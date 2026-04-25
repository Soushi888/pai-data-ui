import matter from 'gray-matter'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  DATA_ROOT,
  domainFromPath,
  getDb,
  removeEntityFromDb,
  upsertEntityInDb,
} from './index-db.js'

const SKIP_DIRS = new Set(['_schemas', '_templates', '_index', 'exports', 'context'])

function syncFile(filePath: string): void {
  const db = getDb()
  let raw: string
  try {
    raw = readFileSync(filePath, 'utf-8')
  } catch {
    return
  }

  const rawExcerpt = raw.slice(0, 500)

  let parsed: { data: Record<string, unknown>; content: string }
  try {
    parsed = matter(raw) as unknown as { data: Record<string, unknown>; content: string }
  } catch (e) {
    db.prepare(
      `INSERT INTO sync_errors (file_path, error_type, error_msg, raw_excerpt)
       SELECT ?, ?, ?, ? WHERE NOT EXISTS (
         SELECT 1 FROM sync_errors WHERE file_path = ? AND error_type = ? AND resolved_at IS NULL
       )`
    ).run(filePath, 'parse_error', String(e), rawExcerpt, filePath, 'parse_error')
    return
  }

  const { data, content } = parsed

  if (!data.id || !data.type) {
    db.prepare(
      `INSERT INTO sync_errors (file_path, error_type, error_msg, raw_excerpt)
       SELECT ?, ?, ?, ? WHERE NOT EXISTS (
         SELECT 1 FROM sync_errors WHERE file_path = ? AND error_type = ? AND resolved_at IS NULL
       )`
    ).run(filePath, 'missing_id', 'Missing required id or type field', rawExcerpt, filePath, 'missing_id')
    return
  }

  const domain = domainFromPath(filePath)
  upsertEntityInDb(
    db,
    String(data.id),
    String(data.type),
    domain,
    filePath,
    data,
    content.trim()
  )

  db.prepare(
    'UPDATE sync_errors SET resolved_at = unixepoch() WHERE file_path = ? AND resolved_at IS NULL'
  ).run(filePath)
}

function walkDir(dir: string, cb: (filePath: string) => void): void {
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const name = String(entry.name)
      const fullPath = join(dir, name)
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(name)) walkDir(fullPath, cb)
      } else if (name.endsWith('.md') && name !== 'README.md') {
        cb(fullPath)
      }
    }
  } catch {
    return
  }
}

/**
 * Walks all .md files under DATA_ROOT recursively, upserts each into the SQLite index,
 * and removes stale rows for files that no longer exist on disk.
 * Skips directories listed in SKIP_DIRS and files named README.md.
 * @returns An object with `indexed` (count of successfully processed files) and `errors` (count of files that threw).
 */
export function rebuildIndex(): { indexed: number; errors: number } {
  const db = getDb()
  const existingPaths = new Set(
    (db.prepare('SELECT file_path FROM entities').all() as { file_path: string }[]).map(
      (r) => r.file_path
    )
  )
  const seenPaths = new Set<string>()
  let indexed = 0
  let errors = 0

  walkDir(DATA_ROOT, (filePath) => {
    seenPaths.add(filePath)
    try {
      syncFile(filePath)
      indexed++
    } catch {
      errors++
    }
  })

  for (const path of existingPaths) {
    if (!seenPaths.has(path)) removeEntityFromDb(db, path)
  }

  return { indexed, errors }
}

/**
 * Orchestrates file system watching to keep the SQLite index in sync with markdown file changes in real time.
 * On start, performs an initial full rebuildIndex pass, then attaches a chokidar watcher for incremental updates.
 * The watcher upserts entities on add/change events and removes them on unlink events.
 * Skips directories in SKIP_DIRS and hidden path segments.
 */
class SyncEngine {
  private started = false

  /**
   * Starts the sync engine. Calls rebuildIndex() for the initial sync, then starts the chokidar watcher.
   * Idempotent: subsequent calls after the first are no-ops.
   */
  start(): void {
    if (this.started) return
    this.started = true
    rebuildIndex()
    this.startWatcher()
  }

  private startWatcher(): void {
    import('chokidar')
      .then(({ watch }) => {
        const watcher = watch(`${DATA_ROOT}/**/*.md`, {
          ignored: (filePath: string) => {
            if (!filePath.startsWith(DATA_ROOT)) return false
            const rel = filePath.slice(DATA_ROOT.length)
            const segments = rel.split('/').filter(Boolean)
            return segments.some((s) => SKIP_DIRS.has(s) || s.startsWith('.'))
          },
          persistent: false,
          ignoreInitial: true,
        })
        watcher
          .on('add', syncFile)
          .on('change', syncFile)
          .on('unlink', (path) => removeEntityFromDb(getDb(), path))
      })
      .catch(console.error)
  }
}

/** Exported singleton SyncEngine instance used by the SvelteKit server hooks to manage the live index. */
export const syncEngine = new SyncEngine()
