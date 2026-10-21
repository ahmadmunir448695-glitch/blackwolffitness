<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '../ui/AppIcon.vue'

/**
 * Desktop Services dropdown (disclosure pattern).
 * Click or hover to open · ↓/↑ to move between links · Esc to close.
 */
const props = defineProps({
  items: { type: Array, required: true },
})

const route = useRoute()
const open = ref(false)
const root = ref(null)
const button = ref(null)
const panelId = `services-menu-${useId()}`
let hoverTimer = null

// Special Kids Training has its own top-level nav entry, so it does not light up Services.
const isActive = computed(() => route.path.startsWith('/services') && route.path !== '/services/special-kids-training')
const regular = computed(() => props.items.filter((item) => !item.featured))
const featured = computed(() => props.items.find((item) => item.featured))

function links() {
  return Array.from(root.value?.querySelectorAll('[data-menu-link]') ?? [])
}

async function openMenu(focusFirst = false) {
  open.value = true
  if (focusFirst) {
    await nextTick()
    links()[0]?.focus()
  }
}

function closeMenu(returnFocus = false) {
  open.value = false
  if (returnFocus) button.value?.focus()
}

let openedByHover = false

function toggle() {
  // A mouse user's click right after hover-opening should not close the menu.
  if (openedByHover) {
    openedByHover = false
    return
  }
  open.value ? closeMenu() : openMenu()
}

function onButtonKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    openMenu(true)
  }
}

function onPanelKeydown(event) {
  const items = links()
  const index = items.indexOf(document.activeElement)
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    items[(index + 1) % items.length]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    items[(index - 1 + items.length) % items.length]?.focus()
  } else if (event.key === 'Home') {
    event.preventDefault()
    items[0]?.focus()
  } else if (event.key === 'End') {
    event.preventDefault()
    items[items.length - 1]?.focus()
  }
}

function onKeydown(event) {
  if (event.key === 'Escape' && open.value) closeMenu(true)
}

function onFocusOut(event) {
  if (open.value && !root.value?.contains(event.relatedTarget)) closeMenu()
}

function onDocumentPointer(event) {
  if (open.value && !root.value?.contains(event.target)) closeMenu()
}

function onPointerEnter(event) {
  if (event.pointerType !== 'mouse') return
  clearTimeout(hoverTimer)
  if (!open.value) openedByHover = true
  openMenu()
}

function onPointerLeave(event) {
  if (event.pointerType !== 'mouse') return
  clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => {
    openedByHover = false
    closeMenu()
  }, 180)
}

watch(() => route.fullPath, () => closeMenu())

onMounted(() => document.addEventListener('pointerdown', onDocumentPointer))
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointer)
  clearTimeout(hoverTimer)
})
</script>

<template>
  <div
    ref="root"
    class="relative"
    @keydown="onKeydown"
    @focusout="onFocusOut"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <button
      ref="button"
      type="button"
      class="relative inline-flex h-[4.5rem] items-center gap-1 px-3 text-[0.94rem] font-medium transition-colors hover:text-bone"
      :class="isActive || open ? 'text-bone' : 'text-ash'"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="panelId"
      @click="toggle"
      @keydown="onButtonKeydown"
    >
      Services
      <AppIcon name="chevronDown" class="h-4 w-4 transition-transform duration-200" :class="open ? 'rotate-180' : ''" />
      <span v-if="isActive" class="absolute inset-x-3 bottom-0 h-0.5 bg-ember" aria-hidden="true" />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-show="open"
        :id="panelId"
        class="absolute left-1/2 top-full z-50 w-[46rem] -translate-x-1/2 border border-line bg-coal shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)]"
        @keydown="onPanelKeydown"
      >
        <div class="grid grid-cols-[1fr_15rem]">
          <ul class="grid grid-cols-2 gap-px bg-line p-px">
            <li v-for="item in regular" :key="item.to" class="bg-coal">
              <RouterLink
                :to="item.to"
                data-menu-link
                class="group block h-full p-4 transition-colors hover:bg-iron focus-visible:bg-iron"
                active-class="bg-iron"
              >
                <span class="block font-display text-xl font-bold uppercase leading-none text-bone group-hover:text-ember">
                  {{ item.shortLabel }}
                </span>
                <span class="mt-1.5 block text-[0.82rem] leading-snug text-ash">{{ item.description }}</span>
              </RouterLink>
            </li>
          </ul>

          <div class="flex flex-col justify-between gap-4 bg-ink p-5">
            <RouterLink
              v-if="featured"
              :to="featured.to"
              data-menu-link
              class="group block border border-ember/40 p-4 transition-colors hover:border-ember"
            >
              <span class="font-display text-xl font-bold uppercase leading-none text-ember">{{ featured.label }}</span>
              <span class="mt-2 block text-[0.82rem] leading-snug text-ash">{{ featured.description }}</span>
              <span class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-bone">
                For parents <AppIcon name="arrowRight" class="h-4 w-4" />
              </span>
            </RouterLink>
            <RouterLink
              to="/services"
              data-menu-link
              class="inline-flex items-center gap-1.5 text-sm font-semibold text-bone hover:text-ember"
            >
              See all programs <AppIcon name="arrowRight" class="h-4 w-4" />
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
