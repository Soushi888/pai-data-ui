/**
 * POST /notify — voice notification endpoint, replaces PULSE on port 8888.
 * Payload: { message: string, voice_id?: string, voice_enabled?: boolean }
 */
import { json, error } from '@sveltejs/kit'
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { spawn } from 'node:child_process'
import type { RequestHandler } from './$types'

const HERMES_DIR = process.env.HERMES_DIR ?? process.env.PAI_DIR ?? join(process.env.HOME ?? '~', '.hermes')
const VOICE_MUTED_FILE = join(HERMES_DIR, 'MEMORY/STATE/voice-muted')
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

function isMuted(): boolean { return existsSync(VOICE_MUTED_FILE) }

async function elevenLabsTTS(text: string, voiceId: string): Promise<ArrayBuffer> {
  if (!ELEVENLABS_API_KEY) throw new Error('no api key')
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY, Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`)
  return res.arrayBuffer()
}

function playWithLinuxPlayer(audioBuffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const tmpFile = `/tmp/pai-voice-${Date.now()}.mp3`
    writeFileSync(tmpFile, Buffer.from(audioBuffer))
    const players = ['gst-play-1.0', 'mpv', 'ffplay', 'paplay']
    let player: string | null = null
    for (const p of players) {
      try { const r = require('node:child_process').spawnSync('which', [p]); if (r.status === 0) { player = p; break } } catch {}
    }
    if (!player) { require('node:fs').unlinkSync(tmpFile); reject(new Error('no audio player')); return }
    const args: Record<string, string[]> = {
      'gst-play-1.0': ['--volume', '1.0', tmpFile],
      'mpv': ['--no-video', '--no-terminal', tmpFile],
      'ffplay': ['-nodisp', '-autoexit', tmpFile],
      'paplay': [tmpFile],
    }
    const proc = spawn(player, args[player] ?? [tmpFile])
    proc.on('exit', (code) => { try { unlinkSync(tmpFile) } catch {} ; code === 0 ? resolve() : reject(new Error(`player exit ${code}`)) })
    proc.on('error', (err) => { try { unlinkSync(tmpFile) } catch {} ; reject(err) })
  })
}

function speakWithEspeak(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('espeak-ng', ['-s', '150', '-v', 'en', text])
    proc.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`espeak-ng exit ${code}`)))
    proc.on('error', reject)
  })
}

function sendDesktopNotification(message: string): void {
  try { spawn('notify-send', ['PAI', message, '--app-name=PAI']) } catch {}
}

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
}

export const POST: RequestHandler = async ({ request }) => {
  const cors = { 'Access-Control-Allow-Origin': '*' }
  let body: { message?: string; voice_id?: string; voice_enabled?: boolean }
  try { body = await request.json() } catch { throw error(400, 'invalid JSON') }

  const message = body.message ?? ''
  const voiceId = body.voice_id ?? 'OqTGHgPzbq47nVmGUnK2'
  const voiceEnabled = body.voice_enabled !== false

  if (!message) throw error(400, 'message required')

  sendDesktopNotification(message)

  let voicePlayed = false
  if (voiceEnabled && !isMuted()) {
    try {
      const audio = await elevenLabsTTS(message, voiceId)
      await playWithLinuxPlayer(audio)
      voicePlayed = true
    } catch {
      try { await speakWithEspeak(message); voicePlayed = true } catch {}
    }
  }

  return json({ status: 'success', message: 'Notification sent', voice_played: voicePlayed }, { headers: cors })
}
