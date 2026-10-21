<script setup>
/** Accessible FAQ accordion built on <details>/<summary> (keyboard-ready by default). */
defineProps({
  items: { type: Array, required: true }, // [{ q, a }]
  tone: { type: String, default: 'dark' },
})
</script>

<template>
  <div class="border-t" :class="tone === 'light' ? 'border-graphite/15' : 'border-line'">
    <details
      v-for="item in items"
      :key="item.q"
      class="group border-b"
      :class="tone === 'light' ? 'border-graphite/15' : 'border-line'"
    >
      <summary
        class="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left text-lg font-semibold transition-colors [&::-webkit-details-marker]:hidden"
        :class="tone === 'light' ? 'text-graphite hover:text-rust' : 'text-bone hover:text-ember'"
      >
        <span>{{ item.q }}</span>
        <span
          class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center border transition-transform duration-200 group-open:rotate-45"
          :class="tone === 'light' ? 'border-graphite/30' : 'border-bone/30'"
          aria-hidden="true"
        >
          <svg viewBox="0 0 12 12" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 1v10M1 6h10" /></svg>
        </span>
      </summary>
      <p class="max-w-3xl pb-6 pr-10 leading-relaxed" :class="tone === 'light' ? 'text-slate' : 'text-ash'">
        {{ item.a }}
      </p>
    </details>
  </div>
</template>
