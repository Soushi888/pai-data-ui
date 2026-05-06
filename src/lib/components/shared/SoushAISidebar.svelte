<script lang="ts">
  import { tick } from 'svelte'
  import ChatMessage from './ChatMessage.svelte'
  import ChatInput from './ChatInput.svelte'
  import ToolCallIndicator from './ToolCallIndicator.svelte'
  import type { Change } from 'diff'

  type ChatContext =
    | { type: 'telos'; file: string; content: string }
    | { type: 'global' }
    | { type: 'crm'; entityId: string }
    | { type: 'erp'; domain: string }

  interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
  }

  interface Props {
    context: ChatContext
    onFileEdit?: (diff: Change[]) => void
  }

  let { context, onFileEdit }: Props = $props()

  let messages = $state<Message[]>([])
  let isStreaming = $state(false)
  let activeToolCalls = $state<string[]>([])
  let scrollEl = $state<HTMLDivElement | null>(null)

  async function scrollToBottom() {
    await tick()
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight
  }

  async function sendMessage(content: string) {
    messages.push({ id: crypto.randomUUID(), role: 'user', content })
    await scrollToBottom()

    isStreaming = true
    activeToolCalls = []

    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' }
    messages.push(assistantMsg)

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content, context }),
      })

      if (!res.ok || !res.body) {
        assistantMsg.content = `Error: ${res.statusText}`
        isStreaming = false
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            isStreaming = false
            activeToolCalls = []
            break
          }
          try {
            const event = JSON.parse(data)
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              assistantMsg.content += event.delta.text
              messages = messages // trigger reactivity
              await scrollToBottom()
            } else if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
              const toolName = event.content_block.name ?? 'tool'
              if (!activeToolCalls.includes(toolName)) activeToolCalls = [...activeToolCalls, toolName]
            } else if (event.type === 'content_block_stop') {
              // tool call finished — keep indicators until DONE
            }
          } catch {
            // non-JSON line, skip
          }
        }
      }
    } catch (err) {
      assistantMsg.content = `Connection error: ${String(err)}`
    } finally {
      isStreaming = false
      activeToolCalls = []
      messages = messages
      await scrollToBottom()
    }
  }
</script>

<div
  class="w-[320px] flex-shrink-0 flex flex-col border-l"
  style="background: var(--athanor-surface); border-color: var(--athanor-border);"
>
  <div class="px-3 py-3 border-b flex-shrink-0" style="border-color: var(--athanor-border);">
    <div class="flex items-center gap-2">
      <div class="w-2 h-2 rounded-full" style="background: var(--athanor-arcane); box-shadow: 0 0 6px var(--athanor-arcane);"></div>
      <p class="text-xs font-semibold" style="color: var(--athanor-arcane);">SoushAI</p>
    </div>
    <p class="text-[10px] mt-0.5" style="color: var(--athanor-mist);">
      {context.type === 'telos' ? `Reading ${context.file}` : 'Global context'}
    </p>
  </div>

  <div bind:this={scrollEl} class="flex-1 overflow-y-auto py-2 space-y-1">
    {#if messages.length === 0}
      <div class="px-4 py-8 text-center">
        <p class="text-xs" style="color: var(--athanor-mist);">
          {context.type === 'telos'
            ? 'Ask about this file, or ask SoushAI to edit it.'
            : 'Ask SoushAI anything about your PAI data.'}
        </p>
      </div>
    {:else}
      {#each messages as msg (msg.id)}
        <ChatMessage role={msg.role} content={msg.content} />
      {/each}
    {/if}

    {#if isStreaming && activeToolCalls.length > 0}
      <ToolCallIndicator tools={activeToolCalls} />
    {:else if isStreaming && activeToolCalls.length === 0}
      <div class="px-4 py-1">
        <span class="text-[10px]" style="color: var(--athanor-mist);">
          <span class="animate-pulse">●</span>
          <span class="animate-pulse" style="animation-delay: 0.2s;">●</span>
          <span class="animate-pulse" style="animation-delay: 0.4s;">●</span>
        </span>
      </div>
    {/if}
  </div>

  <ChatInput disabled={isStreaming} onsubmit={sendMessage} />
</div>
