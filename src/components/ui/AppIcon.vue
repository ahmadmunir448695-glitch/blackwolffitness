<script setup>
import { computed } from 'vue'

/** Small inline icon set (24×24, 1.75 stroke). Decorative unless `label` is set. */
const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
})

const icons = {
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h10'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  plus: ['M12 5v14', 'M5 12h14'],
  chevronDown: ['M6 9l6 6 6-6'],
  chevronRight: ['M9 6l6 6-6 6'],
  arrowRight: ['M5 12h14', 'M13 6l6 6-6 6'],
  arrowLeft: ['M19 12H5', 'M11 6l-6 6 6 6'],
  phone: ['M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z'],
  mail: ['M3.5 6.5h17v11h-17z', 'M4 7l8 6 8-6'],
  pin: ['M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  alert: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17.2v.1'],
  info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 11v5', 'M12 8v.1'],
  refresh: ['M20 11a8 8 0 0 0-14.3-4.9L4 8', 'M4 4v4h4', 'M4 13a8 8 0 0 0 14.3 4.9L20 16', 'M20 20v-4h-4'],
  shield: ['M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z', 'M8.8 12.2l2.2 2.2 4.2-4.4'],
  users: ['M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M2.5 20a6.5 6.5 0 0 1 13 0', 'M16 4.3a3.5 3.5 0 0 1 0 6.4', 'M18 14.2a6.5 6.5 0 0 1 3.5 5.8'],
  heart: ['M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v6H4V6h6'],
  whatsapp: [
    'M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z',
    'M9.1 8.2c.3-.3.8-.3 1 .1l.8 1.7c.1.3 0 .6-.2.8l-.6.6c.6 1.3 1.6 2.3 2.9 2.9l.6-.6c.2-.2.5-.3.8-.2l1.7.8c.4.2.4.7.1 1l-.6.7c-.5.5-1.3.7-2 .4a8.6 8.6 0 0 1-4.9-4.9c-.3-.7-.1-1.5.4-2z',
  ],
  instagram: ['M7.5 3.5h9a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z', 'M12 15.8a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6z', 'M17.2 6.8v.1'],
  facebook: ['M14.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4a20 20 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.1H8.6v3h2.7V21'],
  youtube: ['M3.5 8.2c.1-1.6 1.3-2.8 2.9-2.9C8 5.2 10 5.1 12 5.1s4 .1 5.6.2c1.6.1 2.8 1.3 2.9 2.9.1 1.3.1 2.5.1 3.8s0 2.5-.1 3.8c-.1 1.6-1.3 2.8-2.9 2.9-1.6.1-3.6.2-5.6.2s-4-.1-5.6-.2c-1.6-.1-2.8-1.3-2.9-2.9C3.4 14.5 3.4 13.3 3.4 12s0-2.5.1-3.8z', 'M10.2 9.3l4.6 2.7-4.6 2.7z'],
  tiktok: ['M14 3.5v11.3a3.7 3.7 0 1 1-3.2-3.7', 'M14 3.5c.4 2.4 2.1 4 4.6 4.2'],
}

const paths = computed(() => icons[props.name] ?? [])
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    :role="label ? 'img' : undefined"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label || undefined"
    focusable="false"
  >
    <path v-for="d in paths" :key="d" :d="d" />
  </svg>
</template>
