<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import { http } from '../../../lib/api.js'
import { toast } from '../../../lib/ui.js'

const props = defineProps({
  eventId: { type: Number, required: true },
  organizers: { type: Array, default: () => [] },
})
const emit = defineEmits(['update'])

const users = ref([])
const loading = ref(true)
const selected = ref([])
const saving = ref(false)

watch(() => props.organizers, (list) => (selected.value = list.map((u) => u.id)), { immediate: true })

onMounted(async () => {
  try {
    users.value = (await http.get('/admin/users', { role: 'organizer', pageSize: 100 })).items || []
  } catch (err) {
    toast.error(err)
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const res = await http.put(`/admin/events/${props.eventId}/organizers`, { user_ids: selected.value })
    emit('update', users.value.filter((u) => res.user_ids.includes(u.id)).map((u) => ({ id: u.id, name: u.name, email: u.email })))
    toast.success('Organizers updated.')
  } catch (err) {
    toast.error(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="p-card max-w-2xl p-5 sm:p-6" aria-labelledby="org-title">
    <h2 id="org-title" class="font-display text-xl uppercase tracking-wide text-bone">Organizers</h2>
    <p class="mt-2 text-sm text-ash">Organizer accounts ticked here can manage this championship, review its entries and confirm payments. Super admins can always manage every championship.</p>
    <div v-if="loading" class="mt-5 space-y-2"><div v-for="n in 3" :key="n" class="skeleton h-8" /></div>
    <p v-else-if="!users.length" class="mt-5 text-sm text-smoke">
      No organizer accounts yet. <RouterLink to="/portal/admin/users" class="p-link">Create one in Users</RouterLink>.
    </p>
    <form v-else class="mt-5" @submit.prevent="save">
      <fieldset>
        <legend class="sr-only">Organizers of this championship</legend>
        <ul class="divide-y divide-line/70 border border-line">
          <li v-for="u in users" :key="u.id">
            <label class="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-iron">
              <input v-model="selected" type="checkbox" class="p-check" :value="u.id" />
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-semibold text-bone">{{ u.name }}</span>
                <span class="block truncate text-xs text-smoke">{{ u.email }}</span>
              </span>
              <span v-if="!u.is_active" class="p-badge tone-muted">Inactive</span>
            </label>
          </li>
        </ul>
      </fieldset>
      <div class="mt-4 flex justify-end">
        <BaseButton type="submit" size="sm" icon="check" :disabled="saving">{{ saving ? 'Saving…' : 'Save organizers' }}</BaseButton>
      </div>
    </form>
  </section>
</template>
