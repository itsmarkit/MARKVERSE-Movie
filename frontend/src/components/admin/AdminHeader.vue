<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  Bell,
  LogOut,
  User,
  Upload,
  Users,
  MessageSquare,
  LayoutDashboard,
  Settings
} from 'lucide-vue-next'
import { notifications, users, adminProfile } from '../../stores/contentStore.js'

/* =====================================================
   ROUTE (for active nav highlight)
===================================================== */
const route = useRoute()
const router = useRouter()

/* =====================================================
   API BASE
===================================================== */
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Request failed: ${res.status}`)
  return json.data
}

/* =====================================================
   STATE
===================================================== */
const mobileMenuOpen = ref(false) // kept for desktop compatibility
const profileOpen = ref(false)
const mobileProfileSheetOpen = ref(false)
const headerEl = ref<HTMLElement | null>(null)

/* =====================================================
   NAV ITEMS (admin)
===================================================== */
const navItems = [
  { to: '/admin', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { to: '/admin/upload', label: 'Upload Manager', short: 'Upload', icon: Upload },
  { to: '/admin/users', label: 'Users', short: 'Users', icon: Users },
  { to: '/admin/comments', label: 'Comments', short: 'Comments', icon: MessageSquare },
  { to: '/admin/channel-management', label: 'Channel Management', short: 'Channels', icon: Users }
]

/* =====================================================
   ACTIVE NAV HIGHLIGHT
===================================================== */
function isActive(path: string) {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

/* =====================================================
   UNREAD NOTIFICATION COUNT
===================================================== */
const unreadCount = computed(() => {
  if (!notifications?.value) return 0
  return notifications.value.filter((n: any) => !n.read).length
})

/* =====================================================
   PROFILE
===================================================== */
const profileName = computed(() => adminProfile?.value?.name || 'Admin')
const profileAvatar = computed(() => adminProfile?.value?.avatar || '')
const profileInitials = computed(() => {
  const name = profileName.value
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
})

/* =====================================================
   FETCH ADMIN PROFILE
===================================================== */
async function loadAdminProfile() {
  try {
    const data = await apiFetch('/admin/profile')
    if (data?.profile && adminProfile) {
      adminProfile.value = data.profile
    }
  } catch (e) {
    console.error('Failed to load admin profile:', e)
  }
}

/* =====================================================
   FETCH NOTIFICATIONS
===================================================== */
async function loadNotifications() {
  try {
    const list = await apiFetch('/admin/notifications')
    if (Array.isArray(list) && notifications) {
      notifications.value = list
    }
  } catch (e) {
    console.error('Failed to load notifications:', e)
  }
}

/* =====================================================
   OUTSIDE CLICK HANDLER
===================================================== */
function handleClickOutside(e: MouseEvent) {
  if (!headerEl.value) return
  if (!headerEl.value.contains(e.target as Node)) {
    profileOpen.value = false
  }
}

/* =====================================================
   ESC CLOSE
===================================================== */
function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    mobileMenuOpen.value = false
    profileOpen.value = false
    mobileProfileSheetOpen.value = false
  }
}

/* =====================================================
   CLOSE MENUS WHEN ROUTE CHANGES
===================================================== */
watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
    profileOpen.value = false
    mobileProfileSheetOpen.value = false
  }
)

/* =====================================================
   LOGOUT
===================================================== */
async function handleLogout() {
  profileOpen.value = false
  mobileMenuOpen.value = false
  mobileProfileSheetOpen.value = false
  if (window.confirm('Are you sure you want to log out?')) {
    try {
      await apiFetch('/logout', { method: 'POST' })
    } catch (e) {
      console.error('Logout failed:', e)
    }
    // clear local store references
    if (adminProfile) adminProfile.value = null
    if (notifications) notifications.value = []
    router.push('/')
  }
}

/* =====================================================
   LIFECYCLE
===================================================== */
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKey)
  loadAdminProfile()
  loadNotifications()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKey)
})
</script>
<template>
  <header ref="headerEl" class="w-full px-3 sm:px-4 md:px-6 lg:px-8">
    <div
      class="mx-auto mt-2 w-full max-w-[1800px] rounded-3xl bg-white px-4 py-3 shadow backdrop-blur dark:bg-black dark:shadow-white/20 sm:px-5 md:px-8"
    >
      <div class="flex items-center justify-between gap-3 sm:gap-4 md:gap-6">
        <!-- =========================
             LOGO
        ========================== -->
        <router-link to="/" class="flex shrink-0 items-center gap-2" aria-label="Go to home">
          <img
            src="./markverse.png"
            alt="MARKVERSE"
            class="h-10 w-10 object-contain sm:h-11 sm:w-11 md:h-12 md:w-12"
          />
          <div class="text-lg font-extrabold leading-none sm:text-xl md:text-2xl">
            <span class="text-black dark:text-white">MARK</span>
            <span class="text-blue-600">VERSE</span>
          </div>
        </router-link>

        <!-- =========================
             DESKTOP NAV
        ========================== -->
        <nav
          class="hidden flex-1 items-center justify-center gap-4 text-base font-bold text-black dark:text-white md:flex lg:gap-6 lg:text-lg"
        >
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="rounded-full px-3 py-1.5 transition duration-200 hover:text-blue-400"
            :class="isActive(item.to) ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : ''"
          >
            {{ item.label }}
          </router-link>
        </nav>

        <!-- =========================
             RIGHT SIDE ACTIONS
        ========================== -->
        <div class="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
          <!-- Notifications -->
          <router-link
            to="/admin/notifications"
            class="relative flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-slate-100 hover:text-blue-500 dark:text-white dark:hover:bg-slate-800"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell class="h-5 w-5" />

            <!-- Unread badge -->
            <span
              v-if="unreadCount > 0"
              class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-black"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </router-link>

          <!-- Profile button (with dropdown) — DESKTOP ONLY -->
          <div class="relative hidden md:block">
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-700 transition hover:bg-gray-600 sm:h-11 sm:w-11"
              aria-label="Profile menu"
              :aria-expanded="profileOpen"
              @click="profileOpen = !profileOpen"
            >
              <img
                v-if="profileAvatar"
                :src="profileAvatar"
                alt="Profile"
                class="h-full w-full object-cover"
              />
              <img
                v-else
                src="./markverse.png"
                alt="Profile"
                class="h-8 w-8 object-contain sm:h-9 sm:w-9"
              />
            </button>

            <!-- Dropdown -->
            <Transition
              enter-active-class="transition duration-150"
              enter-from-class="opacity-0 -translate-y-1"
              leave-active-class="transition duration-100"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <div
                v-if="profileOpen"
                class="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10"
              >
                <!-- Profile summary -->
                <div
                  class="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800"
                >
                  <div
                    class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-black text-white"
                  >
                    <img
                      v-if="profileAvatar"
                      :src="profileAvatar"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>{{ profileInitials }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-black dark:text-white">{{ profileName }}</p>
                    <p class="truncate text-[11px] text-slate-500 dark:text-white/60">
                      {{ adminProfile?.email || '' }}
                    </p>
                  </div>
                </div>

                <!-- Menu -->
                <router-link
                  to="/admin/profile"
                  class="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
                  @click="profileOpen = false"
                >
                  <User class="h-4 w-4" />
                  My Profile
                </router-link>

                <button
                  type="button"
                  class="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                  @click="handleLogout"
                >
                  <LogOut class="h-4 w-4" />
                  Log out
                </button>
              </div>
            </Transition>
          </div>

          <!-- Mobile: small profile avatar that opens bottom sheet -->
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-700 transition hover:bg-gray-600 md:hidden"
            aria-label="Open profile menu"
            @click="mobileProfileSheetOpen = true"
          >
            <img
              v-if="profileAvatar"
              :src="profileAvatar"
              alt="Profile"
              class="h-full w-full object-cover"
            />
            <img
              v-else
              src="./markverse.png"
              alt="Profile"
              class="h-8 w-8 object-contain"
            />
          </button>
        </div>
      </div>

      <!-- =========================
           MOBILE NAV (hidden — replaced by bottom bar)
      ========================== -->
      <Transition
        enter-active-class="transition duration-150"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition duration-100"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <nav
          v-if="mobileMenuOpen"
          class="mt-3 hidden flex-col gap-1 border-t border-slate-100 pt-3 dark:border-slate-800"
        >
          <!-- legacy content, not displayed -->
        </nav>
      </Transition>
    </div>
  </header>

  <!-- =====================================================
       WHATSAPP-STYLE BOTTOM NAVIGATION (MOBILE ONLY)
  ====================================================== -->
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around border-t border-slate-200 bg-white px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-[#111b21] md:hidden"
    aria-label="Mobile bottom navigation"
  >
    <!-- Nav items -->
    <router-link
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="group flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium leading-tight transition-colors duration-200"
      :class="
        isActive(item.to)
          ? 'text-[#1daa61] dark:text-[#1daa61]'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
      "
    >
      <component
        :is="item.icon"
        class="h-[22px] w-[22px] transition-transform duration-150 group-active:scale-90"
        :class="isActive(item.to) ? 'stroke-[2.2]' : 'stroke-[1.8]'"
      />
      <span class="max-w-full truncate">{{ item.short || item.label }}</span>
    </router-link>
  </nav>

  <!-- =====================================================
       MOBILE PROFILE BOTTOM SHEET (WhatsApp-style)
  ====================================================== -->
  <Transition
    enter-active-class="transition duration-250 ease-out"
    enter-from-class="opacity-0 translate-y-8"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="opacity-0 translate-y-8"
  >
    <div
      v-if="mobileProfileSheetOpen"
      class="fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl bg-white p-4 shadow-[0_-12px_48px_rgba(0,0,0,0.18)] dark:bg-slate-900 md:hidden"
      style="padding-bottom: max(1rem, env(safe-area-inset-bottom))"
    >
      <!-- drag handle -->
      <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700"></div>

      <!-- Profile summary -->
      <div class="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div
          class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-black text-white"
        >
          <img v-if="profileAvatar" :src="profileAvatar" class="h-full w-full object-cover" />
          <span v-else>{{ profileInitials }}</span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-base font-black dark:text-white">{{ profileName }}</p>
          <p class="truncate text-xs text-slate-500 dark:text-white/60">
            {{ adminProfile?.email || 'admin@markverse.com' }}
          </p>
        </div>
        <router-link
          to="/admin/profile"
          class="flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Edit profile"
          @click="mobileProfileSheetOpen = false"
        >
        </router-link>
      </div>

      <!-- Menu items -->
      <div class="mt-3 space-y-1">
        <router-link
          to="/admin/profile"
          class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
          @click="mobileProfileSheetOpen = false"
        >
          <User class="h-5 w-5 text-slate-500 dark:text-slate-400" />
          My Profile
        </router-link>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
          @click="handleLogout"
        >
          <LogOut class="h-5 w-5" />
          Log out
        </button>
      </div>

      <!-- close button -->
      <button
        type="button"
        class="mt-4 w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        @click="mobileProfileSheetOpen = false"
      >
        Cancel
      </button>
    </div>
  </Transition>

  <!-- Overlay backdrop for mobile profile sheet -->
  <Transition
    enter-active-class="transition duration-200"
    enter-from-class="opacity-0"
    leave-active-class="transition duration-150"
    leave-to-class="opacity-0"
  >
    <div
      v-if="mobileProfileSheetOpen"
      class="fixed inset-0 z-[65] bg-black/50 backdrop-blur-[2px] md:hidden"
      @click="mobileProfileSheetOpen = false"
    ></div>
  </Transition>

  <!-- Spacer so page content isn't hidden behind bottom nav on mobile -->
  <div class="h-16 md:hidden" aria-hidden="true"></div>
</template>