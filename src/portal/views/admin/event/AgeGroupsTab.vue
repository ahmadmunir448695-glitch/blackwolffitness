<script setup>
import { reactive, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import { http } from '../../../lib/api.js'
import { applyFieldErrors, confirmDialog, toast } from '../../../lib/ui.js'

const props = defineProps({ config: { type: Object, required: true } })
const emit = defineEmits(['update'])

const base = () => `/admin/events/${props.config.event.id}/age-divisions`

const form = reactive({ name: '', min_age: '', max_age: '' })
const errors = reactive({ name: '', min_age: '', max_age: '' })
const saving = ref(false)

async function add() {
  saving.value = true
  applyFieldErrors(errors, null)
  try {
    emit('update', await http.post(base(), { ...form }))
    toast.success(`Age group “${form.name}” added.`)
    Object.assign(form, { name: '', min_age: '', max_age: '' })
  } catch (err) {
    applyFieldErrors(errors, err)
    toast.error(err)
  } finally {
    saving.value = false
  }
}

const editing = ref(null)
const edit = reactive({ name: '', min_age: '', max_age: '' })
const editErrors = reactive({ name: '', min_age: '', max_age: '' })
const busy = ref(null)

function startEdit(row) {
  editing.value = row.id
  Object.assign(edit, { name: row.name, min_age: row.min_age, max_age: row.max_age })
  applyFieldErrors(editErrors, null)
}

async function saveEdit(row) {
  busy.value = row.id
  applyFieldErrors(editErrors, null)
  try {
    emit('update', await http.patch(`${base()}/${row.id}`, { ...edit }))
    toast.success('Age group updated.')
    editing.value = null
  } catch (err) {
    applyFieldErrors(editErrors, err)
    toast.error(err)
  } finally {
    busy.value = null
  }
}

async function remove(row) {
  const cats = props.config.categories.filter((c) => c.age_division_id === row.id).length
  const ok = await confirmDialog({
    title: `Delete ${row.name}?`,
    message: `Its weight categories${cats ? ` and ${cats} competition categor${cats === 1 ? 'y' : 'ies'}` : ''} will also be removed.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  busy.value = row.id
  try {
    emit('update', await http.del(`${base()}/${row.id}`))
    toast.success('Age group deleted.')
  } catch (err) {
    toast.error(err)
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[1fr_22rem]">
    <section class="p-card overflow-hidden" aria-labelledby="ages-title">
      <h2 id="ages-title" class="px-5 pt-5 font-display text-xl uppercase tracking-wide text-bone sm:px-6">Age groups</h2>
      <p class="px-5 pt-1 text-sm text-smoke sm:px-6">Ages are counted by the championship's age rule. Weight classes and kyorugi categories belong to an age group.</p>
      <p v-if="!config.age_divisions.length" class="px-5 py-8 text-sm text-smoke sm:px-6">No age groups yet. Add Cadet, Junior, Senior… on the right, or copy the setup from another championship.</p>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="p-table min-w-[32rem]">
          <thead>
            <tr><th scope="col">Name</th><th scope="col">Min age</th><th scope="col">Max age</th><th scope="col" class="text-right">Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in config.age_divisions" :key="row.id">
              <template v-if="editing === row.id">
                <td>
                  <label :for="`age-e-name-${row.id}`" class="sr-only">Name</label>
                  <input :id="`age-e-name-${row.id}`" v-model="edit.name" class="p-input" :aria-invalid="Boolean(editErrors.name)" />
                  <p v-if="editErrors.name" class="mt-1 text-xs text-danger">{{ editErrors.name }}</p>
                </td>
                <td>
                  <label :for="`age-e-min-${row.id}`" class="sr-only">Minimum age</label>
                  <input :id="`age-e-min-${row.id}`" v-model.number="edit.min_age" type="number" min="3" max="99" class="p-input w-24" :aria-invalid="Boolean(editErrors.min_age)" />
                  <p v-if="editErrors.min_age" class="mt-1 text-xs text-danger">{{ editErrors.min_age }}</p>
                </td>
                <td>
                  <label :for="`age-e-max-${row.id}`" class="sr-only">Maximum age</label>
                  <input :id="`age-e-max-${row.id}`" v-model.number="edit.max_age" type="number" min="3" max="99" class="p-input w-24" :aria-invalid="Boolean(editErrors.max_age)" />
                  <p v-if="editErrors.max_age" class="mt-1 text-xs text-danger">{{ editErrors.max_age }}</p>
                </td>
                <td class="text-right">
                  <div class="inline-flex gap-2">
                    <button type="button" class="p-icon-btn" aria-label="Save age group" :disabled="busy === row.id" @click="saveEdit(row)"><AppIcon name="check" class="h-4 w-4" /></button>
                    <button type="button" class="p-icon-btn" aria-label="Cancel editing" @click="editing = null"><AppIcon name="close" class="h-4 w-4" /></button>
                  </div>
                </td>
              </template>
              <template v-else>
                <td class="font-semibold text-bone">{{ row.name }}</td>
                <td>{{ row.min_age }}</td>
                <td>{{ row.max_age }}</td>
                <td class="text-right">
                  <div class="inline-flex gap-2">
                    <button type="button" class="p-icon-btn" :aria-label="`Edit ${row.name}`" @click="startEdit(row)"><AppIcon name="edit" class="h-4 w-4" /></button>
                    <button type="button" class="p-icon-btn is-danger" :aria-label="`Delete ${row.name}`" :disabled="busy === row.id" @click="remove(row)"><AppIcon name="trash" class="h-4 w-4" /></button>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <form class="p-card space-y-4 self-start p-5 sm:p-6" novalidate @submit.prevent="add">
      <h2 class="font-display text-xl uppercase tracking-wide text-bone">Add age group</h2>
      <FormField id="age-name" label="Name" :error="errors.name" hint="e.g. Cadet (12–14)">
        <template #default="{ id, describedby, invalid }">
          <input :id="id" v-model="form.name" class="p-input" maxlength="60" :aria-invalid="invalid" :aria-describedby="describedby" />
        </template>
      </FormField>
      <div class="grid grid-cols-2 gap-3">
        <FormField id="age-min" label="Min age" :error="errors.min_age">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model.number="form.min_age" type="number" min="3" max="99" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField id="age-max" label="Max age" :error="errors.max_age">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model.number="form.max_age" type="number" min="3" max="99" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
      </div>
      <BaseButton type="submit" size="sm" icon="plus" block :disabled="saving">{{ saving ? 'Adding…' : 'Add age group' }}</BaseButton>
    </form>
  </div>
</template>
