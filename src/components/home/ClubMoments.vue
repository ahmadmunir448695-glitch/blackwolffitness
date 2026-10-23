<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '../ui/AppIcon.vue'

/**
 * 3D card carousel ("coverflow"). The active photo sits centre stage; its
 * neighbours tilt away on either side, smaller and dimmer. Every `interval`
 * ms the whole stack glides one step. Pauses on hover/focus and off-screen;
 * swipe on touch screens.
 */
const props = defineProps({
  items: { type: Array, required: true },
  interval: { type: Number, default: 2000 },
})

const active = ref(0)
const paused = ref(false)
const visible = ref(false)
const reduced = ref(false)
const root = ref(null)
let timer = null
let observer = null
let startX = null

const count = computed(() => props.items.length)
const current = computed(() => props.items[active.value])
const pad = (n) => String(n).padStart(2, '0')

/** Shortest signed distance from the active card, wrapping around. */
function offsetOf(i) {
  let o = i - active.value
  const n = count.value
  if (o > n / 2) o -= n
  if (o < -n / 2) o += n
  return o
}

function cardStyle(i) {
  const o = offsetOf(i)
  const a = Math.abs(o)
  const side = Math.sign(o)
  return {
    '--x': `${o * 64}%`,
    '--s': (1 - Math.min(a, 3) * 0.16).toFixed(3),
    '--r': `${-side * Math.min(a, 2) * 24}deg`,
    '--dim': a === 0 ? 1 : a === 1 ? 0.55 : 0.3,
    zIndex: 50 - a,
    opacity: a > 2 ? 0 : 1,
    pointerEvents: a > 2 ? 'none' : 'auto',
  }
}

function go(i) {
  active.value = (i + count.value) % count.value
  restart()
}
function tick() {
  if (!paused.value && visible.value) active.value = (active.value + 1) % count.value
}
function restart() {
  clearInterval(timer)
  if (!reduced.value) timer = setInterval(tick, props.interval)
}

function onPointerDown(e) { startX = e.clientX }
function onPointerUp(e) {
  if (startX === null) return
  const dx = e.clientX - startX
  startX = null
  if (Math.abs(dx) > 40) go(active.value + (dx < 0 ? 1 : -1))
}

onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => { visible.value = entry.isIntersecting }, { threshold: 0.3 })
    observer.observe(root.value)
  } else visible.value = true
  restart()
})
onBeforeUnmount(() => {
  clearInterval(timer)
  observer?.disconnect()
})
</script>

<template>
  <div
    ref="root"
    class="moments"
    :class="{ 'is-paused': paused || !visible }"
    :style="{ '--interval': `${interval}ms` }"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <!-- Stage -->
    <div
      class="stage relative mx-auto h-[19rem] select-none sm:h-[26rem] lg:h-[31rem]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Club moments"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="startX = null"
    >
      <div class="stage-glow pointer-events-none absolute left-1/2 top-1/2 h-3/4 w-2/3 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />

      <button
        v-for="(item, i) in items"
        :key="item.src"
        type="button"
        class="card absolute left-1/2 top-1/2 aspect-square h-full overflow-hidden rounded-[1.75rem] border border-bone/10 bg-coal"
        :class="i === active ? 'is-active' : ''"
        :style="cardStyle(i)"
        :tabindex="Math.abs(offsetOf(i)) <= 1 ? 0 : -1"
        :aria-label="i === active ? item.caption : `Show: ${item.caption}`"
        :aria-current="i === active ? 'true' : undefined"
        @click="i !== active && go(i)"
      >
        <template v-if="Math.abs(offsetOf(i)) <= 3">
          <img :src="item.src" alt="" aria-hidden="true" class="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl brightness-[0.45]" draggable="false" />
          <img :src="item.src" :alt="item.alt" class="card__img absolute inset-0 h-full w-full object-contain" draggable="false" loading="lazy" />
          <span class="card__shade absolute inset-0" aria-hidden="true" />
        </template>
      </button>
    </div>

    <!-- Caption + controls -->
    <div class="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-5 text-center">
      <Transition name="cap" mode="out-in">
        <div :key="active">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-ember">{{ current.detail }}</p>
          <p class="mt-2 font-display text-4xl font-black uppercase leading-none text-bone sm:text-5xl">{{ current.caption }}</p>
        </div>
      </Transition>

      <div class="flex w-full max-w-md items-center gap-4">
        <button type="button" class="moment-btn" aria-label="Previous photo" @click="go(active - 1)">
          <AppIcon name="arrowLeft" class="h-4 w-4" />
        </button>
        <div class="flex flex-1 items-center gap-3">
          <span class="font-display text-lg font-bold tabular-nums text-bone">{{ pad(active + 1) }}</span>
          <span class="relative h-[3px] flex-1 overflow-hidden rounded-full bg-bone/15" aria-hidden="true">
            <span :key="active" class="moment-progress absolute inset-y-0 left-0 w-full origin-left rounded-full bg-ember" />
          </span>
          <span class="font-display text-lg font-bold tabular-nums text-smoke">{{ pad(count) }}</span>
        </div>
        <button type="button" class="moment-btn" aria-label="Next photo" @click="go(active + 1)">
          <AppIcon name="arrowRight" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../../assets/main.css";

.stage {
  touch-action: pan-y;
}
/* Each card carries its own perspective, so cards are layered by z-index
   (centre on top) instead of intersecting in shared 3D space. */
.card {
  transform: translate(-50%, -50%) translateX(var(--x)) perspective(1400px) rotateY(var(--r)) scale(var(--s));
  transition:
    transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.6s ease,
    box-shadow 0.9s ease,
    border-color 0.6s ease;
  will-change: transform;
  box-shadow: 0 30px 60px -30px rgb(0 0 0 / 0.9);
  cursor: pointer;
}
.card.is-active {
  cursor: default;
  border-color: color-mix(in srgb, var(--color-ember) 55%, transparent);
  box-shadow:
    0 40px 90px -30px rgb(0 0 0 / 0.95),
    0 0 0 1px color-mix(in srgb, var(--color-ember) 30%, transparent),
    0 20px 70px -20px color-mix(in srgb, var(--color-ember) 45%, transparent);
}
.card__shade {
  background: rgb(9 9 9);
  opacity: calc(1 - var(--dim));
  transition: opacity 0.9s ease;
}
.card.is-active .card__img {
  animation: moment-zoom calc(var(--interval) + 1500ms) ease-out both;
}
@keyframes moment-zoom {
  from { transform: scale(1.06); }
  to { transform: scale(1); }
}

.stage-glow {
  background: radial-gradient(closest-side, color-mix(in srgb, var(--color-ember) 22%, transparent), transparent);
  filter: blur(30px);
}

.cap-enter-active,
.cap-leave-active {
  transition: opacity 0.35s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), filter 0.35s ease;
}
.cap-enter-from {
  opacity: 0;
  transform: translateY(14px);
  filter: blur(6px);
}
.cap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  filter: blur(6px);
}

.moment-progress {
  animation: moment-progress var(--interval) linear forwards;
}
.is-paused .moment-progress,
.is-paused .card__img {
  animation-play-state: paused;
}
@keyframes moment-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.moment-btn {
  @apply flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors duration-300 hover:border-ember hover:bg-ember hover:text-ink;
}

@media (prefers-reduced-motion: reduce) {
  .card { transition: opacity 0.3s linear; }
  .card__img,
  .moment-progress { animation: none !important; }
}
</style>
