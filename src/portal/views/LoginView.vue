<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/forms/FormField.vue'
import { homeFor, login } from '../lib/session.js'
import { applyFieldErrors } from '../lib/ui.js'

const route = useRoute()
const router = useRouter()
const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  errors.email = form.email ? '' : 'Enter your email.'
  errors.password = form.password ? '' : 'Enter your password.'
  if (errors.email || errors.password) return
  busy.value = true
  try {
    const user = await login(form.email.trim(), form.password)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/portal') ? route.query.redirect : homeFor(user)
    router.replace(redirect)
  } catch (err) {
    if (!applyFieldErrors(errors, err)) error.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
    <section class="hidden lg:block">
      <p class="eyebrow mb-4">Championship Portal</p>
      <h1 class="font-display text-display uppercase text-bone">Register.<br /><span class="text-ember">Compete.</span><br />Win.</h1>
      <p class="mt-5 max-w-md text-ash">Clubs and academies manage their teams, enter athletes in kyorugi, poomsae, breaking and demonstration, and follow every entry from submission to approval.</p>
    </section>

    <section class="p-card cut-corner-lg p-6 sm:p-8">
      <h2 class="font-display text-3xl uppercase tracking-wide text-bone">Sign in</h2>
      <p class="mt-1 text-sm text-ash">Use the account of your club, coach or organizer.</p>

      <form class="mt-6 space-y-5" novalidate @submit.prevent="submit">
        <FormField id="login-email" label="Email" :error="errors.email">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.email" type="email" autocomplete="username" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" autofocus />
          </template>
        </FormField>
        <FormField id="login-password" label="Password" :error="errors.password">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.password" type="password" autocomplete="current-password" class="p-input" :aria-describedby="describedby" :aria-invalid="invalid" />
          </template>
        </FormField>
        <p v-if="error" role="alert" class="border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">{{ error }}</p>
        <BaseButton type="submit" block :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</BaseButton>
      </form>

      <p class="mt-6 text-sm text-ash">
        New club or academy?
        <RouterLink to="/portal/signup" class="p-link">Create a club account</RouterLink>
      </p>
      <p class="mt-2 text-sm text-ash">
        Just looking? <RouterLink to="/portal/events" class="p-link">Browse championships</RouterLink>
      </p>
    </section>
  </div>
</template>
