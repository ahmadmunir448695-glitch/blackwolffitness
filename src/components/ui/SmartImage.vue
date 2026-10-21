<script setup>
import { computed, ref, useAttrs, watch } from 'vue'
import WolfMark from '../brand/WolfMark.vue'

/**
 * Responsive image with lazy loading and a branded fallback.
 *  - Unsplash URLs get a srcset at several widths automatically.
 *  - Local images (/images/…) are used as-is.
 *  - If loading fails, a dark panel with the wolf mark replaces the image.
 * The parent sizes the box; the image covers it.
 */
const props = defineProps({
  image: { type: Object, default: null }, // { src, alt }
  src: { type: String, default: '' },
  alt: { type: String, default: undefined },
  sizes: { type: String, default: '100vw' },
  widths: { type: Array, default: () => [480, 768, 1080, 1440, 1920] },
  priority: { type: Boolean, default: false },
  position: { type: String, default: 'center' },
  imgClass: { type: [String, Array, Object], default: '' },
  quality: { type: Number, default: 70 },
})

const attrs = useAttrs()
// Callers often position the box themselves (absolute inset-0); only add
// `relative` when they have not, so the two classes never conflict.
const positioned = computed(() => /\b(absolute|fixed|sticky)\b/.test(String(attrs.class ?? '')))

const failed = ref(false)
const loaded = ref(false)
const source = computed(() => props.src || props.image?.src || '')
const altText = computed(() => props.alt ?? props.image?.alt ?? '')
const isUnsplash = computed(() => source.value.startsWith('https://images.unsplash.com/'))

watch(source, () => {
  failed.value = false
  loaded.value = false
})

function sized(width) {
  return `${source.value}?w=${width}&q=${props.quality}&auto=format&fit=crop`
}

const srcset = computed(() => (isUnsplash.value ? props.widths.map((w) => `${sized(w)} ${w}w`).join(', ') : undefined))
const fallbackSrc = computed(() => (isUnsplash.value ? sized(props.widths[Math.min(2, props.widths.length - 1)]) : source.value))
</script>

<template>
  <div class="overflow-hidden bg-coal" :class="positioned ? '' : 'relative'">
    <img
      v-if="source && !failed"
      :src="fallbackSrc"
      :srcset="srcset"
      :sizes="isUnsplash ? sizes : undefined"
      :alt="altText"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      class="h-full w-full object-cover transition-opacity duration-500"
      :class="[loaded ? 'opacity-100' : 'opacity-0', imgClass]"
      :style="{ objectPosition: position }"
      @load="loaded = true"
      @error="failed = true"
    />
    <div
      v-if="!source || failed"
      class="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(115deg,#17171c_0_14px,#141418_14px_28px)]"
      role="img"
      :aria-label="altText || undefined"
      :aria-hidden="altText ? undefined : 'true'"
    >
      <WolfMark class="h-1/4 max-h-24 w-1/4 max-w-24 text-line" />
    </div>
    <slot />
  </div>
</template>
