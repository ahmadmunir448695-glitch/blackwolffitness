<script setup>
import { computed, ref } from 'vue'
import SmartImage from '../ui/SmartImage.vue'
import AppIcon from '../ui/AppIcon.vue'

/**
 * Training-environment gallery. Items: { image, caption, size: wide | tall | square }
 * Each photo opens a full-screen viewer (native <dialog>: Esc closes it,
 * arrow keys move between photos).
 */
const props = defineProps({
  items: { type: Array, required: true },
})

const spans = {
  wide: 'col-span-2 aspect-[16/10] lg:aspect-auto lg:row-span-1',
  tall: 'row-span-2 aspect-[3/4] lg:aspect-auto',
  square: 'aspect-square lg:aspect-auto',
}

const dialog = ref(null)
const index = ref(0)
const current = computed(() => props.items[index.value])

function open(i) {
  index.value = i
  dialog.value?.showModal()
}
function close() {
  dialog.value?.close()
}
function step(d) {
  index.value = (index.value + d + props.items.length) % props.items.length
}
function onKey(e) {
  if (e.key === 'ArrowRight') step(1)
  if (e.key === 'ArrowLeft') step(-1)
}
</script>

<template>
  <div>
  <ul v-reveal-stagger class="grid grid-flow-dense grid-cols-2 gap-3 lg:auto-rows-[15rem] lg:grid-cols-4">
    <li v-for="(item, i) in items" :key="item.image.src" :class="spans[item.size] ?? spans.square">
      <figure class="zoom-hover group relative h-full w-full overflow-hidden">
        <SmartImage :image="item.image" sizes="(min-width: 1024px) 25vw, 50vw" :widths="[400, 640, 960, 1280]" class="h-full w-full" />
        <div class="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
        <figcaption class="absolute bottom-0 left-0 flex items-center gap-2 p-4 font-display text-xl font-bold uppercase tracking-wide text-bone">
          <span class="h-[2px] w-5 bg-ember transition-all duration-500 group-hover:w-10" aria-hidden="true" />
          {{ item.caption }}
        </figcaption>
        <button
          type="button"
          class="absolute inset-0 flex items-start justify-end p-4 outline-none"
          :aria-label="`View larger: ${item.caption}`"
          @click="open(i)"
        >
          <span class="flex h-10 w-10 scale-75 items-center justify-center rounded-full bg-ember text-ink opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100">
            <AppIcon name="plus" class="h-5 w-5" />
          </span>
        </button>
      </figure>
    </li>
  </ul>

  <dialog
    ref="dialog"
    class="m-auto h-full max-h-none w-full max-w-none bg-transparent p-0 text-bone backdrop:bg-ink/95 backdrop:backdrop-blur-sm"
    aria-label="Photo viewer"
    @keydown="onKey"
    @click.self="close"
  >
    <div v-if="current" class="flex h-full flex-col items-center justify-center gap-4 p-4 sm:p-10" @click.self="close">
      <div class="relative w-full max-w-6xl flex-1">
        <SmartImage
          :key="current.image.src"
          :image="current.image"
          sizes="90vw"
          :widths="[960, 1440, 1920]"
          class="anim-fade absolute inset-0 h-full w-full bg-transparent!"
          img-class="object-contain!"
        />
      </div>
      <div class="flex w-full max-w-6xl items-center justify-between gap-4">
        <p class="font-display text-2xl font-bold uppercase">
          <span class="text-ember">{{ String(index + 1).padStart(2, '0') }}</span> {{ current.caption }}
        </p>
        <div class="flex gap-2">
          <button type="button" class="flex h-12 w-12 items-center justify-center border border-bone/30 hover:border-ember hover:text-ember" aria-label="Previous photo" @click="step(-1)">
            <AppIcon name="arrowLeft" class="h-5 w-5" />
          </button>
          <button type="button" class="flex h-12 w-12 items-center justify-center border border-bone/30 hover:border-ember hover:text-ember" aria-label="Next photo" @click="step(1)">
            <AppIcon name="arrowRight" class="h-5 w-5" />
          </button>
          <button type="button" class="flex h-12 w-12 items-center justify-center bg-ember text-ink hover:bg-ember-hi" aria-label="Close viewer" @click="close">
            <AppIcon name="close" class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </dialog>
  </div>
</template>
