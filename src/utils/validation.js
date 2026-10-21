/**
 * Form validation rules. Each rule returns an error message or '' when valid.
 * Messages say what is wrong and how to fix it.
 */

export const rules = {
  required: (label) => (value) =>
    String(value ?? '').trim() ? '' : `Enter ${label}.`,

  requiredChoice: (label) => (value) =>
    String(value ?? '').trim() ? '' : `Choose ${label}.`,

  minLength: (min, label) => (value) => {
    const text = String(value ?? '').trim()
    return !text || text.length >= min ? '' : `${capitalise(label)} needs at least ${min} characters.`
  },

  maxLength: (max, label) => (value) =>
    String(value ?? '').length <= max ? '' : `${capitalise(label)} can be up to ${max} characters.`,

  email: (value) => {
    const text = String(value ?? '').trim()
    if (!text) return ''
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text) ? '' : 'Enter an email address like name@example.com.'
  },

  /** Accepts local and international formats: +92 300 1234567, 0300-1234567 … */
  phone: (value) => {
    const text = String(value ?? '').trim()
    if (!text) return ''
    if (!/^[+\d][\d\s().-]*$/.test(text)) return 'Use digits only, with an optional + at the start.'
    const digits = text.replace(/\D/g, '')
    if (digits.length < 10) return 'This number looks too short. Include the full number.'
    if (digits.length > 15) return 'This number looks too long. Check for extra digits.'
    return ''
  },

  ageRange: (min, max) => (value) => {
    if (value === '' || value === null || value === undefined) return ''
    const n = Number(value)
    return Number.isInteger(n) && n >= min && n <= max ? '' : `Enter an age between ${min} and ${max}.`
  },
}

function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Validate a values object against a schema of { field: [rule, rule] }.
 * Returns { valid, errors } where errors only contains failing fields.
 */
export function validate(values, schema) {
  const errors = {}
  Object.entries(schema).forEach(([field, fieldRules]) => {
    for (const rule of fieldRules) {
      const message = rule(values[field])
      if (message) {
        errors[field] = message
        break
      }
    }
  })
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateField(values, schema, field) {
  for (const rule of schema[field] ?? []) {
    const message = rule(values[field])
    if (message) return message
  }
  return ''
}
