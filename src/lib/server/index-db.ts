import BetterSqlite3 from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

export const DATA_ROOT =
  process.env.PAI_DATA_ROOT ?? `${process.env.HOME}/.claude/PAI/USER/DATA`

const DB_PATH = join(DATA_ROOT, '_index', 'pai.db')

let _db: BetterSqlite3.Database | null = null

export function getDb(): BetterSqlite3.Database {
  if (!_db) {
    mkdirSync(join(DATA_ROOT, '_index'), { recursive: true })
    _db = new BetterSqlite3(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('synchronous = NORMAL')
    initSchema(_db)
  }
  return _db
}

function initSchema(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS entities (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL,
      domain      TEXT NOT NULL,
      file_path   TEXT NOT NULL UNIQUE,
      data        TEXT NOT NULL,
      body        TEXT,
      updated     TEXT,
      indexed_at  INTEGER DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_entities_type    ON entities(type);
    CREATE INDEX IF NOT EXISTS idx_entities_domain  ON entities(domain);
    CREATE INDEX IF NOT EXISTS idx_entities_updated ON entities(updated DESC);

    CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(
      id     UNINDEXED,
      type   UNINDEXED,
      name,
      tags,
      body,
      content=entities,
      content_rowid=rowid
    );

    CREATE TABLE IF NOT EXISTS sync_errors (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path   TEXT NOT NULL,
      error_type  TEXT NOT NULL,
      error_msg   TEXT NOT NULL,
      raw_excerpt TEXT,
      occurred_at INTEGER DEFAULT (unixepoch()),
      resolved_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_sync_errors_path ON sync_errors(file_path);
  `)

  const existing = db
    .prepare("SELECT name FROM sqlite_master WHERE type='trigger'")
    .all() as { name: string }[]
  const names = new Set(existing.map((r) => r.name))

  if (!names.has('entities_fts_insert')) {
    db.exec(`
      CREATE TRIGGER entities_fts_insert AFTER INSERT ON entities BEGIN
        INSERT INTO entities_fts(rowid, id, type, name, tags, body)
        VALUES (
          new.rowid, new.id, new.type,
          COALESCE(json_extract(new.data, '$.name'), json_extract(new.data, '$.title'), ''),
          COALESCE(json_extract(new.data, '$.tags'), ''),
          COALESCE(new.body, '')
        );
      END;

      CREATE TRIGGER entities_fts_delete AFTER DELETE ON entities BEGIN
        INSERT INTO entities_fts(entities_fts, rowid, id, type, name, tags, body)
        VALUES ('delete', old.rowid, old.id, old.type, '', '', '');
      END;

      CREATE TRIGGER entities_fts_update AFTER UPDATE ON entities BEGIN
        INSERT INTO entities_fts(entities_fts, rowid, id, type, name, tags, body)
        VALUES ('delete', old.rowid, old.id, old.type, '', '', '');
        INSERT INTO entities_fts(rowid, id, type, name, tags, body)
        VALUES (
          new.rowid, new.id, new.type,
          COALESCE(json_extract(new.data, '$.name'), json_extract(new.data, '$.title'), ''),
          COALESCE(json_extract(new.data, '$.tags'), ''),
          COALESCE(new.body, '')
        );
      END;
    `)
  }
}

export function domainFromPath(filePath: string): string {
  const rel = filePath.slice(DATA_ROOT.length + 1)
  return rel.split('/')[0] ?? 'unknown'
}

export function upsertEntityInDb(
  db: BetterSqlite3.Database,
  id: string,
  type: string,
  domain: string,
  filePath: string,
  data: Record<string, unknown>,
  body: string
): void {
  db.prepare(`
    INSERT OR REPLACE INTO entities (id, type, domain, file_path, data, body, updated, indexed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
  `).run(
    id,
    type,
    domain,
    filePath,
    JSON.stringify(data),
    body || null,
    typeof data.updated === 'string' ? data.updated : null
  )
}

export function removeEntityFromDb(db: BetterSqlite3.Database, filePath: string): void {
  db.prepare('DELETE FROM entities WHERE file_path = ?').run(filePath)
  db.prepare(
    'UPDATE sync_errors SET resolved_at = unixepoch() WHERE file_path = ? AND resolved_at IS NULL'
  ).run(filePath)
}

export function listByType<T>(type: string): T[] {
  const rows = getDb()
    .prepare('SELECT data FROM entities WHERE type = ? ORDER BY updated DESC')
    .all(type) as { data: string }[]
  return rows.map((r) => JSON.parse(r.data) as T)
}

export function getByIdAndType<T>(
  id: string,
  type: string
): { data: T; body: string } | null {
  const row = getDb()
    .prepare('SELECT data, body FROM entities WHERE id = ? AND type = ?')
    .get(id, type) as { data: string; body: string | null } | undefined
  if (!row) return null
  return { data: JSON.parse(row.data) as T, body: row.body ?? '' }
}

export function searchFts(query: string, limit = 20): { id: string; type: string; excerpt: string }[] {
  const rows = getDb()
    .prepare(`
      SELECT id, type, snippet(entities_fts, 4, '', '', '...', 20) as excerpt
      FROM entities_fts
      WHERE entities_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `)
    .all(query, limit) as { id: string; type: string; excerpt: string }[]
  return rows
}
