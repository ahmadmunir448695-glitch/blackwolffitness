import { randomBytes } from 'node:crypto'
import { mkdirSync, openSync, readSync, closeSync, unlinkSync, existsSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import multer from 'multer'
import { config } from '../config.js'
import { badRequest } from './http.js'

/**
 * Two upload areas:
 *   public/   posters, event PDFs, team logos — served to anyone at /api/files/<name>
 *   private/  athlete photos and documents — only through permission-checked routes
 */
export const dirs = {
  public: resolve(config.storageDir, 'uploads/public'),
  private: resolve(config.storageDir, 'uploads/private'),
}
for (const d of Object.values(dirs)) mkdirSync(d, { recursive: true })

const TYPES = {
  'image/jpeg': { ext: '.jpg', magic: [[0xff, 0xd8, 0xff]] },
  'image/png': { ext: '.png', magic: [[0x89, 0x50, 0x4e, 0x47]] },
  'image/webp': { ext: '.webp', magic: [[0x52, 0x49, 0x46, 0x46]] },
  'application/pdf': { ext: '.pdf', magic: [[0x25, 0x50, 0x44, 0x46]] },
}
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const DOC_TYPES = [...IMAGE_TYPES, 'application/pdf']

/** multer middleware for one file field. */
export function uploadOne(field, { area = 'private', types = DOC_TYPES } = {}) {
  const storage = multer.diskStorage({
    destination: dirs[area],
    filename: (_req, file, cb) => cb(null, `${randomBytes(16).toString('hex')}${TYPES[file.mimetype]?.ext ?? ''}`),
  })
  const handler = multer({
    storage,
    limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1, fields: 30 },
    fileFilter: (_req, file, cb) => {
      if (!types.includes(file.mimetype)) {
        return cb(badRequest(`Unsupported file type. Allowed: ${types.map((t) => TYPES[t].ext.slice(1).toUpperCase()).join(', ')}.`))
      }
      cb(null, true)
    },
  }).single(field)

  return (req, res, next) =>
    handler(req, res, (err) => {
      if (err?.code === 'LIMIT_FILE_SIZE') return next(badRequest(`File is too large. Maximum size is ${config.maxUploadMb} MB.`))
      if (err) return next(err.status ? err : badRequest(err.message))
      if (req.file && !matchesMagic(req.file)) {
        removeFile(req.file.path)
        return next(badRequest('The file content does not match its type.'))
      }
      next()
    })
}

function matchesMagic(file) {
  const spec = TYPES[file.mimetype]
  if (!spec) return false
  const buf = Buffer.alloc(8)
  const fd = openSync(file.path, 'r')
  try {
    readSync(fd, buf, 0, 8, 0)
  } finally {
    closeSync(fd)
  }
  return spec.magic.some((sig) => sig.every((byte, i) => buf[i] === byte))
}

export function requireFile(req) {
  if (!req.file) throw badRequest('Choose a file to upload.')
  return req.file
}

/** Stored value for a file: "<area>/<name>". */
export const storedPath = (file, area) => `${area}/${basename(file.path)}`

export function absolutePath(stored) {
  if (!stored) return null
  const [area, name] = String(stored).split('/')
  if (!dirs[area] || !name || name !== basename(name)) return null
  return join(dirs[area], name)
}

export function publicUrl(stored) {
  if (!stored || !stored.startsWith('public/')) return null
  return `/api/files/${stored.slice('public/'.length)}`
}

export function removeFile(storedOrAbs) {
  if (!storedOrAbs) return
  const abs = storedOrAbs.startsWith('/') ? storedOrAbs : absolutePath(storedOrAbs)
  try {
    if (abs && existsSync(abs)) unlinkSync(abs)
  } catch (err) {
    console.error('could not remove file', err)
  }
}

/** Stream a stored private file with a safe download name. */
export function sendStored(res, stored, downloadName, { inline = true } = {}) {
  const abs = absolutePath(stored)
  if (!abs || !existsSync(abs)) {
    res.status(404).json({ error: 'File not found.' })
    return
  }
  const safe = String(downloadName || basename(abs)).replace(/[^\w.\- ]+/g, '_')
  res.set('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${safe}"`)
  res.set('Cache-Control', 'private, no-store')
  res.set('X-Content-Type-Options', 'nosniff')
  res.sendFile(abs)
}
