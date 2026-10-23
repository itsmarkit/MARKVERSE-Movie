<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">

    <!-- HEADER -->
    <div class="fixed top-0 left-0 right-0 z-50">
      <Header />
    </div>

    <!-- MAIN -->
    <main class="pt-20 sm:pt-24 ">

      <!-- PAGE HEADER -->
      <section class="px-3 py-6 sm:px-6 sm:py-8 lg:px-8">

        <div class="mb-4 sm:mb-6 flex items-center justify-between gap-3 sm:gap-4">

          <div>
            <h1 class="text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl">
              Channels
            </h1>
            <p class="mt-1 text-xs sm:text-sm text-slate-600 dark:text-white/70">
              Follow channels to get notified when they upload new content.
            </p>
          </div>

          <button
            type="button"
            @click="refresh"
            :disabled="refreshing"
            class="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm dark:border-slate-800 dark:bg-black dark:text-white dark:hover:bg-slate-900"
          >
            {{ refreshing ? 'Refreshing…' : 'Refresh' }}
          </button>

        </div>

        <!-- LOADING -->
        <div
          v-if="loading"
          class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
        >
          <div
            v-for="i in 4"
            :key="i"
            class="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
          ></div>
        </div>

        <!-- ERROR -->
        <div
          v-else-if="error"
          class="rounded-2xl bg-white p-6 sm:p-8 text-center shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800"
        >
          <p class="text-sm font-black text-slate-700 dark:text-white">
            Failed to load channels
          </p>
          <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-white/70">
            {{ error }}
          </p>
          <button
            type="button"
            @click="fetchChannels"
            class="mt-4 rounded-full bg-blue-500 px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-black text-white transition hover:bg-blue-600"
          >
            Try again
          </button>
        </div>

        <!-- EMPTY -->
        <div
          v-else-if="!channels.length"
          class="rounded-2xl bg-white p-6 sm:p-8 text-center shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800"
        >
          <p class="text-xs sm:text-sm font-bold text-slate-500 dark:text-white/70">
            No channels available yet.
          </p>
        </div>

        <!-- CHANNEL GRID -->
        <div
          v-else
          class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
        >

          <article
            v-for="channel in channels"
            :key="channel.id"
            class="group overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-black dark:text-white dark:shadow-white/20"
          >

            <!-- BANNER -->
            <div
              class="relative h-24 overflow-hidden bg-gradient-to-br from-blue-500/70 to-slate-800 sm:h-28"
              :style="bannerStyle(channel.banner)"
            >
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

              <!-- NEW CONTENT BADGE -->
              <span
                v-if="channel.hasNewContent"
                class="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow sm:right-3 sm:top-3"
              >
                NEW
              </span>
            </div>

            <!-- AVATAR + INFO -->
            <div class="relative px-3 pb-3 pt-0 sm:px-5 sm:pb-5">

              <div class="-mt-6 mb-2 flex items-end justify-between gap-2 sm:-mt-8 sm:mb-3">

                <!-- AVATAR -->
                <router-link
                  :to="`/channels/${channel.id}`"
                  class="block h-12 w-12 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow sm:h-16 sm:w-16 dark:border-black dark:bg-slate-800"
                >
                  <img
                    v-if="channel.avatar && !avatarBroken[channel.id]"
                    :src="resolveImageUrl(channel.avatar)"
                    :alt="channel.name"
                    class="h-full w-full object-cover"
                    @error="avatarBroken[channel.id] = true"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center text-base font-black text-slate-500 sm:text-xl dark:text-white/70"
                  >
                    {{ initials(channel.name) }}
                  </div>
                </router-link>

                <!-- FOLLOW -->
                <button
                  type="button"
                  :disabled="followBusy[channel.id]"
                  @click="toggleFollow(channel)"
                  class="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black transition disabled:opacity-60 sm:px-4 sm:py-2 sm:text-xs"
                  :class="
                    channel.isFollowing
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  "
                >
                  {{ followBusy[channel.id] ? '…' : (channel.isFollowing ? 'Following' : 'Follow') }}
                </button>

              </div>

              <!-- NAME + LINK -->
              <router-link :to="`/channels/${channel.id}`" class="block">
                <h3 class="truncate text-sm font-bold sm:text-lg">
                  {{ channel.name }}
                </h3>
              </router-link>

              <!-- META -->
              <p class="mt-0.5 truncate text-[10px] font-medium text-slate-600 sm:text-sm dark:text-white/70">
                {{ formatSubscribers(channel.subscribers) }} followers
                <span v-if="channel.contentCount">
                  • {{ channel.contentCount }} titles
                </span>
              </p>

              <!-- DESCRIPTION -->
              <p
                v-if="channel.description"
                class="mt-1.5 line-clamp-2 text-[10px] leading-4 text-slate-500 sm:mt-2 sm:text-xs sm:leading-5 dark:text-white/60"
              >
                {{ channel.description }}
              </p>

              <!-- CTA -->
              <div class="mt-3 sm:mt-4">
                <router-link
                  :to="`/channels/${channel.id}`"
                  class="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition group-hover:bg-blue-600 sm:px-5 sm:py-2 sm:text-sm"
                >
                  <PlayIcon class="h-3 w-3 fill-current sm:h-4 sm:w-4" />
                  View Channel
                </router-link>
              </div>

            </div>

          </article>

        </div>

      </section>

    </main>

    <Footer />
  </div>
</template>


<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Header from './Header.vue'
import Footer from './Footer.vue'
import { PlayIcon } from 'lucide-vue-next'

/* =====================================================
   AUTH TOKEN HELPERS (shared with admin pages)
===================================================== */
const TOKEN_KEYS = ['markverse_token', 'token', 'jwt', 'auth_token']

function getAuthToken() {
  for (const key of TOKEN_KEYS) {
    const v = sessionStorage.getItem(key)
    if (v) return v
  }
  for (const key of TOKEN_KEYS) {
    const v = localStorage.getItem(key)
    if (v) return v
  }
  return ''
}

/* =====================================================
   API
===================================================== */
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const API_ORIGIN = (() => {
  try {
    if (/^https?:/i.test(API_BASE)) {
      return new URL(API_BASE).origin
    }
  } catch (_) {}
  return ''
})()

async function apiFetch(path, options = {}) {
  const token = getAuthToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers,
    ...options,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = text
    try {
      const json = JSON.parse(text)
      message = json.error || json.message || text
    } catch (_) {}
    const error = new Error(message || `Request failed (${res.status})`)
    error.status = res.status
    throw error
  }

  return res.json().catch(() => ({}))
}

/* =====================================================
   IMAGE URL RESOLUTION
===================================================== */
function resolveImageUrl(url) {
  if (!url) return ''
  if (/^https?:/i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`
  return url
}

/* =====================================================
   STATE
===================================================== */
const loading = ref(true)
const refreshing = ref(false)
const error = ref(null)
const channels = ref([])

const followBusy = reactive({})
const avatarBroken = reactive({})

let pollTimer = null

/* =====================================================
   NORMALIZE
===================================================== */
function normalizeChannel(item) {
  return {
    id: item?.id ?? item?._id ?? '',
    name: item?.name ?? 'Untitled Channel',
    avatar: item?.avatar ?? item?.logo ?? '',
    banner: item?.banner ?? '',
    description: item?.description ?? '',
    subscribers: Number(item?.subscribers ?? 0),
    contentCount: Number(item?.contentCount ?? 0),
    isFollowing: Boolean(item?.isFollowing),
    hasNewContent: Boolean(item?.hasNewContent),
    latestUploadAt: item?.latestUploadAt ?? null,
  }
}

/* =====================================================
   FETCH
===================================================== */
async function fetchChannels() {
  loading.value = true
  error.value = null

  try {
    const response = await apiFetch('/channels')
    const payload = response?.data ?? response ?? {}
    const list = Array.isArray(payload.channels)
      ? payload.channels
      : Array.isArray(payload)
        ? payload
        : []

    channels.value = list.map(normalizeChannel)
  } catch (err) {
    console.error('Channels fetch error:', err)
    error.value = err?.message || 'Failed to load channels.'
  } finally {
    loading.value = false
  }
}

async function refresh() {
  refreshing.value = true
  try {
    await fetchChannels()
    await checkForNewContent()
  } finally {
    refreshing.value = false
  }
}

/* =====================================================
   FOLLOW / UNFOLLOW (optimistic + rollback)
===================================================== */
async function toggleFollow(channel) {
  if (followBusy[channel.id]) return

  const next = !channel.isFollowing
  const prevSubs = channel.subscribers

  // Optimistic
  channel.isFollowing = next
  channel.subscribers += next ? 1 : -1
  followBusy[channel.id] = true

  try {
    const res = await apiFetch(`/channels/${channel.id}/follow`, {
      method: 'POST',
      body: JSON.stringify({ follow: next }),
    })

    // Adopt the server's authoritative subscriber count.
    const payload = res?.data ?? res ?? {}
    if (typeof payload.subscribers === 'number') {
      channel.subscribers = payload.subscribers
    }
    if (typeof payload.isFollowing === 'boolean') {
      channel.isFollowing = payload.isFollowing
    }

    if (next && typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        try { await Notification.requestPermission() } catch (_) {}
      }
      if (Notification.permission === 'granted') {
        try {
          new Notification(`You're following ${channel.name}`, {
            body: "You'll be notified when new content is uploaded.",
            icon: resolveImageUrl(channel.avatar) || undefined,
          })
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error('Follow error:', err)
    // Rollback
    channel.isFollowing = !next
    channel.subscribers = prevSubs
  } finally {
    delete followBusy[channel.id]
  }
}

/* =====================================================
   NEW-CONTENT POLLING
===================================================== */
async function checkForNewContent() {
  // Requires an authenticated user; skip silently otherwise.
  if (!getAuthToken()) return

  try {
    const response = await apiFetch('/channels/updates')
    const payload = response?.data ?? response ?? {}
    const updates = Array.isArray(payload.updates) ? payload.updates : []

    if (!updates.length) return

    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      updates.forEach((u) => {
        try {
          new Notification(`${u.channelName} uploaded new content`, {
            body: u.title || 'A new title is available.',
            icon: resolveImageUrl(u.avatar) || undefined,
            tag: `channel-${u.channelId}`,
          })
        } catch (_) {}
      })
    }

    // Mark channels with new content
    updates.forEach((u) => {
      const ch = channels.value.find((c) => c.id === u.channelId)
      if (ch) ch.hasNewContent = true
    })

    // Mark updates as seen so we don't re-notify
    try {
      await apiFetch('/channels/updates/mark-seen', { method: 'POST' })
    } catch (_) {}
  } catch (err) {
    // 401 → not logged in; ignore silently.
    if (err?.status !== 401) {
      console.warn('Channel update check failed:', err)
    }
  }
}

/* =====================================================
   HELPERS
===================================================== */
function bannerStyle(url) {
  if (!url) return {}
  return {
    backgroundImage: `url("${resolveImageUrl(url)}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function formatSubscribers(n) {
  n = Number(n) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/* =====================================================
   LIFECYCLE
===================================================== */
onMounted(async () => {
  await fetchChannels()
  await checkForNewContent()

  // Poll for new uploads every 60s
  pollTimer = window.setInterval(checkForNewContent, 60_000)
})

onBeforeUnmount(() => {
  window.clearInterval(pollTimer)
})
</script>