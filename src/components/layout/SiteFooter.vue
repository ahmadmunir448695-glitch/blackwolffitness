<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BrandLogo from '../brand/BrandLogo.vue'
import AppIcon from '../ui/AppIcon.vue'
import PlaceholderText from '../ui/PlaceholderText.vue'
import emblem from '@/assets/brand/wolf-emblem.png'
import { club, socialLabels } from '@/config/club.js'
import { programLinks } from '@/config/navigation.js'
import { telHref } from '@/utils/format.js'
import { whatsappUrl } from '@/utils/whatsapp.js'

const year = new Date().getFullYear()
const chatUrl = whatsappUrl()

/** "https://www.tiktok.com/@blackwolffitness" → "@blackwolffitness" */
function handleFrom(url) {
  const last = String(url).replace(/\/+$/, '').split('/').pop() ?? ''
  return last ? `@${last.replace(/^@/, '')}` : ''
}

const socials = computed(() =>
  Object.entries(club.socials)
    .filter(([, url]) => url)
    .map(([key, url]) => ({ key, url, label: socialLabels[key] ?? key, handle: handleFrom(url) })),
)

/** Phone rows: the main line also opens WhatsApp. */
const phones = computed(() =>
  [
    club.contact.phone && { key: 'main', value: club.contact.phone, tel: telHref(club.contact.phone), whatsapp: chatUrl },
    club.contact.phoneAlt && { key: 'alt', value: club.contact.phoneAlt, tel: telHref(club.contact.phoneAlt), whatsapp: null },
  ].filter(Boolean),
)

const hasContact = computed(() => phones.value.length || club.contact.email || socials.value.length)

const address = computed(() => [...club.location.addressLines, club.location.city].filter(Boolean))

/** Discipline ticker across the top of the footer. */
const ticker = programLinks.map((p) => p.shortLabel)

const clubLinks = [
  { label: 'About us', to: '/about' },
  { label: 'Coaches', to: '/coaches' },
  { label: 'Membership', to: '/membership' },
  { label: 'Book a trial', to: { path: '/contact', query: { topic: 'trial' } } },
  { label: 'Contact us', to: '/contact' },
]

function toTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}
</script>

<template>
  <footer class="relative isolate overflow-hidden bg-coal">
    <!-- Discipline ticker -->
    <div class="ticker relative border-y border-line bg-ink py-5" aria-hidden="true">
      <div class="ticker__track">
        <template v-for="copy in 2" :key="copy">
          <span v-for="(item, i) in ticker" :key="`${copy}-${item}`" class="ticker__item">
            <span :class="i % 2 ? 'ticker__word--outline' : 'ticker__word'">{{ item }}</span>
            <svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0 text-ember"><path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" fill="currentColor" /></svg>
          </span>
        </template>
      </div>
    </div>

    <div class="site-container pt-16 lg:pt-20">
      <!-- Join panel -->
      <section aria-labelledby="footer-join" class="join-panel">
        <div class="join-panel__blob join-panel__blob--a" aria-hidden="true" />
        <div class="join-panel__blob join-panel__blob--b" aria-hidden="true" />
        <img :src="emblem" alt="" aria-hidden="true" class="join-panel__emblem" />

        <div class="relative grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full border border-ember/30 bg-ember/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-ember">
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-60" />
                <span class="relative inline-flex h-2 w-2 rounded-full bg-ember" />
              </span>
              Now enrolling
            </p>
            <h2 id="footer-join" class="mt-6 font-display text-display font-black uppercase text-bone">
              Ready to join<br /><span class="text-gradient-ember">the pack?</span>
            </h2>
            <p class="mt-5 max-w-xl text-lg leading-relaxed text-ash">
              Taekwondo, Boxing, Kickboxing, MMA, Fitness, Gymnastics and Special Kids Training, coached for beginners and experienced athletes.
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            <RouterLink :to="{ path: '/contact', query: { topic: 'trial' } }" class="join-btn join-btn--primary btn-molten btn-sheen group">
              <span>Book a trial session</span>
              <span class="join-btn__icon bg-ink text-ember"><AppIcon name="arrowRight" class="h-4 w-4 transition-transform duration-300 group-hover:-rotate-45" /></span>
            </RouterLink>
            <a v-if="chatUrl" :href="chatUrl" target="_blank" rel="noopener noreferrer" class="join-btn join-btn--ghost group">
              <span class="inline-flex items-center gap-2.5"><AppIcon name="whatsapp" class="h-5 w-5 text-ember" />Chat on WhatsApp</span>
              <span class="join-btn__icon border border-line text-bone group-hover:border-ember group-hover:text-ember"><AppIcon name="arrowRight" class="h-4 w-4 transition-transform duration-300 group-hover:-rotate-45" /></span>
              <span class="sr-only">(opens WhatsApp)</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Contact panel -->
      <section v-if="hasContact" aria-labelledby="footer-contact" class="mt-6">
        <h2 id="footer-contact" class="sr-only">Contact the club</h2>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
          <!-- Phones -->
          <div v-if="phones.length" class="contact-card md:col-span-2 lg:col-span-5">
            <div class="flex items-center gap-3">
              <span class="contact-icon"><AppIcon name="phone" class="h-5 w-5" /></span>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Call or WhatsApp</p>
            </div>
            <ul class="mt-5 divide-y divide-line/70">
              <li v-for="row in phones" :key="row.key" class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3 first:pt-0 last:pb-0">
                <a :href="row.tel" class="font-display text-3xl font-bold tracking-wide text-bone transition-colors duration-300 hover:text-ember sm:text-4xl">
                  {{ row.value }}
                </a>
                <span class="flex gap-2">
                  <a :href="row.tel" class="contact-pill" :aria-label="`Call ${row.value}`">
                    <AppIcon name="phone" class="h-4 w-4" />Call
                  </a>
                  <a
                    v-if="row.whatsapp"
                    :href="row.whatsapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="contact-pill contact-pill--wa"
                    :aria-label="`WhatsApp ${row.value} (opens in a new tab)`"
                  >
                    <AppIcon name="whatsapp" class="h-4 w-4" />WhatsApp
                  </a>
                </span>
              </li>
            </ul>
          </div>

          <!-- Email -->
          <a
            v-if="club.contact.email"
            :href="`mailto:${club.contact.email}`"
            class="contact-card group flex flex-col lg:col-span-4"
          >
            <div class="flex items-center gap-3">
              <span class="contact-icon"><AppIcon name="mail" class="h-5 w-5" /></span>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Email</p>
            </div>
            <p class="mt-5 text-lg font-semibold text-bone transition-colors duration-300 group-hover:text-ember sm:text-xl">
              {{ club.contact.email.split('@')[0] }}<wbr />@{{ club.contact.email.split('@')[1] }}
            </p>
            <span class="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-ash transition-colors duration-300 group-hover:text-ember">
              Write to us
              <AppIcon name="arrowRight" class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </a>

          <!-- Socials -->
          <div v-if="socials.length" class="contact-card flex flex-col lg:col-span-3">
            <div class="flex items-center gap-3">
              <span class="contact-icon"><AppIcon name="users" class="h-5 w-5" /></span>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Follow us</p>
            </div>
            <ul class="mt-5 divide-y divide-line/70 [&>li:first-child>a]:pt-0 [&>li:last-child>a]:pb-0">
              <li v-for="s in socials" :key="s.key">
                <a
                  :href="s.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-3 py-3 transition-colors duration-300"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-ink/60 text-bone transition-colors duration-300 group-hover:border-ember group-hover:bg-ember group-hover:text-ink"
                  >
                    <AppIcon :name="s.key" class="h-[1.15rem] w-[1.15rem]" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-xs font-semibold uppercase tracking-[0.16em] text-smoke">{{ s.label }}</span>
                    <span class="block truncate font-semibold text-bone transition-colors duration-300 group-hover:text-ember">{{ s.handle }}</span>
                  </span>
                  <AppIcon name="arrowRight" class="h-4 w-4 shrink-0 -rotate-45 text-smoke transition-all duration-300 group-hover:rotate-0 group-hover:text-ember" />
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Link columns -->
      <div class="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 border-t border-line pt-14 lg:grid-cols-12 lg:gap-8">
        <div class="col-span-2 lg:col-span-4">
          <RouterLink to="/" aria-label="Black Wolf Fitness Club, home" class="inline-block">
            <BrandLogo size="lg" />
          </RouterLink>
          <p class="mt-6 max-w-sm text-ash">{{ club.tagline }}</p>
          <p class="mt-5 flex items-center gap-3 font-display text-lg font-bold uppercase tracking-[0.22em] text-smoke">
            <span>Train</span><span class="h-1.5 w-1.5 rotate-45 bg-ember" aria-hidden="true" />
            <span>Fight</span><span class="h-1.5 w-1.5 rotate-45 bg-ember" aria-hidden="true" />
            <span>Grow</span>
          </p>
          <ul class="mt-7 flex gap-2.5" aria-label="Black Wolf on social media">
            <li v-for="s in socials" :key="s.key">
              <a :href="s.url" target="_blank" rel="noopener noreferrer" class="social-dot" :aria-label="`${s.label} (opens in a new tab)`">
                <AppIcon :name="s.key" class="h-5 w-5" />
              </a>
            </li>
            <li v-if="chatUrl">
              <a :href="chatUrl" target="_blank" rel="noopener noreferrer" class="social-dot" aria-label="WhatsApp (opens WhatsApp)">
                <AppIcon name="whatsapp" class="h-5 w-5" />
              </a>
            </li>
          </ul>
        </div>

        <nav aria-labelledby="footer-programs" class="col-span-1 lg:col-span-3">
          <h2 id="footer-programs" class="footer-heading"><span class="footer-heading__num">01</span>Programs</h2>
          <ul class="mt-6 space-y-3.5">
            <li v-for="link in programLinks" :key="link.to">
              <RouterLink :to="link.to" class="footer-link group" :class="link.featured ? 'text-ember' : ''">
                <AppIcon name="arrowRight" class="footer-link__arrow" />
                <span>{{ link.label }}</span>
                <span v-if="link.featured" class="ml-1 h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_10px_2px_var(--color-ember)]" aria-hidden="true" />
              </RouterLink>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-club" class="col-span-1 lg:col-span-2">
          <h2 id="footer-club" class="footer-heading"><span class="footer-heading__num">02</span>Club</h2>
          <ul class="mt-6 space-y-3.5">
            <li v-for="link in clubLinks" :key="link.label">
              <RouterLink :to="link.to" class="footer-link group">
                <AppIcon name="arrowRight" class="footer-link__arrow" />
                <span>{{ link.label }}</span>
              </RouterLink>
            </li>
          </ul>
        </nav>

        <div class="col-span-2 lg:col-span-3">
          <h2 class="footer-heading"><span class="footer-heading__num">03</span>Visit</h2>
          <div class="mt-6 space-y-3">
            <div class="visit-row">
              <span class="visit-row__icon"><AppIcon name="pin" class="h-[1.1rem] w-[1.1rem]" /></span>
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Location</p>
                <address class="mt-0.5 not-italic text-bone">
                  <template v-if="address.length">
                    <span v-for="line in address" :key="line" class="block">{{ line }}</span>
                  </template>
                  <PlaceholderText v-else fallback="To be announced" hint="location in src/config/club.js" />
                </address>
              </div>
            </div>
            <div class="visit-row">
              <span class="visit-row__icon"><AppIcon name="clock" class="h-[1.1rem] w-[1.1rem]" /></span>
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Opening hours</p>
                <ul v-if="club.hours.length" class="mt-0.5 space-y-0.5 text-bone">
                  <li v-for="row in club.hours" :key="row.days">{{ row.days }} · <span class="text-ash">{{ row.hours }}</span></li>
                </ul>
                <div v-else class="mt-0.5 text-bone"><PlaceholderText fallback="To be announced" hint="hours in src/config/club.js" /></div>
              </div>
            </div>
            <a
              v-if="club.location.mapLink"
              :href="club.location.mapLink"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-link group gap-2 pt-1 text-sm font-semibold text-ember"
            >Get directions <AppIcon name="arrowRight" class="h-4 w-4 transition-transform group-hover:translate-x-1" /><span class="sr-only"> (opens in a new tab)</span></a>
          </div>
        </div>
      </div>
    </div>

    <!-- Giant wordmark -->
    <div class="mt-10 select-none overflow-hidden pt-10 pb-6" aria-hidden="true">
      <div v-reveal="'up'" class="wordmark group">
        <span class="wordmark__base">Black Wolf</span>
        <span class="wordmark__glow">Black Wolf</span>
        <span class="wordmark__lit">Black Wolf</span>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-line/80">
      <div class="site-container flex flex-col gap-4 py-6 text-sm text-smoke sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ year }} {{ club.name }}. All rights reserved.</p>
        <p class="hidden items-center gap-2 lg:flex">
          <span class="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden="true" />{{ club.tagline }}
        </p>
        <button
          type="button"
          class="group inline-flex items-center gap-3 self-start font-semibold text-ash transition-colors hover:text-bone sm:self-auto"
          @click="toTop"
        >
          Back to top
          <span class="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-ink transition-all duration-300 group-hover:border-ember group-hover:bg-ember group-hover:text-ink">
            <AppIcon name="arrowRight" class="h-4 w-4 -rotate-90 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </span>
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
@reference "../../assets/main.css";

.contact-card {
  @apply relative overflow-hidden rounded-2xl border border-line p-6 transition-[border-color,transform,box-shadow] duration-500 ease-out;
  background:
    radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--color-ember) 7%, transparent), transparent 55%),
    linear-gradient(160deg, var(--color-iron), color-mix(in srgb, var(--color-ink) 60%, transparent));
}
.contact-card:hover {
  @apply -translate-y-1 border-ember/50;
  box-shadow: 0 18px 40px -24px color-mix(in srgb, var(--color-ember) 45%, transparent);
}
.contact-icon {
  @apply flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember ring-1 ring-ember/25;
}
.contact-pill {
  @apply inline-flex h-10 items-center gap-2 rounded-full border border-line bg-ink/60 px-4 text-sm font-semibold text-ash transition-colors duration-300 hover:border-ember hover:bg-ember hover:text-ink;
}
.contact-pill--wa {
  @apply border-ember/40 text-ember;
}


/* Discipline ticker */
.ticker {
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}
.ticker__track {
  display: flex;
  width: max-content;
  animation: bw-marquee 38s linear infinite;
}
.ticker:hover .ticker__track {
  animation-play-state: paused;
}
.ticker__item {
  @apply flex items-center gap-8 pr-8 font-display text-4xl font-black uppercase leading-none whitespace-nowrap sm:text-5xl;
}
.ticker__word {
  @apply text-bone;
}
.ticker__word--outline {
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1.25px rgb(255 255 255 / 0.45);
}

/* Join panel */
.join-panel {
  @apply relative overflow-hidden rounded-[2rem] border border-line p-7 sm:p-10 lg:p-14;
  background: linear-gradient(150deg, #1c1c1c 0%, var(--color-ink) 70%);
}
.join-panel::before {
  /* hairline ember highlight along the top edge */
  content: '';
  position: absolute;
  inset: 0 10% auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-ember) 80%, transparent), transparent);
}
.join-panel__blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(60px);
  pointer-events: none;
}
.join-panel__blob--a {
  width: 26rem; height: 26rem; right: -6rem; top: -10rem;
  background: color-mix(in srgb, var(--color-ember) 28%, transparent);
  animation: footer-float 12s ease-in-out infinite;
}
.join-panel__blob--b {
  width: 20rem; height: 20rem; left: 30%; bottom: -12rem;
  background: color-mix(in srgb, var(--color-blaze) 16%, transparent);
  animation: footer-float 16s ease-in-out infinite reverse;
}
.join-panel__emblem {
  position: absolute;
  right: -3rem;
  bottom: -4rem;
  width: 22rem;
  opacity: 0.07;
  transform: rotate(-12deg);
  pointer-events: none;
  filter: grayscale(1);
}
@keyframes footer-float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-2.5rem, 1.5rem); }
}
.join-btn {
  @apply inline-flex h-16 items-center justify-between gap-4 rounded-full pr-2 pl-7 text-base font-semibold transition-[background-position,background-color,border-color,color,transform] duration-500 hover:-translate-y-0.5;
}
.join-btn--primary {
  @apply text-ink;
  box-shadow: 0 14px 36px -14px color-mix(in srgb, var(--color-ember) 70%, transparent);
}
.join-btn--ghost {
  @apply border border-line bg-ink/60 text-bone backdrop-blur hover:border-ember/60;
}
.join-btn__icon {
  @apply flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors duration-300;
}

/* Link columns */
.footer-heading {
  @apply flex items-center gap-3 font-sans text-xs font-semibold uppercase tracking-[0.24em] text-bone;
}
.footer-heading::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--color-line), transparent);
}
.footer-heading__num {
  @apply font-display text-base font-bold tracking-normal text-ember;
}
.footer-link {
  @apply inline-flex items-center text-ash transition-colors duration-300 hover:text-bone;
}
.footer-link__arrow {
  @apply h-3.5 w-0 shrink-0 -translate-x-2 text-ember opacity-0 transition-all duration-300;
}
.footer-link:hover .footer-link__arrow,
.footer-link:focus-visible .footer-link__arrow {
  @apply mr-2 w-3.5 translate-x-0 opacity-100;
}
.social-dot {
  @apply flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink/60 text-ash transition-all duration-300 hover:-translate-y-1 hover:border-ember hover:bg-ember hover:text-ink;
}
.visit-row {
  @apply flex items-start gap-3.5 rounded-2xl border border-line/70 bg-ink/40 p-4;
}
.visit-row__icon {
  @apply flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ember/10 text-ember;
}

/*
 * Giant footer wordmark: faint outline. On hover a soft-edged ember fill
 * sweeps in from the first letter to the last, and drains back on leave.
 */
.wordmark {
  @apply relative grid cursor-default whitespace-nowrap text-center font-display text-[17.5vw] font-black uppercase leading-[0.92];
  --ease: cubic-bezier(0.45, 0, 0.2, 1);
  --wipe: 1.3s;
  transform-origin: 50% 100%;
  transition: transform 0.9s var(--ease);
}
.wordmark > span {
  grid-area: 1 / 1;
  padding-block: 0.1em; /* room for the glow, identical on every layer so they stay aligned */
}
.wordmark__base {
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1.5px rgb(255 255 255 / 0.28);
  transition: -webkit-text-stroke-color 0.8s var(--ease);
}
.wordmark__lit,
.wordmark__glow {
  /* A wide gradient mask: opaque on the left, feathered edge, transparent on the right.
     Sliding it from right to left reveals the letters with a soft leading edge. */
  -webkit-mask-image: linear-gradient(90deg, #000 45%, transparent 55%);
  mask-image: linear-gradient(90deg, #000 45%, transparent 55%);
  -webkit-mask-size: 220% 100%;
  mask-size: 220% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: 100% 0;
  mask-position: 100% 0;
  transition: -webkit-mask-position var(--wipe) var(--ease), mask-position var(--wipe) var(--ease);
}
.wordmark__lit {
  background: linear-gradient(100deg, var(--color-ember-hi) 0%, var(--color-ember) 45%, var(--color-blaze) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.wordmark__glow {
  color: color-mix(in srgb, var(--color-ember) 35%, transparent);
  text-shadow: 0 0 16px color-mix(in srgb, var(--color-ember) 75%, transparent), 0 0 36px color-mix(in srgb, var(--color-ember) 35%, transparent);
}
.wordmark:hover {
  transform: scale(1.015);
}
.wordmark:hover .wordmark__base {
  -webkit-text-stroke-color: var(--color-ember);
}
.wordmark:hover .wordmark__lit,
.wordmark:hover .wordmark__glow {
  -webkit-mask-position: 0% 0;
  mask-position: 0% 0;
}

@media (prefers-reduced-motion: reduce) {
  .contact-card, .contact-card:hover { transform: none; }
  .wordmark { --wipe: 0.01s; transition: none; }
  .wordmark:hover { transform: none; }
  .ticker__track, .join-panel__blob { animation: none; }
}
</style>
