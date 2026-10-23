<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  Home, Film, Tv, Search, X, Clock, TrendingUp, ArrowRight, Loader2
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

/* ---------- API base ----------
 * Priority:
 *   1) VITE_API_BASE (explicit)
 *   2) Same host as the page, port 5000 (LAN-friendly)
 *   3) localhost:5000 fallback (SSR-safe)
 * Note: when running `npm run dev` with the vite proxy in vite.config.ts,
 *       set VITE_API_BASE=/api so requests are same-origin.
 */
const API_BASE = (() => {
  const envBase = (import.meta as any).env?.VITE_API_BASE
  if (envBase) return String(envBase).replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    return `${protocol}//${hostname}:5000/api`
  }
  return 'http://localhost:5000/api'
})()

/* ---------- NAV ---------- */
const publicNavItems = [
  { to: '/',         label: 'Home',     short: 'Home',     icon: Home },
  { to: '/movies',   label: 'Movies',   short: 'Movies',   icon: Film },
  { to: '/series',   label: 'Series',   short: 'Series',   icon: Film },
  { to: '/channels', label: 'Channels', short: 'Channels', icon: Tv }
]
const navItems = computed(() => publicNavItems)
const MobileNavItems = computed(() => [
  { to: '/',         label: 'Home',     short: 'Home',     icon: Home },
  { to: '/movies',   label: 'Movies',   short: 'Movies',   icon: Film },
  { to: '/series',   label: 'Series',   short: 'Series',   icon: Tv },
  { to: '/channels', label: 'Channels', short: 'Channels', icon: Tv }
])

function isActive(path: string) {
  if (path === '/') return route.path === path
  return route.path.startsWith(path)
}

/* ---------- SEARCH STATE ---------- */
const isSearchOpen = ref(false)
const searchQuery  = ref('')
const searchInput  = ref<HTMLInputElement | null>(null)
const activeFilter = ref<'all' | 'movies' | 'series'>('all')

type ApiResult = {
  id: string
  _id?: string
  title: string
  type: string                 // "Movie" | "Series" (from backend serializer)
  genre?: string
  year?: string
  rating?: string
  image?: string
  thumbnail?: string
}
const apiResults = ref<ApiResult[]>([])
const isLoading  = ref(false)
const errorMsg   = ref('')

const recentSearches = ref<string[]>([])
const trendingSearches = ['Dune', 'The Last of Us', 'Oppenheimer', 'Stranger Things', 'Interstellar']

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let activeController: AbortController | null = null

/* ---------- FETCH ---------- */
async function fetchSearch(q: string) {
  const term = q.trim()
  if (!term) {
    apiResults.value = []
    isLoading.value = false
    errorMsg.value = ''
    return
  }

  activeController?.abort()
  const controller = new AbortController()
  activeController = controller

  isLoading.value = true
  errorMsg.value = ''

  try {
    const url = `${API_BASE}/search?q=${encodeURIComponent(term)}&limit=20`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    })
    if (!res.ok) throw new Error(`Search failed (${res.status})`)

    const json = await res.json()

    // Backend returns { data: [...] } — but tolerate { results: [...] } too
    const list: ApiResult[] = Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.results)
        ? json.results
        : Array.isArray(json)
          ? json
          : []

    apiResults.value = list
  } catch (e: any) {
    if (e?.name === 'AbortError') return
    console.error('Search error:', e)
    errorMsg.value = 'Could not reach search service.'
    apiResults.value = []
  } finally {
    if (activeController === controller) isLoading.value = false
  }
}

watch(searchQuery, (q) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const term = q.trim()
  if (!term) {
    apiResults.value = []
    isLoading.value = false
    errorMsg.value = ''
    return
  }
  debounceTimer = setTimeout(() => fetchSearch(term), 250)
})

/* ---------- RESULTS ---------- */
const filteredResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return apiResults.value
    .filter((item) => {
      if (activeFilter.value === 'all') return true
      const t = (item.type || '').toLowerCase()
      return activeFilter.value === 'movies' ? t === 'movie' : t === 'series'
    })
    .slice(0, 8)
    .map((item) => ({
      id: String(item.id || item._id || ''),
      title: item.title,
      type: (item.type || 'Movie').toLowerCase() === 'series' ? 'series' : 'movies',
      year: item.year || '',
      rating: item.rating || '',
      image: item.image || item.thumbnail || ''
    }))
})

const resultCounts = computed(() => {
  const list = apiResults.value
  if (!searchQuery.value.trim()) return { all: 0, movies: 0, series: 0 }
  return {
    all: list.length,
    movies: list.filter((i) => (i.type || '').toLowerCase() === 'movie').length,
    series: list.filter((i) => (i.type || '').toLowerCase() === 'series').length
  }
})

/* ---------- ACTIONS ---------- */
function openSearch() {
  isSearchOpen.value = true
  nextTick(() => searchInput.value?.focus())
}

function closeSearch() {
  isSearchOpen.value = false
  searchQuery.value = ''
  activeFilter.value = 'all'
  apiResults.value = []
  errorMsg.value = ''
}

function saveRecentSearch(term: string) {
  const t = term.trim()
  if (!t) return
  const updated = [t, ...recentSearches.value.filter(s => s.toLowerCase() !== t.toLowerCase())].slice(0, 5)
  recentSearches.value = updated
  try { localStorage.setItem('markverse_recent_searches', JSON.stringify(updated)) } catch {}
}

function submitSearch(term?: string) {
  const q = (term ?? searchQuery.value).trim()
  if (!q) return
  saveRecentSearch(q)

  // Prefer /search route if it exists; otherwise fall back to in-panel results.
  const routerAny = router as any
  const hasSearchRoute =
    routerAny.hasRoute?.('search') ||
    routerAny.getRoutes?.().some((r: any) => r.path === '/search')

  if (hasSearchRoute) {
    router.push({ path: '/search', query: { q } })
    closeSearch()
  } else {
    // Inline search — just run it (keeps results visible)
    searchQuery.value = q
    fetchSearch(q)
  }
}

function clearRecent() {
  recentSearches.value = []
  try { localStorage.removeItem('markverse_recent_searches') } catch {}
}

function goToResult(item: { id: string; type: string; title: string }) {
  if (!item.id) {
    // No id → just re-run search on that title
    submitSearch(item.title)
    return
  }
  saveRecentSearch(item.title)
  router.push(`/watch/${item.id}`)
  closeSearch()
}

/* ---------- KEYBOARD ---------- */
function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    isSearchOpen.value ? closeSearch() : openSearch()
    return
  }
  if (e.key === 'Escape' && isSearchOpen.value) closeSearch()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  try {
    const stored = localStorage.getItem('markverse_recent_searches')
    if (stored) recentSearches.value = JSON.parse(stored)
  } catch {}
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  activeController?.abort()
  if (debounceTimer) clearTimeout(debounceTimer)
})

watch(isSearchOpen, (open) => {
  if (open) nextTick(() => searchInput.value?.focus())
})
</script>
<template>
  <header class="relative z-50 w-full px-3 sm:px-4 md:px-6 lg:px-8">
    <div>
      <div class="relative overflow-visible">
        <div class="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <div class="flex min-h-[70px] items-center gap-3 px-3 py-2.5 sm:px-4 md:px-5 lg:min-h-[76px] lg:px-6">
          <router-link to="/" class="group flex shrink-0 items-center gap-2.5" aria-label="Go to MARKVERSE home">
            <div class="flex flex-col items-center">
              <div class="logo-float flex items-center justify-center">
                <img src="../assets/markverse.png" width="70" height="70" alt="MARKVERSE" />
              </div>
            </div>
            <div class="hidden xs:block">
              <div class="text-[17px] font-black leading-none tracking-tight sm:text-xl lg:text-[21px]">
                <span class="text-slate-950 dark:text-white">MARK</span><span class="text-blue-600">VERSE</span>
              </div>
              <div class="mt-1 hidden text-[8px] font-bold uppercase tracking-[0.25em] text-slate-400 lg:block dark:text-slate-500">
                Stream • Discover • Enjoy
              </div>
            </div>
          </router-link>

          <nav class="ml-5 hidden flex-1 items-center justify-center lg:flex" aria-label="Desktop navigation">
            <div class="flex items-center gap-1 rounded-2xl bg-slate-100/80 p-1 dark:bg-white/[0.04]">
              <router-link
                v-for="item in navItems" :key="item.to" :to="item.to"
                class="group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all duration-200 xl:px-4"
                :class="isActive(item.to)
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-white/[0.09] dark:text-blue-400'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'"
              >
                <component :is="item.icon" class="h-[17px] w-[17px]" :class="isActive(item.to) ? 'stroke-[2.4]' : 'stroke-[2]'" />
                <span>{{ item.label }}</span>
                <span v-if="isActive(item.to)" class="absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-400" />
              </router-link>
            </div>
          </nav>

          <div class="ml-auto flex items-center lg:ml-0">
            <button
              type="button" @click="openSearch"
              class="group flex h-10 w-10 items-center justify-center rounded-xl text-slate-800 transition-all duration-200 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-white/[0.09] dark:hover:text-white"
              aria-label="Search"
            >
              <Search class="h-[19px] w-[19px] stroke-[2] transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <Transition name="search-fade">
      <div
        v-if="isSearchOpen"
        class="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/60 px-3 pt-[12vh] backdrop-blur-sm sm:px-4 sm:pt-[14vh]"
        @click.self="closeSearch"
      >
        <div class="search-panel w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#111b21]">
          <div class="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <Search class="h-5 w-5 shrink-0 text-slate-400" />
            <input
              ref="searchInput" v-model="searchQuery" type="text"
              placeholder="Search movies, series..."
              class="min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              @keydown.enter="submitSearch()"
            />
            <button
              v-if="searchQuery" type="button"
              class="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
              aria-label="Clear search" @click="searchQuery = ''"
            >
              <X class="h-4 w-4" />
            </button>
            <kbd class="hidden shrink-0 rounded-md border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-600 dark:text-slate-400 sm:block">
              ESC
            </kbd>
          </div>

          <div class="flex items-center gap-1.5 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <button
              v-for="filter in [
                { key: 'all', label: 'All' },
                { key: 'movies', label: 'Movies' },
                { key: 'series', label: 'Series' }
              ]"
              :key="filter.key" type="button"
              class="rounded-lg px-2.5 py-1 text-xs font-semibold transition"
              :class="activeFilter === filter.key
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]'"
              @click="activeFilter = filter.key as 'all' | 'movies' | 'series'"
            >
              {{ filter.label }}
              <span v-if="searchQuery && resultCounts[filter.key as 'all' | 'movies' | 'series']" class="ml-0.5 opacity-70">
                ({{ resultCounts[filter.key as 'all' | 'movies' | 'series'] }})
              </span>
            </button>
          </div>

          <div class="max-h-[52vh] overflow-y-auto p-2">
            <template v-if="searchQuery">
              <div v-if="isLoading" class="flex items-center justify-center gap-2 py-10">
                <Loader2 class="h-4 w-4 animate-spin text-blue-600" />
                <span class="text-xs text-slate-500 dark:text-slate-400">Searching…</span>
              </div>

              <div v-else-if="errorMsg" class="flex flex-col items-center justify-center py-10 text-center">
                <p class="text-sm font-semibold text-rose-600">{{ errorMsg }}</p>
                <button type="button" class="mt-2 text-xs font-semibold text-blue-600 hover:underline" @click="fetchSearch(searchQuery)">
                  Retry
                </button>
              </div>

              <div v-else-if="filteredResults.length" class="space-y-0.5">
                <p class="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Results</p>

                <button
                  v-for="item in filteredResults" :key="item.id" type="button"
                  class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                  @click="goToResult(item)"
                >
                  <div class="relative h-11 w-8 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <img v-if="item.image" :src="item.image" :alt="item.title" class="h-full w-full object-cover" loading="lazy" />
                    <span v-else class="flex h-full w-full items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      {{ item.type === 'movies' ? '🎬' : '📺' }}
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-slate-900 dark:text-white">{{ item.title }}</p>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">
                      <span v-if="item.year">{{ item.year }} · </span>
                      {{ item.type === 'movies' ? 'Movie' : 'Series' }}
                      <span v-if="item.rating"> · ⭐ {{ item.rating }}</span>
                    </p>
                  </div>
                  <ArrowRight class="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </button>
              </div>

              <div v-else class="flex flex-col items-center justify-center py-10 text-center">
                <Search class="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">No results for "{{ searchQuery }}"</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Try a different title or filter.</p>
              </div>
            </template>

            <template v-else>
              <div v-if="recentSearches.length" class="mb-2">
                <div class="flex items-center justify-between px-3 pb-1 pt-2">
                  <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Clock class="h-3 w-3" /> Recent
                  </p>
                  <button type="button" class="text-[10px] font-semibold text-blue-600 hover:underline dark:text-blue-400" @click="clearRecent">Clear</button>
                </div>
                <button
                  v-for="term in recentSearches" :key="term" type="button"
                  class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.05]"
                  @click="submitSearch(term)"
                >
                  <Clock class="h-3.5 w-3.5 text-slate-400" />
                  <span class="truncate">{{ term }}</span>
                </button>
              </div>

              <div>
                <p class="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <TrendingUp class="h-3 w-3" /> Trending
                </p>
                <div class="flex flex-wrap gap-1.5 px-3 py-2">
                  <button
                    v-for="term in trendingSearches" :key="term" type="button"
                    class="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
                    @click="submitSearch(term)"
                  >
                    {{ term }}
                  </button>
                </div>
              </div>
            </template>
          </div>

          <div class="hidden items-center gap-3 border-t border-slate-200 px-4 py-2 text-[10px] text-slate-400 dark:border-slate-700 sm:flex">
            <span><kbd class="font-semibold">↵</kbd> to search</span>
            <span><kbd class="font-semibold">ESC</kbd> to close</span>
            <span class="ml-auto"><kbd class="font-semibold">⌘K</kbd> to toggle</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <nav
    class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-[#111b21] md:hidden"
    aria-label="Mobile bottom navigation"
  >
    <router-link
      v-for="item in MobileNavItems" :key="item.to" :to="item.to"
      class="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors duration-200"
      :class="isActive(item.to)
        ? 'text-[#1daa61] dark:text-[#1daa61]'
        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
    >
      <component :is="item.icon" class="h-[22px] w-[22px]" :class="isActive(item.to) ? 'stroke-[2.2]' : 'stroke-[1.8]'" />
      <span class="truncate">{{ item.short || item.label }}</span>
    </router-link>
  </nav>

  <div class="h-20 md:hidden" />
</template>

<style scoped>
.logo-float { animation: floatUpDown 3s ease-in-out infinite; }
@keyframes floatUpDown {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
.logo-float:hover { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .logo-float { animation: none; } }

.search-fade-enter-active, .search-fade-leave-active { transition: opacity 0.18s ease; }
.search-fade-enter-from, .search-fade-leave-to { opacity: 0; }
.search-fade-enter-active .search-panel, .search-fade-leave-active .search-panel {
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease;
}
.search-fade-enter-from .search-panel { transform: translateY(-10px) scale(0.98); opacity: 0; }
.search-fade-leave-to .search-panel { transform: translateY(-6px) scale(0.99); opacity: 0; }
</style>
