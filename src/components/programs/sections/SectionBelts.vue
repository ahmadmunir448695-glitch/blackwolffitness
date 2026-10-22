<script setup>
/** Taekwondo belt path: a horizontal belt that reads like a real progression. */
defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})

function isDark(hex) {
  const v = parseInt(hex.replace('#', ''), 16)
  const r = (v >> 16) & 255
  const g = (v >> 8) & 255
  const b = v & 255
  return 0.299 * r + 0.587 * g + 0.114 * b < 150
}
</script>

<template>
  <div class="site-container">
    <div class="max-w-2xl">
      <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
      <p v-if="section.intro" class="mt-4 text-lg text-ash">{{ section.intro }}</p>
    </div>

    <ol class="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-6">
      <li v-for="(belt, i) in section.belts" :key="belt.name" class="flex flex-col bg-ink">
        <div
          class="relative flex h-16 items-center justify-between px-4"
          :style="{ backgroundColor: belt.hex }"
          :class="isDark(belt.hex) ? 'text-bone' : 'text-ink'"
        >
          <span class="font-display text-2xl font-black uppercase" :class="isDark(belt.hex) ? '[text-shadow:0_1px_3px_rgb(0_0_0/0.45)]' : ''">{{ belt.name }}</span>
          <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="isDark(belt.hex) ? 'bg-black/35 text-white' : 'bg-white/55 text-ink'">Stage {{ i + 1 }}</span>
          <span v-if="belt.hex.toLowerCase() === '#0b0b0d'" class="absolute inset-x-0 bottom-0 h-1 bg-ember" aria-hidden="true" />
        </div>
        <p class="p-4 text-[0.95rem] leading-relaxed text-ash">{{ belt.text }}</p>
      </li>
    </ol>
    <p v-if="section.note" class="mt-5 max-w-3xl text-sm text-smoke">{{ section.note }}</p>
  </div>
</template>
