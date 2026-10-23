<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">
       <!-- =========================
         HEADER
    ========================== -->
    <header class="fixed top-0 left-0 right-0 z-50">
      <Header />
    </header>

    <!-- =====================================================
         MAIN
    ====================================================== -->
    <main class="px-4 pb-24 pt-24 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-7xl">
        <!-- Page heading -->
        <div class="mt-10 mb-8">


          <div
            class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
          >
            <div>
              <h1
                class="text-3xl font-black tracking-tight dark:text-white text-slate-900 sm:text-4xl"
              >
                My
                <span class="text-blue-600">Downloads</span>
              </h1>

              <p class="mt-2 max-w-2xl text-sm text-slate-500 dark:text-white/80 sm:text-base">
                Manage your downloads — in progress, pending, paused,
                completed, and failed.
              </p>
            </div>

            <!-- Clear all -->
            <button
              v-if="downloads.length"
              type="button"
              class="inline-flex w-fit items-center gap-2 rounded-full dark:bg-black dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-600 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-600"
              @click="clearAllDownloads"
            >
              <TrashIcon class="h-4 w-4" />
              Clear All
            </button>
          </div>
        </div>

        <!-- =====================================================
             SUMMARY CARDS
        ====================================================== -->
        <div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div
            v-for="stat in summaryStats"
            :key="stat.label"
            class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black  dark:shadow-white/80 dark:border dark:border-slate-800"
          >
            <div class="flex items-center justify-between gap-3">
              <p
                class="text-xs font-black uppercase tracking-wider dark:text-white/80 text-slate-500"
              >
                {{ stat.label }}
              </p>

              <component
                :is="stat.icon"
                class="h-5 w-5"
                :class="stat.color"
              />
            </div>

            <p class="mt-2 text-2xl font-black" :class="stat.color">
              {{ stat.value }}
            </p>

            <p v-if="stat.hint" class="mt-1 text-xs font-semibold text-slate-400">
              {{ stat.hint }}
            </p>
          </div>
        </div>

        <!-- =====================================================
             STORAGE
        ====================================================== -->
        <div
          class="mb-8 rounded-2xl bg-white p-4 shadow-sm dark:bg-black  dark:shadow-white/80 dark:border dark:border-slate-800 sm:p-5"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-black text-slate-800 dark:text-white/80">
                Download storage
              </p>

              <p class="mt-1 text-xs font-semibold text-slate-400 dark:text-white/80">
                Total size represented by your downloads
              </p>
            </div>

            <p class="text-sm font-bold text-slate-500 dark:text-white/80">
              {{ formatBytes(totalDownloadedBytes) }}
              /
              {{ formatBytes(totalSizeBytes) }}
            </p>
          </div>

          <div
            class="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            :aria-valuenow="overallProgress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Overall download progress"
          >
            <div
              class="h-full rounded-full bg-blue-500 transition-all duration-500"
              :style="{ width: `${overallProgress}%` }"
            ></div>
          </div>

          <div class="mt-2 flex justify-between text-xs font-bold text-slate-400 dark:text-white/80">
            <span>{{ overallProgress }}% complete</span>
            <span>{{ downloads.length }} items</span>
          </div>
        </div>

        <!-- =====================================================
             FILTER TABS
        ====================================================== -->
        <div class="mb-6 flex flex-wrap gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition"
            :class="
              activeTab === tab.value
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white text-slate-700 dark:bg-black  dark:shadow-white/80 dark:border dark:border-slate-800 dark:hover:bg-slate-600 dark:text-white hover:bg-slate-100'
            "
            :aria-pressed="activeTab === tab.value"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}

            <span
              class="rounded-full px-2 py-0.5 text-xs font-black"
              :class="
                activeTab === tab.value
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              "
            >
              {{ countByStatus(tab.value) }}
            </span>
          </button>
        </div>

        <!-- Error banner -->
        <div
          v-if="errorMessage"
          class="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircleIcon class="h-4 w-4 shrink-0" />
          {{ errorMessage }}
        </div>

        <!-- Loading -->
        <div
          v-if="loading"
          class="flex min-h-[360px] flex-col items-center justify-center rounded-2xl dark:bg-black dark:shadow-white/80 dark:border dark:border-slate-800 bg-white p-10 text-center shadow-sm"
        >
          <div
            class="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500"
          ></div>

          <p class="text-sm font-bold text-slate-500 dark:text-white/80">
            Loading downloads…
          </p>
        </div>

        <!-- =====================================================
             DOWNLOAD LIST
        ====================================================== -->
        <div v-else-if="filteredDownloads.length" class="flex flex-col gap-4">
          <article
            v-for="item in filteredDownloads"
            :key="item.id"
            class="rounded-2xl bg-white dark:bg-black  dark:shadow-white/80 dark:border dark:border-slate-800 p-4 shadow-sm transition hover:shadow-md sm:p-5 "
          >
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
              <!-- Poster -->
              <button
                type="button"
                class="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-950 text-white sm:h-32 sm:w-24"
                :style="posterStyle(item.image)"
                :aria-label="`Open ${item.title}`"
                @click="openItem(item)"
              >
                <span
                  v-if="!item.image"
                  class="px-2 text-center text-lg font-black tracking-wider"
                >
                  {{ initials(item.title) }}
                </span>

                <div
                  class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                ></div>

                <div
                  class="absolute bottom-2 left-2 right-2 text-left text-[10px] font-black uppercase tracking-wider text-white/80"
                >
                  {{ item.quality }}
                </div>
              </button>

              <!-- Information -->
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="truncate text-lg font-black dark:text-white text-slate-900">
                    {{ item.title }}
                  </h2>

                  <span
                    class="rounded-full px-2.5 py-1 text-xs dark:font-white font-black"
                    :class="statusBadgeClass(item.status)"
                  >
                    {{ statusLabel(item.status) }}
                  </span>
                </div>

                <div
                  class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-slate-500 dark:text-white/80"
                >
                  <span>{{ item.genre }}</span>
                  <span>•</span>
                  <span>{{ item.type }}</span>
                  <span>•</span>
                  <span>{{ item.quality }}</span>
                  <span>•</span>
                  <span>{{ formatBytes(item.sizeBytes) }}</span>
                </div>

                <!-- Progress -->
                <div
                  v-if="
                    item.status === 'downloading' ||
                    item.status === 'pending' ||
                    item.status === 'paused'
                  "
                  class="mt-4"
                >
                  <div
                    class="h-2.5 w-full overflow-hidden rounded-full dark:bg-black bg-slate-100"
                    role="progressbar"
                    :aria-valuenow="progressOf(item)"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="`${item.title} download progress`"
                  >
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="progressBarClass(item.status)"
                      :style="{ width: `${progressOf(item)}%` }"
                    ></div>
                  </div>

                  <div
                    class="mt-2 flex items-center justify-between gap-3 text-xs font-bold dark:text-white/80 text-slate-500"
                  >
                    <span>
                      <template v-if="item.status === 'downloading'">
                        {{ progressOf(item) }}% downloading
                      </template>

                      <template v-else-if="item.status === 'paused'">
                        Paused — {{ progressOf(item) }}%
                      </template>

                      <template v-else>
                        Waiting to start
                      </template>
                    </span>

                    <span>
                      {{ formatBytes(item.downloadedBytes) }}
                      /
                      {{ formatBytes(item.sizeBytes) }}
                    </span>
                  </div>
                </div>

                <!-- Completed -->
                <div
                  v-if="item.status === 'completed'"
                  class="mt-3 flex items-center gap-2 text-xs font-bold text-green-600"
                >
                  <CheckIcon class="h-4 w-4" />
                  Download completed
                </div>

                <!-- Failed -->
                <p
                  v-if="item.status === 'failed'"
                  class="mt-3 flex items-center gap-2 text-xs font-bold text-red-500"
                >
                  <AlertCircleIcon class="h-4 w-4 shrink-0" />
                  {{ item.errorMessage || 'Download failed.' }}
                </p>
              </div>

              <!-- Actions -->
              <div
                class="flex shrink-0 flex-wrap items-center gap-2 lg:max-w-[360px] lg:justify-end"
              >
                <!-- Downloading -->
                <template v-if="item.status === 'downloading'">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                    @click="pauseDownload(item)"
                  >
                    <PauseIcon class="h-4 w-4" />
                    Pause
                  </button>

                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-100"
                    @click="removeDownload(item)"
                  >
                    <XIcon class="h-4 w-4" />
                    Remove
                  </button>
                </template>

                <!-- Paused -->
                <template v-else-if="item.status === 'paused'">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
                    @click="resumeDownload(item)"
                  >
                    <PlayIcon class="h-4 w-4 fill-current" />
                    Resume
                  </button>

                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-100"
                    @click="removeDownload(item)"
                  >
                    <XIcon class="h-4 w-4" />
                    Remove
                  </button>
                </template>

                <!-- Pending -->
                <template v-else-if="item.status === 'pending'">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
                    @click="startDownload(item)"
                  >
                    <DownloadIcon class="h-4 w-4" />
                    Start
                  </button>

                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-100"
                    @click="removeDownload(item)"
                  >
                    <XIcon class="h-4 w-4" />
                    Remove
                  </button>
                </template>

                <!-- Completed -->
                <template v-else-if="item.status === 'completed'">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
                    @click="openItem(item)"
                  >
                    <PlayIcon class="h-4 w-4 fill-current" />
                    Watch
                  </button>

                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                    @click="removeDownload(item)"
                  >
                    <TrashIcon class="h-4 w-4" />
                    Delete
                  </button>
                </template>

                <!-- Failed -->
                <template v-else-if="item.status === 'failed'">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
                    @click="retryDownload(item)"
                  >
                    <RefreshIcon class="h-4 w-4" />
                    Retry
                  </button>

                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-100"
                    @click="removeDownload(item)"
                  >
                    <TrashIcon class="h-4 w-4" />
                    Remove
                  </button>
                </template>
              </div>
            </div>
          </article>
        </div>

        <!-- =====================================================
             EMPTY STATE
        ====================================================== -->
        <div
          v-else
          class="flex min-h-[360px] flex-col items-center justify-center rounded-2xl dark:bg-black  dark:shadow-white/80 dark:border dark:border-slate-800 bg-white p-10 text-center shadow-sm"
        >
          <div
            class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
          >
            <DownloadIcon class="h-7 w-7 text-blue-600" />
          </div>

          <h2 class="text-2xl font-black dark:text-white text-slate-900">
            No downloads here
          </h2>

          <p class="mt-2 max-w-md text-slate-500 dark:text-white/80">
            {{
              activeTab === 'all'
                ? "You haven't added any downloads yet."
                : `No ${statusLabel(activeTab).toLowerCase()} downloads right now.`
            }}
          </p>

          <button
            type="button"
            class="mt-5 rounded-full bg-blue-500 px-6 py-3 font-black text-white transition hover:bg-blue-600"
            @click="goMovies"
          >
            Browse Movies
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>

import Header from '../Header.vue'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'

import {
  AlertCircleIcon,
  CheckIcon,
  DownloadIcon,
  PauseIcon,
  PlayIcon,
  RefreshCw as RefreshIcon,
  TrashIcon,
  XIcon,
  DownloadCloudIcon,
  Clock3Icon
} from 'lucide-vue-next'

/* =====================================================
   CONFIG
===================================================== */

const API_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  'http://localhost:5000'

const TICK_MS = 800

/*
 * This is a UI simulation on the client.
 * The server stores the resulting bytes / status.
 */
const BYTES_PER_TICK = 1_800_000

/*
 * Set to 0 if you never want simulated failures.
 */
const FAILURE_CHANCE = 0

/* =====================================================
   HELPERS
===================================================== */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  let value = bytes

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index++
  }

  const decimals = value >= 100 || index <= 2 ? 0 : 1

  return `${value.toFixed(decimals)} ${units[index]}`
}

function initials(title) {
  if (!title) {
    return '?'
  }

  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
}

function progressOf(item) {
  if (!item || !Number.isFinite(item.sizeBytes) || item.sizeBytes <= 0) {
    return 0
  }

  const downloaded = Number.isFinite(item.downloadedBytes)
    ? item.downloadedBytes
    : 0

  return clamp(Math.round((downloaded / item.sizeBytes) * 100), 0, 100)
}

/* =====================================================
   TABS
===================================================== */

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Downloading', value: 'downloading' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' }
]

const activeTab = ref('all')

/* =====================================================
   STATE
===================================================== */

const downloads = ref([])
const loading = ref(true)
const errorMessage = ref('')

/*
 * One timer per download.
 */
const timers = new Map()

/* =====================================================
   API
===================================================== */

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  let body = null
  try {
    body = await res.json()
  } catch (e) {
    /* no body */
  }

  if (!res.ok) {
    const message =
      (body && body.error) || `Request failed (${res.status})`
    throw new Error(message)
  }

  return body
}

/* =====================================================
   STATUS
===================================================== */

function statusLabel(status) {
  return (
    {
      all: 'All',
      downloading: 'Downloading',
      pending: 'Pending',
      paused: 'Paused',
      completed: 'Completed',
      failed: 'Failed'
    }[status] || status
  )
}

function statusBadgeClass(status) {
  return (
    {
      downloading: 'bg-blue-100 text-blue-700',
      pending: 'bg-slate-100 text-slate-700',
      paused: 'bg-amber-100 text-amber-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700'
    }[status] || 'bg-slate-100 text-slate-700'
  )
}

function progressBarClass(status) {
  return (
    {
      downloading: 'bg-blue-500',
      pending: 'bg-slate-400',
      paused: 'bg-amber-400'
    }[status] || 'bg-slate-400'
  )
}

/* =====================================================
   COUNTS
===================================================== */

function countByStatus(status) {
  if (status === 'all') {
    return downloads.value.length
  }

  return downloads.value.filter(item => item.status === status).length
}

/* =====================================================
   SUMMARY
===================================================== */

const summaryStats = computed(() => [
  {
    label: 'Downloading',
    value: countByStatus('downloading'),
    color: 'text-blue-600',
    icon: DownloadCloudIcon
  },
  {
    label: 'Pending',
    value: countByStatus('pending'),
    color: 'text-slate-700',
    icon: Clock3Icon
  },
  {
    label: 'Paused',
    value: countByStatus('paused'),
    color: 'text-amber-600',
    icon: PauseIcon
  },
  {
    label: 'Completed',
    value: countByStatus('completed'),
    color: 'text-green-600',
    icon: CheckIcon
  }
])

const totalSizeBytes = computed(() => {
  return downloads.value.reduce((sum, item) => {
    const size = Number(item.sizeBytes)
    return sum + (Number.isFinite(size) ? size : 0)
  }, 0)
})

const totalDownloadedBytes = computed(() => {
  return downloads.value.reduce((sum, item) => {
    const size = Number(item.sizeBytes) || 0
    const downloaded = Number(item.downloadedBytes) || 0
    return sum + clamp(downloaded, 0, size)
  }, 0)
})

const overallProgress = computed(() => {
  if (totalSizeBytes.value <= 0) {
    return 0
  }

  return clamp(
    Math.round(
      (totalDownloadedBytes.value / totalSizeBytes.value) * 100
    ),
    0,
    100
  )
})

/* =====================================================
   FILTERING
===================================================== */

const filteredDownloads = computed(() => {
  if (activeTab.value === 'all') {
    return downloads.value
  }

  return downloads.value.filter(
    item => item.status === activeTab.value
  )
})

/* =====================================================
   POSTER
===================================================== */

function posterStyle(image) {
  if (!image) {
    return {}
  }

  return {
    backgroundImage: `url("${image}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
}

/* =====================================================
   OPEN ITEM
===================================================== */

function openItem(item) {
  if (!item) {
    return
  }

  const path = `/watch/${encodeURIComponent(item.id)}`
  window.location.href = path
}

function goMovies() {
  window.location.href = '/browser'
}

/* =====================================================
   TIMER MANAGEMENT
===================================================== */

function stopTimer(id) {
  const handle = timers.get(id)

  if (handle !== undefined) {
    clearInterval(handle)
    timers.delete(id)
  }
}

function stopAllTimers() {
  for (const handle of timers.values()) {
    clearInterval(handle)
  }

  timers.clear()
}

function startTimer(item) {
  if (!item) {
    return
  }

  stopTimer(item.id)

  const handle = window.setInterval(async () => {
    const live = downloads.value.find(d => d.id === item.id)

    if (!live) {
      stopTimer(item.id)
      return
    }

    if (live.status !== 'downloading') {
      stopTimer(item.id)
      return
    }

    if (FAILURE_CHANCE > 0 && Math.random() < FAILURE_CHANCE) {
      stopTimer(item.id)
      try {
        const updated = await api(`/api/downloads/${live.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            status: 'failed',
            errorMessage:
              'Network error — connection lost during download.'
          })
        })
        if (updated && updated.data) {
          Object.assign(live, updated.data)
        }
      } catch (e) {
        errorMessage.value = e.message
      }
      return
    }

    const size = Number(live.sizeBytes) || 0
    const downloaded = Number(live.downloadedBytes) || 0
    const remaining = Math.max(size - downloaded, 0)
    const step = Math.min(BYTES_PER_TICK, remaining)
    const nextDownloaded = clamp(downloaded + step, 0, size)
    const done = size > 0 && nextDownloaded >= size

    /* Optimistic local update */
    live.downloadedBytes = nextDownloaded
    if (done) {
      live.status = 'completed'
      live.errorMessage = ''
      stopTimer(live.id)
    }

    /* Persist to backend */
    try {
      const updated = await api(`/api/downloads/${live.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          downloadedBytes: nextDownloaded,
          ...(done ? { status: 'completed', errorMessage: '' } : {})
        })
      })
      if (updated && updated.data) {
        Object.assign(live, updated.data)
        if (live.status !== 'downloading') {
          stopTimer(live.id)
        }
      }
    } catch (e) {
      /* Roll back on failure */
      live.downloadedBytes = downloaded
      errorMessage.value = e.message
      stopTimer(live.id)
    }
  }, TICK_MS)

  timers.set(item.id, handle)
}

/* =====================================================
   ACTIONS
===================================================== */

async function pauseDownload(item) {
  if (!item) {
    return
  }

  stopTimer(item.id)
  item.status = 'paused'

  try {
    const res = await api(`/api/downloads/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'paused' })
    })
    if (res && res.data) {
      Object.assign(item, res.data)
    }
  } catch (e) {
    errorMessage.value = e.message
  }
}

async function resumeDownload(item) {
  if (!item) {
    return
  }

  if (item.downloadedBytes >= item.sizeBytes) {
    item.downloadedBytes = item.sizeBytes
    item.status = 'completed'

    try {
      const res = await api(`/api/downloads/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' })
      })
      if (res && res.data) {
        Object.assign(item, res.data)
      }
    } catch (e) {
      errorMessage.value = e.message
    }
    return
  }

  item.status = 'downloading'
  item.errorMessage = ''

  try {
    const res = await api(`/api/downloads/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'downloading', errorMessage: '' })
    })
    if (res && res.data) {
      Object.assign(item, res.data)
    }
  } catch (e) {
    errorMessage.value = e.message
  }

  startTimer(item)
}

async function startDownload(item) {
  if (!item) {
    return
  }

  if (item.downloadedBytes >= item.sizeBytes) {
    item.downloadedBytes = item.sizeBytes
    item.status = 'completed'

    try {
      const res = await api(`/api/downloads/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' })
      })
      if (res && res.data) {
        Object.assign(item, res.data)
      }
    } catch (e) {
      errorMessage.value = e.message
    }
    return
  }

  item.status = 'downloading'
  item.errorMessage = ''

  try {
    const res = await api(`/api/downloads/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'downloading', errorMessage: '' })
    })
    if (res && res.data) {
      Object.assign(item, res.data)
    }
  } catch (e) {
    errorMessage.value = e.message
  }

  startTimer(item)
}

async function removeDownload(item) {
  if (!item) {
    return
  }

  stopTimer(item.id)

  const prev = downloads.value
  downloads.value = downloads.value.filter(d => d.id !== item.id)

  try {
    await api(`/api/downloads/${item.id}`, { method: 'DELETE' })
  } catch (e) {
    downloads.value = prev
    errorMessage.value = e.message
  }
}

async function retryDownload(item) {
  if (!item) {
    return
  }

  stopTimer(item.id)

  if (item.downloadedBytes >= item.sizeBytes) {
    item.downloadedBytes = item.sizeBytes
    item.status = 'completed'

    try {
      const res = await api(`/api/downloads/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' })
      })
      if (res && res.data) {
        Object.assign(item, res.data)
      }
    } catch (e) {
      errorMessage.value = e.message
    }
    return
  }

  item.status = 'downloading'
  item.errorMessage = ''

  try {
    const res = await api(`/api/downloads/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'downloading', errorMessage: '' })
    })
    if (res && res.data) {
      Object.assign(item, res.data)
    }
  } catch (e) {
    errorMessage.value = e.message
  }

  startTimer(item)
}

async function clearAllDownloads() {
  const confirmed = window.confirm('Remove all downloads?')

  if (!confirmed) {
    return
  }

  stopAllTimers()

  const prev = downloads.value
  downloads.value = []

  try {
    await api('/api/downloads', { method: 'DELETE' })
  } catch (e) {
    downloads.value = prev
    errorMessage.value = e.message
  }
}

/* =====================================================
   INITIAL LOAD
===================================================== */

async function loadDownloads() {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await api('/api/downloads')
    downloads.value = Array.isArray(res && res.data) ? res.data : []

    /*
     * If the user has no downloads yet, ask the server to
     * seed the default demo set once. This keeps the page
     * looking alive on first visit.
     */
    if (downloads.value.length === 0) {
      try {
        await api('/api/downloads/seed-defaults', { method: 'POST' })
        const again = await api('/api/downloads')
        downloads.value = Array.isArray(again && again.data)
          ? again.data
          : []
      } catch (e) {
        /* Seeding is best-effort; ignore failures (e.g. already seeded). */
      }
    }

    /*
     * Auto-resume any items the server reports as still
     * downloading (e.g. after a page refresh).
     */
    for (const item of downloads.value) {
      if (item.status === 'downloading') {
        startTimer(item)
      }
    }
  } catch (e) {
    errorMessage.value = e.message || 'Could not load downloads.'
    downloads.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDownloads()
})

/* =====================================================
   CLEANUP
===================================================== */

onBeforeUnmount(() => {
  stopAllTimers()
})

/* =====================================================
   MISC
===================================================== */

const currentYear = new Date().getFullYear()
</script>