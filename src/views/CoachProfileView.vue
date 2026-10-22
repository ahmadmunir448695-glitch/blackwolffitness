<script setup>
import { computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '@/services/api'
import { useAsync } from '@/composables/useAsync.js'
import { programCatalog as programList } from '@/services/catalog.js'
import { coachPage } from '@/seo/pages.js'
import { applyPageMeta } from '@/seo/usePageMeta.js'
import CoachAvatar from '@/components/coaches/CoachAvatar.vue'
import AsyncState from '@/components/ui/AsyncState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import WhatsAppLink from '@/components/layout/WhatsAppLink.vue'
import NotFoundView from './NotFoundView.vue'

const route = useRoute()
const slug = computed(() => route.params.slug)
const { data: coach, loading, error, reload } = useAsync(({ signal }) => api.coaches.get(slug.value, { signal }), { watch: slug })

const isNotFound = computed(() => error.value?.code === 'not_found')
const programs = computed(() =>
  (coach.value?.programs ?? []).map((s) => programList.find((p) => p.slug === s)).filter(Boolean),
)
const inquiry = computed(() => ({
  path: '/contact',
  query: { topic: 'trial', ...(programs.value[0] ? { program: programs.value[0].slug } : {}) },
}))
const whatsappMessage = computed(() =>
  coach.value?.whatsapp
    ? `Hi ${coach.value.name.split(' ')[0]}, I found you on the Black Wolf Fitness Club website and would like to train with you. Could you share class times?`
    : `Hi Black Wolf Fitness Club, I would like to train with ${coach.value?.name || `your ${coach.value?.role}`}. Could you share class times?`,
)

/** Medal colour for an achievement line, from the words in it. */
function medalTone(text) {
  if (/gold/i.test(text)) return 'bg-[#e8b84a]'
  if (/silver/i.test(text)) return 'bg-[#c9ccd3]'
  if (/bronze/i.test(text)) return 'bg-[#c27a45]'
  return 'bg-ember'
}

watch(coach, (value) => value && applyPageMeta(coachPage(value)))
watch(isNotFound, (value) => value && applyPageMeta({ title: 'Coach not found', noindex: true }))
</script>

<template>
  <NotFoundView v-if="isNotFound" />

  <div v-else class="site-container pb-12 pt-[calc(var(--header-h)+3rem)] lg:pb-16 lg:pt-[calc(var(--header-h)+4rem)]">
    <nav aria-label="Breadcrumb" class="text-sm text-ash">
      <RouterLink to="/coaches" class="inline-flex items-center gap-1.5 hover:text-ember">
        <AppIcon name="arrowLeft" class="h-4 w-4" /> All coaches
      </RouterLink>
    </nav>

    <AsyncState class="mt-8" :loading="loading" :error="error" error-title="This profile could not load" @retry="reload">
      <template #loading>
        <div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]" aria-hidden="true">
          <div class="skeleton aspect-[4/5]" />
          <div class="space-y-4"><div class="skeleton h-5 w-40" /><div class="skeleton h-16 w-3/4" /><div class="skeleton h-32" /></div>
        </div>
      </template>

      <article v-if="coach" class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16" aria-labelledby="coach-name">
        <div class="lg:sticky lg:top-28 lg:self-start">
          <CoachAvatar :coach="coach" priority sizes="(min-width: 1024px) 35vw, 100vw" class="cut-corner-lg aspect-[4/5] w-full" />
          <p v-if="coach.whatsapp" class="mt-4 flex items-center gap-2 text-sm text-ash">
            <AppIcon name="whatsapp" class="h-4 w-4 text-ember" />
            WhatsApp: <span class="select-all font-semibold text-bone">{{ coach.whatsapp }}</span>
          </p>
          <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <BaseButton :to="inquiry" block icon-right="arrowRight">Train with this coach</BaseButton>
            <WhatsAppLink
              variant="block"
              :message="whatsappMessage"
              :number="coach.whatsapp || undefined"
              :label="coach.whatsapp && coach.name ? `WhatsApp ${coach.name.split(' ')[0]}` : 'WhatsApp'"
            />
          </div>
        </div>

        <div>
          <p class="font-semibold text-ember">{{ coach.role }}</p>
          <h1 id="coach-name" class="mt-2 font-display text-display font-black uppercase" :class="coach.name ? '' : 'text-ash'">
            {{ coach.name || 'Name to be announced' }}
          </h1>

          <p v-if="coach.placeholder" class="mt-6 flex gap-2.5 border border-dashed border-ember/50 p-4 text-sm text-ash">
            <AppIcon name="info" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
            Full profile coming soon. Contact the club to learn more about this coach.
          </p>

          <ul class="mt-6 flex flex-wrap gap-2" aria-label="Specializations">
            <li v-for="tag in coach.specializations" :key="tag" class="border border-line px-3 py-1 text-sm text-ash">{{ tag }}</li>
          </ul>

          <dl v-if="coach.facts?.length" class="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line xl:grid-cols-4">
            <div v-for="fact in coach.facts" :key="fact.label" class="bg-coal p-4">
              <dt class="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">{{ fact.label }}</dt>
              <dd class="mt-1.5 font-display text-xl font-bold uppercase leading-tight text-bone">{{ fact.value }}</dd>
            </div>
          </dl>

          <div class="prose-bw mt-8 text-lg leading-relaxed">
            <p v-for="p in coach.bio" :key="p">{{ p }}</p>
          </div>

          <section v-if="coach.achievements.length && !coach.placeholder" class="mt-12" aria-labelledby="medals-title">
            <h2 id="medals-title" class="font-display text-heading font-black uppercase">Championships &amp; medals</h2>
            <ul class="mt-5 grid gap-3 sm:grid-cols-2">
              <li
                v-for="item in coach.achievements"
                :key="item"
                class="flex items-start gap-3 border border-line bg-coal p-4 transition-colors hover:border-ember/50"
              >
                <span class="mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-ink" :class="medalTone(item)" aria-hidden="true" />
                <span class="text-bone">{{ item }}</span>
              </li>
            </ul>
          </section>

          <dl class="mt-10 divide-y divide-line border-y border-line">
            <div v-if="!coach.clubs?.length" class="grid gap-2 py-5 sm:grid-cols-[12rem_1fr]">
              <dt class="text-sm font-semibold text-bone">Experience</dt>
              <dd class="text-ash"><span v-if="coach.experience">{{ coach.experience }}</span><span v-else class="placeholder-text">To be added</span></dd>
            </div>
            <div class="grid gap-2 py-5 sm:grid-cols-[12rem_1fr]">
              <dt class="text-sm font-semibold text-bone">Certifications</dt>
              <dd class="text-ash">
                <ul v-if="coach.certifications.length" class="space-y-1">
                  <li v-for="item in coach.certifications" :key="item">{{ item }}</li>
                </ul>
                <span v-else class="placeholder-text">To be added</span>
              </dd>
            </div>
            <div v-if="coach.coaching?.length" class="grid gap-2 py-5 sm:grid-cols-[12rem_1fr]">
              <dt class="text-sm font-semibold text-bone">Coaching</dt>
              <dd class="text-ash">
                <ul class="space-y-1.5">
                  <li v-for="item in coach.coaching" :key="item" class="flex gap-2"><AppIcon name="check" class="mt-1 h-4 w-4 shrink-0 text-ember" />{{ item }}</li>
                </ul>
              </dd>
            </div>
            <div v-if="coach.clubs?.length" class="grid gap-2 py-5 sm:grid-cols-[12rem_1fr]">
              <dt class="text-sm font-semibold text-bone">Clubs &amp; schools</dt>
              <dd>
                <ul class="flex flex-wrap gap-2">
                  <li v-for="club in coach.clubs" :key="club" class="border border-line px-3 py-1 text-sm text-ash">{{ club }}</li>
                </ul>
              </dd>
            </div>
            <div v-if="coach.education?.length" class="grid gap-2 py-5 sm:grid-cols-[12rem_1fr]">
              <dt class="text-sm font-semibold text-bone">Education</dt>
              <dd class="text-ash">
                <ul class="space-y-1">
                  <li v-for="item in coach.education" :key="item">{{ item }}</li>
                </ul>
              </dd>
            </div>
            <div v-if="coach.publications?.length" class="grid gap-2 py-5 sm:grid-cols-[12rem_1fr]">
              <dt class="text-sm font-semibold text-bone">Research</dt>
              <dd class="text-ash">
                <ol class="space-y-3">
                  <li v-for="item in coach.publications" :key="item" class="border-l-2 border-ember/50 pl-3 text-[0.95rem] leading-relaxed">{{ item }}</li>
                </ol>
              </dd>
            </div>
            <div v-if="coach.placeholder || !coach.achievements.length" class="grid gap-2 py-5 sm:grid-cols-[12rem_1fr]">
              <dt class="text-sm font-semibold text-bone">Achievements</dt>
              <dd class="text-ash">
                <ul v-if="coach.achievements.length" class="space-y-1">
                  <li v-for="item in coach.achievements" :key="item">{{ item }}</li>
                </ul>
                <span v-else class="placeholder-text">To be added</span>
              </dd>
            </div>
            <div v-if="(coach.languages.length && !coach.facts?.some((f) => f.label === 'Languages')) || coach.placeholder" class="grid gap-2 py-5 sm:grid-cols-[12rem_1fr]">
              <dt class="text-sm font-semibold text-bone">Languages</dt>
              <dd class="text-ash">
                <span v-if="coach.languages.length">{{ coach.languages.join(', ') }}</span>
                <span v-else class="placeholder-text">To be added</span>
              </dd>
            </div>
            <div class="grid gap-2 py-5 sm:grid-cols-[12rem_1fr]">
              <dt class="text-sm font-semibold text-bone">Programs</dt>
              <dd>
                <ul class="flex flex-wrap gap-2">
                  <li v-for="program in programs" :key="program.slug">
                    <RouterLink :to="`/services/${program.slug}`" class="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-sm font-medium hover:border-ember hover:text-ember">
                      {{ program.shortName ?? program.name }} <AppIcon name="arrowRight" class="h-3.5 w-3.5" />
                    </RouterLink>
                  </li>
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      </article>
    </AsyncState>
  </div>
</template>
