/**
 * ============================================================================
 *  MEMBERSHIP PLANS & PRICES (mock data) — edit this file to set prices.
 *
 *  Nothing here is a real price or term yet. Every plan is a configurable
 *  placeholder (placeholder: true). While `price` is null the page shows
 *  "Price on request" and a note that plans are being finalised.
 *
 *  Fields
 *    id          Stable id, used for analytics / API mapping.
 *    name        Plan name.
 *    summary     One sentence.
 *    price       Number (e.g. 8000) or null.
 *    currency    e.g. 'PKR'. Shown before the price.
 *    period      'month', 'quarter', 'session'… shown after the price.
 *    otherPrices Optional extra price lines, e.g. [{ label: 'Admission fee', price: null }]
 *    programs    Program slugs the plan can be used for.
 *    inclusions  What the plan includes (confirm with the club).
 *    highlight   true to visually feature one plan.
 *    placeholder true until confirmed.
 * ============================================================================
 */

/**
 * Legacy plan list (kept for the API layer). The Membership page now reads
 * real prices from src/config/pricing.js.
 */
export const membershipPlans = []

/** Membership FAQs. Answers avoid inventing terms — edit once policies are set. */
export const membershipFaqs = [
  { q: 'How much does membership cost?', a: 'Taekwondo is PKR 6,000, Boxing PKR 7,000, MMA PKR 10,000 and General Fitness PKR 8,000 per month for one person. When three people join together each pays the group rate shown on this page. There is also a one-time registration fee of PKR 2,000 when you join, paid once and not every month.' },
  { q: 'How does the group rate work?', a: 'The group price is per person, per month, when three people enrol together. For example, three people in Taekwondo pay PKR 5,000 each, PKR 15,000 a month in total. The General Fitness rate is a family package for three members of the same family.' },
  { q: 'Can I try a class before joining?', a: 'Yes. Request a trial session using the form on this page and we will arrange a suitable class.' },
  { q: 'Can I train in more than one program?', a: 'Yes. Ask about multi-program options when you contact the club.' },
  { q: 'Do I need any experience to join?', a: 'No. Every program has beginner-friendly sessions and coaches will help you start at the right level.' },
  { q: 'How do I pay or cancel?', a: 'Payment methods and membership terms will be shared when you enrol. Ask the club if you have specific questions.' },
]
