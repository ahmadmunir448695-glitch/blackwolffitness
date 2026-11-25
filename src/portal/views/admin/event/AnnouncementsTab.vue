<script setup>
import { reactive, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import { http } from '../../../lib/api.js'
import { fmtDateTime } from '../../../lib/format.js'
import { applyFieldErrors, confirmDialog, toast } from '../../../lib/ui.js'

const props = defineProps({ config: { type: Object, required: true } })
const emit = defineEmits(['update'])

const base = () => `/admin/events/${props.config.event.id}/announcements`
const form = reactive({ title: '', body: '', pinned: false, notify: true })
const errors = reactive({ title: '', body: '' })
const saving = ref(false)

async function post() {
  saving.value = true
  applyFieldErrors(errors, null)
  try {
    emit('update', await http.post(base(), { ...form }))
    toast.success(form.notify ? 'Announcement posted and clubs notified.' : 'Announcement posted.')
    Object.assign(form, { title: '', body: '', pinned: false, notify: true })
  } catch (err) {
    applyFieldErrors(errors, err)
    toast.error(err)
  } finally {
    saving.value = false
  }
}

const busy = ref(null)
async function remove(a) {
  if (!(await confirmDialog({ title: 'Delete announcement?', message: a.title, confirmLabel: 'Delete', danger: true }))) return
  busy.value = a.id
  try {
    emit('update', await http.del(`${base()}/${a.id}`))
    toast.success('Announcement deleted.')
  } catch (err) {
    toast.error(err)
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[1fr_26rem]">
    <section aria-labelledby="ann-title">
      <h2 id="ann-title" class="font-display text-xl uppercase tracking-wide text-bone">Announcements</h2>
      <p class="mt-1 text-sm text-smoke">Shown on the public championship page. Pinned ones appear first.</p>
      <p v-if="!config.announcements.length" class="p-card mt-4 p-6 text-sm text-smoke">No announcements yet.</p>
      <ul v-else class="mt-4 space-y-3">
        <li v-for="a in config.announcements" :key="a.id" class="p-card p-4 sm:p-5" :class="a.pinned ? 'border-ember/50' : ''">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="flex flex-wrap items-center gap-2">
                <span v-if="a.pinned" class="p-badge tone-ember">Pinned</span>
                <span class="text-xs text-smoke">{{ fmtDateTime(a.created_at) }}</span>
              </p>
              <h3 class="mt-1.5 font-semibold text-bone">{{ a.title }}</h3>
            </div>
            <button type="button" class="p-icon-btn is-danger shrink-0" :aria-label="`Delete announcement ${a.title}`" :disabled="busy === a.id" @click="remove(a)"><AppIcon name="trash" class="h-4 w-4" /></button>
          </div>
          <p class="mt-2 whitespace-pre-line text-sm text-ash">{{ a.body }}</p>
        </li>
      </ul>
    </section>

    <form class="p-card space-y-4 self-start p-5 sm:p-6" novalidate @submit.prevent="post">
      <h2 class="font-display text-xl uppercase tracking-wide text-bone">New announcement</h2>
      <FormField id="ann-title-in" label="Title" :error="errors.title">
        <template #default="{ id, describedby, invalid }">
          <input :id="id" v-model="form.title" class="p-input" maxlength="160" :aria-invalid="invalid" :aria-describedby="describedby" />
        </template>
      </FormField>
      <FormField id="ann-body" label="Message" :error="errors.body">
        <template #default="{ id, describedby, invalid }">
          <textarea :id="id" v-model="form.body" class="p-textarea" rows="6" maxlength="5000" :aria-invalid="invalid" :aria-describedby="describedby" />
        </template>
      </FormField>
      <label class="flex items-start gap-3 text-sm text-ash"><input v-model="form.pinned" type="checkbox" class="p-check mt-0.5" /> Pin to the top</label>
      <label class="flex items-start gap-3 text-sm text-ash"><input v-model="form.notify" type="checkbox" class="p-check mt-0.5" /> Notify clubs with entries in this championship</label>
      <BaseButton type="submit" size="sm" icon="bell" block :disabled="saving">{{ saving ? 'Posting…' : 'Post announcement' }}</BaseButton>
    </form>
  </div>
</template>
