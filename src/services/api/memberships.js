import { membershipPlans as mockPlans } from '@/data/mock/memberships.js'
import { isLive } from './config.js'
import { endpoints } from './endpoints.js'
import { fromMock, request, unwrapList } from './client.js'

/**
 * Convert one plan from your API into:
 * { id, name, summary, price:number|null, currency, period,
 *   otherPrices[{label, price}], programs[], inclusions[], highlight, placeholder }
 */
export function mapPlan(raw) {
  return {
    otherPrices: [],
    programs: [],
    inclusions: [],
    highlight: false,
    placeholder: false,
    currency: 'PKR',
    period: 'month',
    ...raw,
    price: raw?.price == null || raw.price === '' ? null : Number(raw.price),
  }
}

export async function listPlans({ signal } = {}) {
  if (!isLive('memberships')) return fromMock(mockPlans.map(mapPlan))
  const data = await request(endpoints.memberships.plans, { signal })
  return unwrapList(data).map(mapPlan)
}
