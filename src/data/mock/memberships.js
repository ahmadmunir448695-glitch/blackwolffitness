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

export const membershipPlans = [
  {
    id: 'single-program',
    name: 'Single program',
    summary: 'Train in one program of your choice.',
    price: null,
    currency: 'PKR',
    period: 'month',
    otherPrices: [
      { label: 'Admission / registration fee', price: null },
    ],
    programs: ['taekwondo', 'boxing', 'kickboxing', 'mma', 'general-fitness', 'gymnastics'],
    inclusions: ['Coached group sessions in one program', 'Progress check-ins with your coach', 'Access to beginner sessions'],
    highlight: false,
    placeholder: true,
  },
  {
    id: 'multi-program',
    name: 'Multi-program',
    summary: 'Combine martial arts with fitness, or train in more than one discipline.',
    price: null,
    currency: 'PKR',
    period: 'month',
    otherPrices: [
      { label: 'Admission / registration fee', price: null },
    ],
    programs: ['taekwondo', 'boxing', 'kickboxing', 'mma', 'general-fitness', 'gymnastics'],
    inclusions: ['Coached sessions across more than one program', 'Progress check-ins with your coaches', 'Goal-setting session'],
    highlight: true,
    placeholder: true,
  },
  {
    id: 'kids-programs',
    name: 'Kids & juniors',
    summary: 'Age-appropriate classes for children and juniors.',
    price: null,
    currency: 'PKR',
    period: 'month',
    otherPrices: [],
    programs: ['taekwondo', 'gymnastics'],
    inclusions: ['Age-appropriate group classes', 'Regular feedback for parents'],
    highlight: false,
    placeholder: true,
  },
  {
    id: 'special-kids-training',
    name: 'Special Kids Training',
    summary: 'Individualized support, planned with parents.',
    price: null,
    currency: 'PKR',
    period: 'month',
    otherPrices: [],
    programs: ['special-kids-training'],
    inclusions: ['Parent consultation before starting', 'Individualized activity planning', 'Progress updates for parents'],
    highlight: false,
    placeholder: true,
  },
]

/** Membership FAQs. Answers avoid inventing terms — edit once policies are set. */
export const membershipFaqs = [
  { q: 'How much does membership cost?', a: 'Plans and prices are being finalised. Send us a message or WhatsApp and we will share current options.' },
  { q: 'Can I try a class before joining?', a: 'Yes. Request a trial session using the form on this page and we will arrange a suitable class.' },
  { q: 'Can I train in more than one program?', a: 'Yes. Ask about multi-program options when you contact the club.' },
  { q: 'Do I need any experience to join?', a: 'No. Every program has beginner-friendly sessions and coaches will help you start at the right level.' },
  { q: 'How do I pay or cancel?', a: 'Payment methods and membership terms will be shared when you enrol. Ask the club if you have specific questions.' },
]
