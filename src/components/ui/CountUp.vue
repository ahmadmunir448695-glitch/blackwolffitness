<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Number that counts up from zero the first time it scrolls into view. */
const props = defineProps({
  value: { type: Number, required: true },
  duration: { type: Number, default: 1600 },
  pad: { type: Number, default: 2 },
})

const el = ref(null)
const shown = ref(props.value)
let observer = null
let frame = 0

const format = (n) => String(Math.round(n)).padStart(props.pad, '0')

function run() {
  const start = performance.now()
  const tick = (now) => {
    const t = Math.min(1, (now - start) / props.duration)
    shown.value = props.value * (1 - Math.pow(1 - t, 4))
    if (t < 1) frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  shown.value = 0
  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    observer.disconnect()
    run()
  }, { threshold: 0.6 })
  observer.observe(el.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})
</script>

<template>
  <span ref="el" class="tabular-nums"><span aria-hidden="true">{{ format(shown) }}</span><span class="sr-only">{{ value }}</span></span>
</template>
