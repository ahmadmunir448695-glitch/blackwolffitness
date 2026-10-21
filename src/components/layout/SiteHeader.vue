<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import BrandLogo from '../brand/BrandLogo.vue'
import BaseButton from '../ui/BaseButton.vue'
import AppIcon from '../ui/AppIcon.vue'
import ServicesMenu from './ServicesMenu.vue'
import MobileNav from './MobileNav.vue'
import WhatsAppLink from './WhatsAppLink.vue'
import { joinLink, mainNav } from '@/config/navigation.js'

const scrolled = ref(false)
const hidden = ref(false)
const progress = ref(0)
const mobileOpen = ref(false)
const menuButton = ref(null)
let lastY = 0

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
    class="sticky top-0 z-40 border-b bg-ink/95 backdrop-blur-md transition-[transform,border-color,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] supports-[backdrop-filter]:bg-ink/75"
    :class="[scrolled ? 'border-line' : 'border-transparent', hidden ? '-translate-y-full' : 'translate-y-0']"
    @focusin="hidden = false"
  >
    <span
      class="pointer-events-none absolute -bottom-px left-0 h-[2px] w-full origin-left bg-gradient-to-r from-ember-lo via-ember to-ember-hi"
      :style="{ transform: `scaleX(${progress})` }"
      aria-hidden="true"
    />
    <div class="site-container flex h-[4.5rem] items-center justify-between gap-6">
      <RouterLink to="/" class="shrink-0" aria-label="Black Wolf Fitness Club, home">
        <BrandLogo />
      </RouterLink>

      <nav aria-label="Main" class="hidden xl:block">
        <ul class="flex items-center">
          <li v-for="item in mainNav" :key="item.to">
            <ServicesMenu v-if="item.children" :items="item.children" />
            <RouterLink v-else v-slot="{ isExactActive, href, navigate }" :to="item.to" custom>
              <a
                :href="href"
                class="group relative inline-flex h-[4.5rem] items-center px-3 text-[0.94rem] font-medium transition-colors"
                :class="[
                  item.highlight ? 'text-ember hover:text-ember-hi' : isExactActive ? 'text-bone' : 'text-ash hover:text-bone',
                ]"
                :aria-current="isExactActive ? 'page' : undefined"
                @click="navigate"
              >
                {{ item.label }}
                <span v-if="isExactActive" class="absolute inset-x-3 bottom-0 h-0.5 bg-ember" aria-hidden="true" />
              </a>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="flex items-center gap-2.5">
        <span class="hidden sm:contents"><WhatsAppLink variant="icon" /></span>
        <BaseButton :to="joinLink.to" size="sm">{{ joinLink.label }}</BaseButton>
        <button
          ref="menuButton"
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center border border-bone/25 text-bone xl:hidden"
          :aria-expanded="mobileOpen ? 'true' : 'false'"
          aria-controls="mobile-nav"
          @click="mobileOpen = !mobileOpen"
        >
          <AppIcon :name="mobileOpen ? 'close' : 'menu'" class="h-6 w-6" />
          <span class="sr-only">{{ mobileOpen ? 'Close menu' : 'Open menu' }}</span>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <MobileNav :open="mobileOpen" @close="closeMobile" />
    </Teleport>
  </header>
</template>
