import { programs as mockPrograms } from '@/data/mock/programs.js'
import { isLive } from './config.js'
import { endpoints } from './endpoints.js'
import { fromMock, notFound, request, unwrapItem, unwrapList } from './client.js'

/**
 * Convert one program from your API into the shape the pages expect
 * (see src/data/mock/programs.js for the full contract).
 * If your API already returns that shape, leave this as-is.
 */
export function mapProgram(raw) {
  return raw
}

export async function listPrograms({ signal } = {}) {
  if (!isLive('programs')) return fromMock(mockPrograms)
  const data = await request(endpoints.programs.list, { signal })
  return unwrapList(data).map(mapProgram)
}

export async function getProgram(slug, { signal } = {}) {
  if (!isLive('programs')) {
    const program = mockPrograms.find((p) => p.slug === slug)
    if (!program) throw notFound('This program')
    return fromMock(program)
  }
  const data = await request(endpoints.programs.detail(slug), { signal })
  return mapProgram(unwrapItem(data))
}
