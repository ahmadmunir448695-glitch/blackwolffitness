<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg | xl
})
const emit = defineEmits(['close'])

const panel = ref(null)
let returnFocus = null
const titleId = `modal-${Math.random().toString(36).slice(2, 9)}`

function focusables() {
  return [...(panel.value?.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])]
}

function onKey(e) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    emit('close')
  } else if (e.key === 'Tab') {
    const items = focusables()
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocus = document.activeElement
      document.documentElement.style.overflow = 'hidden'
      await nextTick()
      const target = panel.value?.querySelector('[autofocus]') || focusables().find((el) => el.tagName !== 'BUTTON') || focusables()[0]
      target?.focus()
    } else {
      document.documentElement.style.overflow = ''
      returnFocus?.focus?.()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (props.open) document.documentElement.style.overflow = ''
})

const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="open" class="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6" @mousedown.self="emit('close')" @keydown="onKey">
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="flex max-h-[92vh] w-full flex-col border border-line bg-coal shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)]"
          :class="widths[size]"
        >
          <div class="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <h2 :id="titleId" class="font-display text-2xl uppercase tracking-wide text-bone">{{ title }}</h2>
              <p v-if="subtitle" class="mt-1 text-sm text-ash">{{ subtitle }}</p>
            </div>
            <button type="button" class="p-icon-btn shrink-0" aria-label="Close" @click="emit('close')">
              <AppIcon name="close" class="h-4 w-4" />
            </button>
          </div>
          <div class="overflow-y-auto px-5 py-5 sm:px-6">
            <slot />
          </div>
          <div v-if="$slots.footer" class="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
