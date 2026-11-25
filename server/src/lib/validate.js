import { badRequest } from './http.js'

/**
 * Small schema validator. Each rule returns the cleaned value or throws a
 * message string. Collects every field error before failing, so forms can
 * show them all at once.
 *
 *   const data = validate(req.body, { name: str({ max: 120 }), dob: date() })
 */
export function validate(input, schema, { partial = false } = {}) {
  const body = input && typeof input === 'object' ? input : {}
  const out = {}
  const fields = {}
  for (const [key, rule] of Object.entries(schema)) {
    const present = Object.prototype.hasOwnProperty.call(body, key)
    if (partial && !present) continue
    try {
      const value = rule(body[key], key, body)
      if (value !== undefined) out[key] = value
    } catch (err) {
      if (typeof err === 'string') fields[key] = err
      else throw err
    }
  }
  if (Object.keys(fields).length) throw badRequest('Please correct the highlighted fields.', fields)
  return out
}

const blank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

export const str =
  ({ required = true, min = 0, max = 500, pattern, message, lower = false } = {}) =>
  (v) => {
    if (blank(v)) {
      if (required) throw 'This field is required.'
      return null
    }
    let s = String(v).trim()
    if (lower) s = s.toLowerCase()
    if (s.length < min) throw `Must be at least ${min} characters.`
    if (s.length > max) throw `Must be ${max} characters or fewer.`
    if (pattern && !pattern.test(s)) throw message || 'Invalid format.'
    return s
  }

export const text = (opts = {}) => str({ required: false, max: 20000, ...opts })

export const email = ({ required = true } = {}) =>
  str({ required, max: 254, lower: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: 'Enter a valid email address.' })

export const phone = ({ required = false } = {}) =>
  str({ required, max: 30, pattern: /^\+?[0-9 ()-]{7,20}$/, message: 'Enter a valid phone number.' })

export const num =
  ({ required = true, min = -Infinity, max = Infinity, integer = false } = {}) =>
  (v) => {
    if (blank(v)) {
      if (required) throw 'This field is required.'
      return null
    }
    const n = Number(v)
    if (!Number.isFinite(n)) throw 'Enter a number.'
    if (integer && !Number.isInteger(n)) throw 'Enter a whole number.'
    if (n < min) throw `Must be at least ${min}.`
    if (n > max) throw `Must be ${max} or less.`
    return n
  }

export const bool = () => (v) => {
  if (blank(v)) return 0
  return v === true || v === 1 || v === '1' || v === 'true' || v === 'on' ? 1 : 0
}

export const oneOf =
  (values, { required = true } = {}) =>
  (v) => {
    if (blank(v)) {
      if (required) throw 'Choose an option.'
      return null
    }
    if (!values.includes(v)) throw 'Choose a valid option.'
    return v
  }

const DATE = /^\d{4}-\d{2}-\d{2}$/
export const date =
  ({ required = true } = {}) =>
  (v) => {
    if (blank(v)) {
      if (required) throw 'Enter a date.'
      return null
    }
    const s = String(v).slice(0, 10)
    if (!DATE.test(s) || Number.isNaN(Date.parse(`${s}T00:00:00Z`))) throw 'Enter a valid date (YYYY-MM-DD).'
    return s
  }

export const id =
  ({ required = true } = {}) =>
  (v) => {
    if (blank(v)) {
      if (required) throw 'This field is required.'
      return null
    }
    const n = Number(v)
    if (!Number.isInteger(n) || n < 1) throw 'Invalid selection.'
    return n
  }

export const ids =
  ({ min = 0, max = 50 } = {}) =>
  (v) => {
    const arr = Array.isArray(v) ? v : blank(v) ? [] : String(v).split(',')
    const out = [...new Set(arr.map(Number))]
    if (out.some((n) => !Number.isInteger(n) || n < 1)) throw 'Invalid selection.'
    if (out.length < min) throw min === 1 ? 'Select at least one.' : `Select at least ${min}.`
    if (out.length > max) throw `Select at most ${max}.`
    return out
  }

export const password = () => (v) => {
  if (blank(v)) throw 'Enter a password.'
  const s = String(v)
  if (s.length < 8) throw 'Use at least 8 characters.'
  if (s.length > 200) throw 'Password is too long.'
  if (!/[A-Za-z]/.test(s) || !/[0-9]/.test(s)) throw 'Use letters and at least one number.'
  return s
}

/** Array of objects (or its JSON string), each validated with `schema`. */
export const list =
  (schema, { max = 200 } = {}) =>
  (v) => {
    let arr = v
    if (typeof v === 'string') {
      try {
        arr = JSON.parse(v || '[]')
      } catch {
        throw 'Invalid list.'
      }
    }
    if (blank(arr)) return []
    if (!Array.isArray(arr)) throw 'Invalid list.'
    if (arr.length > max) throw `At most ${max} items.`
    return arr.map((item, i) => {
      try {
        return validate(item, schema)
      } catch (err) {
        if (err.fields) throw `Row ${i + 1}: ${Object.entries(err.fields).map(([k, m]) => `${k}: ${m}`).join('; ')}`
        throw err
      }
    })
  }
