<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BrandLogo from '../brand/BrandLogo.vue'
import AppIcon from '../ui/AppIcon.vue'
import PlaceholderText from '../ui/PlaceholderText.vue'
import WhatsAppLink from './WhatsAppLink.vue'
import { club, socialLabels } from '@/config/club.js'
import { programLinks } from '@/config/navigation.js'
import { telHref } from '@/utils/format.js'
import { whatsappUrl } from '@/utils/whatsapp.js'

const year = new Date().getFullYear()

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
    club.contact.phone && { key: 'main', value: club.contact.phone, tel: telHref(club.contact.phone), whatsapp: whatsappUrl() },
    club.contact.phoneAlt && { key: 'alt', value: club.contact.phoneAlt, tel: telHref(club.contact.phoneAlt), whatsapp: null },
  ].filter(Boolean),
)

const hasContact = computed(() => phones.value.length || club.contact.email || socials.value.length)

const address = computed(() => [...club.location.addressLines, club.location.city].filter(Boolean))

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
  <footer class="relative isolate overflow-hidden border-t border-line bg-coal">
    <div class="glow-ember pointer-events-none absolute -bottom-72 left-1/2 -z-10 h-[36rem] w-[60rem] -translate-x-1/2 opacity-40" aria-hidden="true" />
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember/60 to-transparent" aria-hidden="true" />

    <div class="site-container pt-16 lg:pt-20">
      <!-- Brand row -->
      <div class="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <RouterLink to="/" aria-label="Black Wolf Fitness Club, home" class="inline-block">
            <BrandLogo size="lg" />
          </RouterLink>
          <p class="mt-5 flex items-center gap-3 font-display text-xl font-bold uppercase tracking-[0.18em] text-ash">
            <span>Train</span><span class="h-1.5 w-1.5 rotate-45 bg-ember" aria-hidden="true" />
            <span>Fight</span><span class="h-1.5 w-1.5 rotate-45 bg-ember" aria-hidden="true" />
            <span>Grow</span>
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <WhatsAppLink />
          <RouterLink
            :to="{ path: '/contact', query: { topic: 'trial' } }"
            class="btn-sheen cut-corner inline-flex h-12 items-center gap-2 bg-ember px-6 font-semibold text-ink transition-colors hover:bg-ember-hi"
          >
            Book a trial session
            <AppIcon name="arrowRight" class="h-4 w-4" />
          </RouterLink>
        </div>
      </div>

      <!-- Contact panel -->
      <section v-if="hasContact" aria-labelledby="footer-contact" class="mt-12">
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
      <div class="mt-14 grid gap-10 border-t border-line pt-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.2fr]">
        <nav aria-labelledby="footer-programs">
          <h2 id="footer-programs" class="eyebrow">Programs</h2>
          <ul class="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <li v-for="link in programLinks" :key="link.to">
              <RouterLink
                :to="link.to"
                class="group inline-flex items-center transition-colors hover:text-bone"
                :class="link.featured ? 'text-ember' : 'text-ash'"
              >
                <span class="h-px w-0 bg-ember transition-all duration-300 group-hover:mr-2 group-hover:w-4" aria-hidden="true" />
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-club">
          <h2 id="footer-club" class="eyebrow">Club</h2>
          <ul class="mt-5 space-y-3">
            <li v-for="link in clubLinks" :key="link.label">
              <RouterLink :to="link.to" class="group inline-flex items-center text-ash transition-colors hover:text-bone">
                <span class="h-px w-0 bg-ember transition-all duration-300 group-hover:mr-2 group-hover:w-4" aria-hidden="true" />
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <div class="sm:col-span-2 lg:col-span-1">
          <h2 class="eyebrow">Visit</h2>
          <div class="mt-5 space-y-5">
            <div class="flex items-start gap-3">
              <AppIcon name="pin" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
              <address class="not-italic text-ash">
                <template v-if="address.length">
                  <span v-for="line in address" :key="line" class="block">{{ line }}</span>
                </template>
                <PlaceholderText v-else fallback="Address to be announced" hint="location in src/config/club.js" />
              </address>
            </div>
            <div class="flex items-start gap-3">
              <AppIcon name="clock" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
              <ul v-if="club.hours.length" class="space-y-1 text-ash">
                <li v-for="row in club.hours" :key="row.days"><span class="text-bone">{{ row.days }}</span> · {{ row.hours }}</li>
              </ul>
              <p v-else class="text-ash"><PlaceholderText fallback="Opening hours to be announced" hint="hours in src/config/club.js" /></p>
            </div>
            <a
              v-if="club.location.mapLink"
              :href="club.location.mapLink"
              target="_blank"
              rel="noopener noreferrer"
              class="link-ember inline-block text-sm font-semibold"
            >Get directions<span class="sr-only"> (opens in a new tab)</span></a>
          </div>
        </div>
      </div>
    </div>

    <!-- Giant wordmark -->
    <div class="pointer-events-none mt-12 select-none overflow-hidden" aria-hidden="true">
      <p v-reveal="'up'" class="text-outline whitespace-nowrap text-center font-display text-[17.5vw] font-black uppercase leading-[0.78] text-bone/15">
        Black Wolf
      </p>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-line bg-ink/40">
      <div class="site-container flex flex-col gap-4 py-5 text-sm text-smoke sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ year }} {{ club.name }}. All rights reserved.</p>
        <p class="hidden lg:block">{{ club.tagline }}</p>
        <button
          type="button"
          class="group inline-flex items-center gap-2 self-start font-semibold text-ash transition-colors hover:text-ember sm:self-auto"
          @click="toTop"
        >
          Back to top
          <span class="flex h-8 w-8 items-center justify-center border border-line transition-colors group-hover:border-ember">
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
    radial-gradient(120% 140% at 0% 0%, rgb(255 148 71 / 0.07), transparent 55%),
    linear-gradient(160deg, var(--color-iron), rgb(11 11 13 / 0.6));
}
.contact-card:hover {
  @apply -translate-y-1 border-ember/50;
  box-shadow: 0 18px 40px -24px rgb(255 148 71 / 0.45);
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
@media (prefers-reduced-motion: reduce) {
  .contact-card, .contact-card:hover { transform: none; }
}
</style>
