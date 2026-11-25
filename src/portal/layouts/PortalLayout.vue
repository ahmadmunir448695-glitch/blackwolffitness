<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import '../portal.css'
import { ROLE_LABELS, isAdmin, isClubUser, isSuperAdmin, logout, refreshUser, role, session } from '../lib/session.js'
import { closeDialog, dialog, dismissToast, toasts } from '../lib/ui.js'
import { initials } from '../lib/format.js'

const route = useRoute()
const router = useRouter()
const drawer = ref(false)

const clubNav = [
  { label: 'Dashboard', to: '/portal', icon: 'grid', exact: true },
  { label: 'My Team', to: '/portal/team', icon: 'users' },
  { label: 'Events', to: '/portal/events', icon: 'trophy' },
  { label: 'Registration', to: '/portal/register', icon: 'clipboard' },
  { label: 'My Entries', to: '/portal/entries', icon: 'list' },
  { label: 'Athletes', to: '/portal/athletes', icon: 'kick' },
  { label: 'Coaches', to: '/portal/coaches', icon: 'user' },
  { label: 'Certificates & Documents', to: '/portal/documents', icon: 'file' },
  { label: 'Notifications', to: '/portal/notifications', icon: 'bell', badge: true },
  { label: 'Profile & Settings', to: '/portal/profile', icon: 'settings' },
]
const athleteNav = [
  { label: 'Dashboard', to: '/portal', icon: 'grid', exact: true },
  { label: 'Events', to: '/portal/events', icon: 'trophy' },
  { label: 'My Entries', to: '/portal/entries', icon: 'list' },
  { label: 'Certificates & Documents', to: '/portal/documents', icon: 'file' },
  { label: 'Notifications', to: '/portal/notifications', icon: 'bell', badge: true },
  { label: 'Profile & Settings', to: '/portal/profile', icon: 'settings' },
]

const sections = computed(() => {
  if (isClubUser.value) return [{ title: 'Championship', items: clubNav }]
  if (role.value === 'athlete') return [{ title: 'Championship', items: athleteNav }]
  if (isAdmin.value) {
    const manage = [
      { label: 'Overview', to: '/portal/admin', icon: 'chart', exact: true },
      { label: 'Championships', to: '/portal/admin/events', icon: 'trophy' },
      { label: 'Registrations', to: '/portal/admin/registrations', icon: 'clipboard' },
      { label: 'Payments', to: '/portal/admin/payments', icon: 'card' },
      { label: 'Teams', to: '/portal/admin/teams', icon: 'users' },
      { label: 'Athletes', to: '/portal/admin/athletes', icon: 'kick' },
      { label: 'Reports & Exports', to: '/portal/admin/reports', icon: 'download' },
    ]
    if (isSuperAdmin.value) {
      manage.push({ label: 'Users', to: '/portal/admin/users', icon: 'shield' }, { label: 'Audit Log', to: '/portal/admin/audit', icon: 'history' })
    }
    return [
      { title: 'Administration', items: manage },
      {
        title: 'Account',
        items: [
          { label: 'Public events', to: '/portal/events', icon: 'calendar' },
          { label: 'Notifications', to: '/portal/notifications', icon: 'bell', badge: true },
          { label: 'Profile & Settings', to: '/portal/profile', icon: 'settings' },
        ],
      },
    ]
  }
  return [
    {
      title: 'Championship',
      items: [
        { label: 'Events', to: '/portal/events', icon: 'trophy' },
        { label: 'Sign in', to: '/portal/login', icon: 'user' },
        { label: 'Create club account', to: '/portal/signup', icon: 'plus' },
      ],
    },
  ]
})

function isActive(item) {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

const unread = computed(() => session.user?.unread_notifications ?? 0)

function signOut() {
  logout()
  router.push('/portal/login')
}

watch(() => route.fullPath, () => (drawer.value = false))
watch(drawer, (open) => (document.documentElement.style.overflow = open ? 'hidden' : ''))

// Keep the unread badge fresh while the portal is open.
let timer = null
onMounted(() => {
  timer = setInterval(() => session.user && refreshUser().catch(() => {}), 60_000)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.documentElement.style.overflow = ''
})

const dialogInput = ref(null)
function confirmDialogAction() {
  if (dialog.input) {
    if (dialog.input.required && !dialog.value.trim()) {
      dialogInput.value?.focus()
      return
    }
    closeDialog(dialog.value.trim())
  } else closeDialog(true)
}
</script>

<template>
  <div class="min-h-screen bg-ink text-bone lg:grid lg:grid-cols-[17rem_1fr]">
    <a href="#portal-main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:bg-ember focus:px-4 focus:py-3 focus:font-semibold focus:text-ink">Skip to content</a>

    <!-- Mobile top bar -->
    <div class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-ink/95 px-4 backdrop-blur lg:hidden">
      <button type="button" class="p-icon-btn" :aria-expanded="drawer ? 'true' : 'false'" aria-controls="portal-sidebar" @click="drawer = !drawer">
        <AppIcon :name="drawer ? 'close' : 'menu'" class="h-5 w-5" />
        <span class="sr-only">{{ drawer ? 'Close menu' : 'Open menu' }}</span>
      </button>
      <RouterLink to="/" aria-label="Black Wolf Fitness Club home" class="scale-90"><BrandLogo /></RouterLink>
      <RouterLink v-if="session.user" to="/portal/notifications" class="p-icon-btn relative" aria-label="Notifications">
        <AppIcon name="bell" class="h-5 w-5" />
        <span v-if="unread" class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[0.7rem] font-bold text-ink">{{ unread > 99 ? '99+' : unread }}</span>
      </RouterLink>
      <span v-else class="w-9" />
    </div>

    <!-- Sidebar -->
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-150" leave-to-class="opacity-0">
      <div v-if="drawer" class="fixed inset-0 z-40 bg-black/60 lg:hidden" aria-hidden="true" @click="drawer = false" />
    </Transition>
    <aside
      id="portal-sidebar"
      class="fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-line bg-coal transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
      :class="drawer ? 'translate-x-0' : '-translate-x-full'"
      aria-label="Championship portal"
    >
      <div class="border-b border-line px-5 py-5">
        <RouterLink to="/" aria-label="Black Wolf Fitness Club home"><BrandLogo /></RouterLink>
        <p class="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-ember">Championship Portal</p>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Portal">
        <div v-for="section in sections" :key="section.title" class="mb-5">
          <p class="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-smoke">{{ section.title }}</p>
          <ul class="space-y-0.5">
            <li v-for="item in section.items" :key="item.to">
              <RouterLink
                :to="item.to"
                class="group relative flex items-center gap-3 px-3 py-2.5 text-[0.92rem] font-medium transition-colors"
                :class="isActive(item) ? 'bg-ember/10 text-bone' : 'text-ash hover:bg-white/[0.04] hover:text-bone'"
                :aria-current="isActive(item) ? 'page' : undefined"
              >
                <span class="absolute inset-y-1.5 left-0 w-[3px] bg-ember transition-opacity" :class="isActive(item) ? 'opacity-100' : 'opacity-0'" aria-hidden="true" />
                <AppIcon :name="item.icon" class="h-[1.15rem] w-[1.15rem] shrink-0 transition-colors" :class="isActive(item) ? 'text-ember' : 'text-smoke group-hover:text-ember'" />
                <span class="flex-1">{{ item.label }}</span>
                <span v-if="item.badge && unread" class="flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1.5 text-[0.7rem] font-bold text-ink">{{ unread > 99 ? '99+' : unread }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>

      <div class="border-t border-line p-4">
        <div v-if="session.user" class="flex items-center gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center bg-ember font-display text-lg font-bold text-ink">{{ initials(session.user.name) }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-bone">{{ session.user.name }}</p>
            <p class="truncate text-xs text-smoke">{{ ROLE_LABELS[session.user.role] }}<template v-if="session.user.club"> · {{ session.user.club.name }}</template></p>
          </div>
          <button type="button" class="p-icon-btn" aria-label="Sign out" title="Sign out" @click="signOut">
            <AppIcon name="logout" class="h-4 w-4" />
          </button>
        </div>
        <RouterLink v-else to="/" class="flex items-center gap-2 text-sm text-ash hover:text-ember">
          <AppIcon name="arrowLeft" class="h-4 w-4" /> Back to website
        </RouterLink>
      </div>
    </aside>

    <!-- Content -->
    <main id="portal-main" tabindex="-1" class="min-w-0 outline-none">
      <div class="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <RouterView v-slot="{ Component, route: r }">
          <Transition name="p-fade" mode="out-in">
            <component :is="Component" :key="r.path" />
          </Transition>
        </RouterView>
      </div>
    </main>

    <!-- Toasts -->
    <div class="pointer-events-none fixed bottom-4 right-4 z-[95] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      <TransitionGroup name="p-fade">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 border bg-coal px-4 py-3 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)]"
          :class="t.kind === 'error' ? 'border-danger/60' : t.kind === 'success' ? 'border-success/50' : 'border-line'"
          :role="t.kind === 'error' ? 'alert' : 'status'"
        >
          <AppIcon :name="t.kind === 'error' ? 'alert' : t.kind === 'success' ? 'check' : 'info'" class="mt-0.5 h-5 w-5 shrink-0" :class="t.kind === 'error' ? 'text-danger' : t.kind === 'success' ? 'text-success' : 'text-ember'" />
          <p class="flex-1 text-sm text-bone">{{ t.message }}</p>
          <button type="button" class="text-smoke hover:text-bone" aria-label="Dismiss" @click="dismissToast(t.id)"><AppIcon name="close" class="h-4 w-4" /></button>
        </div>
      </TransitionGroup>
    </div>

    <!-- Confirmation dialog -->
    <Teleport to="body">
      <div v-if="dialog.open" class="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" @mousedown.self="closeDialog(dialog.input ? null : false)" @keydown.esc="closeDialog(dialog.input ? null : false)">
        <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" class="w-full max-w-md border border-line bg-coal p-6">
          <h2 id="confirm-title" class="font-display text-2xl uppercase tracking-wide text-bone">{{ dialog.title }}</h2>
          <p v-if="dialog.message" class="mt-2 text-sm text-ash">{{ dialog.message }}</p>
          <div v-if="dialog.input" class="mt-4">
            <label for="confirm-input" class="p-label">{{ dialog.input.label }}<span v-if="!dialog.input.required" class="font-normal text-smoke"> (optional)</span></label>
            <textarea id="confirm-input" ref="dialogInput" v-model="dialog.value" class="p-textarea" rows="3" autofocus />
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="h-10 border border-line px-4 text-sm font-semibold text-ash hover:border-bone/40 hover:text-bone" @click="closeDialog(dialog.input ? null : false)">Cancel</button>
            <button
              type="button"
              class="h-10 px-4 text-sm font-semibold"
              :class="dialog.danger ? 'bg-danger text-ink hover:brightness-110' : 'btn-molten text-ink'"
              autofocus
              @click="confirmDialogAction"
            >{{ dialog.confirmLabel }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
