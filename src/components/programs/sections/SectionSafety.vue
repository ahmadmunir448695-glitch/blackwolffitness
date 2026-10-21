<script setup>
import AppIcon from '../../ui/AppIcon.vue'
import PlaceholderText from '../../ui/PlaceholderText.vue'

/** Supervision & safety standards plus configurable practical details. */
defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})
</script>

<template>
  <div class="site-container">
    <div class="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
      <div>
        <AppIcon name="shield" class="h-9 w-9 text-ember" />
        <h2 :id="headingId" class="mt-5 font-display text-title font-black uppercase">{{ section.heading }}</h2>
        <p v-if="section.intro" class="mt-4 max-w-md text-lg text-ash">{{ section.intro }}</p>

        <dl v-if="section.details?.length" class="soft-round mt-8 divide-y divide-line border border-line bg-ink">
          <div v-for="row in section.details" :key="row.label" class="flex items-baseline justify-between gap-6 px-5 py-3.5">
            <dt class="text-sm text-ash">{{ row.label }}</dt>
            <dd class="text-right font-semibold">
              <PlaceholderText :value="row.value" fallback="Ask us" hint="fill in safety details in src/data/mock/programs.js" />
            </dd>
          </div>
        </dl>
      </div>

      <ul class="grid gap-3 sm:grid-cols-2">
        <li v-for="item in section.items" :key="item.title" class="soft-round bg-ink p-6">
          <h3 class="font-display text-2xl font-bold uppercase leading-none">{{ item.title }}</h3>
          <p class="mt-3 leading-relaxed text-ash">{{ item.text }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>
