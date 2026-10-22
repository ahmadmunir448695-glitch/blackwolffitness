<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '../ui/AppIcon.vue'
import { joinLink, mainNav } from '@/config/navigation.js'
import { club } from '@/config/club.js'
import { telHref } from '@/utils/format.js'
import { whatsappUrl } from '@/utils/whatsapp.js'

const chatUrl = whatsappUrl()

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const route = useRoute()
const panel = ref(null)
const servicesOpen = ref(route.path.startsWith('/services'))

function focusables() {
  return Array.from(panel.value?.querySelectorAll('a[href], button:not([disabled])') ?? [])
}

/** Keep Tab inside the menu, including the header's close button. */
function trapOrder() {
  const toggle = document.querySelector('[aria-controls="mobile-nav"]')
  return [...(toggle ? [toggle] : []), ...focusables()]
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key !== 'Tab') return
  const items = trapOrder()
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    document.documentElement.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) {
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      focusables()[0]?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
)

watch(() => route.fullPath, () => props.open && emit('close'))

onBeforeUnmount(() => {
  document.documentElement.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      id="mobile-nav"
      ref="panel"
      class="fixed inset-x-0 bottom-0 top-0 z-30 overflow-y-auto overscroll-contain bg-ink/95 pt-24 backdrop-blur-xl xl:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
    >
      <nav aria-label="Mobile" class="site-container pb-10 pt-4">
        <ul class="divide-y divide-line border-b border-line">
          <li v-for="item in mainNav" :key="item.to">
            <template v-if="item.children">
              <button
                type="button"
                class="flex w-full items-center justify-between py-4 font-display text-3xl font-bold uppercase text-bone"
                :aria-expanded="servicesOpen ? 'true' : 'false'"
                aria-controls="mobile-services"
                @click="servicesOpen = !servicesOpen"
              >
                {{ item.label }}
                <AppIcon name="chevronDown" class="h-6 w-6 transition-transform" :class="servicesOpen ? 'rotate-180' : ''" />
              </button>
              <ul v-show="servicesOpen" id="mobile-services" class="mb-4 grid gap-px bg-line sm:grid-cols-2">
                <li v-for="child in item.children" :key="child.to" class="bg-coal">
                  <RouterLink
                    :to="child.to"
                    class="block px-4 py-3 text-base font-medium"
                    :class="child.featured ? 'text-ember' : 'text-ash'"
                    exact-active-class="!text-bone bg-iron"
                  >
                    {{ child.label }}
                  </RouterLink>
                </li>
                <li class="bg-coal sm:col-span-2">
                  <RouterLink to="/services" class="flex items-center gap-2 px-4 py-3 text-base font-semibold text-bone">
                    All programs <AppIcon name="arrowRight" class="h-4 w-4" />
                  </RouterLink>
                </li>
              </ul>
            </template>
            <RouterLink
              v-else
              :to="item.to"
              class="block py-4 font-display text-3xl font-bold uppercase"
              :class="item.highlight ? 'text-ember' : 'text-bone'"
              exact-active-class="!text-ember"
            >
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>

        <div class="mt-8 grid gap-3 sm:grid-cols-2">
          <RouterLink :to="joinLink.to" class="btn-molten btn-sheen flex h-14 items-center justify-center gap-2 rounded-full font-semibold text-ink">
            {{ joinLink.label }} <AppIcon name="arrowRight" class="h-4 w-4" />
          </RouterLink>
          <a
            v-if="chatUrl"
            :href="chatUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-14 items-center justify-center gap-2 rounded-full border border-white/15 font-semibold text-bone transition-colors hover:border-ember hover:text-ember"
          >
            <AppIcon name="whatsapp" class="h-5 w-5" /> Chat on WhatsApp<span class="sr-only"> (opens WhatsApp)</span>
          </a>
        </div>
        <a
          v-if="club.contact.phone"
          :href="telHref(club.contact.phone)"
          class="mt-6 inline-flex items-center gap-2 text-ash hover:text-bone"
        >
          <AppIcon name="phone" class="h-5 w-5" /> {{ club.contact.phone }}
        </a>
        <a
          v-if="club.contact.phoneAlt"
          :href="telHref(club.contact.phoneAlt)"
          class="mt-3 flex items-center gap-2 text-ash hover:text-bone"
        >
          <AppIcon name="phone" class="h-5 w-5" /> {{ club.contact.phoneAlt }}
        </a>
      </nav>
    </div>
  </Transition>
</template>
