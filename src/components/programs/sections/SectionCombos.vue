<script setup>
/**
 * Boxing / kickboxing combination notation. The legend teaches the numbers,
 * then each combination is written the way a coach calls it.
 */
const props = defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})

const legendKeys = new Set(props.section.legend.map((l) => l.key))
const nameFor = (key) => props.section.legend.find((l) => l.key === key)?.name ?? key
const isNumber = (key) => /^\d$/.test(key)
</script>

<template>
  <div class="site-container">
    <div class="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
      <div>
        <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
        <p v-if="section.intro" class="mt-4 max-w-md text-lg text-ash">{{ section.intro }}</p>

        <dl class="mt-8 grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
          <div v-for="item in section.legend" :key="item.key" class="flex items-center gap-3 bg-coal p-3.5">
            <dt
              class="flex h-10 min-w-10 shrink-0 items-center justify-center bg-ember px-2 font-display font-black text-ink"
              :class="isNumber(item.key) ? 'text-2xl' : 'text-lg uppercase leading-none'"
            >
              {{ isNumber(item.key) ? item.key : (item.abbr ?? item.key.slice(0, 2)) }}
            </dt>
            <dd class="text-sm leading-tight">
              <span class="block font-semibold text-bone">{{ isNumber(item.key) ? item.name : item.key }}</span>
              <span v-if="!isNumber(item.key)" class="text-ash">{{ item.name }}</span>
            </dd>
          </div>
        </dl>
        <p v-if="section.note" class="mt-4 text-sm text-smoke">{{ section.note }}</p>
      </div>

      <ul class="divide-y divide-line border-y border-line">
        <li v-for="combo in section.combos" :key="combo.name" class="grid gap-3 py-5 sm:grid-cols-[17rem_1fr] sm:items-center sm:gap-6">
          <p class="flex flex-wrap items-center gap-1.5">
            <span class="sr-only">{{ combo.sequence.map(nameFor).join(', then ') }}</span>
            <template v-for="(key, i) in combo.sequence" :key="i">
              <span
                class="inline-flex h-11 min-w-11 items-center justify-center px-2 font-display font-black"
                :class="
                  legendKeys.has(key) && isNumber(key)
                    ? 'bg-bone text-2xl text-ink'
                    : legendKeys.has(key)
                      ? 'bg-ember text-sm uppercase text-ink'
                      : 'border border-dashed border-ember text-sm uppercase text-ember'
                "
                aria-hidden="true"
              >{{ key }}</span>
              <span v-if="i < combo.sequence.length - 1" class="h-px w-3 bg-smoke" aria-hidden="true" />
            </template>
          </p>
          <div>
            <h3 class="font-semibold text-bone">{{ combo.name }}</h3>
            <p class="mt-1 text-[0.95rem] text-ash">{{ combo.text }}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
