import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, apiConfig, isLive } from '@/services/api'
import { programs } from '@/data/mock/programs.js'

const reset = () => {
  apiConfig.baseUrl = ''
  apiConfig.resources = []
}

afterEach(() => {
  reset()
  vi.unstubAllGlobals()
})

describe('API layer: mock mode (no VITE_API_BASE_URL)', () => {
  it('serves programs, coaches, plans and schedule from mock data', async () => {
    expect(isLive('programs')).toBe(false)
    expect((await api.programs.list()).length).toBe(programs.length)
    expect((await api.programs.get('boxing')).name).toBe('Boxing')
    expect((await api.coaches.list({ program: 'boxing' })).every((c) => c.programs.includes('boxing'))).toBe(true)
    expect(Array.isArray(await api.memberships.listPlans())).toBe(true)
    expect(await api.schedule.list()).toEqual([])
  })

  it('returns copies, so pages cannot mutate the source data', async () => {
    const first = await api.programs.get('boxing')
    first.name = 'changed'
    expect((await api.programs.get('boxing')).name).toBe('Boxing')
  })

  it('throws not_found for unknown slugs', async () => {
    await expect(api.programs.get('nope')).rejects.toMatchObject({ code: 'not_found' })
    await expect(api.coaches.get('nope')).rejects.toMatchObject({ code: 'not_found' })
  })

  it('never pretends to send a contact message', async () => {
    await expect(api.contact.send({ name: 'A' })).rejects.toMatchObject({ code: 'not_configured' })
    await expect(api.contact.requestTrial({ name: 'A' })).rejects.toMatchObject({ code: 'not_configured' })
  })
})

describe('API layer: live mode', () => {
  it('fetches from the configured base URL and unwraps DRF pagination', async () => {
    apiConfig.baseUrl = 'https://api.example.test'
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ results: [{ slug: 'x', name: 'X', role: 'Coach' }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const list = await api.coaches.list()
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/coaches/')
    expect(list[0]).toMatchObject({ slug: 'x', specializations: [], bio: [] })
  })

  it('switches only the listed resources to the API', () => {
    apiConfig.baseUrl = 'https://api.example.test'
    apiConfig.resources = ['contact']
    expect(isLive('contact')).toBe(true)
    expect(isLive('programs')).toBe(false)
  })

  it('maps field errors from a 400 response', async () => {
    apiConfig.baseUrl = 'https://api.example.test'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ email: ['Enter a valid email address.'] }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })))
    await expect(api.contact.send({ name: 'Ali', phone: '03001234567', email: 'x' })).rejects.toMatchObject({
      status: 400,
      fieldErrors: { email: 'Enter a valid email address.' },
    })
  })

  it('reports network failures clearly', async () => {
    apiConfig.baseUrl = 'https://api.example.test'
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    await expect(api.programs.list()).rejects.toMatchObject({ code: 'network' })
  })
})
