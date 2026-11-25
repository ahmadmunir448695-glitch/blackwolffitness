<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import { signup } from '../lib/session.js'
import { applyFieldErrors, toast } from '../lib/ui.js'

const router = useRouter()
const form = reactive({ name: '', email: '', phone: '', password: '', club_name: '', country: 'Pakistan', city: '' })
const errors = reactive({ name: '', email: '', phone: '', password: '', club_name: '', country: '', city: '' })
const error = ref('')
const busy = ref(false)

const fields = [
  { key: 'club_name', label: 'Club / academy name', autocomplete: 'organization' },
  { key: 'country', label: 'Country', autocomplete: 'country-name' },
  { key: 'city', label: 'City', autocomplete: 'address-level2' },
  { key: 'name', label: 'Your full name', autocomplete: 'name' },
  { key: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
  { key: 'phone', label: 'Phone / WhatsApp', type: 'tel', autocomplete: 'tel', optional: true },
  { key: 'password', label: 'Password', type: 'password', autocomplete: 'new-password', hint: 'At least 8 characters, with letters and a number.' },
]

function validateLocal() {
  let ok = true
  for (const f of fields) {
    errors[f.key] = !f.optional && !String(form[f.key]).trim() ? 'This field is required.' : ''
    if (errors[f.key]) ok = false
  }
  if (form.password && (form.password.length < 8 || !/\d/.test(form.password) || !/[a-z]/i.test(form.password))) {
    errors.password = 'Use at least 8 characters with letters and a number.'
    ok = false
  }
  return ok
}

async function submit() {
  error.value = ''
  if (!validateLocal()) return
  busy.value = true
  try {
    await signup({ ...form })
    toast.success('Your club account is ready. Create your first team to get started.')
    router.replace('/portal/team')
  } catch (err) {
    if (!applyFieldErrors(errors, err)) error.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <section class="p-card cut-corner-lg p-6 sm:p-8">
      <p class="eyebrow mb-3">Club registration</p>
      <h1 class="font-display text-[2.2rem] uppercase leading-none tracking-wide text-bone">Create a club account</h1>
      <p class="mt-2 text-sm text-ash">One account per club or academy. The person who signs up becomes the club manager and can add coach logins later.</p>

      <form class="mt-7 grid gap-5 sm:grid-cols-2" novalidate @submit.prevent="submit">
        <FormField
          v-for="f in fields"
          :id="`signup-${f.key}`"
          :key="f.key"
          :label="f.label"
          :error="errors[f.key]"
          :hint="f.hint || ''"
          :optional="Boolean(f.optional)"
          :class="['club_name', 'password'].includes(f.key) ? 'sm:col-span-2' : ''"
        >
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form[f.key]" :type="f.type || 'text'" :autocomplete="f.autocomplete" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" />
          </template>
        </FormField>
        <p v-if="error" role="alert" class="border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger sm:col-span-2">{{ error }}</p>
        <div class="flex flex-col-reverse items-start gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-ash">Already registered? <RouterLink to="/portal/login" class="p-link">Sign in</RouterLink></p>
          <BaseButton type="submit" :disabled="busy" icon-right="arrowRight">{{ busy ? 'Creating account…' : 'Create account' }}</BaseButton>
        </div>
      </form>
    </section>
  </div>
</template>
