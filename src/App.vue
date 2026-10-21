<script setup>
import { nextTick, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import FloatingWhatsApp from '@/components/layout/FloatingWhatsApp.vue'

const route = useRoute()
const main = ref(null)
const announcement = ref('')
let firstLoad = true

// After client-side navigation, move focus to the page and announce it,
// so keyboard and screen-reader users land at the start of the new page.
watch(
  () => route.path,
  async () => {
    if (firstLoad) {
      firstLoad = false
      return
    }
    await nextTick()
    setTimeout(() => {
      announcement.value = document.title
      if (!route.hash) main.value?.focus({ preventScroll: true })
    }, 60)
  },
)
</script>

<template>
  <a
    href="#main"
    class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ember focus:px-4 focus:py-3 focus:font-semibold focus:text-ink"
  >
    Skip to content
  </a>
  <SiteHeader />
  <main id="main" ref="main" tabindex="-1" class="outline-none">
    <RouterView v-slot="{ Component, route: viewRoute }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="viewRoute.path" />
      </Transition>
    </RouterView>
  </main>
  <SiteFooter />
  <FloatingWhatsApp />
  <p class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
</template>
