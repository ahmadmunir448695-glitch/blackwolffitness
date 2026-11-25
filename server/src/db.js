import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { config } from './config.js'

/**
 * Thin wrapper around node:sqlite with the handful of helpers the routes use.
 * All queries use bound parameters; no SQL is ever built from user input
 * except whitelisted column names for sorting.
 */
export function openDatabase(path = config.databasePath) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const raw = new DatabaseSync(path)
  raw.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;')

  const cache = new Map()
  const stmt = (sql) => {
    let s = cache.get(sql)
    if (!s) {
      s = raw.prepare(sql)
      cache.set(sql, s)
    }
    return s
  }
  const bind = (params) => (params === undefined ? [] : Array.isArray(params) ? params : [params])
  let depth = 0

  const db = {
    raw,
    all: (sql, params) => stmt(sql).all(...bind(params)).map(plain),
    get: (sql, params) => plain(stmt(sql).get(...bind(params))),
    run: (sql, params) => {
      const r = stmt(sql).run(...bind(params))
      return { id: Number(r.lastInsertRowid), changes: Number(r.changes) }
    },
    exec: (sql) => raw.exec(sql),
    /** Run fn atomically. Nested calls join the outer transaction. */
    transaction(fn) {
      if (depth > 0) return fn()
      depth++
      raw.exec('BEGIN IMMEDIATE')
      try {
        const result = fn()
        raw.exec('COMMIT')
        return result
      } catch (err) {
        raw.exec('ROLLBACK')
        throw err
      } finally {
        depth--
      }
    },
    close: () => raw.close(),
  }
  return db
}

function plain(row) {
  return row ? { ...row } : row ?? null
}

/** Apply every migrations/*.sql file not yet recorded, in name order. */
export function migrate(db, dir = join(config.root, 'migrations')) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`)
  const done = new Set(db.all('SELECT name FROM schema_migrations').map((r) => r.name))
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
  const applied = []
  for (const file of files) {
    if (done.has(file)) continue
    const sql = readFileSync(join(dir, file), 'utf8')
    // Foreign keys are checked at commit; the initial schema references tables declared later.
    db.exec('PRAGMA foreign_keys = OFF')
    try {
      db.transaction(() => {
        db.exec(sql)
        db.run('INSERT INTO schema_migrations (name) VALUES (?)', file)
      })
    } finally {
      db.exec('PRAGMA foreign_keys = ON')
    }
    applied.push(file)
  }
  return applied
}
