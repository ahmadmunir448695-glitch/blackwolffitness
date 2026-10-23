/**
 * ============================================================================
 *  MEMBERSHIP PRICING — the one place to change fees.
 *
 *  Everything on the Membership page reads from here. Group totals are
 *  calculated (perPerson × size), never typed in, so they always match.
 *  Keep this file plain JavaScript (no imports) so tests and build scripts
 *  can read it in Node.
 * ============================================================================
 */

export const currency = 'PKR'

/**
 * One-time registration fee, paid once when joining. Shown on the programs
 * listed in `appliesTo` (Martial Arts & Fitness Membership). It is separate
 * from the monthly fee and is never added into the monthly prices.
 */
export const registrationFee = {
  amount: 2000,
  label: 'One-Time Registration Fee',
  appliesTo: ['taekwondo', 'boxing', 'mma', 'general-fitness'],
}

/** True when the registration fee applies to this program slug. */
export function hasRegistrationFee(slug) {
  return registrationFee.appliesTo.includes(slug)
}

/**
 * Martial Arts & Fitness Membership.
 *   individual       monthly fee for one person
 *   group.perPerson  monthly fee per person when `group.size` people join together
 *   group.label      badge text
 *   group.note       optional condition shown under the group price
 */
export const programMemberships = [
  {
    slug: 'taekwondo',
    name: 'Taekwondo',
    icon: 'kick',
    individual: 6000,
    group: { size: 3, perPerson: 5000, label: '3-Person Group Discount' },
  },
  {
    slug: 'boxing',
    name: 'Boxing',
    icon: 'glove',
    individual: 7000,
    group: { size: 3, perPerson: 6000, label: '3-Person Group Discount' },
  },
  {
    slug: 'mma',
    name: 'MMA',
    icon: 'octagon',
    individual: 10000,
    group: { size: 3, perPerson: 8000, label: '3-Person Group Discount' },
  },
  {
    slug: 'general-fitness',
    name: 'General Fitness',
    icon: 'dumbbell',
    individual: 8000,
    group: { size: 3, perPerson: 7000, label: 'Family Package', note: 'For 3 members of the same family' },
  },
]

/**
 * Personal Training & Home Training.
 *   period  billing period shown after the price ('month'), or null while it
 *           has not been confirmed. Null shows no period at all.
 *   family.total  the TOTAL fee for all `family.size` people together.
 */
export const personalServices = [
  {
    id: 'personal-training',
    name: 'Personal Training',
    place: 'At the club',
    icon: 'user',
    period: 'month',
    summary: 'One-to-one coaching with a personalized workout plan and professional guidance toward your fitness goals.',
    individual: { label: 'Individual Package', price: 20000 },
    family: { label: 'Family Package', total: 25000, size: 3, note: 'For 3 people from the same family' },
    cta: 'Book Personal Training',
  },
  {
    id: 'home-training',
    name: 'Home Training',
    place: 'At your home',
    icon: 'home',
    period: null, // billing period not confirmed yet: do not show "month" or "session"
    summary: 'Your coach comes to you and trains you at home, so you can train in your own space.',
    individual: { label: 'Individual Home Training', price: 35000 },
    family: { label: 'Family Home Training', total: 40000, size: 3, note: 'For 3 people from the same household' },
    cta: 'Book Home Training',
  },
]

/** Total monthly amount for a whole group. */
export function groupTotal(group) {
  return group.perPerson * group.size
}

/** How much each person saves per month in the group rate. */
export function groupSaving(plan) {
  return plan.individual - plan.group.perPerson
}
