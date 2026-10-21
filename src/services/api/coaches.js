import { coaches as mockCoaches } from '@/data/mock/coaches.js'
import { isLive } from './config.js'
import { endpoints } from './endpoints.js'
import { fromMock, notFound, request, unwrapItem, unwrapList } from './client.js'

/**
 * Convert one coach from your API into the shape the UI expects:
 * { slug, name, role, specializations[], programs[], photo{src,alt}|null,
 *   bio[], experience, certifications[], achievements[], languages[] }
 *
 * Example for a Django serializer with different field names:
 *   return {
 *     slug: raw.slug,
 *     name: raw.full_name,
 *     role: raw.position,
 *     specializations: raw.specializations ?? [],
 *     programs: raw.program_slugs ?? [],
 *     photo: raw.photo_url ? { src: raw.photo_url, alt: raw.full_name } : null,
 *     bio: raw.biography ? raw.biography.split('\n\n') : [],
 *     experience: raw.experience ?? '',
 *     certifications: raw.certifications ?? [],
 *     achievements: raw.achievements ?? [],
 *     languages: raw.languages ?? [],
 *     placeholder: false,
 *   }
 */
export function mapCoach(raw) {
  return {
    specializations: [],
    programs: [],
    certifications: [],
    achievements: [],
    languages: [],
    facts: [],
    coaching: [],
    clubs: [],
    education: [],
    publications: [],
    whatsapp: '',
    photo: null,
    placeholder: false,
    ...raw,
    bio: Array.isArray(raw?.bio) ? raw.bio : raw?.bio ? [raw.bio] : [],
  }
}

function filterCoaches(list, { specialization, program } = {}) {
  return list.filter(
    (coach) =>
      (!specialization || coach.specializations.includes(specialization)) &&
      (!program || coach.programs.includes(program)),
  )
}

/**
 * @param {object} [filters] { specialization, program }
 */
export async function listCoaches(filters = {}, { signal } = {}) {
  if (!isLive('coaches')) return fromMock(filterCoaches(mockCoaches.map(mapCoach), filters))
  const data = await request(endpoints.coaches.list, { signal, query: filters })
  // Filter again client-side in case the API ignores the query parameters.
  return filterCoaches(unwrapList(data).map(mapCoach), filters)
}

export async function getCoach(slug, { signal } = {}) {
  if (!isLive('coaches')) {
    const coach = mockCoaches.find((c) => c.slug === slug)
    if (!coach) throw notFound('This coach profile')
    return fromMock(mapCoach(coach))
  }
  const data = await request(endpoints.coaches.detail(slug), { signal })
  return mapCoach(unwrapItem(data))
}
