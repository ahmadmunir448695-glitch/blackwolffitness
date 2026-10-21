<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InquiryForm from '@/components/forms/InquiryForm.vue'
import PageIntro from '@/components/shared/PageIntro.vue'
import { media } from '@/data/media.js'
import WhatsAppLink from '@/components/layout/WhatsAppLink.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PlaceholderText from '@/components/ui/PlaceholderText.vue'
import { club, socialLabels } from '@/config/club.js'
import { programSlugs } from '@/services/catalog.js'
import { isLive } from '@/services/api'
import { telHref } from '@/utils/format.js'
import { applyJsonLd, siteUrl } from '@/seo/usePageMeta.js'
import { organizationJsonLd } from '@/seo/structuredData.js'

const route = useRoute()
const router = useRouter()

const modes = [
  { value: 'contact', label: 'General message' },
  { value: 'trial', label: 'Book a trial' },
  { value: 'parent', label: 'Parent inquiry' },
]

function modeFromQuery(topic) {
  if (topic === 'trial') return 'trial'
  if (topic === 'parent') return 'parent'
  return 'contact'
}

const mode = ref(modeFromQuery(route.query.topic))
const initialProgram = computed(() => {
  const program = String(route.query.program ?? '')
  return programSlugs.includes(program) ? program : ''
})

watch(() => route.query.topic, (topic) => (mode.value = modeFromQuery(topic)))

function setMode(value) {
  mode.value = value
  router.replace({ query: { ...route.query, topic: value === 'contact' ? undefined : value } })
}

const formReady = isLive('contact')
const address = computed(() => [...club.location.addressLines, club.location.city, club.location.country].filter(Boolean))
const socials = computed(() => Object.entries(club.socials).filter(([, url]) => url))

onMounted(() => applyJsonLd('ld-organization', organizationJsonLd(siteUrl)))
onBeforeUnmount(() => applyJsonLd('ld-organization', null))
</script>

<template>
  <div>
    <PageIntro
      title="Contact us"
      eyebrow="Get in touch"
      :image="media.gymDark"
      lead="Questions about a program, a trial session or Special Kids Training? Message us and a coach will reply. WhatsApp is usually the fastest way to reach the club."
    />

    <div class="site-container grid gap-12 py-14 lg:grid-cols-[1fr_1.45fr] lg:gap-16 lg:py-20">
      <!-- Contact details -->
      <aside aria-label="Contact details" class="space-y-10">
        <div class="space-y-3">
          <WhatsAppLink variant="block" label="Chat on WhatsApp" />
          <a
            v-if="club.contact.phone"
            :href="telHref(club.contact.phone)"
            class="flex h-12 w-full items-center justify-center gap-2 border border-bone/35 font-semibold transition-colors hover:border-ember hover:text-ember"
          >
            <AppIcon name="phone" class="h-5 w-5" /> Call {{ club.contact.phone }}
          </a>
          <a
            v-if="club.contact.phoneAlt"
            :href="telHref(club.contact.phoneAlt)"
            class="flex h-12 w-full items-center justify-center gap-2 border border-bone/35 font-semibold transition-colors hover:border-ember hover:text-ember"
          >
            <AppIcon name="phone" class="h-5 w-5" /> Call {{ club.contact.phoneAlt }}
          </a>
        </div>

        <dl class="divide-y divide-line border-y border-line">
          <div class="grid grid-cols-[2rem_1fr] gap-3 py-5">
            <AppIcon name="phone" class="h-5 w-5 text-ember" />
            <div>
              <dt class="text-sm font-semibold text-bone">Phone</dt>
              <dd class="mt-1 text-ash">
                <a v-if="club.contact.phone" :href="telHref(club.contact.phone)" class="hover:text-ember">{{ club.contact.phone }}</a>
                <a v-if="club.contact.phoneAlt" :href="telHref(club.contact.phoneAlt)" class="mt-1 block hover:text-ember">{{ club.contact.phoneAlt }}</a>
                <PlaceholderText v-else fallback="Phone number to be announced" hint="contact.phone in src/config/club.js" />
              </dd>
            </div>
          </div>
          <div class="grid grid-cols-[2rem_1fr] gap-3 py-5">
            <AppIcon name="mail" class="h-5 w-5 text-ember" />
            <div>
              <dt class="text-sm font-semibold text-bone">Email</dt>
              <dd class="mt-1 break-all text-ash">
                <a v-if="club.contact.email" :href="`mailto:${club.contact.email}`" class="hover:text-ember">{{ club.contact.email }}</a>
                <PlaceholderText v-else fallback="Email address to be announced" hint="contact.email in src/config/club.js" />
              </dd>
            </div>
          </div>
          <div class="grid grid-cols-[2rem_1fr] gap-3 py-5">
            <AppIcon name="pin" class="h-5 w-5 text-ember" />
            <div>
              <dt class="text-sm font-semibold text-bone">Location</dt>
              <dd class="mt-1 text-ash">
                <address v-if="address.length" class="not-italic">
                  <span v-for="line in address" :key="line" class="block">{{ line }}</span>
                </address>
                <PlaceholderText v-else fallback="Address to be announced" hint="location in src/config/club.js" />
                <a v-if="club.location.mapLink" :href="club.location.mapLink" target="_blank" rel="noopener noreferrer" class="link-ember mt-2 inline-flex items-center gap-1 text-sm">
                  Get directions <AppIcon name="external" class="h-4 w-4" /><span class="sr-only">(opens in a new tab)</span>
                </a>
              </dd>
            </div>
          </div>
          <div class="grid grid-cols-[2rem_1fr] gap-3 py-5">
            <AppIcon name="clock" class="h-5 w-5 text-ember" />
            <div>
              <dt class="text-sm font-semibold text-bone">Opening hours</dt>
              <dd class="mt-1 text-ash">
                <ul v-if="club.hours.length" class="space-y-1">
                  <li v-for="row in club.hours" :key="row.days" class="flex justify-between gap-4">
                    <span>{{ row.days }}</span><span class="text-bone">{{ row.hours }}</span>
                  </li>
                </ul>
                <PlaceholderText v-else fallback="Opening hours to be announced" hint="hours in src/config/club.js" />
              </dd>
            </div>
          </div>
          <div class="grid grid-cols-[2rem_1fr] gap-3 py-5">
            <AppIcon name="instagram" class="h-5 w-5 text-ember" />
            <div>
              <dt class="text-sm font-semibold text-bone">Social media</dt>
              <dd class="mt-1 text-ash">
                <ul v-if="socials.length" class="flex flex-wrap gap-x-5 gap-y-1">
                  <li v-for="[key, url] in socials" :key="key">
                    <a :href="url" target="_blank" rel="noopener noreferrer" class="hover:text-ember">{{ socialLabels[key] }}<span class="sr-only"> (opens in a new tab)</span></a>
                  </li>
                </ul>
                <PlaceholderText v-else fallback="Social links coming soon" hint="socials in src/config/club.js" />
              </dd>
            </div>
          </div>
        </dl>

        <!-- Map -->
        <div class="aspect-[4/3] overflow-hidden border border-line bg-coal">
          <iframe
            v-if="club.location.mapEmbedUrl"
            :src="club.location.mapEmbedUrl"
            title="Map showing the Black Wolf Fitness Club location"
            class="h-full w-full grayscale invert-[0.92] hue-rotate-180"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          />
          <div v-else class="flex h-full flex-col items-center justify-center gap-3 bg-[repeating-linear-gradient(0deg,transparent_0_31px,#1f1f25_31px_32px),repeating-linear-gradient(90deg,transparent_0_31px,#1f1f25_31px_32px)] p-6 text-center">
            <AppIcon name="pin" class="h-9 w-9 text-ember" />
            <p class="font-semibold text-bone">Map coming soon</p>
            <p class="max-w-xs text-sm text-ash">The map will appear here once the club address is confirmed.</p>
          </div>
        </div>
      </aside>

      <!-- Form -->
      <section aria-labelledby="form-title" class="border border-line bg-coal p-6 sm:p-8 lg:p-10">
        <h2 id="form-title" class="font-display text-title font-black uppercase">Send a message</h2>

        <p v-if="!formReady" class="mt-4 flex gap-2.5 border border-dashed border-ember/50 p-4 text-sm text-ash">
          <AppIcon name="info" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
          Online messages are not connected yet. You can fill in the form, and we will help you send it on WhatsApp or by phone instead.
        </p>

        <fieldset class="mt-6">
          <legend class="sr-only">What is your message about?</legend>
          <div class="grid grid-cols-3 gap-px border border-line bg-line">
            <label
              v-for="m in modes"
              :key="m.value"
              class="relative cursor-pointer px-2 py-3 text-center text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ember"
              :class="mode === m.value ? 'bg-ember text-ink' : 'bg-ink text-ash hover:text-bone'"
            >
              <input
                type="radio"
                name="contact-mode"
                class="sr-only"
                :value="m.value"
                :checked="mode === m.value"
                @change="setMode(m.value)"
              />
              {{ m.label }}
            </label>
          </div>
        </fieldset>

        <p v-if="mode === 'parent'" class="mt-5 text-ash">
          Tell us a little about your child. A coach will contact you to arrange a parent consultation before any session.
        </p>
        <p v-else-if="mode === 'trial'" class="mt-5 text-ash">
          Choose a program and we will arrange a trial session that suits your level.
        </p>

        <InquiryForm :key="mode" class="mt-6" :variant="mode" :initial-program="initialProgram" :heading="modes.find((m) => m.value === mode)?.label" />
      </section>
    </div>
  </div>
</template>
