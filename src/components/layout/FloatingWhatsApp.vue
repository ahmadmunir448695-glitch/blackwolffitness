<script setup>
import { computed } from 'vue'
import AppIcon from '../ui/AppIcon.vue'
import { whatsappUrl } from '@/utils/whatsapp.js'

/** Floating click-to-chat button. Only rendered when a WhatsApp number is configured. */
const url = computed(() => whatsappUrl())
</script>

<template>
  <a
    v-if="url"
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    class="fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-ember text-ink shadow-[0_10px_30px_-8px_rgb(247_134_15/0.55)] transition-transform duration-150 hover:scale-105 sm:bottom-7 sm:right-7"
  >
    <AppIcon name="whatsapp" class="h-7 w-7" />
    <span class="sr-only">Chat with Black Wolf on WhatsApp (opens WhatsApp)</span>
  </a>
</template>
