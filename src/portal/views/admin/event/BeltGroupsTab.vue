<script setup>
import { computed, reactive, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import { http } from '../../../lib/api.js'
import { applyFieldErrors, confirmDialog, toast } from '../../../lib/ui.js'

const props = defineProps({
  config: { type: Object, required: true },
  belts: { type: Array, default: () => [] },
})
const emit = defineEmits(['update'])

const base = () => `/admin/events/${props.config.event.id}/belt-divisions`

const form = reactive({ name: '', belts: [] })
const errors = reactive({ name: '', belts: '' })
const saving = ref(false)
const editing = ref(null) // belt group id, or null when adding

const kyu = computed(() => props.belts.filter((b) => /Gup/.test(b)))
const dan = computed(() => props.belts.filter((b) => !/Gup/.test(b)))

function reset() {
  editing.value = null
  Object.assign(form, { name: '', belts: [] })
  applyFieldErrors(errors, null)
}

function startEdit(group) {
  editing.value = group.id
  Object.assign(form, { name: group.name, belts: [...group.belts] })
  applyFieldErrors(errors, null)
}

function selectAll(list, on) {
  const set = new Set(form.belts)
  for (const b of list) on ? set.add(b) : set.delete(b)
  form.belts = props.belts.filter((b) => set.has(b))
}

async function submit() {
  saving.value = true
  applyFieldErrors(errors, null)
  try {
    const body = { name: form.name, belts: props.belts.filter((b) => form.belts.includes(b)) }
    emit('update', editing.value ? await http.patch(`${base()}/${editing.value}`, body) : await http.post(base(), body))
    toast.success(editing.value ? 'Belt group updated.' : `Belt group “${form.name}” added.`)
    reset()
  } catch (err) {
    applyFieldErrors(errors, err)
    toast.error(err)
  } finally {
    saving.value = false
  }
}

const busy = ref(null)
async function remove(group) {
  const cats = props.config.categories.filter((c) => c.belt_division_id === group.id).length
  const ok = await confirmDialog({
    title: `Delete ${group.name}?`,
    message: cats ? `${cats} categor${cats === 1 ? 'y uses' : 'ies use'} this belt group and will also be removed.` : '',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  busy.value = group.id
  try {
    emit('update', await http.del(`${base()}/${group.id}`))
    toast.success('Belt group deleted.')
    if (editing.value === group.id) reset()
  } catch (err) {
    toast.error(err)
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[1fr_26rem]">
    <section aria-labelledby="belts-title">
      <h2 id="belts-title" class="font-display text-xl uppercase tracking-wide text-bone">Belt groups</h2>
      <p class="mt-1 text-sm text-smoke">Optional. Split categories by grade, e.g. “Color belts” and “Black belts”.</p>
      <p v-if="!config.belt_divisions.length" class="p-card mt-4 p-6 text-sm text-smoke">No belt groups. Categories without a belt group are open to every belt.</p>
      <ul v-else class="mt-4 space-y-3">
        <li v-for="g in config.belt_divisions" :key="g.id" class="p-card p-4" :class="editing === g.id ? 'border-ember/60' : ''">
          <div class="flex items-start justify-between gap-3">
            <h3 class="font-semibold text-bone">{{ g.name }} <span class="text-sm font-normal text-smoke">· {{ g.belts.length }} belts</span></h3>
            <div class="flex shrink-0 gap-2">
              <button type="button" class="p-icon-btn" :aria-label="`Edit ${g.name}`" @click="startEdit(g)"><AppIcon name="edit" class="h-4 w-4" /></button>
              <button type="button" class="p-icon-btn is-danger" :aria-label="`Delete ${g.name}`" :disabled="busy === g.id" @click="remove(g)"><AppIcon name="trash" class="h-4 w-4" /></button>
            </div>
          </div>
          <ul class="mt-3 flex flex-wrap gap-1.5">
            <li v-for="b in g.belts" :key="b" class="p-chip">{{ b }}</li>
          </ul>
        </li>
      </ul>
    </section>

    <form class="p-card space-y-4 self-start p-5 sm:p-6" novalidate @submit.prevent="submit">
      <h2 class="font-display text-xl uppercase tracking-wide text-bone">{{ editing ? 'Edit belt group' : 'Add belt group' }}</h2>
      <FormField id="belt-name" label="Name" :error="errors.name">
        <template #default="{ id, describedby, invalid }">
          <input :id="id" v-model="form.name" class="p-input" maxlength="60" placeholder="Color belts" :aria-invalid="invalid" :aria-describedby="describedby" />
        </template>
      </FormField>
      <fieldset :aria-describedby="errors.belts ? 'belt-list-error' : undefined">
        <legend class="p-label">Belts in this group</legend>
        <div v-for="part in [{ key: 'kyu', title: 'Gup (color belts)', list: kyu }, { key: 'dan', title: 'Poom & Dan', list: dan }]" :key="part.key" class="mt-3">
          <div class="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.12em] text-smoke">
            <span>{{ part.title }}</span>
            <span class="flex gap-3 normal-case tracking-normal">
              <button type="button" class="p-link text-xs" @click="selectAll(part.list, true)">Select all</button>
              <button type="button" class="text-xs text-smoke hover:text-bone" @click="selectAll(part.list, false)">Clear</button>
            </span>
          </div>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <label v-for="b in part.list" :key="b" class="flex items-center gap-2.5 text-sm text-ash">
              <input v-model="form.belts" type="checkbox" class="p-check" :value="b" /> {{ b }}
            </label>
          </div>
        </div>
        <p v-if="errors.belts" id="belt-list-error" class="mt-2 text-sm font-medium text-danger">{{ errors.belts }}</p>
      </fieldset>
      <div class="flex gap-2">
        <BaseButton type="submit" size="sm" :icon="editing ? 'check' : 'plus'" class="flex-1" :disabled="saving">{{ saving ? 'Saving…' : editing ? 'Save belt group' : 'Add belt group' }}</BaseButton>
        <BaseButton v-if="editing" variant="outline" size="sm" @click="reset">Cancel</BaseButton>
      </div>
    </form>
  </div>
</template>
