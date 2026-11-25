import { randomInt } from 'node:crypto'

// No 0/O/1/I so codes read cleanly over the phone.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export function randomCode(length = 6) {
  let s = ''
  for (let i = 0; i < length; i++) s += ALPHABET[randomInt(ALPHABET.length)]
  return s
}

/** Generate a code with `prefix` that is not yet used in table.column (both trusted constants). */
export function uniqueCode(db, table, column, prefix, length = 6) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = `${prefix}-${randomCode(length)}`
    if (!db.get(`SELECT 1 AS x FROM ${table} WHERE ${column} = ?`, code)) return code
  }
  throw new Error(`Could not generate a unique ${table} code`)
}

export function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'event'
  )
}

export const now = () => new Date().toISOString()
export const today = () => new Date().toISOString().slice(0, 10)
