<script setup>
import { ref, useId } from 'vue'
import AppIcon from '../../ui/AppIcon.vue'

/** MMA's three ranges as accessible tabs (←/→ to switch, Home/End). */
const props = defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})

const uid = useId()
const active = ref(0)
const tabs = ref([])

function select(index, focus = false) {
  const count = props.section.ranges.length
  active.value = (index + count) % count
  if (focus) tabs.value[active.value]?.focus()
}

function onKeydown(event) {
  const map = { ArrowRight: active.value + 1, ArrowLeft: active.value - 1, Home: 0, End: props.section.ranges.length - 1 }
  if (event.key in map) {
    event.preventDefault()
    select(map[event.key], true)
  }
}
</script>

<template>
  <div class="site-container">
    <div class="max-w-2xl">
      <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
      <p v-if="section.intro" class="mt-4 text-lg text-ash">{{ section.intro }}</p>
    </div>

    <div class="mt-10">
      <div role="tablist" :aria-labelledby="headingId" class="grid grid-cols-3 border-b border-line" @keydown="onKeydown">
        <button
          v-for="(range, i) in section.ranges"
          :id="`${uid}-tab-${i}`"
          :key="range.name"
          ref="tabs"
          role="tab"
          type="button"
          :aria-selected="active === i ? 'true' : 'false'"
          :aria-controls="`${uid}-panel-${i}`"
          :tabindex="active === i ? 0 : -1"
          class="relative px-2 pb-4 pt-2 text-left font-display text-3xl font-black uppercase transition-colors sm:text-5xl lg:text-6xl"
          :class="active === i ? 'text-bone' : 'text-smoke hover:text-ash'"
          @click="select(i)"
        >
          {{ range.name }}
          <span class="absolute inset-x-0 -bottom-px h-1 transition-colors" :class="active === i ? 'bg-ember' : 'bg-transparent'" aria-hidden="true" />
        </button>
      </div>

      <div
        v-for="(range, i) in section.ranges"
        v-show="active === i"
        :id="`${uid}-panel-${i}`"
        :key="range.name"
        role="tabpanel"
        :aria-labelledby="`${uid}-tab-${i}`"
        tabindex="0"
        class="grid gap-8 py-8 lg:grid-cols-[1fr_1.2fr] lg:gap-16"
      >
        <div>
          <p class="text-xl leading-relaxed text-bone">{{ range.text }}</p>
          <p v-if="range.availabilityNote" class="mt-5 flex gap-2.5 border border-ember/40 p-4 text-[0.95rem] text-ash">
            <AppIcon name="info" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
            {{ range.availabilityNote }}
          </p>
        </div>
        <ul class="grid gap-px bg-line sm:grid-cols-2">
          <li v-for="skill in range.skills" :key="skill" class="flex items-center gap-3 bg-ink p-5 font-semibold">
            <AppIcon name="check" class="h-5 w-5 shrink-0 text-ember" />
            {{ skill }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
