# Black Wolf Fitness Club — website frontend

A multi-page website built with Vue 3, Vite, Vue Router and Tailwind CSS v4. It is frontend-only: content comes from local mock data through an API service layer, ready to switch to your real API later (see [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md)).

## Run it

Requires Node 20.19+ (Node 22 recommended).

```bash
npm install
cp .env.example .env      # optional; empty values = mock data
npm run dev               # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build into `dist/`, plus per-route HTML with SEO tags, `robots.txt`, and `sitemap.xml` when `VITE_SITE_URL` is set |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (also blocks pages importing mock data directly) |
| `npm test` | Vitest: API layer, validation, WhatsApp links |
| `npm run check:content` | Lists every business detail still missing (phone, prices, coaches…) |
| `npm run images:check` | Checks every photo in `src/data/media.js` still loads |
| `npm run images:download` | Saves every photo to `public/images/` |
| `npm run images:selfhost` | Downloads the photos and points `media.js` at the local copies, so the site no longer depends on Unsplash |

## Pages

| Route | Page |
|---|---|
| `/` | Home: hero, programs, why Black Wolf, coaches, gallery, membership CTA, testimonials (placeholders shown only in dev) |
| `/about` | Mission, vision, philosophy, values, gallery |
| `/services` | All programs |
| `/services/taekwondo` · `boxing` · `kickboxing` · `mma` · `general-fitness` · `gymnastics` · `special-kids-training` | Individual program pages, each with its own sections, FAQs, metadata and CTA |
| `/coaches` | Coach directory with specialization filters |
| `/coaches/:slug` | Individual coach profile |
| `/membership` | Plans, program categories, schedule, trial request, FAQs |
| `/contact` | Contact, trial and parent-inquiry form, WhatsApp, map, hours, socials |
| anything else | Custom 404 |

`/kids` and `/special-kids-training` redirect to the Special Kids Training page.

## Where to edit things

| To update… | Edit |
|---|---|
| Phone, WhatsApp, email, address, map, opening hours, social links | `src/config/club.js` |
| Coach profiles (add / remove / edit) | `src/data/mock/coaches.js` |
| Membership prices, plans, inclusions | `src/data/mock/memberships.js` |
| Membership FAQs | `src/data/mock/memberships.js` (`membershipFaqs`) |
| Class schedule | `src/data/mock/schedule.js` |
| Program page content, FAQs, ages, safety details | `src/data/mock/programs.js` |
| About page text, "Why Black Wolf", gallery | `src/data/content.js` |
| Photos | `src/data/media.js` (files in `src/assets/photos/`) |
| Testimonials (real ones only) | `src/data/mock/testimonials.js` |
| Navigation menu | `src/config/navigation.js` |
| Page titles and descriptions | `src/seo/pages.js` (program pages use each program's `seo` field) |
| Colors, fonts, spacing tokens | `src/assets/main.css` (`@theme`) |

Once the API is connected, coaches, plans, schedule and programs come from the API instead. The files above stay as the offline fallback.

Empty values never show broken links: a missing WhatsApp number hides WhatsApp buttons, a missing price shows "Price on request", and so on. Run `npm run check:content` before launch.

## Design and motion

- **Hero**: a cross-fading photo slideshow (one per discipline) with a slow Ken Burns zoom, slide progress bars, the torn-in claw marks and a line-by-line headline. Slides are set in `heroSlides` in `src/data/content.js`.
- **Scroll reveals**: `v-reveal`, `v-reveal-stagger`, `v-reveal-auto` and `v-parallax` (in `src/directives/motion.js`) fade, slide, wipe and drift content in as it scrolls into view.
- **Home extras**: discipline marquee, counting stats band (`clubFacts` in `content.js` — keep these strictly factual), values band with a parallax photo, photo collage in "Why Black Wolf".
- **Details**: header hides while scrolling down and shows a reading-progress bar, program tiles zoom and tint on hover, gallery photos open in a full-screen viewer (arrow keys / Esc), button sheen, film-grain texture, giant outlined wordmark in the footer.
- Everything respects *reduced motion*: visitors who turn animations off get the static layout, with all content visible.

## Project structure

```
src/
  config/        club.js (contact info), navigation.js
  services/      api.js + api/ (API layer), catalog.js (static lookups)
  data/          mock/ (API-shaped mock data), content.js, media.js
  composables/   useAsync (loading / error / data state)
  components/    layout, brand, ui, home, programs (+ sections), coaches, forms, shared
  views/         one component per page
  seo/           per-route metadata, JSON-LD
  router/        routes, slug guards, scroll behaviour
scripts/         postbuild.mjs (per-route HTML + sitemap), check-content.mjs
tests/           Vitest specs
```

## Deployment

`npm run build` outputs a static site in `dist/`. It works on any static host.

- **Vercel**: import the repo. `vercel.json` sets the build command, output folder, SPA rewrites and asset caching.
- **Netlify**: import the repo. `netlify.toml` and `public/_redirects` handle the build and SPA fallback.
- **Other hosts** (Cloudflare Pages, S3, nginx): serve `dist/` and rewrite unknown paths to `/index.html`. Every known route also has its own `dist/<route>/index.html`, so direct links like `/services/boxing` work even without a rewrite, and `dist/404.html` is included.

Set these environment variables on the host (see `.env.example`), then redeploy:

- `VITE_SITE_URL`: your public URL, used for canonical links, Open Graph URLs and the sitemap
- `VITE_API_BASE_URL`: when your API is ready

## Contact forms

The forms validate input on the client, but **nothing is sent until an API is connected**. Until then, submitting shows "Your message has not been sent" and offers WhatsApp (pre-filled with the visitor's details) or a phone call. A success message appears only after the API confirms receipt. See [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md) for the endpoint contract and server-side requirements (CORS, spam protection, delivery).

## Content rules followed

There are no invented prices, schedules, coach identities, qualifications, awards, member numbers, addresses or federation affiliations. Testimonials are marked as placeholders and hidden in production. The Special Kids Training page makes no medical or therapeutic claims.
