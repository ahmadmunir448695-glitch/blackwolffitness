<script setup>
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FileDrop from '../../../components/FileDrop.vue'
import { fileUrl, http } from '../../../lib/api.js'
import { confirmDialog, toast } from '../../../lib/ui.js'

const props = defineProps({ config: { type: Object, required: true } })
const emit = defineEmits(['update'])

const event = computed(() => props.config.event)
const busy = ref('')

const kinds = [
  { key: 'poster', label: 'Poster image', urlKey: 'poster_url', accept: 'image/jpeg,image/png,image/webp', hint: 'JPG, PNG or WEBP up to 5 MB. Shown on the championship card and page.' },
  { key: 'invitation', label: 'Invitation letter (PDF)', urlKey: 'invitation_pdf_url', accept: 'application/pdf', hint: 'PDF up to 5 MB. Clubs can download it from the championship page.' },
  { key: 'rules', label: 'Rules (PDF)', urlKey: 'rules_pdf_url', accept: 'application/pdf', hint: 'PDF up to 5 MB.' },
]

async function upload(kind, file) {
  busy.value = kind.key
  try {
    emit('update', await http.upload(`/admin/events/${event.value.id}/files/${kind.key}`, file))
    toast.success(`${kind.label} uploaded.`)
  } catch (err) {
    toast.error(err)
  } finally {
    busy.value = ''
  }
}

async function remove(kind) {
  if (!(await confirmDialog({ title: `Remove ${kind.label.toLowerCase()}?`, message: 'The file will be deleted from the championship.', confirmLabel: 'Remove', danger: true }))) return
  busy.value = kind.key
  try {
    emit('update', await http.del(`/admin/events/${event.value.id}/files/${kind.key}`))
    toast.success(`${kind.label} removed.`)
  } catch (err) {
    toast.error(err)
  } finally {
    busy.value = ''
  }
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-3">
    <section v-for="kind in kinds" :key="kind.key" class="p-card flex flex-col p-5 sm:p-6" :aria-labelledby="`file-${kind.key}`">
      <h2 :id="`file-${kind.key}`" class="font-display text-xl uppercase tracking-wide text-bone">{{ kind.label }}</h2>
      <div class="mt-4 flex-1">
        <template v-if="event[kind.urlKey]">
          <a v-if="kind.key === 'poster'" :href="fileUrl(event[kind.urlKey])" target="_blank" rel="noopener" class="block border border-line bg-iron">
            <img :src="fileUrl(event[kind.urlKey])" :alt="`Poster of ${event.name}`" class="mx-auto max-h-72 w-auto object-contain" />
            <span class="sr-only">(opens in a new tab)</span>
          </a>
          <a v-else :href="fileUrl(event[kind.urlKey])" target="_blank" rel="noopener" class="flex items-center gap-3 border border-line bg-iron px-4 py-3 text-sm text-bone hover:border-ember">
            <AppIcon name="file" class="h-5 w-5 text-ember" />
            <span class="flex-1">View current PDF</span>
            <AppIcon name="external" class="h-4 w-4 text-smoke" />
            <span class="sr-only">(opens in a new tab)</span>
          </a>
          <button type="button" class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-danger hover:underline disabled:opacity-50" :disabled="busy === kind.key" @click="remove(kind)">
            <AppIcon name="trash" class="h-4 w-4" /> Remove
          </button>
        </template>
        <p v-else class="text-sm text-smoke">No file uploaded yet.</p>
      </div>
      <div class="mt-5">
        <FileDrop :accept="kind.accept" :hint="kind.hint" :busy="busy === kind.key" :label="event[kind.urlKey] ? 'Replace file' : 'Upload file'" compact @select="(f) => upload(kind, f)" />
      </div>
    </section>
  </div>
</template>
