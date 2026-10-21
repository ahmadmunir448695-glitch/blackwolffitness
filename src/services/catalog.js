/**
 * ============================================================================
 *  SITE CATALOG — static lookups the UI needs synchronously
 *
 *  Menus, route guards, filters, name lookups and build-time SEO must work
 *  instantly, before (or without) any API call. They read from here.
 *
 *  This file and src/services/api/* are the ONLY modules allowed to import
 *  from src/data/mock/. Pages and components never do, so replacing mock data
 *  with API responses never means editing a page.
 *
 *  When your API is live, the full program / coach / plan objects come from
 *  `api.*` (src/services/api). This catalog only keeps the lightweight list
 *  of program names and slugs used for navigation — keep it in step with the
 *  programs your API returns (or generate it from the API at build time).
 *
 *  Plain JS with relative imports only — Node also reads this at build time.
 * ============================================================================
 */
import { programs } from '../data/mock/programs.js'
import { coaches, coachSpecializations as specializations } from '../data/mock/coaches.js'
import { membershipFaqs as faqs } from '../data/mock/memberships.js'
import { testimonials as testimonialList } from '../data/mock/testimonials.js'

/** Lightweight program list: { slug, name, shortName, tagline, featured, discipline, image, seo } */
export const programCatalog = programs.map((p) => ({
  slug: p.slug,
  name: p.name,
  shortName: p.shortName ?? p.name,
  tagline: p.tagline,
  featured: Boolean(p.featured),
  discipline: p.discipline ?? p.name,
  image: p.image ?? null,
  seo: p.seo ?? null,
}))

export const programSlugs = programCatalog.map((p) => p.slug)

export function findProgram(slug) {
  return programCatalog.find((p) => p.slug === slug) ?? null
}

/** Short display name for a program slug; falls back to the slug itself. */
export function programName(slug) {
  return findProgram(slug)?.shortName ?? slug
}

/** Coach slugs known locally (used by the router while coaches are on mock data). */
export const coachSlugs = coaches.map((c) => c.slug)

/** Filter chips on the Coaches page (only chips with at least one coach are shown). */
export const coachSpecializations = [...specializations]

/** Membership FAQs are site copy, not API data. Edit them in src/data/mock/memberships.js. */
export const membershipFaqs = faqs

/**
 * Testimonials are site copy. Entries marked `placeholder: true` are only
 * shown in development, clearly labelled, and never on the live site.
 */
export const testimonials = testimonialList

/**
 * Full local records used ONLY at build time (scripts/postbuild.mjs via
 * src/seo/pages.js) to write per-route HTML with titles and Open Graph tags.
 * In the browser, pages get their data from `api.*` and set metadata from it.
 */
export const prerenderSource = { programs, coaches }
