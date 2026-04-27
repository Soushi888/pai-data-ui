import BetterSqlite3 from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

/** Root path to the PAI data directory. Defaults to ~/.claude/PAI/USER/DATA, overridable via PAI_DATA_ROOT env var. */
export const DATA_ROOT =
  process.env.PAI_DATA_ROOT ?? `${process.env.HOME}/.claude/PAI/USER/DATA`

const DB_PATH = join(DATA_ROOT, '_index', 'pai.db')

let _db: BetterSqlite3.Database | null = null

/**
 * Lazy singleton that returns the shared BetterSqlite3 Database instance.
 * On first call, creates the _index directory if needed, opens the SQLite DB at DATA_ROOT/_index/pai.db,
 * enables WAL journal mode, and initializes the schema (entities table, FTS5 virtual table, triggers).
 * Subsequent calls return the cached instance without re-initializing.
 * @returns The open BetterSqlite3 Database instance.
 */
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

  initVfViews(db)

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

function initVfViews(db: BetterSqlite3.Database): void {
  db.exec(`
    DROP VIEW IF EXISTS vf_economic_events;
    CREATE VIEW vf_economic_events AS
      SELECT
        id, type, domain, file_path,
        json_extract(data, '$.vf_action')                        AS action,
        json_extract(data, '$.vf_provider')                      AS provider,
        json_extract(data, '$.vf_receiver')                      AS receiver,
        json_extract(data, '$.vf_input_of')                      AS input_of,
        json_extract(data, '$.vf_output_of')                     AS output_of,
        json_extract(data, '$.vf_resource_conforms_to')          AS resource_spec,
        json_extract(data, '$.vf_resource_quantity.numericValue') AS qty_value,
        json_extract(data, '$.vf_resource_quantity.unit')         AS qty_unit,
        json_extract(data, '$.vf_has_point_in_time')              AS point_in_time,
        updated
      FROM entities
      WHERE type IN ('task', 'expense', 'income');

    DROP VIEW IF EXISTS vf_process_flows;
    CREATE VIEW vf_process_flows AS
      SELECT
        p.id                            AS process_id,
        p.domain                        AS process_domain,
        json_extract(p.data, '$.title') AS process_title,
        e.id                            AS event_id,
        e.action,
        e.provider,
        e.receiver,
        e.qty_value,
        e.qty_unit,
        e.resource_spec,
        e.point_in_time,
        CASE WHEN e.input_of = p.id THEN 'input' ELSE 'output' END AS direction
      FROM entities p
      JOIN vf_economic_events e ON e.input_of = p.id OR e.output_of = p.id
      WHERE p.type = 'project';

    DROP VIEW IF EXISTS vf_agent_contributions;
    CREATE VIEW vf_agent_contributions AS
      SELECT
        provider       AS agent_id,
        resource_spec,
        qty_unit,
        SUM(qty_value) AS total_qty,
        COUNT(*)       AS event_count
      FROM vf_economic_events
      WHERE action IN ('work', 'deliver-service', 'produce', 'raise', 'cite')
        AND provider IS NOT NULL
      GROUP BY provider, resource_spec, qty_unit;

    DROP VIEW IF EXISTS vf_claim_status;
    CREATE VIEW vf_claim_status AS
      SELECT
        id,
        json_extract(data, '$.title')                             AS title,
        json_extract(data, '$.vf_resource_quantity.numericValue') AS claimed_amount,
        json_extract(data, '$.vf_resource_quantity.unit')          AS currency,
        json_extract(data, '$.client')                            AS client,
        json_extract(data, '$.vf_settled_by')                     AS settled_by,
        CASE
          WHEN json_array_length(json_extract(data, '$.vf_settled_by')) > 0
          THEN 'settled'
          ELSE 'outstanding'
        END AS settlement_status
      FROM entities
      WHERE type = 'invoice';
  `)
}

/**
 * Extracts the domain segment from an entity file path.
 * The domain is the first directory component after DATA_ROOT (e.g. "CRM" from "~/.../CRM/contacts/foo.md").
 * Returns "unknown" if the path has no subdirectory under DATA_ROOT.
 * @param filePath - Absolute path to the entity file.
 * @returns The domain string.
 */
export function domainFromPath(filePath: string): string {
  const rel = filePath.slice(DATA_ROOT.length + 1)
  return rel.split('/')[0] ?? 'unknown'
}

/**
 * Inserts or replaces an entity row in the entities table and updates the FTS5 full-text search index.
 * Uses INSERT OR REPLACE so existing rows are atomically overwritten. The FTS index is kept in sync via triggers.
 * @param db - The open BetterSqlite3 Database instance.
 * @param id - Unique entity identifier.
 * @param type - Entity type string (e.g. "contact", "project").
 * @param domain - Domain segment derived from the file path (e.g. "CRM").
 * @param filePath - Absolute path to the source .md file.
 * @param data - Parsed YAML frontmatter data to store as JSON.
 * @param body - Trimmed markdown body content.
 */
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

/**
 * Deletes an entity row by file_path from the entities table and marks any open sync errors for that path as resolved.
 * The FTS index is updated automatically via the entities_fts_delete trigger.
 * @param db - The open BetterSqlite3 Database instance.
 * @param filePath - Absolute path of the .md file whose entity should be removed.
 */
export function removeEntityFromDb(db: BetterSqlite3.Database, filePath: string): void {
  db.prepare('DELETE FROM entities WHERE file_path = ?').run(filePath)
  db.prepare(
    'UPDATE sync_errors SET resolved_at = unixepoch() WHERE file_path = ? AND resolved_at IS NULL'
  ).run(filePath)
}

/**
 * Queries all entities of the given type, deserializes the JSON data column, and returns them as T[].
 * Results are ordered by the updated field descending.
 * @param type - Entity type to filter by (e.g. "contact").
 * @returns Array of deserialized entity data objects typed as T.
 */
export function listByType<T>(type: string): T[] {
  const rows = getDb()
    .prepare('SELECT data FROM entities WHERE type = ? ORDER BY updated DESC')
    .all(type) as { data: string }[]
  return rows.map((r) => JSON.parse(r.data) as T)
}

/**
 * Queries a single entity by id and type, returning its deserialized data and body.
 * @param id - The entity's unique identifier.
 * @param type - The entity type to match against (e.g. "contact").
 * @returns An object with the deserialized data typed as T and the markdown body string, or null if not found.
 */
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

/**
 * Performs a full-text search across the entities_fts virtual table using FTS5 MATCH syntax.
 * Returns ranked results with a snippet excerpt from the matched body field.
 * @param query - FTS5 query string (e.g. "john" or "tag:design").
 * @param limit - Maximum number of results to return. Defaults to 20.
 * @returns Array of SearchResult objects with id, type, and a short excerpt snippet.
 */
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
