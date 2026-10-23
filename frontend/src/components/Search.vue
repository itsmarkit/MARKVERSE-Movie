<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SearchIcon, XIcon, ArrowLeftIcon, PlayIcon, StarIcon } from 'lucide-vue-next'
import Header from './Header.vue'

const route = useRoute()
const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/* =====================================================
   STATE
===================================================== */
const query = ref(route.query.q || '')
const inputValue = ref(route.query.q || '')
const results = ref([])
const loading = ref(false)
const error = ref('')

/* Debounce + abort controller */
let debounceTimer = null
let abortController = null

/* =====================================================
   SEARCH
===================================================== */
async function runSearch(q, { signal } = {}) {
  const trimmed = q?.trim()
  if (!trimmed) {
    results.value = []
    loading.value = false
    error.value = ''
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await fetch(
      `${API_BASE}/search?q=${encodeURIComponent(trimmed)}&limit=40`,
      { signal }
    )

    if (!res.ok) throw new Error(`Search failed (${res.status})`)

    const json = await res.json()
    results.value = Array.isArray(json?.data) ? json.data : []
  } catch (e) {
    if (e.name === 'AbortError') return
    error.value = 'Search failed. Please try again.'
    results.value = []
  } finally {
    if (!signal?.aborted) loading.value = false
  }
}

/* =====================================================
   INPUT HANDLER (debounced)
===================================================== */
function onInput() {
  const value = inputValue.value

  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    // Sync URL without full navigation
    const nextQuery = value.trim()
    const currentQ = route.query.q || ''

    if (nextQuery !== currentQ) {
      router.replace({
        query: nextQuery ? { ...route.query, q: nextQuery } : omitQ(route.query)
      })
    }

    // Run search immediately
    if (abortController) abortController.abort()
    abortController = new AbortController()
    runSearch(value, { signal: abortController.signal })
  }, 300)
}

function omitQ(query) {
  const { q, ...rest } = query
  return rest
}

function clearSearch() {
  inputValue.value = ''
  if (debounceTimer) clearTimeout(debounceTimer)
  if (abortController) abortController.abort()
  results.value = []
  error.value = ''
  router.replace({ query: omitQ(route.query) })
}

/* =====================================================
   WATCH ROUTE (external navigation / back button)
===================================================== */
watch(
  () => route.query.q,
  (q) => {
    const next = q || ''
    if (next === inputValue.value.trim()) return

    query.value = next
    inputValue.value = next

    if (abortController) abortController.abort()
    abortController = new AbortController()
    runSearch(next, { signal: abortController.signal })
  },
  { immediate: true }
)

/* =====================================================
   CLEANUP
===================================================== */
onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (abortController) abortController.abort()
})

/* =====================================================
   HELPERS
===================================================== */
const resultCount = computed(() => results.value.length)

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

function posterStyle(image) {
  if (!image) return {}
  return {
    backgroundImage: `url("${image}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
}

function mediaLabel(item) {
  const type = String(item?.type || '').toLowerCase()
  if (type === 'series') return 'Series'
  if (type === 'movie') return 'Movie'
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Title'
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">

    <!-- HEADER -->
    <header class="fixed left-0 right-0 top-0 z-50">
      <Header />
    </header>

    <main class="mx-auto max-w-[1600px] px-3 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">

      <!-- BACK + SEARCH BAR -->
      <div class="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-4">

        <button
          type="button"
          @click="goBack"
          class="inline-flex w-fit items-center gap-2 rounded-full
                 bg-white px-4 py-2.5 text-sm font-bold text-slate-700
                 shadow-sm transition hover:bg-slate-100 hover:text-blue-600
                 dark:bg-black dark:text-white dark:shadow-white/20 dark:hover:bg-slate-800"
        >
          <ArrowLeftIcon class="h-4 w-4" />
          Back
        </button>

        <div class="relative flex-1">

          <SearchIcon
            class="pointer-events-none absolute left-4 top-1/2 h-5 w-5
                   -translate-y-1/2 text-slate-400"
          />

          <input
            v-model="inputValue"
            type="search"
            placeholder="Search movies, series, genres..."
            autofocus
            @input="onInput"
            class="w-full rounded-xl border border-slate-300 bg-white
                   py-3 pl-12 pr-12 text-sm font-medium text-slate-900
                   outline-none shadow-sm transition
                   placeholder:text-slate-400
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                   dark:border-slate-800 dark:bg-black dark:text-white
                   dark:placeholder:text-slate-500
                   sm:text-base"
          />

          <button
            v-if="inputValue"
            type="button"
            aria-label="Clear search"
            @click="clearSearch"
            class="absolute right-2 top-1/2 flex h-8 w-8
                   -translate-y-1/2 items-center justify-center
                   rounded-full text-slate-400 transition
                   hover:bg-slate-100 hover:text-slate-900
                   dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <XIcon class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- TITLE / COUNT -->
      <div
        v-if="query"
        class="mb-6 flex flex-col gap-1 sm:mb-8 sm:flex-row sm:items-end sm:justify-between"
      >
        <h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
          Search results for
          <span class="text-blue-600">"{{ query }}"</span>
        </h1>

        <p class="text-xs text-slate-500 dark:text-white/70 sm:text-sm">
          {{ resultCount }} {{ resultCount === 1 ? 'result' : 'results' }}
        </p>
      </div>

      <!-- LOADING -->
      <section
        v-if="loading"
        class="flex min-h-[280px] flex-col items-center justify-center
               rounded-2xl bg-white p-6 text-center shadow-lg
               dark:bg-black dark:ring-1 dark:ring-slate-800
               sm:min-h-[350px] sm:p-10"
      >
        <div
          class="mb-4 h-8 w-8 animate-spin rounded-full
                 border-4 border-slate-200 border-t-blue-500
                 sm:h-10 sm:w-10"
        ></div>
        <p class="text-xs font-bold text-slate-500 dark:text-white/70 sm:text-sm">
          Searching…
        </p>
      </section>

      <!-- ERROR -->
      <section
        v-else-if="error"
        class="flex min-h-[280px] flex-col items-center justify-center
               rounded-2xl bg-white p-6 text-center shadow-lg
               dark:bg-black dark:ring-1 dark:ring-slate-800
               sm:min-h-[350px] sm:p-10"
      >
        <div
          class="mb-4 flex h-12 w-12 items-center justify-center
                 rounded-full bg-red-100 text-xl
                 sm:h-16 sm:w-16 sm:text-2xl"
        >
          ⚠️
        </div>
        <h2 class="text-xl font-extrabold sm:text-2xl">Search failed</h2>
        <p class="mt-2 max-w-md text-xs text-slate-500 dark:text-white/70 sm:text-sm">
          {{ error }}
        </p>
        <button
          type="button"
          @click="runSearch(inputValue)"
          class="mt-5 rounded-full bg-blue-500 px-5 py-2.5 text-sm
                 font-bold text-white transition hover:bg-blue-600
                 sm:px-6 sm:py-3 sm:text-base"
        >
          Try again
        </button>
      </section>

      <!-- EMPTY -->
      <section
        v-else-if="query && !results.length"
        class="flex min-h-[280px] flex-col items-center justify-center
               rounded-2xl bg-white p-6 text-center shadow-lg
               dark:bg-black dark:ring-1 dark:ring-slate-800
               sm:min-h-[350px] sm:p-10"
      >
        <div
          class="mb-4 flex h-12 w-12 items-center justify-center
                 rounded-full bg-blue-100 text-xl
                 sm:h-16 sm:w-16 sm:text-2xl"
        >
          🎬
        </div>
        <h2 class="text-xl font-extrabold sm:text-2xl">No results found</h2>
        <p class="mt-2 max-w-md text-xs text-slate-500 dark:text-white/70 sm:text-sm">
          We couldn't find anything matching
          <span class="font-bold text-slate-700 dark:text-white">"{{ query }}"</span>.
          Try a different keyword.
        </p>
        <button
          type="button"
          @click="clearSearch"
          class="mt-5 rounded-full bg-blue-500 px-5 py-2.5 text-sm
                 font-bold text-white transition hover:bg-blue-600
                 sm:px-6 sm:py-3 sm:text-base"
        >
          Clear search
        </button>
      </section>

      <!-- IDLE (no query) -->
      <section
        v-else-if="!query"
        class="flex min-h-[280px] flex-col items-center justify-center
               rounded-2xl bg-white p-6 text-center shadow-lg
               dark:bg-black dark:ring-1 dark:ring-slate-800
               sm:min-h-[350px] sm:p-10"
      >
        <div
          class="mb-4 flex h-12 w-12 items-center justify-center
                 rounded-full bg-blue-100 text-xl
                 sm:h-16 sm:w-16 sm:text-2xl"
        >
          🔍
        </div>
        <h2 class="text-xl font-extrabold sm:text-2xl">Start typing to search</h2>
        <p class="mt-2 max-w-md text-xs text-slate-500 dark:text-white/70 sm:text-sm">
          Find movies and series by title, genre, or keyword.
        </p>
      </section>

      <!-- RESULTS GRID -->
      <section v-else>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">

          <article
            v-for="item in results"
            :key="item.id"
            class="group overflow-hidden rounded-2xl bg-white shadow-lg
                   transition duration-300 hover:-translate-y-1 hover:shadow-2xl
                   dark:bg-black dark:shadow-white/10"
          >

            <router-link :to="`/watch/${item.id}`" class="block">

              <!-- POSTER -->
              <div
                class="relative h-36 overflow-hidden bg-gradient-to-br
                       from-slate-600 to-slate-900 sm:h-60"
                :style="posterStyle(item.image || item.poster || item.thumbnail)"
              >

                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/80
                         via-transparent to-transparent"
                ></div>

                <!-- RATING -->
                <div
                  v-if="item.rating"
                  class="absolute right-2 top-2 rounded-full bg-black/70
                         px-2 py-0.5 text-xs font-bold text-white
                         backdrop-blur sm:right-3 sm:top-3 sm:px-3
                         sm:py-1 sm:text-sm"
                >
                  <span class="inline-flex items-center gap-0.5">
                    <StarIcon class="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {{ item.rating }}
                  </span>
                </div>

                <!-- TYPE BADGE -->
                <div
                  class="absolute bottom-2 left-2 rounded-full bg-blue-500/90
                         px-2 py-0.5 text-[10px] font-bold text-white
                         backdrop-blur sm:bottom-3 sm:left-3 sm:px-3
                         sm:py-1 sm:text-xs"
                >
                  {{ mediaLabel(item) }}
                </div>

                <!-- PLAY OVERLAY -->
                <div
                  class="absolute inset-0 flex items-center justify-center
                         opacity-0 transition duration-300 group-hover:opacity-100"
                >
                  <span
                    class="flex h-12 w-12 items-center justify-center
                           rounded-full bg-blue-500 text-white shadow-xl
                           transition group-hover:scale-110
                           sm:h-16 sm:w-16"
                  >
                    <PlayIcon class="ml-0.5 h-5 w-5 fill-current sm:ml-1 sm:h-7 sm:w-7" />
                  </span>
                </div>
              </div>

              <!-- INFO -->
              <div class="p-3 sm:p-5">

                <h2 class="truncate text-sm font-bold sm:text-lg md:text-xl">
                  {{ item.title }}
                </h2>

                <div class="mt-1 flex items-center justify-between sm:mt-2">

                  <span class="truncate text-xs font-medium text-slate-700 dark:text-white sm:text-sm">
                    {{ item.genre || mediaLabel(item) }}
                  </span>

                  <span
                    v-if="item.year"
                    class="text-[10px] text-slate-600 dark:text-white sm:text-sm"
                  >
                    {{ item.year }}
                  </span>
                </div>

                <div class="mt-3 sm:mt-4">
                  <span
                    class="inline-flex items-center gap-1 rounded-full
                           bg-blue-500 px-3 py-1.5 text-xs font-bold
                           text-white transition group-hover:bg-blue-600
                           sm:gap-2 sm:px-5 sm:py-2 sm:text-sm"
                  >
                    <PlayIcon class="h-3 w-3 fill-current sm:h-4 sm:w-4" />
                    Watch Now
                  </span>
                </div>
              </div>
            </router-link>
          </article>

        </div>

      </section>
    </main>
  </div>
</template>