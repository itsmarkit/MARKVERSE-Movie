<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">
    <header class="fixed left-0 right-0 top-0 z-50">
      <AdminHeader />
    </header>

    <main class="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-8xl">

        <!-- =========================
             HEADING
        ========================== -->
        <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Admin</p>
            <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Dashboard
              <span class="text-blue-600">Overview</span>
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-slate-500 dark:text-white/70 sm:text-base">
              A snapshot of content, users, and platform activity.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900 dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
              title="Export JSON"
              @click="exportAnalytics"
            >
              <DownloadIcon class="h-4 w-4" />
              Export
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900 dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
              title="Refresh"
              @click="refresh"
            >
              <RefreshCwIcon class="h-4 w-4" :class="refreshing ? 'animate-spin' : ''" />
              Refresh
            </button>
          </div>
        </div>

        <!-- =========================
             LOADING / ERROR
        ========================== -->
        <div
          v-if="loading"
          class="mb-6 flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
        >
          <div class="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
          <p class="text-sm font-bold text-slate-500 dark:text-white/70">
            Loading dashboard…
          </p>
        </div>

        <div
          v-else-if="loadError"
          class="mb-6 flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
        >
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">⚠️</div>
          <h2 class="text-2xl font-black">Failed to load dashboard</h2>
          <p class="mt-2 max-w-md text-sm text-slate-500 dark:text-white/70">
            {{ loadError }}
          </p>
          <button
            type="button"
            class="mt-5 rounded-full bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
            @click="fetchDashboard"
          >
            Try again
          </button>
        </div>

        <template v-else>
          <!-- =========================
               TIME RANGE TABS
          ========================== -->
          <div class="mb-6 flex flex-wrap items-center gap-3">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="r in ranges"
                :key="r.value"
                type="button"
                class="rounded-full px-4 py-2.5 text-sm font-black transition"
                :class="
                  range === r.value
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-black dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-900'
                "
                @click="range = r.value"
              >
                {{ r.label }}
              </button>
            </div>

            <div class="ml-auto flex items-center gap-2">
              <span class="text-xs font-bold text-slate-500 dark:text-white/60">
                {{ rangeLabel }}
              </span>
            </div>
          </div>

          <!-- =========================
               KPI CARDS
          ========================== -->
          <div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div
              v-for="k in kpis"
              :key="k.label"
              class="group rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-black dark:border dark:border-slate-800"
            >
              <div class="flex items-center justify-between">
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  {{ k.label }}
                </p>
                <component :is="k.icon" class="h-5 w-5" :class="k.color" />
              </div>

              <div class="mt-3 flex items-baseline gap-2">
                <p class="text-3xl font-black" :class="k.color">{{ k.value }}</p>
                <span
                  v-if="k.change !== null"
                  class="text-xs font-black"
                  :class="k.change >= 0 ? 'text-emerald-500' : 'text-red-500'"
                >
                  {{ k.change >= 0 ? '+' : '' }}{{ k.change }}%
                </span>
              </div>

              <p class="mt-1 text-[11px] font-semibold text-slate-400">
                {{ k.hint }}
              </p>

              <!-- Mini sparkline -->
              <div class="mt-3 h-8">
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" class="h-full w-full">
                  <polyline
                    :points="k.sparkline"
                    fill="none"
                    :stroke="k.strokeColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <polyline
                    :points="`${k.sparkline} 100,20 0,20`"
                    :fill="k.fillColor"
                    stroke="none"
                    opacity="0.15"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- =========================
               MAIN CHART (Views / Clients)
          ========================== -->
          <div class="mb-6 rounded-2xl bg-white p-5 shadow-sm dark:bg-black dark:border dark:border-slate-800">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-black">System Views & Clients</h2>
                <p class="mt-0.5 text-xs text-slate-500 dark:text-white/60">
                  Total traffic over the selected {{ rangeLabel.toLowerCase() }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-4 text-xs font-bold">
                <span class="inline-flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                  Views
                </span>
                <span class="inline-flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  Unique Clients
                </span>
              </div>
            </div>

            <div class="relative h-64 w-full">
              <svg viewBox="0 0 800 240" preserveAspectRatio="none" class="h-full w-full overflow-visible">
                <g stroke="currentColor" class="text-slate-200 dark:text-slate-800">
                  <line v-for="y in 5" :key="y" x1="0" x2="800" :y1="(y - 1) * 60" :y2="(y - 1) * 60" stroke-dasharray="2 4" />
                </g>

                <g class="fill-slate-400 text-[10px]">
                  <text
                    v-for="(label, i) in yLabels"
                    :key="i"
                    x="4"
                    :y="i * 60 + 12"
                    font-weight="700"
                  >{{ label }}</text>
                </g>

                <polygon :points="viewsArea" fill="url(#viewsGradient)" opacity="0.35" />
                <polyline
                  :points="viewsLine"
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />

                <polygon :points="clientsArea" fill="url(#clientsGradient)" opacity="0.3" />
                <polyline
                  :points="clientsLine"
                  fill="none"
                  stroke="#10b981"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />

                <circle
                  v-for="(p, i) in viewsPoints"
                  :key="'vd' + i"
                  :cx="p.x"
                  :cy="p.y"
                  r="3"
                  fill="#3b82f6"
                  class="opacity-0 transition hover:opacity-100"
                />
                <circle
                  v-for="(p, i) in clientsPoints"
                  :key="'cd' + i"
                  :cx="p.x"
                  :cy="p.y"
                  r="3"
                  fill="#10b981"
                  class="opacity-0 transition hover:opacity-100"
                />

                <defs>
                  <linearGradient id="viewsGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.6" />
                    <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
                  </linearGradient>
                  <linearGradient id="clientsGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.6" />
                    <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <div class="mt-2 flex justify-between text-[10px] font-bold text-slate-400">
                <span v-for="(l, i) in xLabels" :key="i">{{ l }}</span>
              </div>
            </div>
          </div>

          <!-- =========================
               AVERAGES ROW
          ========================== -->
          <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="a in averages"
              :key="a.label"
              class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800"
            >
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                {{ a.label }}
              </p>
              <p class="mt-2 text-2xl font-black" :class="a.color">{{ a.value }}</p>
              <p class="mt-0.5 text-[11px] font-semibold text-slate-400">{{ a.hint }}</p>
            </div>
          </div>

          <!-- =========================
               QUICK ACTIONS
          ========================== -->
          <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <router-link
              to="/admin/upload"
              class="group flex items-center justify-between rounded-2xl bg-blue-500 p-5 text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
            >
              <div>
                <p class="text-xs font-black uppercase tracking-wider opacity-80">Upload</p>
                <p class="mt-1 text-lg font-black">Add new title</p>
              </div>
              <PlusCircleIcon class="h-10 w-10 opacity-80 transition group-hover:scale-110" />
            </router-link>

            <router-link
              to="/admin/upload"
              class="group flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-black dark:border dark:border-slate-800 dark:shadow-white/10"
            >
              <div>
                <p class="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Content</p>
                <p class="mt-1 text-lg font-black">Manage uploads</p>
              </div>
              <FolderIcon class="h-10 w-10 text-blue-500 transition group-hover:scale-110" />
            </router-link>

            <router-link
              to="/admin/users"
              class="group flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-black dark:border dark:border-slate-800 dark:shadow-white/10"
            >
              <div>
                <p class="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Users</p>
                <p class="mt-1 text-lg font-black">Manage users</p>
              </div>
              <UsersIcon class="h-10 w-10 text-blue-500 transition group-hover:scale-110" />
            </router-link>
          </div>

          <!-- =========================
               RECENT + GENRES
          ========================== -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div class="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-lg font-black">Recent Uploads</h2>
                <router-link to="/admin/upload" class="text-sm font-bold text-blue-600 hover:text-blue-800">
                  View all →
                </router-link>
              </div>

              <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                <div
                  v-for="item in recentContent"
                  :key="item.id"
                  class="flex items-center gap-4 py-3"
                >
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-950 text-sm font-black text-white"
                    :style="posterStyle(item.thumbnail || item.image)"
                  >
                    <span v-if="!(item.thumbnail || item.image)">{{ initials(item.title) }}</span>
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-black">{{ item.title }}</p>
                    <p class="truncate text-xs font-semibold text-slate-500 dark:text-white/70">
                      {{ item.genre }} • {{ item.type }} • {{ item.year }}
                    </p>
                  </div>

                  <div class="shrink-0 text-right">
                    <span
                      class="rounded-full px-3 py-1 text-xs font-black"
                      :class="item.type === 'Series' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                    >
                      {{ item.type }}
                    </span>
                    <p class="mt-1 text-[10px] font-semibold text-slate-400">
                      {{ relativeTime(item._createdAt) }}
                    </p>
                  </div>
                </div>

                <p v-if="!recentContent.length" class="py-6 text-center text-sm text-slate-500">
                  No content yet.
                </p>
              </div>
            </div>

            <div class="rounded-2xl bg-white p-5 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <h2 class="mb-4 text-lg font-black">Top Genres</h2>

              <div class="flex flex-col gap-3">
                <div v-for="g in genreBreakdown" :key="g.name">
                  <div class="flex items-center justify-between text-xs font-bold">
                    <span class="truncate text-slate-700 dark:text-white/80">{{ g.name }}</span>
                    <span class="text-slate-500 dark:text-white/70">{{ g.count }}</span>
                  </div>
                  <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      class="h-full rounded-full bg-blue-500"
                      :style="{ width: g.percent + '%' }"
                    ></div>
                  </div>
                </div>

                <p v-if="!genreBreakdown.length" class="py-6 text-center text-sm text-slate-500">
                  No data yet.
                </p>
              </div>
            </div>
          </div>

          <!-- =========================
               TOP USERS + COMMENTS
          ========================== -->
          <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="rounded-2xl bg-white p-5 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <h2 class="mb-4 text-lg font-black">Top Users by Downloads</h2>

              <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                <div
                  v-for="(u, i) in topUsers"
                  :key="u.id"
                  class="flex items-center gap-3 py-3"
                >
                  <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black dark:bg-slate-800">
                    {{ i + 1 }}
                  </span>
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-black text-white"
                  >
                    <img v-if="u.avatar" :src="u.avatar" class="h-full w-full object-cover" />
                    <span v-else>{{ initials(u.name) }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-black">{{ u.name }}</p>
                    <p class="truncate text-[11px] text-slate-500 dark:text-white/60">{{ u.email }}</p>
                  </div>
                  <span class="shrink-0 text-sm font-black text-blue-600">
                    {{ u.downloads }}
                  </span>
                </div>

                <p v-if="!topUsers.length" class="py-6 text-center text-sm text-slate-500">
                  No users yet.
                </p>
              </div>
            </div>

            <div class="rounded-2xl bg-white p-5 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <h2 class="mb-4 text-lg font-black">Comments Activity</h2>

              <div class="grid grid-cols-3 gap-3">
                <div class="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-900">
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Total
                  </p>
                  <p class="mt-1 text-2xl font-black text-blue-600">{{ commentsStats.total }}</p>
                </div>
                <div class="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-900">
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Approved
                  </p>
                  <p class="mt-1 text-2xl font-black text-emerald-600">{{ commentsStats.approved }}</p>
                </div>
                <div class="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-900">
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Pending
                  </p>
                  <p class="mt-1 text-2xl font-black text-amber-600">{{ commentsStats.pending }}</p>
                </div>
              </div>

              <div class="mt-5">
                <p class="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Activity ({{ rangeLabel.toLowerCase() }})
                </p>
                <div class="flex h-24 items-end gap-1.5">
                  <div
                    v-for="(h, i) in commentsSeries"
                    :key="i"
                    class="flex-1 rounded-t bg-blue-500/70 transition hover:bg-blue-500"
                    :style="{ height: `${h}%` }"
                  ></div>
                </div>
                <div class="mt-2 flex justify-between text-[10px] font-bold text-slate-400">
                  <span v-for="(l, i) in xLabels" :key="i">{{ l }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import AdminHeader from '../admin/AdminHeader.vue'

import {
  FilmIcon,
  TvIcon,
  UsersIcon,
  DownloadCloudIcon,
  PlusCircleIcon,
  FolderIcon,
  EyeIcon,
  MessageSquareIcon,
  TrendingUpIcon,
  DownloadIcon,
  RefreshCwIcon
} from 'lucide-vue-next'

/* =====================================================
   API
===================================================== */
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json().catch(() => ({}))
}

/* =====================================================
   TIME RANGE
===================================================== */
const ranges = [
  { label: 'Day',   value: 'day' },
  { label: 'Week',  value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year',  value: 'year' }
]

const range = ref('week')
const refreshing = ref(false)

const rangeLabel = computed(() => {
  return {
    day:   'Last 24 hours',
    week:  'Last 7 days',
    month: 'Last 30 days',
    year:  'Last 12 months'
  }[range.value]
})

/* =====================================================
   STATE
===================================================== */
const loading = ref(true)
const loadError = ref(null)

const dashboard = ref({
  views: [],
  clients: [],
  labels: [],
  totalViews: 0,
  totalClients: 0,
  prevViewsTotal: 0,
  prevClientsTotal: 0,
  totalMovies: 0,
  totalSeries: 0,
  totalDownloads: 0,
  totalUploads: 0,
  totalUsers: 0,
  activeUsers: 0,
  totalComments: 0,
  approvedComments: 0,
  pendingComments: 0,
  commentsSeries: [],
  genreBreakdown: [],
  topUsers: [],
  recentContent: [],
  avgDownloadsPerUser: 0,
  avgUploadsPerUser: 0,
  avgRating: 0,
  ratedCount: 0
})

/* =====================================================
   FETCH
===================================================== */
async function fetchDashboard() {
  loading.value = true
  loadError.value = null

  try {
    const data = await apiFetch(`/admin/dashboard?range=${range.value}`)
    const payload = data?.data ?? data

    dashboard.value = {
      views: Array.isArray(payload.views) ? payload.views : [],
      clients: Array.isArray(payload.clients) ? payload.clients : [],
      labels: Array.isArray(payload.labels) ? payload.labels : [],
      totalViews: Number(payload.totalViews ?? 0),
      totalClients: Number(payload.totalClients ?? 0),
      prevViewsTotal: Number(payload.prevViewsTotal ?? 0),
      prevClientsTotal: Number(payload.prevClientsTotal ?? 0),
      totalMovies: Number(payload.totalMovies ?? 0),
      totalSeries: Number(payload.totalSeries ?? 0),
      totalDownloads: Number(payload.totalDownloads ?? 0),
      totalUploads: Number(payload.totalUploads ?? 0),
      totalUsers: Number(payload.totalUsers ?? 0),
      activeUsers: Number(payload.activeUsers ?? 0),
      totalComments: Number(payload.totalComments ?? 0),
      approvedComments: Number(payload.approvedComments ?? 0),
      pendingComments: Number(payload.pendingComments ?? 0),
      commentsSeries: Array.isArray(payload.commentsSeries) ? payload.commentsSeries : [],
      genreBreakdown: Array.isArray(payload.genreBreakdown) ? payload.genreBreakdown : [],
      topUsers: Array.isArray(payload.topUsers) ? payload.topUsers : [],
      recentContent: Array.isArray(payload.recentContent) ? payload.recentContent : [],
      avgDownloadsPerUser: Number(payload.avgDownloadsPerUser ?? 0),
      avgUploadsPerUser: Number(payload.avgUploadsPerUser ?? 0),
      avgRating: Number(payload.avgRating ?? 0),
      ratedCount: Number(payload.ratedCount ?? 0)
    }
  } catch (err) {
    loadError.value = err?.message || 'Failed to load dashboard.'
  } finally {
    loading.value = false
  }
}

/* Refetch when the range changes */
watch(range, () => {
  fetchDashboard()
})

/* =====================================================
   CHART PATH BUILDERS
===================================================== */
const CHART_W = 800
const CHART_H = 240

function buildChartPoints(series) {
  if (!series.length) return []
  const max = Math.max(...series, 1)
  return series.map((v, i) => ({
    x: (i / Math.max(series.length - 1, 1)) * CHART_W,
    y: CHART_H - (v / max) * (CHART_H - 20) - 10
  }))
}

function pointsToLine(points) {
  return points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
}

function pointsToArea(points) {
  if (!points.length) return ''
  const line = pointsToLine(points)
  return `0,${CHART_H} ${line} ${CHART_W},${CHART_H}`
}

const viewsPoints   = computed(() => buildChartPoints(dashboard.value.views))
const clientsPoints = computed(() => buildChartPoints(dashboard.value.clients))

const viewsLine   = computed(() => pointsToLine(viewsPoints.value))
const clientsLine = computed(() => pointsToLine(clientsPoints.value))
const viewsArea   = computed(() => pointsToArea(viewsPoints.value))
const clientsArea = computed(() => pointsToArea(clientsPoints.value))

const yLabels = computed(() => {
  const max = Math.max(...dashboard.value.views, ...dashboard.value.clients, 1)
  return [4, 3, 2, 1, 0].map(i => {
    const v = Math.round((max * i) / 4)
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
    return String(v)
  })
})

const xLabels = computed(() => {
  const labels = dashboard.value.labels
  if (labels.length <= 6) return labels
  const step = Math.ceil(labels.length / 6)
  return labels.filter((_, i) => i % step === 0)
})

/* =====================================================
   SPARKLINE HELPER
===================================================== */
function sparklinePath(series) {
  if (!series || !series.length) return '0,18 100,18'
  const max = Math.max(...series, 1)
  return series
    .map((v, i) => {
      const x = (i / Math.max(series.length - 1, 1)) * 100
      const y = 20 - (v / max) * 18
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

/* =====================================================
   KPI CARDS
===================================================== */
function changePct(current, prev) {
  if (!prev) return null
  return Math.round(((current - prev) / prev) * 1000) / 10
}

const kpis = computed(() => {
  const d = dashboard.value

  return [
    {
      label: 'System Views',
      value: formatNumber(d.totalViews),
      hint: `vs ${formatNumber(d.prevViewsTotal)} prev`,
      change: changePct(d.totalViews, d.prevViewsTotal),
      color: 'text-blue-600',
      strokeColor: '#3b82f6',
      fillColor: '#3b82f6',
      icon: EyeIcon,
      sparkline: sparklinePath(d.views)
    },
    {
      label: 'Unique Clients',
      value: formatNumber(d.totalClients),
      hint: `vs ${formatNumber(d.prevClientsTotal)} prev`,
      change: changePct(d.totalClients, d.prevClientsTotal),
      color: 'text-emerald-600',
      strokeColor: '#10b981',
      fillColor: '#10b981',
      icon: UsersIcon,
      sparkline: sparklinePath(d.clients)
    },
    {
      label: 'Downloads',
      value: formatNumber(d.totalDownloads),
      hint: 'All-time',
      change: null,
      color: 'text-amber-600',
      strokeColor: '#f59e0b',
      fillColor: '#f59e0b',
      icon: DownloadCloudIcon,
      sparkline: sparklinePath(d.views)
    },
    {
      label: 'Uploads',
      value: formatNumber(d.totalUploads),
      hint: 'By users',
      change: null,
      color: 'text-purple-600',
      strokeColor: '#a855f7',
      fillColor: '#a855f7',
      icon: TrendingUpIcon,
      sparkline: sparklinePath(d.clients)
    },
    {
      label: 'Movies',
      value: d.totalMovies,
      hint: 'Published titles',
      change: null,
      color: 'text-blue-600',
      strokeColor: '#3b82f6',
      fillColor: '#3b82f6',
      icon: FilmIcon,
      sparkline: sparklinePath(d.views)
    },
    {
      label: 'Series',
      value: d.totalSeries,
      hint: 'Published series',
      change: null,
      color: 'text-fuchsia-600',
      strokeColor: '#d946ef',
      fillColor: '#d946ef',
      icon: TvIcon,
      sparkline: sparklinePath(d.clients)
    },
    {
      label: 'User Accounts',
      value: d.totalUsers,
      hint: `${d.activeUsers} active`,
      change: null,
      color: 'text-green-600',
      strokeColor: '#22c55e',
      fillColor: '#22c55e',
      icon: UsersIcon,
      sparkline: sparklinePath(d.views)
    },
    {
      label: 'Comments',
      value: d.totalComments,
      hint: 'All-time',
      change: null,
      color: 'text-rose-600',
      strokeColor: '#f43f5e',
      fillColor: '#f43f5e',
      icon: MessageSquareIcon,
      sparkline: sparklinePath(d.commentsSeries)
    }
  ]
})

/* =====================================================
   AVERAGES
===================================================== */
const averages = computed(() => {
  const d = dashboard.value
  const activeRate = d.totalUsers ? Math.round((d.activeUsers / d.totalUsers) * 100) : 0

  return [
    {
      label: 'Avg Downloads / User',
      value: d.avgDownloadsPerUser.toFixed(1),
      hint: 'All users',
      color: 'text-amber-600'
    },
    {
      label: 'Avg Uploads / User',
      value: d.avgUploadsPerUser.toFixed(1),
      hint: 'All users',
      color: 'text-purple-600'
    },
    {
      label: 'Avg Rating',
      value: d.avgRating.toFixed(1),
      hint: `${d.ratedCount} rated`,
      color: 'text-blue-600'
    },
    {
      label: 'Active Rate',
      value: `${activeRate}%`,
      hint: `${d.activeUsers} / ${d.totalUsers} users`,
      color: 'text-emerald-600'
    }
  ]
})

/* =====================================================
   RECENT CONTENT
===================================================== */
const recentContent = computed(() => dashboard.value.recentContent)

/* =====================================================
   GENRE BREAKDOWN
===================================================== */
const genreBreakdown = computed(() => {
  const list = dashboard.value.genreBreakdown
  if (!list.length) return []
  const total = list.reduce((s, g) => s + (g.count || 0), 0) || 1
  return list.map(g => ({
    name: g.name,
    count: g.count || 0,
    percent: g.percent ?? Math.round(((g.count || 0) / total) * 100)
  }))
})

/* =====================================================
   TOP USERS
===================================================== */
const topUsers = computed(() => dashboard.value.topUsers)

/* =====================================================
   COMMENTS STATS
===================================================== */
const commentsStats = computed(() => ({
  total: dashboard.value.totalComments,
  approved: dashboard.value.approvedComments,
  pending: dashboard.value.pendingComments
}))

const commentsSeries = computed(() => dashboard.value.commentsSeries)

/* =====================================================
   HELPERS
===================================================== */
function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function initials(title) {
  if (!title) return '?'
  return title.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function posterStyle(image) {
  if (!image) return {}
  return {
    backgroundImage: `url("${image}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
}

function relativeTime(ts) {
  if (!ts) return 'just now'
  const diff = Date.now() - Number(ts)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const mo = Math.floor(day / 30)
  return `${mo}mo ago`
}

/* =====================================================
   ACTIONS
===================================================== */
function exportAnalytics() {
  const data = {
    range: range.value,
    generatedAt: new Date().toISOString(),
    kpis: kpis.value.map(k => ({ label: k.label, value: k.value, change: k.change })),
    averages: averages.value,
    genres: genreBreakdown.value,
    topUsers: topUsers.value.map(u => ({ name: u.name, downloads: u.downloads })),
    comments: commentsStats.value
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard-${range.value}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function refresh() {
  refreshing.value = true
  await fetchDashboard()
  setTimeout(() => { refreshing.value = false }, 400)
}

/* =====================================================
   LIFECYCLE
===================================================== */
onMounted(() => {
  fetchDashboard()
})
</script>