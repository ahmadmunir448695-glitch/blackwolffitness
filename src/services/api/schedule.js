import { schedule as mockSchedule, weekDays } from '@/data/mock/schedule.js'
import { isLive } from './config.js'
import { endpoints } from './endpoints.js'
import { fromMock, request, unwrapList } from './client.js'

/** Convert one class from your API into { program, day, start, end, level, coach }. */
export function mapClass(raw) {
  return {
    program: raw.program,
    day: raw.day,
    start: raw.start,
    end: raw.end,
    level: raw.level ?? '',
    coach: raw.coach ?? '',
  }
}

function sortClasses(list) {
  return [...list].sort(
    (a, b) => weekDays.indexOf(a.day) - weekDays.indexOf(b.day) || String(a.start).localeCompare(String(b.start)),
  )
}

/** @param {object} [filters] { program } */
export async function listSchedule({ program } = {}, { signal } = {}) {
  let list
  if (!isLive('schedule')) {
    list = await fromMock(mockSchedule)
  } else {
    const data = await request(endpoints.schedule.list, { signal, query: { program } })
    list = unwrapList(data)
  }
  const mapped = list.map(mapClass)
  return sortClasses(program ? mapped.filter((c) => c.program === program) : mapped)
}
