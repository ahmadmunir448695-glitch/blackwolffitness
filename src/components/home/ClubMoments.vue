<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from '../ui/AppIcon.vue'

/**
 * Auto-playing photo showcase. Every `interval` ms the next photo wipes in
 * with a slow zoom over a blurred copy of itself, so portrait and landscape
 * photos both show in full. Pauses on hover, on focus and while off-screen.
 */
const props = defineProps({
  items: { type: Array, required: true },
  interval: { type: Number, default: 2400 },
})

const active = ref(0)
const paused = ref(false)
const visible = ref(false)
const reduced = ref(false)
const root = ref(null)
const rail = ref(null)
let timer = null
let observer = null

const current = computed(() => props.items[active.value])
const pad = (n) => String(n).padStart(2, '0')

function go(i) {
  active.value = (i + props.items.length) % props.items.length
  restart()
}
function tick() {
  if (!paused.value && visible.value) active.value = (active.value + 1) % props.items.length
}
function restart() {
  clearInterval(timer)
  if (!reduced.value) timer = setInterval(tick, props.interval)
}

onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => { visible.value = entry.isIntersecting }, { threshold: 0.25 })
    observer.observe(root.value)
  } else visible.value = true
  restart()
})
// Load the next photo ahead of time, and keep the active thumbnail in view
// by scrolling only the thumbnail rail (never the page).
watch(active, async (i) => {
  const next = props.items[(i + 1) % props.items.length]
  if (next) new Image().src = next.src
  await nextTick()
  const box = rail.value
  const thumb = box?.children[i]
  if (!box || !thumb) return
  const vertical = box.scrollHeight > box.clientHeight + 4 && getComputedStyle(box).overflowY !== 'visible'
  if (vertical) box.scrollTo({ top: thumb.offsetTop - box.clientHeight / 2 + thumb.offsetHeight / 2, behavior: 'smooth' })
  else box.scrollTo({ left: thumb.offsetLeft - box.clientWidth / 2 + thumb.offsetWidth / 2, behavior: 'smooth' })
})

onBeforeUnmount(() => {
  clearInterval(timer)
  observer?.disconnect()
})
</script>

<template>
  <div
    ref="root"
    class="moments grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]"
    :class="{ 'is-paused': paused || !visible }"
    :style="{ '--interval': `${interval}ms` }"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <!-- Stage -->
    <figure class="relative isolate aspect-[4/5] overflow-hidden rounded-3xl border border-line bg-coal sm:aspect-[16/11]">
      <TransitionGroup name="moment">
        <div v-for="item in [current]" :key="item.src" class="moment absolute inset-0">
          <img :src="item.src" alt="" aria-hidden="true" class="moment__blur absolute inset-0 h-full w-full object-cover" />
          <img :src="item.src" :alt="item.alt" class="moment__img absolute inset-0 h-full w-full object-contain" />
        </div>
      </TransitionGroup>

      <div class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-ink via-ink/60 to-transparent" aria-hidden="true" />

      <figcaption class="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-6 p-6 sm:p-8">
        <Transition name="cap" mode="out-in">
          <div :key="active">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-ember">{{ current.detail }}</p>
            <p class="mt-2 font-display text-4xl font-black uppercase leading-none text-bone sm:text-5xl">{{ current.caption }}</p>
          </div>
        </Transition>
        <p class="hidden shrink-0 font-display text-2xl font-bold tabular-nums text-bone sm:block">
          {{ pad(active + 1) }}<span class="text-smoke"> / {{ pad(items.length) }}</span>
        </p>
      </figcaption>

      <!-- Prev / next -->
      <div class="absolute right-4 top-4 z-20 flex gap-2">
        <button type="button" class="moment-btn" aria-label="Previous photo" @click="go(active - 1)">
          <AppIcon name="arrowLeft" class="h-4 w-4" />
        </button>
        <button type="button" class="moment-btn" aria-label="Next photo" @click="go(active + 1)">
          <AppIcon name="arrowRight" class="h-4 w-4" />
        </button>
      </div>

      <!-- Progress -->
      <div class="absolute inset-x-0 bottom-0 z-30 h-1 bg-bone/10" aria-hidden="true">
        <span :key="active" class="moment-progress block h-full origin-left bg-ember" />
      </div>
    </figure>

    <!-- Thumbnails: a strip on phones, a scrolling column beside the photo on desktop -->
    <div class="relative min-w-0">
    <ul ref="rail" class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto scroll-smooth px-4 lg:absolute lg:inset-0 lg:mx-0 lg:grid lg:grid-cols-3 lg:content-start lg:overflow-y-auto lg:overflow-x-hidden lg:px-0 lg:pr-1" aria-label="Choose a photo">
      <li v-for="(item, i) in items" :key="item.src" class="shrink-0">
        <button
          type="button"
          class="thumb group relative block h-20 w-20 overflow-hidden rounded-xl border-2 transition-all duration-300 lg:aspect-square lg:h-auto lg:w-full"
          :class="i === active ? 'border-ember' : 'border-transparent opacity-55 hover:opacity-100'"
          :aria-label="`Show: ${item.caption}`"
          :aria-current="i === active ? 'true' : undefined"
          @click="go(i)"
        >
          <img :src="item.src" alt="" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        </button>
      </li>
    </ul>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 hidden h-16 bg-gradient-to-t from-ink to-transparent lg:block" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
@reference "../../assets/main.css";

.moment__blur {
  filter: blur(28px) brightness(0.45) saturate(1.2);
  transform: scale(1.25);
}
.moment__img {
  animation: moment-zoom calc(var(--interval) + 1200ms) ease-out both;
}
@keyframes moment-zoom {
  from { transform: scale(1.08); }
  to { transform: scale(1); }
}

/* Incoming photo wipes in on a diagonal, the outgoing one fades under it. */
.moment-enter-active {
  transition: clip-path 0.9s cubic-bezier(0.77, 0, 0.18, 1), opacity 0.9s ease;
  z-index: 2;
}
.moment-leave-active {
  transition: opacity 0.9s ease;
  z-index: 1;
}
.moment-enter-from {
  clip-path: polygon(0 0, 0 0, -20% 100%, 0 100%);
}
.moment-enter-to {
  clip-path: polygon(0 0, 120% 0, 100% 100%, 0 100%);
}
.moment-leave-to {
  opacity: 0;
}

.cap-enter-active,
.cap-leave-active {
  transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.cap-enter-from {
  opacity: 0;
  transform: translateY(18px);
}
.cap-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.moment-progress {
  animation: moment-progress var(--interval) linear forwards;
}
.is-paused .moment-progress,
.is-paused .moment__img {
  animation-play-state: paused;
}
@keyframes moment-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.moment-btn {
  @apply flex h-10 w-10 items-center justify-center rounded-full border border-bone/20 bg-ink/50 text-bone backdrop-blur-md transition-colors duration-300 hover:border-ember hover:bg-ember hover:text-ink;
}

@media (prefers-reduced-motion: reduce) {
  .moment__img,
  .moment-progress { animation: none; }
  .moment-enter-active,
  .moment-leave-active { transition: opacity 0.2s linear; }
  .moment-enter-from { clip-path: none; opacity: 0; }
}
</style>
