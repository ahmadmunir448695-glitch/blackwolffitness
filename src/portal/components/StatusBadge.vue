<script setup>
import { computed } from 'vue'
import { ENTRY_STATUS, EVENT_STATUS, PAYMENT_STATUS, humanize } from '../lib/format.js'

const props = defineProps({
  value: { type: String, default: '' },
  kind: { type: String, default: 'entry' }, // entry | event | payment
})

const map = { entry: ENTRY_STATUS, event: EVENT_STATUS, payment: PAYMENT_STATUS }
const info = computed(() => map[props.kind]?.[props.value] ?? { label: humanize(props.value), tone: 'muted' })
</script>

<template>
  <span v-if="value" class="p-badge" :class="`tone-${info.tone}`">{{ info.label }}</span>
</template>
