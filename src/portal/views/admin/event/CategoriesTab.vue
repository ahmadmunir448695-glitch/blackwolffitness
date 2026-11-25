<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import Modal from '../../../components/Modal.vue'
import { http } from '../../../lib/api.js'
import { DISCIPLINE_LABELS, fmtMoney, humanize } from '../../../lib/format.js'
import { applyFieldErrors, confirmDialog, toast } from '../../../lib/ui.js'

const props = defineProps({
  config: { type: Object, required: true },
  disciplines: { type: Array, default: () => [] }, // [{ value, label, formats, subtypes }]
})
const emit = defineEmits(['update'])

const base = () => `/admin/events/${props.config.event.id}/categories`
const event = computed(() => props.config.event)
const ageName = (id) => props.config.age_divisions.find((a) => a.id === id)?.name || '—'
const beltName = (id) => props.config.belt_divisions.find((b) => b.id === id)?.name || '—'
const specFor = (d) => props.disciplines.find((x) => x.value === d) || { formats: ['individual'], subtypes: [] }
const GENDERS = ['male', 'female', 'mixed', 'open']

// ---- List -----------------------------------------------------------------
const filter = ref('')
const rows = computed(() => (filter.value ? props.config.categories.filter((c) => c.discipline === filter.value) : props.config.categories))
const busy = ref(null)

async function patch(cat, body, message) {
  busy.value = cat.id
  try {
    emit('update', await http.patch(`${base()}/${cat.id}`, body))
    toast.success(message)
    return true
  } catch (err) {
    toast.error(err)
    return err
  } finally {
    busy.value = null
  }
}

function toggleActive(cat, e) {
  const active = e.target.checked
  patch(cat, { active }, active ? `${cat.name} is open for entries.` : `${cat.name} is turned off.`).then((r) => {
    if (r !== true) e.target.checked = cat.active
  })
}

async function remove(cat) {
  if (!(await confirmDialog({ title: 'Delete category?', message: cat.name, confirmLabel: 'Delete', danger: true }))) return
  busy.value = cat.id
  try {
    emit('update', await http.del(`${base()}/${cat.id}`))
    toast.success('Category deleted.')
  } catch (err) {
    toast.error(err)
  } finally {
    busy.value = null
  }
}

// ---- Edit (name, fee, limits, notes) --------------------------------------
const editing = ref(null)
const edit = reactive({ name: '', fee: '', max_entries_per_team: '', notes: '' })
const editErrors = reactive({ name: '', fee: '', max_entries_per_team: '', notes: '' })
const editSaving = ref(false)
function openEdit(cat) {
  editing.value = cat
  Object.assign(edit, { name: cat.name, fee: cat.fee ?? '', max_entries_per_team: cat.max_entries_per_team ?? '', notes: cat.notes ?? '' })
  applyFieldErrors(editErrors, null)
}
async function saveEdit() {
  editSaving.value = true
  applyFieldErrors(editErrors, null)
  const body = { ...edit }
  for (const k of ['fee', 'max_entries_per_team']) if (body[k] === '') body[k] = null
  if (!String(body.name).trim()) delete body.name
  try {
    emit('update', await http.patch(`${base()}/${editing.value.id}`, body))
    toast.success('Category updated.')
    editing.value = null
  } catch (err) {
    applyFieldErrors(editErrors, err)
    toast.error(err)
  } finally {
    editSaving.value = false
  }
}

// ---- Add one ----------------------------------------------------------------
const one = reactive({ discipline: 'kyorugi', subtype: '', format: 'individual', gender: 'male', age_division_id: '', belt_division_id: '', min_members: 3, max_members: 5, fee: '', name: '' })
const oneErrors = reactive({ discipline: '', subtype: '', format: '', gender: '', age_division_id: '', belt_division_id: '', min_members: '', max_members: '', fee: '', name: '' })
const oneSaving = ref(false)
const oneSpec = computed(() => specFor(one.discipline))
const oneGenders = computed(() => (one.discipline === 'kyorugi' ? ['male', 'female'] : GENDERS))
watch(
  () => one.discipline,
  () => {
    if (!oneSpec.value.formats.includes(one.format)) one.format = oneSpec.value.formats[0]
    if (!oneSpec.value.subtypes.some((s) => s.value === one.subtype)) one.subtype = oneSpec.value.subtypes[0]?.value || ''
    if (!oneGenders.value.includes(one.gender)) one.gender = oneGenders.value[0]
  },
)

async function addOne() {
  oneSaving.value = true
  applyFieldErrors(oneErrors, null)
  const body = { ...one }
  for (const k of ['subtype', 'age_division_id', 'belt_division_id', 'fee', 'name']) if (body[k] === '') body[k] = null
  if (body.format !== 'team') {
    delete body.min_members
    delete body.max_members
  }
  try {
    emit('update', await http.post(base(), body))
    toast.success('Category added.')
    one.name = ''
  } catch (err) {
    applyFieldErrors(oneErrors, err)
    toast.error(err)
  } finally {
    oneSaving.value = false
  }
}

// ---- Generate ---------------------------------------------------------------
const gen = reactive({ discipline: 'kyorugi', subtype: '', format: 'individual', genders: ['male', 'female'], age_division_ids: [], belt_division_ids: [], min_members: 3, max_members: 5, fee: '' })
const genErrors = reactive({ discipline: '', subtype: '', format: '', genders: '', age_division_ids: '', belt_division_ids: '', min_members: '', max_members: '', fee: '' })
const genSaving = ref(false)
const genResult = ref(null)
const genSpec = computed(() => specFor(gen.discipline))
const genGenders = computed(() => (gen.discipline === 'kyorugi' ? ['male', 'female'] : GENDERS))
watch(
  () => gen.discipline,
  () => {
    if (!genSpec.value.formats.includes(gen.format)) gen.format = genSpec.value.formats[0]
    if (!genSpec.value.subtypes.some((s) => s.value === gen.subtype)) gen.subtype = genSpec.value.subtypes[0]?.value || ''
    gen.genders = gen.genders.filter((g) => genGenders.value.includes(g))
  },
)
const genCount = computed(() => gen.genders.length * Math.max(1, gen.age_division_ids.length) * Math.max(1, gen.belt_division_ids.length))

async function generate() {
  genSaving.value = true
  genResult.value = null
  applyFieldErrors(genErrors, null)
  const body = { ...gen, fee: gen.fee === '' ? null : gen.fee }
  if (!body.subtype) body.subtype = null
  if (body.format !== 'team') {
    delete body.min_members
    delete body.max_members
  }
  try {
    const res = await http.post(`${base()}/generate`, body)
    emit('update', res)
    genResult.value = { created: res.created, skipped: res.skipped }
    toast.success(`Created ${res.created} categor${res.created === 1 ? 'y' : 'ies'}${res.skipped ? `, skipped ${res.skipped} that already existed` : ''}.`)
  } catch (err) {
    applyFieldErrors(genErrors, err)
    toast.error(err)
  } finally {
    genSaving.value = false
  }
}

const members = (c) => (c.min_members === c.max_members ? c.min_members : `${c.min_members}–${c.max_members}`)
</script>

<template>
  <div class="space-y-6">
    <section aria-labelledby="cats-title">
      <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="cats-title" class="font-display text-xl uppercase tracking-wide text-bone">Categories <span class="text-smoke">({{ config.categories.length }})</span></h2>
          <p class="mt-1 text-sm text-smoke">An empty fee means the championship fee ({{ fmtMoney(event.base_fee, event.currency) }}) applies.</p>
        </div>
        <div class="sm:w-56">
          <label for="cat-filter" class="sr-only">Filter by discipline</label>
          <select id="cat-filter" v-model="filter" class="p-select">
            <option value="">All disciplines</option>
            <option v-for="d in disciplines" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </div>
      </div>
      <div class="p-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="p-table min-w-[60rem]">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Discipline</th>
                <th scope="col">Format</th>
                <th scope="col">Gender</th>
                <th scope="col">Age group</th>
                <th scope="col">Belt group</th>
                <th scope="col">Athletes</th>
                <th scope="col" class="text-right">Fee</th>
                <th scope="col" class="text-right">Entries</th>
                <th scope="col">Active</th>
                <th scope="col" class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in rows" :key="c.id" :class="c.active ? '' : 'opacity-60'">
                <td class="font-semibold text-bone">{{ c.name }}</td>
                <td>{{ DISCIPLINE_LABELS[c.discipline] || c.discipline }}</td>
                <td>{{ humanize(c.format) }}</td>
                <td>{{ humanize(c.gender) }}</td>
                <td>{{ c.age_division_id ? ageName(c.age_division_id) : 'Any' }}</td>
                <td>{{ c.belt_division_id ? beltName(c.belt_division_id) : 'Any' }}</td>
                <td>{{ members(c) }}</td>
                <td class="text-right">
                  <span v-if="c.fee !== null && c.fee !== undefined" class="text-bone">{{ fmtMoney(c.fee, event.currency) }}</span>
                  <span v-else class="text-smoke">Base fee</span>
                </td>
                <td class="text-right">{{ c.entry_count }}</td>
                <td>
                  <label class="inline-flex items-center gap-2">
                    <input type="checkbox" class="p-check" :checked="c.active" :disabled="busy === c.id" @change="toggleActive(c, $event)" />
                    <span class="sr-only">Active: {{ c.name }}</span>
                  </label>
                </td>
                <td class="text-right">
                  <div class="inline-flex gap-2">
                    <button type="button" class="p-icon-btn" :aria-label="`Edit ${c.name}`" @click="openEdit(c)"><AppIcon name="edit" class="h-4 w-4" /></button>
                    <button type="button" class="p-icon-btn is-danger" :aria-label="`Delete ${c.name}`" :disabled="busy === c.id || c.entry_count > 0" :title="c.entry_count ? 'Has entries: turn it off instead' : undefined" @click="remove(c)"><AppIcon name="trash" class="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!rows.length" class="border-t border-line px-6 py-10 text-center text-sm text-smoke">
          {{ config.categories.length ? 'No categories in this discipline.' : 'No categories yet. Generate a set below or add them one by one.' }}
        </p>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-2">
      <form class="p-card space-y-4 p-5 sm:p-6" novalidate @submit.prevent="generate">
        <div>
          <h2 class="font-display text-xl uppercase tracking-wide text-bone">Generate categories</h2>
          <p class="mt-1 text-sm text-smoke">Creates one category for every gender × age group × belt group you tick. Existing ones are skipped.</p>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <FormField id="gen-disc" label="Discipline" :error="genErrors.discipline">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="gen.discipline" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                <option v-for="d in disciplines" :key="d.value" :value="d.value">{{ d.label }}</option>
              </select>
            </template>
          </FormField>
          <FormField v-if="genSpec.subtypes.length" id="gen-sub" label="Type" :error="genErrors.subtype">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="gen.subtype" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                <option v-for="s in genSpec.subtypes" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </template>
          </FormField>
          <FormField id="gen-format" label="Format" :error="genErrors.format">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="gen.format" class="p-select" :disabled="genSpec.formats.length < 2" :aria-invalid="invalid" :aria-describedby="describedby">
                <option v-for="f in genSpec.formats" :key="f" :value="f">{{ humanize(f) }}</option>
              </select>
            </template>
          </FormField>
        </div>
        <fieldset>
          <legend class="p-label">Gender</legend>
          <div class="flex flex-wrap gap-x-5 gap-y-2">
            <label v-for="g in genGenders" :key="g" class="flex items-center gap-2 text-sm text-ash"><input v-model="gen.genders" type="checkbox" class="p-check" :value="g" /> {{ humanize(g) }}</label>
          </div>
          <p v-if="genErrors.genders" class="mt-2 text-sm text-danger">{{ genErrors.genders }}</p>
        </fieldset>
        <fieldset>
          <legend class="p-label">Age groups <span class="font-normal text-smoke">{{ gen.discipline === 'kyorugi' ? '(required for kyorugi)' : '(none = all ages)' }}</span></legend>
          <p v-if="!config.age_divisions.length" class="text-sm text-smoke">No age groups yet.</p>
          <div class="flex flex-wrap gap-x-5 gap-y-2">
            <label v-for="a in config.age_divisions" :key="a.id" class="flex items-center gap-2 text-sm text-ash"><input v-model="gen.age_division_ids" type="checkbox" class="p-check" :value="a.id" /> {{ a.name }}</label>
          </div>
          <p v-if="genErrors.age_division_ids" class="mt-2 text-sm text-danger">{{ genErrors.age_division_ids }}</p>
        </fieldset>
        <fieldset>
          <legend class="p-label">Belt groups <span class="font-normal text-smoke">(none = all belts)</span></legend>
          <p v-if="!config.belt_divisions.length" class="text-sm text-smoke">No belt groups.</p>
          <div class="flex flex-wrap gap-x-5 gap-y-2">
            <label v-for="b in config.belt_divisions" :key="b.id" class="flex items-center gap-2 text-sm text-ash"><input v-model="gen.belt_division_ids" type="checkbox" class="p-check" :value="b.id" /> {{ b.name }}</label>
          </div>
        </fieldset>
        <div class="grid gap-3 sm:grid-cols-3">
          <template v-if="gen.format === 'team'">
            <FormField id="gen-min" label="Min athletes" :error="genErrors.min_members">
              <template #default="{ id, describedby, invalid }">
                <input :id="id" v-model.number="gen.min_members" type="number" min="1" max="60" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
              </template>
            </FormField>
            <FormField id="gen-max" label="Max athletes" :error="genErrors.max_members">
              <template #default="{ id, describedby, invalid }">
                <input :id="id" v-model.number="gen.max_members" type="number" min="1" max="60" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
              </template>
            </FormField>
          </template>
          <FormField id="gen-fee" label="Fee" optional hint="Empty = base fee" :error="genErrors.fee">
            <template #default="{ id, describedby, invalid }">
              <input :id="id" v-model.number="gen.fee" type="number" min="0" step="any" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
            </template>
          </FormField>
        </div>
        <p v-if="genResult" class="border border-success/40 bg-success/5 px-3 py-2 text-sm text-success" role="status">
          Created {{ genResult.created }}, skipped {{ genResult.skipped }} (already existed).
        </p>
        <BaseButton type="submit" size="sm" icon="plus" block :disabled="genSaving || !gen.genders.length">
          {{ genSaving ? 'Generating…' : `Generate up to ${genCount} categor${genCount === 1 ? 'y' : 'ies'}` }}
        </BaseButton>
      </form>

      <form class="p-card space-y-4 self-start p-5 sm:p-6" novalidate @submit.prevent="addOne">
        <h2 class="font-display text-xl uppercase tracking-wide text-bone">Add one category</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <FormField id="c1-disc" label="Discipline" :error="oneErrors.discipline">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="one.discipline" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                <option v-for="d in disciplines" :key="d.value" :value="d.value">{{ d.label }}</option>
              </select>
            </template>
          </FormField>
          <FormField v-if="oneSpec.subtypes.length" id="c1-sub" label="Type" :error="oneErrors.subtype">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="one.subtype" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                <option v-for="s in oneSpec.subtypes" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </template>
          </FormField>
          <FormField id="c1-format" label="Format" :error="oneErrors.format">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="one.format" class="p-select" :disabled="oneSpec.formats.length < 2" :aria-invalid="invalid" :aria-describedby="describedby">
                <option v-for="f in oneSpec.formats" :key="f" :value="f">{{ humanize(f) }}</option>
              </select>
            </template>
          </FormField>
          <FormField id="c1-gender" label="Gender" :error="oneErrors.gender">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="one.gender" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                <option v-for="g in oneGenders" :key="g" :value="g">{{ humanize(g) }}</option>
              </select>
            </template>
          </FormField>
          <FormField id="c1-age" label="Age group" :optional="one.discipline !== 'kyorugi'" :error="oneErrors.age_division_id">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="one.age_division_id" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                <option value="">{{ one.discipline === 'kyorugi' ? 'Choose…' : 'All ages' }}</option>
                <option v-for="a in config.age_divisions" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </template>
          </FormField>
          <FormField id="c1-belt" label="Belt group" optional :error="oneErrors.belt_division_id">
            <template #default="{ id, describedby, invalid }">
              <select :id="id" v-model="one.belt_division_id" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
                <option value="">All belts</option>
                <option v-for="b in config.belt_divisions" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </template>
          </FormField>
          <template v-if="one.format === 'team'">
            <FormField id="c1-min" label="Min athletes" :error="oneErrors.min_members">
              <template #default="{ id, describedby, invalid }">
                <input :id="id" v-model.number="one.min_members" type="number" min="1" max="60" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
              </template>
            </FormField>
            <FormField id="c1-max" label="Max athletes" :error="oneErrors.max_members">
              <template #default="{ id, describedby, invalid }">
                <input :id="id" v-model.number="one.max_members" type="number" min="1" max="60" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
              </template>
            </FormField>
          </template>
          <FormField id="c1-fee" label="Fee" optional hint="Empty = base fee" :error="oneErrors.fee">
            <template #default="{ id, describedby, invalid }">
              <input :id="id" v-model.number="one.fee" type="number" min="0" step="any" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
            </template>
          </FormField>
          <FormField id="c1-name" label="Name" optional hint="Empty = generated" :error="oneErrors.name">
            <template #default="{ id, describedby, invalid }">
              <input :id="id" v-model="one.name" class="p-input" maxlength="160" :aria-invalid="invalid" :aria-describedby="describedby" />
            </template>
          </FormField>
        </div>
        <BaseButton type="submit" variant="outline" size="sm" icon="plus" block :disabled="oneSaving">{{ oneSaving ? 'Adding…' : 'Add category' }}</BaseButton>
      </form>
    </div>

    <Modal :open="Boolean(editing)" title="Edit category" :subtitle="editing?.name" size="sm" @close="editing = null">
      <form id="cat-edit-form" class="space-y-4" novalidate @submit.prevent="saveEdit">
        <FormField id="ce-name" label="Name" :error="editErrors.name">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="edit.name" class="p-input" maxlength="160" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField id="ce-fee" label="Fee" optional :hint="`Empty = base fee (${fmtMoney(event.base_fee, event.currency)})`" :error="editErrors.fee">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model.number="edit.fee" type="number" min="0" step="any" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField id="ce-max" label="Max entries per team" optional hint="Empty = no limit" :error="editErrors.max_entries_per_team">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model.number="edit.max_entries_per_team" type="number" min="1" max="100" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField id="ce-notes" label="Notes for clubs" optional :error="editErrors.notes">
          <template #default="{ id, describedby, invalid }">
            <textarea :id="id" v-model="edit.notes" class="p-textarea" rows="3" maxlength="500" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
      </form>
      <template #footer>
        <BaseButton variant="outline" size="sm" @click="editing = null">Cancel</BaseButton>
        <BaseButton type="submit" form="cat-edit-form" size="sm" icon="check" :disabled="editSaving">{{ editSaving ? 'Saving…' : 'Save' }}</BaseButton>
      </template>
    </Modal>
  </div>
</template>
