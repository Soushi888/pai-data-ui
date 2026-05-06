import { spawn } from 'node:child_process'
import { error } from '@sveltejs/kit'
import { TELOS_ROOT } from '$lib/server/telos.js'
import type { RequestHandler } from './$types'

type ChatContext =
  | { type: 'telos'; file: string; content: string }
  | { type: 'global' }
  | { type: 'crm'; entityId: string }
  | { type: 'erp'; domain: string }

function buildPrompt(userMessage: string, context: ChatContext): string {
  if (context.type === 'telos' && context.file) {
    return `You are SoushAI, the PAI Homunculus. You are viewing the TELOS file: ${context.file}

Current content:
${context.content}

User: ${userMessage}`
  }
  return `You are SoushAI, the PAI Homunculus. You have DataLayer-wide awareness of the user's Personal AI Infrastructure.

User: ${userMessage}`
}

export const POST: RequestHandler = async ({ request }) => {
  let body: { prompt: string; context: ChatContext }
  try {
    body = await request.json()
  } catch {
    error(400, 'Invalid JSON body')
  }

  const { prompt, context } = body
  if (!prompt) error(400, 'Missing prompt')

  const fullPrompt = buildPrompt(prompt, context)

  // Remove CLAUDECODE to avoid PAI nested session guard in Inference.ts
  const { CLAUDECODE: _, ...safeEnv } = process.env as Record<string, string>

  const proc = spawn(
    'claude',
    ['--print', '--output-format', 'stream-json', '--verbose', '--allowedTools', 'Read,Edit,Write', '-p', fullPrompt],
    { env: safeEnv, cwd: TELOS_ROOT }
  )

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      proc.stdout.on('data', (chunk: Buffer) => {
        for (const line of chunk.toString().split('\n').filter(Boolean)) {
          controller.enqueue(encoder.encode(`data: ${line}\n\n`))
        }
      })
      proc.on('close', () => {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      })
      proc.on('error', (e) => controller.error(e))
    },
    cancel() {
      proc.kill()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
