import { describe, expect, it } from 'vitest'
import { groupSaving, groupTotal, personalServices, programMemberships } from '../src/config/pricing.js'

const bySlug = Object.fromEntries(programMemberships.map((p) => [p.slug, p]))

describe('membership pricing', () => {
  it('has the agreed individual and group fees', () => {
    expect(bySlug.taekwondo.individual).toBe(6000)
    expect(bySlug.taekwondo.group.perPerson).toBe(5000)
    expect(bySlug.boxing.individual).toBe(7000)
    expect(bySlug.boxing.group.perPerson).toBe(6000)
    expect(bySlug.mma.individual).toBe(10000)
    expect(bySlug.mma.group.perPerson).toBe(8000)
    expect(bySlug['general-fitness'].individual).toBe(8000)
    expect(bySlug['general-fitness'].group.perPerson).toBe(7000)
  })

  it('calculates the total for three people correctly', () => {
    expect(groupTotal(bySlug.taekwondo.group)).toBe(15000)
    expect(groupTotal(bySlug.boxing.group)).toBe(18000)
    expect(groupTotal(bySlug.mma.group)).toBe(24000)
    expect(groupTotal(bySlug['general-fitness'].group)).toBe(21000)
    programMemberships.forEach((p) => expect(p.group.size).toBe(3))
  })

  it('shows a positive saving per person', () => {
    programMemberships.forEach((p) => expect(groupSaving(p)).toBeGreaterThan(0))
    expect(groupSaving(bySlug.mma)).toBe(2000)
  })

  it('labels General Fitness as a family package', () => {
    expect(bySlug['general-fitness'].group.label).toBe('Family Package')
  })

  it('has the personal and home training packages', () => {
    const [personal, home] = personalServices
    expect(personal.individual.price).toBe(20000)
    expect(personal.family.total).toBe(25000)
    expect(personal.family.size).toBe(3)
    expect(personal.period).toBe('month')
    expect(home.individual.price).toBe(35000)
    expect(home.family.total).toBe(40000)
    expect(home.family.size).toBe(3)
    expect(home.period).toBeNull() // billing period not confirmed yet
  })
})
