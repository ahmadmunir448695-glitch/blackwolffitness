/**
 * Public entry point of the API service layer.
 *
 *   import { api } from '@/services/api'
 *
 * Modules (one per resource) live in src/services/api/:
 *   programs.js     → api.programs.list() / api.programs.get(slug)
 *   coaches.js      → api.coaches.list({ specialization, program }) / api.coaches.get(slug)
 *   memberships.js  → api.memberships.listPlans()
 *   schedule.js     → api.schedule.list({ program })
 *   contact.js      → api.contact.send(form) / api.contact.requestTrial(form)
 *
 * Supporting files: config.js (env vars), endpoints.js (every URL path),
 * client.js (fetch wrapper, errors, response unwrapping).
 * See docs/API_INTEGRATION.md for how to connect your existing API.
 */
export * from './api/index.js'
