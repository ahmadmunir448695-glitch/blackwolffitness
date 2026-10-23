<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import BrandLogo from '../brand/BrandLogo.vue'
import AppIcon from '../ui/AppIcon.vue'
import ServicesMenu from './ServicesMenu.vue'
import MobileNav from './MobileNav.vue'
import { joinLink, mainNav } from '@/config/navigation.js'
import { whatsappUrl } from '@/utils/whatsapp.js'

const scrolled = ref(false)
const hidden = ref(false)
const progress = ref(0)
const mobileOpen = ref(false)
const menuButton = ref(null)
let lastY = 0

const chatUrl = whatsappUrl()

/** The logo already links home, so the desktop bar skips "Home" to stay uncluttered. */
const desktopNav = mainNav.filter((item) => item.to !== '/')

// Soft pill that glides behind whichever link the pointer is over.
const pill = reactive({ x: 0, w: 0, visible: false })
function movePill(event) {
  const el = event.currentTarget
  pill.x = el.offsetLeft
  pill.w = el.offsetWidth
  pill.visible = true
}
function hidePill() {
  pill.visible = false
}

// Header tucks away while scrolling down and returns on the way up;
// a thin ember bar along its bottom edge shows reading progress.
function onScroll() {
  const y = window.scrollY
  scrolled.value = y > 8
  if (!mobileOpen.value && Math.abs(y - lastY) > 6) hidden.value = y > lastY && y > 320
  lastY = y
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(1, y / max) : 0
}

function closeMobile() {
  mobileOpen.value = false
  menuButton.value?.focus()
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header
    class="sticky top-0 z-40 mb-[calc(var(--header-h)*-1)] h-[var(--header-h)] px-3 pt-3 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-5"
    :class="hidden ? '-translate-y-[120%]' : 'translate-y-0'"
    @focusin="hidden = false"
  >
    <div
      class="relative mx-auto flex h-16 max-w-[84rem] items-center justify-between gap-4 rounded-full border pl-4 pr-2 transition-[background-color,border-color,box-shadow] duration-500 sm:pl-5"
      :class="
        scrolled || mobileOpen
          ? 'border-white/10 bg-ink/90 shadow-[0_18px_50px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl'
          : 'border-white/[0.06] bg-ink/45 backdrop-blur-md'
      "
    >
      <!-- reading progress, tucked inside the bar -->
      <span
        class="pointer-events-none absolute inset-x-8 bottom-0 h-px origin-left bg-gradient-to-r from-transparent via-ember to-ember-hi"
        :style="{ transform: `scaleX(${progress})` }"
        aria-hidden="true"
      />

      <RouterLink to="/" class="shrink-0" aria-label="Black Wolf Fitness Club, home">
        <BrandLogo />
      </RouterLink>

      <nav aria-label="Main" class="hidden xl:block">
        <ul class="relative flex items-center gap-0.5" @mouseleave="hidePill">
          <span
            class="pointer-events-none absolute left-0 top-1/2 h-10 rounded-full bg-white/[0.07] ring-1 ring-white/[0.06] transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :style="{ width: `${pill.w}px`, transform: `translate(${pill.x}px, -50%)`, opacity: pill.visible ? 1 : 0 }"
            aria-hidden="true"
          />
          <li v-for="item in desktopNav" :key="item.to" class="relative" @mouseenter="movePill">
            <ServicesMenu v-if="item.children" :items="item.children" />
            <RouterLink v-else v-slot="{ isActive, href, navigate }" :to="item.to" custom>
              <a
                :href="href"
                class="relative inline-flex h-10 items-center rounded-full px-4 text-[0.92rem] font-medium tracking-[0.01em] transition-colors duration-200"
                :class="item.highlight ? 'text-ember-hi hover:text-ember-hi' : isActive ? 'text-bone' : 'text-ash hover:text-bone'"
                :aria-current="isActive ? 'page' : undefined"
                @click="navigate"
              >
                {{ item.label }}
                <span
                  class="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-ember transition-all duration-300"
                  :class="isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'"
                  aria-hidden="true"
                />
              </a>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="flex items-center gap-2">
        <a
          v-if="chatUrl"
          :href="chatUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-bone transition-colors duration-300 hover:border-ember hover:text-ember sm:inline-flex"
          aria-label="Chat on WhatsApp (opens WhatsApp)"
        >
          <AppIcon name="whatsapp" class="h-5 w-5" />
        </a>
        <RouterLink
          :to="joinLink.to"
          class="btn-molten btn-sheen group inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full pr-1.5 pl-4 text-sm font-semibold text-ink sm:pl-5"
        >
          {{ joinLink.label }}
          <span class="hidden h-8 w-8 items-center justify-center rounded-full bg-ink text-ember min-[400px]:flex">
            <AppIcon name="arrowRight" class="h-4 w-4 transition-transform duration-300 group-hover:-rotate-45" />
          </span>
        </RouterLink>
        <button
          ref="menuButton"
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-bone transition-colors hover:border-ember xl:hidden"
          :aria-expanded="mobileOpen ? 'true' : 'false'"
          aria-controls="mobile-nav"
          @click="mobileOpen = !mobileOpen"
        >
          <AppIcon :name="mobileOpen ? 'close' : 'menu'" class="h-5 w-5" />
          <span class="sr-only">{{ mobileOpen ? 'Close menu' : 'Open menu' }}</span>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <MobileNav :open="mobileOpen" @close="closeMobile" />
    </Teleport>
  </header>
</template>
