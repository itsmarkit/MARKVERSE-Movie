<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">

    <!-- HEADER -->
    <div class="fixed top-0 left-0 right-0 z-50">
      <Header />
    </div>

    <main class="pt-20 sm:pt-24">

      <!-- =========================
           LOADING
      ========================== -->
      <div
        v-if="loading"
        class="px-3 py-8 sm:px-6 sm:py-10 lg:px-8"
      >
        <div class="h-40 animate-pulse rounded-2xl bg-slate-200 sm:h-56 dark:bg-slate-800"></div>
        <div class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="i in 4"
            :key="i"
            class="h-48 animate-pulse rounded-2xl bg-slate-200 sm:h-64 dark:bg-slate-800"
          ></div>
        </div>
      </div>

      <!-- =========================
           ERROR
      ========================== -->
      <div
        v-else-if="error"
        class="px-3 py-8 sm:px-6 sm:py-10 lg:px-8"
      >
        <div class="rounded-2xl bg-white p-6 sm:p-8 text-center shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800">
          <p class="text-sm font-black text-slate-700 dark:text-white">
            Failed to load channel
          </p>
          <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-white/70">
            {{ error }}
          </p>
          <button
            type="button"
            @click="fetchChannel"
            class="mt-4 rounded-full bg-blue-500 px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-black text-white transition hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      </div>

      <!-- =========================
           CHANNEL CONTENT
      ========================== -->
      <template v-else-if="channel">

        <!-- BANNER + PROFILE -->
        <section class="px-3 pt-4 sm:px-6 sm:pt-6 lg:px-8">

          <div
            class="relative h-36 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/70 to-slate-800 shadow-lg sm:h-48 md:h-56"
            :style="bannerStyle(channel.banner)"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
          </div>

          <!-- PROFILE ROW -->
          <div class="relative -mt-10 flex flex-col gap-3 px-2 sm:-mt-12 sm:flex-row sm:items-end sm:gap-5 sm:px-4">

            <!-- AVATAR -->
            <div class="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-lg sm:h-28 sm:w-28 dark:border-black dark:bg-slate-800">
              <img
                v-if="channel.avatar && !avatarBroken"
                :src="resolveImageUrl(channel.avatar)"
                :alt="channel.name"
                class="h-full w-full object-cover"
                @error="avatarBroken = true"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-2xl font-black text-slate-500 sm:text-4xl dark:text-white/70"
              >
                {{ initials(channel.name) }}
              </div>
            </div>

            <!-- NAME + META + FOLLOW -->
            <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

              <div class="min-w-0">
                <h1 class="truncate text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl">
                  {{ channel.name }}
                </h1>

                <p class="mt-0.5 text-xs font-medium text-slate-600 sm:text-sm dark:text-white/70">
                  {{ formatSubscribers(channel.subscribers) }} followers
                  <span v-if="channel.contentCount"> • {{ channel.contentCount }} titles </span>
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  :disabled="followBusy"
                  @click="toggleFollow"
                  class="rounded-full px-4 py-2 text-xs font-black transition disabled:opacity-60 sm:px-6 sm:py-2.5 sm:text-sm"
                  :class="
                    channel.isFollowing
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  "
                >
                  {{ followBusy ? '…' : (channel.isFollowing ? 'Following' : 'Follow') }}
                </button>
              </div>

            </div>

          </div>

          <!-- DESCRIPTION -->
          <p
            v-if="channel.description"
            class="mt-3 max-w-3xl px-2 text-xs leading-5 text-slate-600 sm:mt-4 sm:px-4 sm:text-sm sm:leading-6 dark:text-white/70"
          >
            {{ channel.description }}
          </p>

        </section>


        <!-- =========================
             CONTENT TABS
        ========================== -->
        <section class="px-3 py-6 sm:px-6 sm:py-8 lg:px-8">

          <!-- TABS -->
          <div class="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              type="button"
              @click="activeTab = tab.value"
              class="rounded-full px-3 py-1.5 text-xs font-bold transition sm:px-5 sm:py-2 sm:text-sm"
              :class="
                activeTab === tab.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800'
              "
            >
              {{ tab.label }}
              <span
                v-if="tabCount(tab.value) > 0"
                class="ml-1 opacity-70"
              >
                ({{ tabCount(tab.value) }})
              </span>
            </button>
          </div>

          <!-- EMPTY -->
          <div
            v-if="!filteredItems.length"
            class="rounded-2xl bg-white p-6 sm:p-8 text-center shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800"
          >
            <p class="text-xs sm:text-sm font-bold text-slate-500 dark:text-white/70">
              Nothing uploaded here yet.
            </p>
          </div>

          <!-- GRID -->
          <div
            v-else
            class="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
          >

            <article
              v-for="item in filteredItems"
              :key="item.id"
              class="group overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-black dark:text-white dark:shadow-white/20"
            >

              <router-link :to="`/watch/${item.id}`" class="block">

                <!-- POSTER -->
                <div
                  class="relative h-36 overflow-hidden bg-gradient-to-br from-slate-600 to-slate-800 sm:h-60"
                  :style="posterStyle(item.image)"
                >
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

                  <!-- RATING -->
                  <div
                    v-if="item.rating"
                    class="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur sm:right-3 sm:top-3 sm:px-3 sm:py-1 sm:text-sm"
                  >
                    ★ {{ item.rating }}
                  </div>

                  <!-- PLAY -->
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                    <span class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg sm:h-14 sm:w-14">
                      <PlayIcon class="h-4 w-4 fill-current sm:h-6 sm:w-6" />
                    </span>
                  </div>
                </div>

                <!-- INFO -->
                <div class="p-3 sm:p-5">
                  <h3 class="truncate text-sm font-bold sm:text-xl">
                    {{ item.title }}
                  </h3>

                  <div class="mt-1 flex items-center justify-between gap-2">
                    <p class="truncate text-xs font-medium text-slate-700 sm:text-sm dark:text-white">
                      {{ item.genre }}
                    </p>

                    <p
                      v-if="item.type === 'series' && item.episodeCount > 0"
                      class="shrink-0 text-[10px] text-slate-600 sm:text-sm dark:text-white"
                    >
                      {{ item.episodeCount }}
                      {{ item.episodeCount === 1 ? 'Ep' : 'Eps' }}
                    </p>
                  </div>

                  <div class="mt-3 sm:mt-4">
                    <span class="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition group-hover:bg-blue-600 sm:gap-2 sm:px-5 sm:py-2 sm:text-sm">
                      <PlayIcon class="h-3 w-3 fill-current sm:h-4 sm:w-4" />
                      Watch Now
                    </span>
                  </div>
                </div>

              </router-link>

            </article>

          </div>

        </section>

      </template>

    </main>

    <Footer />
  </div>
</template>


<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Header from './Header.vue'
import Footer from './Footer.vue'
import { PlayIcon } from 'lucide-vue-next'

/* =====================================================
   AUTH TOKEN HELPERS (shared with other pages)
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
   ROUTE / STATE
===================================================== */
const route = useRoute()

const loading = ref(true)
const error = ref(null)
const channel = ref(null)
const items = ref([])
const activeTab = ref('all')

const followBusy = ref(false)
const avatarBroken = ref(false)

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'movies', label: 'Movies' },
  { value: 'series', label: 'Series' },
]

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
  }
}

function normalizeContent(item) {
  const rawEpisodes = Array.isArray(item?.episodes) ? item.episodes : []
  const episodeCount =
    rawEpisodes.length > 0
      ? rawEpisodes.length
      : Number(item?.episodeCount || 0)

  const type =
    String(item?.type || '').toLowerCase() === 'series' ? 'series' : 'movie'

  return {
    id: item?.id ?? item?._id ?? '',
    title: item?.title ?? 'Untitled',
    type,
    genre: item?.genre ?? '',
    year: item?.year ?? '',
    rating: item?.rating ?? '',
    image:
      item?.image ??
      item?.thumbnail ??
      item?.poster ??
      item?.backdrop ??
      '',
    episodeCount,
  }
}

/* =====================================================
   FETCH — channel + all content in parallel
===================================================== */
async function fetchChannel() {
  loading.value = true
  error.value = null
  avatarBroken.value = false

  const id = String(route.params.id || '')
  if (!id) {
    error.value = 'No channel id provided.'
    loading.value = false
    return
  }

  try {
    // Parallel: channel detail + full content list.
    // /channels/:id only returns the latest 12 items, so we hit /content
    // as well to make sure ALL titles show up.
    const [channelRes, contentRes] = await Promise.all([
      apiFetch(`/channels/${id}`),
      apiFetch(`/channels/${id}/content`),
    ])

    const channelPayload = channelRes?.data ?? channelRes ?? {}
    const ch = channelPayload?.channel ?? channelPayload
    channel.value = ch ? normalizeChannel(ch) : null

    // Prefer the full /content list when available; fall back to
    // whatever /channels/:id returned if /content was empty/missing.
    const contentPayload = contentRes?.data ?? contentRes ?? {}
    let rawItems = []
    if (Array.isArray(contentPayload?.items)) {
      rawItems = contentPayload.items
    } else if (Array.isArray(contentPayload)) {
      rawItems = contentPayload
    } else if (Array.isArray(channelPayload?.content)) {
      rawItems = channelPayload.content
    }

    items.value = rawItems.map(normalizeContent)

    if (!channel.value) {
      error.value = 'Channel not found.'
    }
  } catch (err) {
    console.error('Channel fetch error:', err)
    error.value = err?.message || 'Failed to load channel.'
  } finally {
    loading.value = false
  }
}

/* =====================================================
   FOLLOW / UNFOLLOW (optimistic + rollback)
===================================================== */
async function toggleFollow() {
  if (!channel.value || followBusy.value) return

  const next = !channel.value.isFollowing
  const prevSubs = channel.value.subscribers

  channel.value.isFollowing = next
  channel.value.subscribers += next ? 1 : -1
  followBusy.value = true

  try {
    const res = await apiFetch(`/channels/${channel.value.id}/follow`, {
      method: 'POST',
      body: JSON.stringify({ follow: next }),
    })

    // Adopt the server's authoritative values.
    const payload = res?.data ?? res ?? {}
    if (typeof payload.subscribers === 'number') {
      channel.value.subscribers = payload.subscribers
    }
    if (typeof payload.isFollowing === 'boolean') {
      channel.value.isFollowing = payload.isFollowing
    }

    // Optional browser notification on follow
    if (next && typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        try { await Notification.requestPermission() } catch (_) {}
      }
      if (Notification.permission === 'granted') {
        try {
          new Notification(`You're following ${channel.value.name}`, {
            body: "You'll be notified when new content is uploaded.",
            icon: resolveImageUrl(channel.value.avatar) || undefined,
          })
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error('Follow error:', err)
    // Rollback
    channel.value.isFollowing = !next
    channel.value.subscribers = prevSubs
  } finally {
    followBusy.value = false
  }
}

/* =====================================================
   FILTERS / COUNTS
===================================================== */
const filteredItems = computed(() => {
  if (activeTab.value === 'movies') {
    return items.value.filter((i) => i.type === 'movie')
  }
  if (activeTab.value === 'series') {
    return items.value.filter((i) => i.type === 'series')
  }
  return items.value
})

function tabCount(tab) {
  if (tab === 'movies') return items.value.filter((i) => i.type === 'movie').length
  if (tab === 'series') return items.value.filter((i) => i.type === 'series').length
  return items.value.length
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

function posterStyle(url) {
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
onMounted(fetchChannel)

// Refetch if the user navigates between channels (same route, different id).
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) fetchChannel()
  }
)
</script>