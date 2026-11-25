<script setup>
/**
 * Championship details form, used to create a championship and to edit one.
 * `save(payload)` is called on submit; field errors from the API are shown inline.
 */
import { reactive, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { applyFieldErrors, toast } from '../../../lib/ui.js'

const props = defineProps({
  event: { type: Object, default: null },
  save: { type: Function, required: true },
  submitLabel: { type: String, default: 'Save changes' },
})

const TEXT_FIELDS = [
  'name', 'organizer', 'federation', 'summary', 'description', 'rules', 'venue_name', 'venue_address', 'city', 'country',
  'start_date', 'end_date', 'registration_opens', 'registration_deadline', 'currency', 'age_method', 'age_reference_date',
  'contact_email', 'contact_phone',
]
const NUM_FIELDS = ['base_fee', 'max_categories_per_athlete', 'weight_tolerance_kg']
const BOOL_FIELDS = ['require_photo', 'require_id_document', 'require_medical', 'allow_duplicate_entries']
const ALL = [...TEXT_FIELDS, ...NUM_FIELDS, ...BOOL_FIELDS, 'schedule']

const defaults = {
  country: 'Pakistan',
  currency: 'PKR',
  base_fee: 0,
  age_method: 'birth_year',
  weight_tolerance_kg: 0,
  require_photo: true,
  require_id_document: true,
  require_medical: false,
  allow_duplicate_entries: false,
}

const form = reactive({})
const errors = reactive(Object.fromEntries(ALL.map((k) => [k, ''])))
const saving = ref(false)

function fill(ev) {
  const src = ev || defaults
  for (const k of TEXT_FIELDS) form[k] = src[k] ?? defaults[k] ?? ''
  for (const k of NUM_FIELDS) form[k] = src[k] ?? defaults[k] ?? ''
  for (const k of BOOL_FIELDS) form[k] = Boolean(src[k] ?? defaults[k])
  form.schedule = (ev?.schedule || []).map((r) => ({ date: r.date || '', time: r.time || '', item: r.item || '' }))
}
// Refill only when a different championship is loaded, so unsaved edits survive other tabs' updates.
watch(() => props.event?.id, () => fill(props.event), { immediate: true })

function addRow() {
  const last = form.schedule[form.schedule.length - 1]
  form.schedule.push({ date: last?.date || form.start_date || '', time: '', item: '' })
}

async function submit() {
  saving.value = true
  applyFieldErrors(errors, null)
  const payload = { ...form, schedule: form.schedule.filter((r) => r.date || r.time || r.item) }
  for (const k of NUM_FIELDS) if (payload[k] === '') payload[k] = null
  try {
    await props.save(payload)
  } catch (err) {
    applyFieldErrors(errors, err)
    toast.error(err)
  } finally {
    saving.value = false
  }
}

const field = (k) => `ev-${k}`
</script>

<template>
  <form class="space-y-6" novalidate @submit.prevent="submit">
    <section class="p-card p-5 sm:p-6">
      <h2 class="font-display text-xl uppercase tracking-wide text-bone">Championship</h2>
      <div class="mt-5 grid gap-5 md:grid-cols-2">
        <FormField :id="field('name')" label="Championship name" :error="errors.name" class="md:col-span-2">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.name" class="p-input" maxlength="160" required :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('organizer')" label="Organizer" :error="errors.organizer">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.organizer" class="p-input" maxlength="160" required :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('federation')" label="Federation / sanctioning body" optional :error="errors.federation">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.federation" class="p-input" maxlength="160" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('summary')" label="Short summary" optional hint="One or two sentences shown on the championship card." :error="errors.summary" class="md:col-span-2">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.summary" class="p-input" maxlength="400" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('description')" label="Description" optional :error="errors.description" class="md:col-span-2">
          <template #default="{ id, describedby, invalid }">
            <textarea :id="id" v-model="form.description" class="p-textarea" rows="5" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('rules')" label="Rules & regulations" optional hint="Plain text. You can also upload a rules PDF in the Files tab." :error="errors.rules" class="md:col-span-2">
          <template #default="{ id, describedby, invalid }">
            <textarea :id="id" v-model="form.rules" class="p-textarea" rows="5" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
      </div>
    </section>

    <section class="p-card p-5 sm:p-6">
      <h2 class="font-display text-xl uppercase tracking-wide text-bone">Dates & venue</h2>
      <div class="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <FormField :id="field('start_date')" label="Start date" :error="errors.start_date">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.start_date" type="date" class="p-input" required :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('end_date')" label="End date" :error="errors.end_date">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.end_date" type="date" class="p-input" required :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('registration_opens')" label="Registration opens" optional :error="errors.registration_opens">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.registration_opens" type="date" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('registration_deadline')" label="Registration deadline" :error="errors.registration_deadline">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.registration_deadline" type="date" class="p-input" required :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
      </div>
      <div class="mt-5 grid gap-5 md:grid-cols-2">
        <FormField :id="field('venue_name')" label="Venue" optional :error="errors.venue_name">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.venue_name" class="p-input" maxlength="160" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('venue_address')" label="Venue address" optional :error="errors.venue_address">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.venue_address" class="p-input" maxlength="300" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('city')" label="City" optional :error="errors.city">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.city" class="p-input" maxlength="80" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('country')" label="Country" optional :error="errors.country">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.country" class="p-input" maxlength="80" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
      </div>
    </section>

    <section class="p-card p-5 sm:p-6" aria-labelledby="schedule-title">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="schedule-title" class="font-display text-xl uppercase tracking-wide text-bone">Schedule</h2>
          <p class="mt-1 text-sm text-smoke">Weigh-ins, draws, competition days. Shown on the public championship page.</p>
        </div>
        <BaseButton variant="outline" size="sm" icon="plus" @click="addRow">Add item</BaseButton>
      </div>
      <p v-if="errors.schedule" class="mt-3 text-sm font-medium text-danger" role="alert">{{ errors.schedule }}</p>
      <p v-if="!form.schedule.length" class="mt-5 text-sm text-smoke">No schedule items yet.</p>
      <ol v-else class="mt-5 space-y-3">
        <li v-for="(row, i) in form.schedule" :key="i" class="grid gap-2 border border-line p-3 sm:grid-cols-[10rem_8rem_1fr_auto] sm:items-end sm:border-0 sm:p-0">
          <div>
            <label :for="`sch-date-${i}`" class="p-label" :class="i ? 'sm:sr-only' : ''">Date</label>
            <input :id="`sch-date-${i}`" v-model="row.date" type="date" class="p-input" />
          </div>
          <div>
            <label :for="`sch-time-${i}`" class="p-label" :class="i ? 'sm:sr-only' : ''">Time</label>
            <input :id="`sch-time-${i}`" v-model="row.time" class="p-input" maxlength="40" placeholder="09:00" />
          </div>
          <div>
            <label :for="`sch-item-${i}`" class="p-label" :class="i ? 'sm:sr-only' : ''">Item</label>
            <input :id="`sch-item-${i}`" v-model="row.item" class="p-input" maxlength="200" placeholder="Weigh-in, Kyorugi cadets…" />
          </div>
          <button type="button" class="p-icon-btn is-danger h-11 w-11" :aria-label="`Remove schedule item ${i + 1}`" @click="form.schedule.splice(i, 1)">
            <AppIcon name="trash" class="h-4 w-4" />
          </button>
        </li>
      </ol>
    </section>

    <section class="p-card p-5 sm:p-6">
      <h2 class="font-display text-xl uppercase tracking-wide text-bone">Fees & rules of entry</h2>
      <div class="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <FormField :id="field('currency')" label="Currency" hint="3-letter code" :error="errors.currency">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.currency" class="p-input uppercase" maxlength="3" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('base_fee')" label="Entry fee per category" hint="Categories can override it" :error="errors.base_fee">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model.number="form.base_fee" type="number" min="0" step="any" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('max_categories_per_athlete')" label="Max categories per athlete" optional hint="Empty = no limit" :error="errors.max_categories_per_athlete">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model.number="form.max_categories_per_athlete" type="number" min="1" max="20" step="1" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('weight_tolerance_kg')" label="Weight tolerance (kg)" hint="Allowed over the limit" :error="errors.weight_tolerance_kg">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model.number="form.weight_tolerance_kg" type="number" min="0" max="5" step="0.1" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('age_method')" label="Age is counted by" :error="errors.age_method" class="sm:col-span-2">
          <template #default="{ id, describedby, invalid }">
            <select :id="id" v-model="form.age_method" class="p-select" :aria-invalid="invalid" :aria-describedby="describedby">
              <option value="birth_year">Birth year (World Taekwondo rule)</option>
              <option value="exact_date">Exact date of birth</option>
            </select>
          </template>
        </FormField>
        <FormField :id="field('age_reference_date')" label="Age reference date" optional hint="Empty = championship start date" :error="errors.age_reference_date" class="sm:col-span-2">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.age_reference_date" type="date" class="p-input" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
      </div>
      <fieldset class="mt-6">
        <legend class="p-label">Requirements</legend>
        <div class="mt-2 grid gap-3 sm:grid-cols-2">
          <label class="flex items-start gap-3 text-sm text-ash"><input v-model="form.require_photo" type="checkbox" class="p-check mt-0.5" /> Athlete photo required</label>
          <label class="flex items-start gap-3 text-sm text-ash"><input v-model="form.require_id_document" type="checkbox" class="p-check mt-0.5" /> ID / passport document required</label>
          <label class="flex items-start gap-3 text-sm text-ash"><input v-model="form.require_medical" type="checkbox" class="p-check mt-0.5" /> Medical certificate required</label>
          <label class="flex items-start gap-3 text-sm text-ash"><input v-model="form.allow_duplicate_entries" type="checkbox" class="p-check mt-0.5" /> Allow the same athlete twice in one category</label>
        </div>
      </fieldset>
    </section>

    <section class="p-card p-5 sm:p-6">
      <h2 class="font-display text-xl uppercase tracking-wide text-bone">Contact</h2>
      <div class="mt-5 grid gap-5 md:grid-cols-2">
        <FormField :id="field('contact_email')" label="Contact email" optional :error="errors.contact_email">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.contact_email" type="email" class="p-input" autocomplete="off" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
        <FormField :id="field('contact_phone')" label="Contact phone" optional :error="errors.contact_phone">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.contact_phone" type="tel" class="p-input" autocomplete="off" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </FormField>
      </div>
    </section>

    <div class="sticky bottom-0 z-10 -mx-4 flex justify-end gap-3 border-t border-line bg-ink/90 px-4 py-3 backdrop-blur sm:mx-0 sm:border sm:px-5">
      <slot name="actions" />
      <BaseButton type="submit" size="sm" icon="check" :disabled="saving">{{ saving ? 'Saving…' : submitLabel }}</BaseButton>
    </div>
  </form>
</template>
