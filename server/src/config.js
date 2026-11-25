import { randomBytes } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = process.env
const isProd = env.NODE_ENV === 'production'

function list(value) {
  return String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

if (isProd && !env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production (a long random string).')
}

export const config = {
  root,
  isProd,
  port: Number(env.PORT || 8787),
  /** SQLite file. Use ':memory:' for tests. */
  databasePath: env.DATABASE_PATH || resolve(root, 'storage/championship.db'),
  /** Uploaded files live here (posters, logos, athlete documents). */
  storageDir: env.STORAGE_DIR || resolve(root, 'storage'),
  sessionSecret: env.SESSION_SECRET || randomBytes(32).toString('hex'),
  sessionTtlHours: Number(env.SESSION_TTL_HOURS || 24 * 7),
  /** Origins allowed to call the API from a browser (the website). */
  corsOrigins: list(env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'),
  maxUploadMb: Number(env.MAX_UPLOAD_MB || 5),
  /** Used in notifications and the confirmation PDF. */
  siteName: env.SITE_NAME || 'Black Wolf Fitness Club',
  portalUrl: (env.PORTAL_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  /** First super admin, created on start if no super admin exists yet. */
  bootstrapAdmin: {
    email: env.ADMIN_EMAIL || '',
    password: env.ADMIN_PASSWORD || '',
    name: env.ADMIN_NAME || 'Super Admin',
  },
  trustProxy: env.TRUST_PROXY === '1' || env.TRUST_PROXY === 'true',
}
