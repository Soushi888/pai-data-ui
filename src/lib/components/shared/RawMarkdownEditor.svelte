<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { enhance } from '$app/forms'
  import type { EditorView } from 'codemirror'
  import type { DecorationSet } from '@codemirror/view'

  let {
    content,
    backUrl,
    title
  }: { content: string; backUrl: string; title: string } = $props()

  let value = $state(content)
  let dirty = $state(false)
  let saving = $state(false)
  let saved = $state(false)
  let editorEl: HTMLDivElement
  let formEl: HTMLFormElement
  let editorView: EditorView | undefined

  $effect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  })

  $effect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && dirty && !saving) formEl.requestSubmit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  onDestroy(() => {
    editorView?.destroy()
  })

  onMount(async () => {
    const [
      { EditorView, basicSetup },
      { oneDark },
      { markdown, markdownLanguage },
      { yaml },
      { keymap, ViewPlugin, Decoration },
      { RangeSetBuilder },
      { indentWithTab },
      { LanguageDescription }
    ] = await Promise.all([
      import('codemirror'),
      import('@codemirror/theme-one-dark'),
      import('@codemirror/lang-markdown'),
      import('@codemirror/lang-yaml'),
      import('@codemirror/view'),
      import('@codemirror/state'),
      import('@codemirror/commands'),
      import('@codemirror/language')
    ])

    const frontmatterTheme = EditorView.baseTheme({
      '.cm-fm-line': { background: 'rgba(88, 110, 149, 0.12)' },
      '.cm-fm-delim': { color: '#f97583 !important', fontWeight: 'bold' },
      '.cm-fm-key': { color: '#79b8ff !important' },
      '.cm-fm-sep': { color: '#e1e4e8 !important' },
      '.cm-fm-val': { color: '#9ecbff !important' }
    })

    function buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<typeof Decoration.mark extends (s: infer _) => infer D ? D : never>()
      const doc = view.state.doc
      const text = doc.toString()

      if (!text.startsWith('---')) return builder.finish() as DecorationSet

      const closeIdx = text.indexOf('\n---', 3)
      if (closeIdx < 0) return builder.finish() as DecorationSet

      const fmLastLine = doc.lineAt(closeIdx + 1).number

      for (let n = 1; n <= fmLastLine; n++) {
        const line = doc.line(n)
        const ln = line.text

        builder.add(line.from, line.from, Decoration.line({ class: 'cm-fm-line' }))

        if (ln === '---') {
          builder.add(line.from, line.to, Decoration.mark({ class: 'cm-fm-delim' }))
        } else if (/^[a-zA-Z_][^:]*:/.test(ln)) {
          const colonIdx = ln.indexOf(':')
          builder.add(line.from, line.from + colonIdx, Decoration.mark({ class: 'cm-fm-key' }))
          builder.add(line.from + colonIdx, line.from + colonIdx + 1, Decoration.mark({ class: 'cm-fm-sep' }))
          if (line.from + colonIdx + 1 < line.to) {
            builder.add(line.from + colonIdx + 1, line.to, Decoration.mark({ class: 'cm-fm-val' }))
          }
        }
      }

      return builder.finish() as DecorationSet
    }

    const frontmatterPlugin = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet
        constructor(view: EditorView) {
          this.decorations = buildDecorations(view)
        }
        update(update: { docChanged: boolean; viewportChanged: boolean; view: EditorView }) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = buildDecorations(update.view)
          }
        }
      },
      { decorations: (v) => v.decorations }
    )

    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          if (dirty && formEl) formEl.requestSubmit()
          return true
        }
      }
    ])

    editorView = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        oneDark,
        keymap.of([indentWithTab]),
        saveKeymap,
        markdown({
          base: markdownLanguage,
          codeLanguages: [
            LanguageDescription.of({
              name: 'yaml',
              alias: ['yml'],
              extensions: ['yaml', 'yml'],
              load: async () => yaml()
            })
          ]
        }),
        frontmatterTheme,
        frontmatterPlugin,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            value = update.state.doc.toString()
            dirty = true
          }
        }),
        EditorView.theme({
          '&': { height: '100%', minHeight: '70vh', fontSize: '13px' },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }
        })
      ],
      parent: editorEl
    })
  })
</script>

<div class="flex flex-col h-full p-6 max-w-5xl">
  <div class="flex items-center gap-3 mb-4">
    <a href={backUrl} class="text-gray-500 hover:text-gray-300 text-sm">← Back</a>
    <h1 class="text-sm font-semibold text-gray-400">{title} — Raw Markdown</h1>
    {#if dirty}
      <span class="text-xs text-amber-500">unsaved changes</span>
    {/if}
    {#if saved}
      <span class="text-xs text-green-400">Saved ✓</span>
    {/if}
    <div class="ml-auto">
      <form
        bind:this={formEl}
        method="POST"
        action="?/save"
        use:enhance={() => {
          saving = true
          return async ({ update }) => {
            await update()
            saving = false
            saved = true
            dirty = false
            setTimeout(() => (saved = false), 2000)
          }
        }}
      >
        <input type="hidden" name="content" bind:value />
        <button
          type="submit"
          disabled={saving || !dirty}
          class="text-xs px-3 py-1.5 rounded transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  </div>

  <div bind:this={editorEl} class="flex-1 min-h-[70vh] border border-gray-700 rounded overflow-hidden"></div>
</div>
