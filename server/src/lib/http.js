/** Error with an HTTP status and optional per-field messages. */
export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message)
    this.status = status
    if (fields) this.fields = fields
  }
}

export const badRequest = (message, fields) => new HttpError(400, message, fields)
export const unauthorized = (message = 'Please sign in to continue.') => new HttpError(401, message)
export const forbidden = (message = 'You do not have permission to do that.') => new HttpError(403, message)
export const notFound = (what = 'Record') => new HttpError(404, `${what} not found.`)
export const conflict = (message, fields) => new HttpError(409, message, fields)

/** Parse ?page=&pageSize= into LIMIT/OFFSET values. */
export function pagination(query, { defaultSize = 20, maxSize = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const pageSize = Math.min(maxSize, Math.max(1, parseInt(query.pageSize, 10) || defaultSize))
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize }
}

export function paged(items, total, { page, pageSize }) {
  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

/** Pick a whitelisted ORDER BY clause from ?sort=field&dir=asc|desc. */
export function orderBy(query, allowed, fallback) {
  const column = allowed[query.sort]
  if (!column) return fallback
  return `${column} ${String(query.dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC'}`
}

/** LIKE pattern for a search term, with wildcards escaped (use ESCAPE '\'). */
export function likeTerm(term) {
  return `%${String(term).replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}
