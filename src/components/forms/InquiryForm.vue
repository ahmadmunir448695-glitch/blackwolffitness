<script setup>
import { computed, nextTick, reactive, ref, useId, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import FormField from './FormField.vue'
import AppIcon from '../ui/AppIcon.vue'
import BaseButton from '../ui/BaseButton.vue'
import { api, isLive } from '@/services/api'
import { programLinks } from '@/config/navigation.js'
import { club } from '@/config/club.js'
import { rules, validate, validateField } from '@/utils/validation.js'
import { messageFromForm, whatsappUrl } from '@/utils/whatsapp.js'
import { telHref } from '@/utils/format.js'

/**
 * Contact, trial-session and parent-consultation form.
 *
 * Honest by design: a success message appears ONLY after the API confirms
 * the submission. While no API is connected but the club has a WhatsApp
 * number, the form sends through WhatsApp: submitting opens a chat with the
 * visitor's details already typed, and they press send there. With neither,
 * the visitor is told the message was not sent and offered a phone call.
 */
const props = defineProps({
  variant: { type: String, default: 'contact' }, // contact | trial | parent
  initialProgram: { type: String, default: '' },
  heading: { type: String, default: '' },
})

const route = useRoute()
const uid = useId()
const fid = (name) => `${uid}-${name}`

const programOptions = [
  ...programLinks.map((link) => ({ value: link.to.split('/').pop(), label: link.label })),
  { value: 'not-sure', label: 'Not sure yet, please advise' },
]

const form = reactive({
  name: '',
  phone: '',
  email: '',
  program: props.variant === 'parent' ? 'special-kids-training' : props.initialProgram,
  message: '',
  preferredTime: '',
  childName: '',
  childAge: '',
  website: '', // honeypot
})

watch(
  () => props.initialProgram,
  (value) => {
    if (value && props.variant !== 'parent') form.program = value
  },
)

const schema = computed(() => {
  const base = {
    name: [rules.required('your name'), rules.minLength(2, 'name'), rules.maxLength(80, 'name')],
    phone: [rules.required('a phone number we can reach you on'), rules.phone],
    email: [rules.email, rules.maxLength(120, 'email')],
  }
  if (props.variant === 'contact') {
    return {
      ...base,
      program: [rules.requiredChoice('a program, or “Not sure yet”')],
      message: [rules.required('a message'), rules.minLength(10, 'your message'), rules.maxLength(2000, 'your message')],
    }
  }
  if (props.variant === 'trial') {
    return {
      ...base,
      program: [rules.requiredChoice('the program you want to try')],
      preferredTime: [rules.maxLength(120, 'preferred time')],
      message: [rules.maxLength(2000, 'your message')],
    }
  }
  return {
    ...base,
    childName: [rules.maxLength(60, 'child’s name')],
    childAge: [rules.required('your child’s age'), rules.ageRange(2, 18)],
    message: [rules.maxLength(2000, 'your message')],
  }
})

const errors = reactive({})
const touched = reactive({})
const status = ref('idle') // idle | submitting | success | unavailable | error
const serverError = ref('')
const summary = ref(null)
const resultPanel = ref(null)

const fieldLabels = {
  name: props.variant === 'parent' ? 'Your name' : 'Name',
  phone: 'Phone',
  email: 'Email',
  program: 'Program',
  message: 'Message',
  preferredTime: 'Preferred days or times',
  childName: 'Child’s first name',
  childAge: 'Child’s age',
}

const errorList = computed(() => Object.entries(errors).filter(([, msg]) => msg))
const showSummary = ref(false)

function onBlur(field) {
  touched[field] = true
  errors[field] = validateField(form, schema.value, field)
}

function onInput(field) {
  if (touched[field] || errors[field]) errors[field] = validateField(form, schema.value, field)
}

const programName = computed(() => programOptions.find((o) => o.value === form.program)?.label ?? '')
const fallbackWhatsApp = computed(() =>
  whatsappUrl(
    messageFromForm(form, {
      programName: programName.value,
      heading: props.variant === 'parent' ? 'Parent inquiry: Special Kids Training' : props.variant === 'trial' ? 'Trial session request' : 'Message from the website',
    }),
  ),
)

const topic = computed(() => (props.variant === 'contact' ? route.query.topic || 'general' : props.variant))

/** No API yet, but WhatsApp is set: the form hands the message to WhatsApp. */
const viaWhatsApp = computed(() => !isLive('contact') && !!whatsappUrl('x'))

async function submit() {
  Object.keys(schema.value).forEach((field) => (touched[field] = true))
  const result = validate(form, schema.value)
  Object.keys(errors).forEach((key) => delete errors[key])
  Object.assign(errors, result.errors)

  if (!result.valid) {
    showSummary.value = true
    await nextTick()
    summary.value?.focus()
    return
  }
  showSummary.value = false
  if (form.website) return // bot filled the honeypot

  if (viaWhatsApp.value) {
    // Opened straight from the click so browsers don't block the new tab.
    window.open(fallbackWhatsApp.value, '_blank', 'noopener')
    status.value = 'whatsapp'
    await nextTick()
    resultPanel.value?.focus()
    return
  }

  status.value = 'submitting'
  serverError.value = ''
  const meta = { topic: topic.value, sourcePage: route.fullPath }
  try {
    if (props.variant === 'contact') await api.contact.send(form, meta)
    else await api.contact.requestTrial(form, meta)
    status.value = 'success'
  } catch (err) {
    if (err?.code === 'not_configured') {
      status.value = 'unavailable'
    } else {
      status.value = 'error'
      serverError.value =
        err?.code === 'network'
          ? 'Your message was not sent because the connection failed. Check your internet connection and try again.'
          : err?.code === 'timeout'
            ? 'Your message was not sent because the server took too long to respond. Try again in a moment.'
            : `Your message was not sent. ${err?.message ?? ''}`.trim()
      Object.entries(err?.fieldErrors ?? {}).forEach(([key, msg]) => {
        const field = { child_name: 'childName', child_age: 'childAge', preferred_time: 'preferredTime' }[key] ?? key
        if (field in form) errors[field] = msg
      })
    }
  }
  await nextTick()
  resultPanel.value?.focus()
}

function reset() {
  Object.assign(form, {
    name: '', phone: '', email: '', message: '', preferredTime: '', childName: '', childAge: '', website: '',
    program: props.variant === 'parent' ? 'special-kids-training' : props.initialProgram,
  })
  Object.keys(errors).forEach((key) => delete errors[key])
  Object.keys(touched).forEach((key) => delete touched[key])
  status.value = 'idle'
}

const inputClass = (field) => [
  'block w-full border bg-ink px-4 py-3 text-bone placeholder:text-smoke transition-colors',
  'focus:border-ember focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ember',
  errors[field] ? 'border-danger' : 'border-line hover:border-smoke',
]

const submitLabel = computed(() =>
  viaWhatsApp.value
    ? 'Send on WhatsApp'
    : { contact: 'Send message', trial: 'Request trial session', parent: 'Request consultation' }[props.variant],
)
</script>

<template>
  <div>
    <!-- Success: only after the API confirmed the submission -->
    <div v-if="status === 'success'" ref="resultPanel" tabindex="-1" role="status" class="border border-success/50 bg-coal p-7 outline-none">
      <AppIcon name="check" class="h-8 w-8 text-success" />
      <h3 class="mt-4 font-display text-3xl font-black uppercase">
        {{ variant === 'contact' ? 'Message sent' : 'Request sent' }}
      </h3>
      <p class="mt-3 text-ash">
        Thanks, {{ form.name.split(' ')[0] }}. The club will get back to you on {{ form.phone }}{{ form.email ? ` or ${form.email}` : '' }}.
      </p>
      <BaseButton class="mt-6" variant="outline" @click="reset">Send another message</BaseButton>
    </div>

    <form v-else novalidate :aria-label="heading || undefined" @submit.prevent="submit">
      <div
        v-if="showSummary && errorList.length"
        ref="summary"
        tabindex="-1"
        role="alert"
        class="mb-6 border border-danger/60 bg-danger/10 p-5 outline-none"
      >
        <p class="font-semibold text-bone">Check {{ errorList.length === 1 ? 'this field' : `these ${errorList.length} fields` }} before sending:</p>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li v-for="[field, msg] in errorList" :key="field">
            <a :href="`#${fid(field)}`" class="text-bone underline underline-offset-2 hover:text-ember">{{ fieldLabels[field] }}: {{ msg }}</a>
          </li>
        </ul>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <FormField :id="fid('name')" :label="fieldLabels.name" :error="errors.name" :class="variant === 'parent' ? '' : 'sm:col-span-2'">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.name" type="text" name="name" autocomplete="name" :class="inputClass('name')" :aria-describedby="describedby" :aria-invalid="invalid" @blur="onBlur('name')" @input="onInput('name')" />
          </template>
        </FormField>

        <template v-if="variant === 'parent'">
          <FormField :id="fid('childName')" :label="fieldLabels.childName" :error="errors.childName" optional>
            <template #default="{ id, describedby, invalid }">
              <input :id="id" v-model="form.childName" type="text" name="child_name" autocomplete="off" :class="inputClass('childName')" :aria-describedby="describedby" :aria-invalid="invalid" @blur="onBlur('childName')" @input="onInput('childName')" />
            </template>
          </FormField>
        </template>

        <FormField :id="fid('phone')" :label="fieldLabels.phone" :error="errors.phone" hint="WhatsApp number preferred">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.phone" type="tel" name="phone" inputmode="tel" autocomplete="tel" placeholder="+92 300 1234567" :class="inputClass('phone')" :aria-describedby="describedby" :aria-invalid="invalid" @blur="onBlur('phone')" @input="onInput('phone')" />
          </template>
        </FormField>

        <FormField :id="fid('email')" :label="fieldLabels.email" :error="errors.email" optional hint="For written details or a reply by email">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.email" type="email" name="email" autocomplete="email" placeholder="name@example.com" :class="inputClass('email')" :aria-describedby="describedby" :aria-invalid="invalid" @blur="onBlur('email')" @input="onInput('email')" />
          </template>
        </FormField>

        <FormField v-if="variant === 'parent'" :id="fid('childAge')" :label="fieldLabels.childAge" :error="errors.childAge">
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.childAge" type="number" name="child_age" inputmode="numeric" min="2" max="18" :class="inputClass('childAge')" :aria-describedby="describedby" :aria-invalid="invalid" @blur="onBlur('childAge')" @input="onInput('childAge')" />
          </template>
        </FormField>

        <FormField v-if="variant !== 'parent'" :id="fid('program')" :label="fieldLabels.program" :error="errors.program" :class="variant === 'trial' ? '' : 'sm:col-span-2'">
          <template #default="{ id, describedby, invalid }">
            <div class="relative">
              <select :id="id" v-model="form.program" name="program" :class="[inputClass('program'), 'appearance-none pr-10']" :aria-describedby="describedby" :aria-invalid="invalid" @blur="onBlur('program')" @change="onInput('program')">
                <option value="" disabled>Choose a program</option>
                <option v-for="opt in programOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <AppIcon name="chevronDown" class="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ash" />
            </div>
          </template>
        </FormField>

        <FormField v-if="variant === 'trial'" :id="fid('preferredTime')" :label="fieldLabels.preferredTime" :error="errors.preferredTime" optional>
          <template #default="{ id, describedby, invalid }">
            <input :id="id" v-model="form.preferredTime" type="text" name="preferred_time" placeholder="e.g. weekday evenings" :class="inputClass('preferredTime')" :aria-describedby="describedby" :aria-invalid="invalid" @blur="onBlur('preferredTime')" @input="onInput('preferredTime')" />
          </template>
        </FormField>

        <FormField
          :id="fid('message')"
          :label="variant === 'parent' ? 'Anything you would like the coach to know' : variant === 'trial' ? 'Goals or experience' : fieldLabels.message"
          :error="errors.message"
          :optional="variant !== 'contact'"
          :hint="variant === 'parent' ? 'For example what your child enjoys, what helps them feel comfortable, or any support needs. Share only what you are comfortable with.' : ''"
          class="sm:col-span-2"
        >
          <template #default="{ id, describedby, invalid }">
            <textarea :id="id" v-model="form.message" name="message" rows="5" :class="[inputClass('message'), 'resize-y']" :aria-describedby="describedby" :aria-invalid="invalid" @blur="onBlur('message')" @input="onInput('message')" />
          </template>
        </FormField>

        <!-- Honeypot: hidden from people and assistive tech -->
        <div class="hidden" aria-hidden="true">
          <label :for="fid('website')">Leave this field empty</label>
          <input :id="fid('website')" v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" />
        </div>
      </div>

      <!-- Handed to WhatsApp: the visitor finishes by pressing send there -->
      <div v-if="status === 'whatsapp'" ref="resultPanel" tabindex="-1" role="status" class="mt-6 border border-success/50 bg-success/10 p-5 outline-none">
        <p class="flex items-start gap-2.5 font-semibold text-bone">
          <AppIcon name="whatsapp" class="mt-0.5 h-5 w-5 shrink-0 text-success" />
          WhatsApp is opening with your message. Press send in WhatsApp to reach the club.
        </p>
        <p class="mt-2 text-sm text-ash">If WhatsApp did not open, use the button below, or call us.</p>
        <div class="mt-4 flex flex-wrap gap-3">
          <a :href="fallbackWhatsApp" target="_blank" rel="noopener noreferrer" class="inline-flex h-11 items-center gap-2 bg-ember px-4 text-sm font-semibold text-ink hover:bg-ember-hi">
            <AppIcon name="whatsapp" class="h-5 w-5" /> Open WhatsApp
          </a>
          <a v-if="club.contact.phone" :href="telHref(club.contact.phone)" class="inline-flex h-11 items-center gap-2 border border-bone/35 px-4 text-sm font-semibold hover:border-ember hover:text-ember">
            <AppIcon name="phone" class="h-5 w-5" /> Call {{ club.contact.phone }}
          </a>
        </div>
      </div>

      <!-- Not sent: API not connected yet -->
      <div v-if="status === 'unavailable'" ref="resultPanel" tabindex="-1" role="alert" class="mt-6 border border-ember/60 bg-ember/10 p-5 outline-none">
        <p class="flex items-start gap-2.5 font-semibold text-bone">
          <AppIcon name="info" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
          Your message has not been sent. Online messages are not connected yet.
        </p>
        <p class="mt-2 text-sm text-ash">Your details are still in the form. Send them on WhatsApp instead, or call the club.</p>
        <div class="mt-4 flex flex-wrap gap-3">
          <a v-if="fallbackWhatsApp" :href="fallbackWhatsApp" target="_blank" rel="noopener noreferrer" class="inline-flex h-11 items-center gap-2 bg-ember px-4 text-sm font-semibold text-ink hover:bg-ember-hi">
            <AppIcon name="whatsapp" class="h-5 w-5" /> Send on WhatsApp instead
          </a>
          <a v-if="club.contact.phone" :href="telHref(club.contact.phone)" class="inline-flex h-11 items-center gap-2 border border-bone/35 px-4 text-sm font-semibold hover:border-ember hover:text-ember">
            <AppIcon name="phone" class="h-5 w-5" /> Call {{ club.contact.phone }}
          </a>
          <RouterLink v-if="!fallbackWhatsApp && !club.contact.phone" to="/contact" class="text-sm text-ash underline underline-offset-4">
            Contact details will appear here once they are added.
          </RouterLink>
        </div>
      </div>

      <!-- Not sent: request failed -->
      <div v-if="status === 'error'" ref="resultPanel" tabindex="-1" role="alert" class="mt-6 flex items-start gap-2.5 border border-danger/60 bg-danger/10 p-5 outline-none">
        <AppIcon name="alert" class="mt-0.5 h-5 w-5 shrink-0 text-danger" />
        <p class="text-bone">{{ serverError }}</p>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-4">
        <BaseButton
          type="submit"
          size="lg"
          :disabled="status === 'submitting'"
          :icon="viaWhatsApp && status !== 'submitting' ? 'whatsapp' : ''"
          :icon-right="status === 'submitting' || viaWhatsApp ? '' : 'arrowRight'"
        >
          <span v-if="status === 'submitting'" class="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" aria-hidden="true" />
          {{ status === 'submitting' ? 'Sending…' : status === 'error' ? 'Try again' : submitLabel }}
        </BaseButton>
        <p class="text-sm text-smoke">
          {{ viaWhatsApp ? `Opens WhatsApp to ${club.contact.phone || 'the club'} with your details filled in.` : 'We only use your details to reply to you.' }}
        </p>
      </div>
    </form>
  </div>
</template>
