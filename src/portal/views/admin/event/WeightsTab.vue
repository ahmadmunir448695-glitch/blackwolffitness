<script setup>
import { computed, reactive, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import { http } from '../../../lib/api.js'
import { applyFieldErrors, confirmDialog, toast } from '../../../lib/ui.js'

const props = defineProps({ config: { type: Object, required: true } })
const emit = defineEmits(['update'])

const base = () => `/admin/events/${props.config.event.id}/weight-divisions`
const ages = computed(() => props.config.age_divisions)

const groups = computed(() => {
  const out = []
  for (const age of ages.value) {
    for (const gender of ['male', 'female']) {
      const items = props.config.weight_divisions.filter((w) => w.age_division_id === age.id && w.gender === gender)
      out.push({ key: `${age.id}-${gender}`, age, gender, items })
    }
  }
  return out
})

// Bulk ladder
const bulk = reactive({ age_division_id: '', gender: 'male', limits: '', add_open_class: true, replace: false })
const bulkErrors = reactive({ age_division_id: '', gender: '', limits: '' })
const bulkSaving = ref(false)

async function addBulk() {
  if (bulk.replace) {
    const ok = await confirmDialog({ title: 'Replace weight categories?', message: 'Existing weight categories for this age group and gender will be deleted first.', confirmLabel: 'Replace', danger: true })
    if (!ok) return
  }
  bulkSaving.value = true
  applyFieldErrors(bulkErrors, null)
  try {
    emit('update', await http.post(`${base()}/bulk`, { ...bulk }))
    toast.success('Weight categories created.')
    bulk.limits = ''
    bulk.replace = false
  } catch (err) {
    applyFieldErrors(bulkErrors, err)
    toast.error(err)
  } finally {
    bulkSaving.value = false
  }
}

// Single class
const one = reactive({ age_division_id: '', gender: 'male', min_kg: '', max_kg: '', name: '' })
const oneErrors = reactive({ age_division_id: '', gender: '', min_kg: '', max_kg: '', name: '' })
const oneSaving = ref(false)

async function addOne() {
  oneSaving.value = true
  applyFieldErrors(oneErrors, null)
  try {
    const body = { ...one }
    for (const k of ['min_kg', 'max_kg', 'name']) if (body[k] === '') body[k] = null
    emit('update', await http.post(base(), body))
    toast.success('Weight category added.')
    Object.assign(one, { min_kg: '', max_kg: '', name: '' })
  } catch (err) {
    applyFieldErrors(oneErrors, err)
    toast.error(err)
  } finally {
    oneSaving.value = false
  }
}

const busy = ref(null)
async function remove(w) {
  if (!(await confirmDialog({ title: `Delete ${w.name}?`, confirmLabel: 'Delete', danger: true }))) return
  busy.value = w.id
  try {
    emit('update', await http.del(`${base()}/${w.id}`))
    toast.success('Weight category deleted.')
  } catch (err) {
    toast.error(err)
  } finally {
    busy.value = null
  }
}

function range(w) {
  if (w.min_kg != null && w.max_kg != null) return `over ${w.min_kg} up to ${w.max_kg} kg`
  if (w.max_kg != null) return `up to ${w.max_kg} kg`
  if (w.min_kg != null) return `over ${w.min_kg} kg`
  return ''
}
</script>

<template>
  <div v-if="!ages.length" class="p-card p-6 text-sm text-ash">Add age groups first. Weight categories belong to an age group and a gender.</div>
  <div v-else class="grid gap-6 xl:grid-cols-[1fr_24rem]">
    <section aria-labelledby="weights-title">
      <h2 id="weights-title" class="font-display text-xl uppercase tracking-wide text-bone">Weight categories</h2>
      <p class="mt-1 text-sm text-smoke">Used by kyorugi. Each class runs from the previous limit up to its own.</p>
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <article v-for="g in groups" :key="g.key" class="p-card p-4">
          <h3 class="text-sm font-semibold text-bone">{{ g.age.name }} <span class="text-smoke">· {{ g.gender === 'male' ? 'Male' : 'Female' }}</span></h3>
          <p v-if="!g.items.length" class="mt-3 text-sm text-smoke">None yet.</p>
          <ul v-else class="mt-3 flex flex-wrap gap-2">
            <li v-for="w in g.items" :key="w.id" class="p-chip pr-1" :title="range(w)">
              <span class="font-semibold text-bone">{{ w.name }}</span>
              <button type="button" class="inline-flex h-6 w-6 items-center justify-center text-smoke hover:text-danger disabled:opacity-40" :aria-label="`Delete ${g.age.name} ${g.gender} ${w.name}`" :disabled="busy === w.id" @click="remove(w)">
                <AppIcon name="close" class="h-3.5 w-3.5" />
              </button>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <div class="space-y-6">
      <form class="p-card space-y-4 p-5 sm:p-6" novalidate @submit.prevent="addBulk">
        <h2 class="font-display text-xl uppercase tracking-wide text-bone">Add a weight ladder</h2>
        <div class="grid grid-cols-2 gap-3">
          <FormField id="wb-age" label="Age group" :error="bulkErrors.age_division_id">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="bulk.age_division_id" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                <option value="" disabled>Choose…</option>
                <option v-for="a in ages" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </template>
          </FormField>
          <FormField id="wb-gender" label="Gender" :error="bulkErrors.gender">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="bulk.gender" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </template>
          </FormField>
        </div>
        <FormField id="wb-limits" label="Upper limits (kg)" hint="Separated by commas, e.g. 45, 48, 51, 55, 59" :error="bulkErrors.limits">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="bulk.limits" class="p-input" inputmode="decimal" placeholder="45, 48, 51, 55" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <label class="flex items-start gap-3 text-sm text-ash"><input v-model="bulk.add_open_class" type="checkbox" class="p-check mt-0.5" /> Add a final “+” class above the last limit</label>
        <label class="flex items-start gap-3 text-sm text-ash"><input v-model="bulk.replace" type="checkbox" class="p-check mt-0.5" /> Replace existing classes for this age group and gender</label>
        <BaseButton type="submit" size="sm" icon="plus" block :disabled="bulkSaving">{{ bulkSaving ? 'Creating…' : 'Create ladder' }}</BaseButton>
      </form>

      <form class="p-card space-y-4 p-5 sm:p-6" novalidate @submit.prevent="addOne">
        <h2 class="font-display text-xl uppercase tracking-wide text-bone">Add one class</h2>
        <div class="grid grid-cols-2 gap-3">
          <FormField id="w1-age" label="Age group" :error="oneErrors.age_division_id">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="one.age_division_id" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                <option value="" disabled>Choose…</option>
                <option v-for="a in ages" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </template>
          </FormField>
          <FormField id="w1-gender" label="Gender" :error="oneErrors.gender">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="one.gender" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </template>
          </FormField>
          <FormField id="w1-min" label="Over (kg)" optional :error="oneErrors.min_kg">
            <template #default="{ id, describedby, invalid }">
              <input :id="id" v-model.number="one.min_kg" type="number" min="0" max="300" step="0.1" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
            </template>
          </FormField>
          <FormField id="w1-max" label="Up to (kg)" optional :error="oneErrors.max_kg">
            <template #default="{ id, describedby, invalid }">
              <input :id="id" v-model.number="one.max_kg" type="number" min="0" max="300" step="0.1" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
            </template>
          </FormField>
        </div>
        <FormField id="w1-name" label="Name" optional hint="Empty = from the limits, e.g. -54 kg" :error="oneErrors.name">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="one.name" class="p-input" maxlength="40" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <BaseButton type="submit" variant="outline" size="sm" icon="plus" block :disabled="oneSaving">{{ oneSaving ? 'Adding…' : 'Add class' }}</BaseButton>
      </form>
    </div>
  </div>
</template>
