<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import FloatingWhatsApp from '@/components/layout/FloatingWhatsApp.vue'

const route = useRoute()
// The championship portal has its own sidebar layout, without the site header and footer.
const isPortal = computed(() => Boolean(route.meta.portal))
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
    v-if="!isPortal"
    href="#main"
    class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ember focus:px-4 focus:py-3 focus:font-semibold focus:text-ink"
  >
    Skip to content
  </a>
  <SiteHeader v-if="!isPortal" />
  <main id="main" ref="main" tabindex="-1" class="outline-none">
    <RouterView v-slot="{ Component, route: viewRoute }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="viewRoute.meta.portal ? 'portal' : viewRoute.path" />
      </Transition>
    </RouterView>
  </main>
  <SiteFooter v-if="!isPortal" />
  <FloatingWhatsApp v-if="!isPortal" />
  <p class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
</template>
