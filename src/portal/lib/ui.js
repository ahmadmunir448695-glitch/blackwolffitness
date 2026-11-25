import { reactive } from 'vue'
import { http } from './api.js'

/**
 * Toasts and confirmation dialogs, rendered once by PortalLayout.
 *   toast.success('Saved')     toast.error(err)
 *   if (await confirmDialog({ title, message, confirmLabel, danger: true })) …
 */
export const toasts = reactive([])
let nextId = 1

function push(kind, message, timeout = 4500) {
  const id = nextId++
  toasts.push({ id, kind, message })
  if (timeout) setTimeout(() => dismissToast(id), timeout)
}

export function dismissToast(id) {
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) toasts.splice(i, 1)
}

export const toast = {
  success: (message) => push('success', message),
  info: (message) => push('info', message),
  error: (err) => push('error', typeof err === 'string' ? err : err?.message || 'Something went wrong.', 7000),
}

export const dialog = reactive({ open: false, title: '', message: '', confirmLabel: 'Confirm', danger: false, input: null, value: '', resolve: null })

/**
 * Ask the user to confirm. With `input: { label, required }` it also collects
 * a note and resolves to the text (or null when cancelled).
 */
export function confirmDialog({ title, message = '', confirmLabel = 'Confirm', danger = false, input = null }) {
  return new Promise((resolve) => {
    Object.assign(dialog, { open: true, title, message, confirmLabel, danger, input, value: '', resolve })
  })
}

export function closeDialog(result) {
  const resolve = dialog.resolve
  dialog.open = false
  dialog.resolve = null
  resolve?.(result)
}

/** Shared reference data (belts, disciplines…), loaded once. */
let metaPromise = null
export function loadMeta() {
  if (!metaPromise) metaPromise = http.get('/meta').catch((err) => {
    metaPromise = null
    throw err
  })
  return metaPromise
}

/** Map an ApiError's field messages onto a form's error object. */
export function applyFieldErrors(errors, err) {
  for (const k of Object.keys(errors)) errors[k] = ''
  if (err?.fields) for (const [k, v] of Object.entries(err.fields)) errors[k] = v
  return Boolean(err?.fields)
}
