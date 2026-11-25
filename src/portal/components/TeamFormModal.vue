<script setup>
import { reactive, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import Modal from './Modal.vue'
import { http } from '../lib/api.js'
import { applyFieldErrors, toast } from '../lib/ui.js'
import { session } from '../lib/session.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  team: { type: Object, default: null }, // edit when set
})
const emit = defineEmits(['close', 'saved'])

const blank = () => ({
  name: '',
  country: session.user?.club?.country || '',
  city: session.user?.club?.city || '',
  head_coach_name: '',
  coach_phone: '',
  coach_email: '',
  status: 'active',
})
const form = reactive(blank())
const errors = reactive({ name: '', country: '', city: '', head_coach_name: '', coach_phone: '', coach_email: '' })
const busy = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    Object.assign(form, blank(), props.team ? Object.fromEntries(Object.keys(blank()).map((k) => [k, props.team[k] ?? ''])) : {})
    applyFieldErrors(errors, null)
  },
)

async function save() {
  busy.value = true
  try {
    const res = props.team ? await http.patch(`/teams/${props.team.id}`, form) : await http.post('/teams', form)
    toast.success(props.team ? 'Team updated.' : `Team created. Team ID ${res.team.code}.`)
    emit('saved', res.team)
  } catch (err) {
    if (!applyFieldErrors(errors, err)) toast.error(err)
  } finally {
    busy.value = false
  }
}

const fields = [
  { key: 'name', label: 'Team name', span: true },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'head_coach_name', label: 'Head coach name', optional: true, span: true },
  { key: 'coach_phone', label: 'Coach phone', type: 'tel', optional: true },
  { key: 'coach_email', label: 'Coach email', type: 'email', optional: true },
]
</script>

<template>
  <Modal :open="open" :title="team ? 'Edit team' : 'Create a team'" :subtitle="team ? team.code : 'Each team gets its own Team ID.'" @close="emit('close')">
    <form id="team-form" class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="save">
      <FormField v-for="f in fields" :id="`team-${f.key}`" :key="f.key" :label="f.label" :error="errors[f.key]" :optional="Boolean(f.optional)" :class="f.span ? 'sm:col-span-2' : ''">
        <template #default="{ id, describedby, invalid }">
          <input :id="id" v-model="form[f.key]" :type="f.type || 'text'" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" />
        </template>
      </FormField>
      <FormField v-if="team" id="team-status" label="Status">
        <template #default="{ id }">
          <select :id="id" v-model="form.status" class="p-select">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </template>
      </FormField>
    </form>
    <template #footer>
      <BaseButton variant="outline" size="sm" @click="emit('close')">Cancel</BaseButton>
      <BaseButton type="submit" form="team-form" size="sm" :disabled="busy">{{ busy ? 'Saving…' : team ? 'Save changes' : 'Create team' }}</BaseButton>
    </template>
  </Modal>
</template>
