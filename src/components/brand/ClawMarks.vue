<script setup>
import { useId } from 'vue'

/**
 * Three tapered claw slashes — the hero's signature graphic. With `animate`
 * they are torn in one after another, once, on load (the site's only
 * unprompted motion). Each slash is a filled crescent revealed by a mask
 * stroke drawn along its centre line.
 */
defineProps({
  animate: { type: Boolean, default: false },
  delay: { type: Number, default: 0.5 },
})

const uid = useId()

const claws = [
  { shape: 'M120 20 Q115 198 40 360 Q84 191 120 20 Z', spine: 'M120 20 Q99.5 194.5 40 360' },
  { shape: 'M195 4 Q191 207.5 105 392 Q152 198.5 195 4 Z', spine: 'M195 4 Q171.5 203 105 392' },
  { shape: 'M262 40 Q256 203.8 186 352 Q227 196.7 262 40 Z', spine: 'M262 40 Q241.5 200 186 352' },
]
</script>

<template>
  <svg viewBox="0 0 300 400" fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
    <defs v-if="animate">
      <mask v-for="(claw, i) in claws" :id="`${uid}-m${i}`" :key="i" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="400">
        <path
          :d="claw.spine"
          stroke="#fff"
          stroke-width="48"
          stroke-linecap="round"
          class="anim-claw"
          :style="{ '--claw-length': 420, animationDelay: `${delay + i * 0.13}s` }"
        />
      </mask>
    </defs>
    <path
      v-for="(claw, i) in claws"
      :key="claw.shape"
      :d="claw.shape"
      fill="currentColor"
      :mask="animate ? `url(#${uid}-m${i})` : undefined"
    />
  </svg>
</template>
