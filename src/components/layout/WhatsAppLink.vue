<script setup>
import { computed } from 'vue'
import AppIcon from '../ui/AppIcon.vue'
import { whatsappUrl } from '@/utils/whatsapp.js'

/**
 * WhatsApp click-to-chat link using the number in src/config/club.js
 * (or a `number` passed in, such as a coach's own WhatsApp).
 * When no number is set: hidden on the live site; shown as a dashed
 * placeholder during development so you can see where it appears.
 */
const props = defineProps({
  message: { type: String, default: undefined },
  variant: { type: String, default: 'button' }, // button | icon | text | block | accent | light
  label: { type: String, default: 'WhatsApp' },
  /** Optional number to chat with instead of the club's (e.g. a coach's). */
  number: { type: String, default: undefined },
})

const url = computed(() => whatsappUrl(props.message, props.number))
const isDev = import.meta.env.DEV

const base = {
  button: 'inline-flex h-12 items-center justify-center gap-2 border border-bone/35 px-5 text-[0.95rem] font-semibold text-bone transition-colors hover:border-ember hover:text-ember',
  block: 'flex h-12 w-full items-center justify-center gap-2 border border-bone/35 px-5 font-semibold text-bone transition-colors hover:border-ember hover:text-ember',
  icon: 'inline-flex h-11 w-11 items-center justify-center border border-bone/25 text-bone transition-colors hover:border-ember hover:text-ember',
  text: 'inline-flex items-center gap-2 font-semibold text-bone underline decoration-1 underline-offset-4 hover:text-ember',
  accent: 'inline-flex h-12 items-center justify-center gap-2 border-2 border-ink/70 px-5 text-[0.95rem] font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5',
  light: 'inline-flex h-12 items-center justify-center gap-2 border border-graphite/35 px-5 text-[0.95rem] font-semibold text-graphite transition-colors hover:border-rust hover:text-rust',
}
</script>

<template>
  <a
    v-if="url"
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    :class="base[variant]"
    :aria-label="variant === 'icon' ? `Chat on WhatsApp (opens WhatsApp)` : undefined"
  >
    <AppIcon name="whatsapp" class="h-5 w-5 shrink-0" />
    <span v-if="variant !== 'icon'">{{ label }}</span>
    <span v-if="variant !== 'icon'" class="sr-only">(opens WhatsApp)</span>
  </a>
  <span
    v-else-if="isDev"
    :class="[base[variant], 'cursor-help border-dashed opacity-70']"
    title="Placeholder — add contact.whatsapp in src/config/club.js to activate this button"
  >
    <AppIcon name="whatsapp" class="h-5 w-5 shrink-0" />
    <span v-if="variant !== 'icon'">{{ label }} (not set)</span>
  </span>
</template>
