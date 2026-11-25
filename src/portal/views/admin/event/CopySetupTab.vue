<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { http } from '../../../lib/api.js'
import { fmtRange } from '../../../lib/format.js'
import { confirmDialog, toast } from '../../../lib/ui.js'

const props = defineProps({ config: { type: Object, required: true } })
const emit = defineEmits(['update'])

const events = ref([])
const loading = ref(true)
const from = ref('')
const saving = ref(false)

onMounted(async () => {
  try {
    events.value = ((await http.get('/admin/events')).items || []).filter((e) => e.id !== props.config.event.id)
  } catch (err) {
    toast.error(err)
  } finally {
    loading.value = false
  }
})

const source = computed(() => events.value.find((e) => e.id === from.value))
const current = computed(() => ({
  ages: props.config.age_divisions.length,
  weights: props.config.weight_divisions.length,
  belts: props.config.belt_divisions.length,
  categories: props.config.categories.length,
}))

async function copy() {
  const ok = await confirmDialog({
    title: 'Replace this championship’s setup?',
    message: `Age groups, weight categories, belt groups and categories will be deleted here and copied from “${source.value?.name}”. Details, files and announcements are kept.`,
    confirmLabel: 'Copy setup',
    danger: true,
  })
  if (!ok) return
  saving.value = true
  try {
    emit('update', await http.post(`/admin/events/${props.config.event.id}/copy-config`, { from_event_id: from.value }))
    toast.success(`Setup copied from ${source.value?.name}.`)
    from.value = ''
  } catch (err) {
    toast.error(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="p-card max-w-2xl p-5 sm:p-6" aria-labelledby="copy-title">
    <h2 id="copy-title" class="font-display text-xl uppercase tracking-wide text-bone">Copy setup from another championship</h2>
    <p class="mt-2 text-sm text-ash">
      Start from a championship you ran before: its age groups, weight categories, belt groups and categories are copied here.
      This replaces the current setup ({{ current.ages }} age groups, {{ current.weights }} weight categories, {{ current.belts }} belt groups, {{ current.categories }} categories).
      It is only possible before any entry is made.
    </p>
    <form class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" @submit.prevent="copy">
      <div class="flex-1">
        <label for="copy-from" class="p-label">Copy from</label>
        <select id="copy-from" v-model="from" class="p-select" :disabled="loading">
          <option value="" disabled>{{ loading ? 'Loading…' : events.length ? 'Choose a championship…' : 'No other championships' }}</option>
          <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }} ({{ fmtRange(e.start_date, e.end_date) }})</option>
        </select>
      </div>
      <BaseButton type="submit" size="sm" :disabled="!from || saving">{{ saving ? 'Copying…' : 'Copy setup' }}</BaseButton>
    </form>
  </section>
</template>
