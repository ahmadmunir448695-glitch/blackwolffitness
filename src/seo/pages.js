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
export const DEFAULT_IMAGE = '/og-image.png'

/** ' in Lahore' once a city is configured, so local searches match. */
export function localSuffix() {
  return club.location.city ? ` in ${club.location.city}` : ''
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
    title: `${SITE_NAME} | Taekwondo, Boxing, MMA & Fitness Training${localSuffix()}`,
    description: `Black Wolf Fitness Club offers coached Taekwondo, Boxing, Kickboxing, MMA, General Fitness, Gymnastics and Special Kids Training${localSuffix()}. Beginner-friendly sessions and structured programs.`,
  },
  about: {
    path: '/about',
    title: 'About Us: Our Mission, Coaching Philosophy & Values',
    description: 'Learn about Black Wolf Fitness Club: our mission, vision, training philosophy and the values of discipline, respect, confidence, consistency and growth.',
  },
  services: {
    path: '/services',
    title: `Training Programs: Martial Arts, Boxing & Fitness${localSuffix()}`,
    description: 'Explore every Black Wolf program: Taekwondo, Boxing, Kickboxing, Mixed Martial Arts, General Fitness, Gymnastics and Special Kids Training.',
  },
  coaches: {
    path: '/coaches',
    title: 'Our Coaches: Taekwondo, Boxing, MMA & Fitness',
    description: 'Meet the Black Wolf Fitness Club coaching team. Filter coaches by specialization and view each coach’s experience and programs.',
  },
  membership: {
    path: '/membership',
    title: 'Membership Plans & Trial Sessions',
    description: 'Membership options at Black Wolf Fitness Club. Compare plans, see what is included and request a trial session in any program.',
  },
  contact: {
    path: '/contact',
    title: `Contact Us: Location, Hours & WhatsApp${localSuffix()}`,
    description: 'Contact Black Wolf Fitness Club by phone, WhatsApp or message. Find our location, opening hours and social media links.',
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
  return {
    path: `/coaches/${coach.slug}`,
    title: coach.name?.trim() ? `${name}, ${coach.role}` : `${coach.role}`,
    description: `${name} at Black Wolf Fitness Club. Specializations: ${coach.specializations.join(', ')}.`,
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
