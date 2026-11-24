/**
 * Page titles and descriptions for every route. Used in the browser (on
 * navigation) and by scripts/postbuild.mjs, which writes a static HTML file
 * per route with these tags so search engines and link previews (WhatsApp,
 * Facebook) see the right title, description and image.
 *
 * Plain JS with relative imports only — Node reads this file at build time.
 */
import { club } from '../config/club.js'
import { prerenderSource } from '../services/catalog.js'

const { programs, coaches } = prerenderSource

export const SITE_NAME = club.name
export const DEFAULT_IMAGE = '/og-image.jpg'

/** ' in Lahore' once a city is configured, so local searches match. */
export function localSuffix() {
  const { area, city } = club.location
  if (!city) return ''
  return area ? ` in ${area}, ${city}` : ` in ${city}`
}

export function fullTitle(title) {
  if (!title) return SITE_NAME
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
}

/** Social preview crop for Unsplash images; local paths are left alone. */
export function socialImage(src) {
  if (!src) return DEFAULT_IMAGE
  if (src.startsWith('https://images.unsplash.com/')) {
    return `${src}?w=1200&h=630&fit=crop&crop=entropy&q=75&auto=format`
  }
  return src
}

export const staticPages = {
  home: {
    path: '/',
    title: `${SITE_NAME} | Taekwondo, Boxing, MMA & Fitness Club${localSuffix()}`,
    description: `Black Wolf Fitness Club is a fitness, Taekwondo, Boxing, Kickboxing and MMA club${localSuffix()}, Punjab. Coached classes for kids and adults, gymnastics and Special Kids Training. Call 0305 4486950.`,
  },
  about: {
    path: '/about',
    title: `About Black Wolf Fitness Club: Martial Arts & Fitness Club${localSuffix()}`,
    description: `Meet Black Wolf Fitness Club${localSuffix()}: our team, training hall, mission and values of discipline, respect, confidence, consistency and growth.`,
  },
  services: {
    path: '/services',
    title: `Taekwondo, Boxing, MMA, Kickboxing & Fitness Classes${localSuffix()}`,
    description: `Every Black Wolf program${localSuffix()}: Taekwondo, Boxing, Kickboxing, Mixed Martial Arts (MMA), General Fitness, Gymnastics and Special Kids Training.`,
  },
  coaches: {
    path: '/coaches',
    title: `Taekwondo, Boxing & MMA Coaches${localSuffix()}`,
    description: `Meet the Black Wolf Fitness Club coaches${localSuffix()}: Taekwondo black belts and championship medalists coaching Taekwondo, Boxing, MMA and fitness.`,
  },
  membership: {
    path: '/membership',
    title: `Membership Fees & Trial Sessions${localSuffix()}`,
    description: `Black Wolf Fitness Club membership fees${localSuffix()}. Compare Taekwondo, Boxing, MMA and fitness plans, family discounts, and book a trial session.`,
  },
  contact: {
    path: '/contact',
    title: `Contact Us: Location, Timings & WhatsApp${localSuffix()}`,
    description: 'Black Wolf Fitness Club, 114 St 3-A Plaza, 15-C Lavandus Block, Bahria Town, Lahore. Call or WhatsApp 0305 4486950. Directions, timings and social links.',
  },
  notFound: {
    path: '/404',
    title: 'Page not found',
    description: 'The page you are looking for does not exist. Explore our training programs or contact the club.',
    noindex: true,
  },
}

export function programPage(program) {
  return {
    path: `/services/${program.slug}`,
    title: `${program.seo?.title ?? program.name}${localSuffix()}`,
    description: program.seo?.description ?? program.tagline,
    image: socialImage(program.hero?.image?.src ?? program.image?.src),
  }
}

export function coachDisplayName(coach) {
  return coach.name?.trim() || coach.role
}

export function coachPage(coach) {
  const name = coachDisplayName(coach)
  const aka = (coach.alternateNames ?? []).filter(Boolean)
  const shownName = aka.length ? `${name} (${aka.join(', ')})` : name
  return {
    path: `/coaches/${coach.slug}`,
    title: coach.name?.trim() ? `${shownName}, ${coach.role}` : `${coach.role}`,
    description: `${shownName}, ${coach.role} at ${SITE_NAME}${localSuffix()}. Specializations: ${coach.specializations.join(', ')}.`,
    image: socialImage(coach.photo?.src),
    // Keep placeholder profiles out of search results until they are real.
    noindex: Boolean(coach.placeholder),
  }
}

/** Every route the postbuild script should write an HTML file for. */
export function allPages() {
  return [
    ...Object.entries(staticPages).map(([key, page]) => ({ key, ...page })),
    ...programs.map((program) => ({ key: `program:${program.slug}`, ...programPage(program) })),
    ...coaches.map((coach) => ({ key: `coach:${coach.slug}`, ...coachPage(coach) })),
  ]
}
