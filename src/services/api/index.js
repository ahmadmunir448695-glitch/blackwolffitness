/**
 * API service layer — the only place the UI gets data from.
 *
 *   import { api } from '@/services/api'
 *   const coaches = await api.coaches.list({ specialization: 'Boxing' })
 *
 * Each module returns local mock data until its resource is switched to the
 * real API (see config.js and .env.example). Pages never import mock data
 * directly, so connecting your API does not require touching any page.
 */
import { listPrograms, getProgram } from './programs.js'
import { listCoaches, getCoach } from './coaches.js'
import { listPlans } from './memberships.js'
import { listSchedule } from './schedule.js'
import { sendContactMessage, requestTrialSession } from './contact.js'

export const api = {
  programs: { list: listPrograms, get: getProgram },
  coaches: { list: listCoaches, get: getCoach },
  memberships: { listPlans },
  schedule: { list: listSchedule },
  contact: { send: sendContactMessage, requestTrial: requestTrialSession },
}

export { ApiError, ApiNotConfiguredError } from './client.js'
export { apiConfig, isApiConfigured, isLive } from './config.js'
