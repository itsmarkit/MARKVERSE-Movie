<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">

    <!-- =========================
         HEADER
    ========================== -->

    <header class="fixed left-0 right-0 top-0 z-50">
      <Header />
    </header>


    <!-- =========================
         MAIN
    ========================== -->

    <main class="px-4 pb-20 pt-28 sm:px-6 lg:px-8">

      <!-- =========================
           SEARCH HERO
      ========================== -->

      <section
        class="mx-auto max-w-5xl
               pt-10 text-center
               sm:pt-16"
      >

        <p
          class="mb-3 text-sm font-bold
                 uppercase tracking-[0.25em]
                 text-blue-600"
        >
          MARKVERSE
        </p>


        <h1
          class="text-4xl font-extrabold
                 tracking-tight
                 sm:text-5xl lg:text-6xl"
        >
          Find your next
          <span class="text-blue-600">
            movie
          </span>
        </h1>


        <p
          class="mx-auto mt-4 max-w-2xl
                 text-base text-slate-500
                 sm:text-lg"
        >
          Search movies and series by title,
          genre, or year.
        </p>


        <!-- Search Box -->

        <div
          class="relative mx-auto mt-8
                 max-w-3xl"
        >

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search movies, series, genres..."
            class="w-full rounded-3xl
                   dark:shadow-white/40 dark:text-white
                   bg-white dark:bg-black
                   px-6 py-5
                   pr-14
                   text-lg
                   font-medium
                   text-slate-900
                   shadow-2xl
                   outline-none
                   transition
                   placeholder:text-slate-400
                   focus:border-blue-500
                   focus:ring-4
                   focus:ring-blue-500/10"
          />


          <!-- Search Icon -->

          <div
            class="pointer-events-none
                   absolute right-5 top-1/2
                   flex h-10 w-10
                   -translate-y-1/2
                   items-center
                   justify-center
                   rounded-full
                   bg-blue-500
                   text-white"
          >

            <SearchIcon
              class="h-5 w-5"
            />

          </div>


          <!-- Clear -->

          <button
            v-if="searchQuery"
            type="button"
            aria-label="Clear search"
            @click="searchQuery = ''"
            class="absolute right-16 top-1/2
                   -translate-y-1/2
                   rounded-full
                   px-2
                   text-slate-400
                   transition
                   hover:bg-slate-100
                   hover:text-slate-900"
          >
            ×
          </button>

        </div>

      </section>


      <!-- =========================
           LATEST RELEASES
      ========================== -->

      <section
        class="mx-auto mt-12 max-w-7xl"
      >

        <!-- Heading -->

        <div class="mb-8 text-center">

          <h2
            class="text-2xl font-extrabold"
          >
            Latest
            <span class="text-blue-600">
              Releases
            </span>
          </h2>

          <p
            class="mt-1 text-sm
                   text-slate-500 dark:text-white/70"
          >
            {{
              searchQuery.trim()
                ? `${latestMovies.length} result${latestMovies.length === 1 ? '' : 's'} for "${searchQuery.trim()}"`
                : `${latestMovies.length} title${latestMovies.length === 1 ? '' : 's'} just added to Markverse`
            }}
          </p>

        </div>


        <!-- Loading -->

        <div
          v-if="loading"
          class="flex min-h-[350px]
                 flex-col items-center
                 justify-center
                 rounded-2xl
                 bg-white dark:bg-black
                 p-10
                 text-center
                 shadow-lg"
        >
          <div
            class="mb-4 h-10 w-10
                   animate-spin
                   rounded-full
                   border-4
                   border-slate-200
                   border-t-blue-500"
          ></div>
          <p class="text-sm font-bold text-slate-500 dark:text-white/70">
            Loading titles…
          </p>
        </div>


        <!-- Error -->

        <div
          v-else-if="error"
          class="flex min-h-[350px]
                 flex-col items-center
                 justify-center
                 rounded-2xl
                 bg-white dark:bg-black
                 p-10
                 text-center
                 shadow-lg"
        >
          <div
            class="mb-4 flex h-16 w-16
                   items-center justify-center
                   rounded-full
                   bg-red-100
                   text-2xl"
          >
            ⚠️
          </div>
          <h2 class="text-2xl font-extrabold">
            Something went wrong
          </h2>
          <p class="mt-2 max-w-md text-slate-500 dark:text-white/70">
            {{ error }}
          </p>
          <button
            type="button"
            @click="fetchLatest"
            class="mt-5 rounded-full
                   bg-blue-500
                   px-6 py-3
                   font-bold
                   text-white
                   transition
                   hover:bg-blue-600"
          >
            Try again
          </button>
        </div>


        <!-- Results Grid -->

        <div
          v-else-if="latestMovies.length"
          class="grid grid-cols-2 gap-2
                 sm:grid-cols-2 sm:gap-8
                 lg:grid-cols-3 lg:gap-10"
        >

          <article
            v-for="movie in latestMovies"
            :key="movie.id"
            class="group overflow-hidden
                   rounded-2xl
                   bg-white dark:bg-black dark:shadow-white/20
                   shadow-xl
                   transition duration-300
                   hover:-translate-y-1
                   hover:shadow-2xl"
          >

            <router-link
              :to="watchRoute(movie)"
              class="block"
            >

              <!-- Poster -->

              <div
                class="relative h-30 overflow-hidden
                       bg-gradient-to-br
                       from-slate-600
                       to-slate-950
                       sm:h-72"
                :style="posterStyle(movie.image)"
              >

                <!-- Dark Gradient -->

                <div
                  class="absolute inset-0
                         bg-gradient-to-t
                         from-black/80
                         via-transparent
                         to-transparent"
                ></div>


                <!-- Rating -->

                <div
                  v-if="movie.rating"
                  class="absolute right-3 top-3
                         rounded-full
                         bg-black/70
                         px-3 py-1
                         text-sm font-bold
                         text-white
                         backdrop-blur"
                >
                  ★ {{ movie.rating }}
                </div>


                <!-- Type -->

                <div
                  v-if="movie.type"
                  class="absolute bottom-3 left-3
                         rounded-full
                         bg-blue-500/90
                         px-3 py-1
                         text-xs font-bold
                         text-white
                         backdrop-blur"
                >
                  {{ movie.type }}
                </div>


                <!-- Play -->

                <div
                  class="absolute inset-0
                         flex items-center
                         justify-center
                         opacity-0
                         transition duration-300
                         group-hover:opacity-100"
                >

                  <span
                    class="flex h-16 w-16
                           items-center justify-center
                           rounded-full
                           bg-blue-500
                           text-white
                           shadow-xl
                           transition
                           group-hover:scale-110"
                  >

                    <PlayIcon
                      class="ml-1 h-7 w-7
                             fill-current"
                    />

                  </span>

                </div>

              </div>


              <!-- Information -->

              <div class="p-5">

                <h3
                  class="truncate text-xl
                         font-extrabold dark:text-white"
                >
                  {{ movie.title }}
                </h3>


                <div
                  class="mt-2 flex
                         items-center
                         justify-between"
                >

                  <span
                    class="font-medium
                           text-slate-700 dark:text-white"
                  >
                    {{ movie.genre }}
                  </span>

                  <span
                    v-if="movie.year"
                    class="text-sm
                           text-slate-600 dark:text-white"
                  >
                    {{ movie.year }}
                  </span>

                </div>


                <!-- Watch -->

                <div class="mt-5">

                  <span
                    class="inline-flex
                           items-center
                           gap-2
                           rounded-full
                           bg-blue-500
                           px-6 py-2.5
                           font-bold
                           text-white
                           transition
                           group-hover:bg-blue-600"
                  >

                    <PlayIcon
                      class="h-4 w-4
                             fill-current"
                    />

                    Watch Now

                  </span>

                </div>

              </div>

            </router-link>

          </article>

        </div>


        <!-- =========================
             EMPTY STATE
        ========================== -->

        <div
          v-else
          class="flex min-h-[350px]
                 flex-col items-center
                 justify-center
                 rounded-2xl
                 bg-white dark:bg-black
                 p-10
                 text-center
                 shadow-lg"
        >

          <div
            class="mb-4 flex h-16 w-16
                   items-center justify-center
                   rounded-full
                   bg-blue-100"
          >

            <SearchIcon
              class="h-7 w-7
                     text-blue-600"
            />

          </div>


          <h2
            class="text-2xl
                   font-extrabold"
          >
            No results found
          </h2>


          <p
            class="mt-2 max-w-md
                   text-slate-500 dark:text-white/70"
          >
            <template v-if="searchQuery.trim()">
              We couldn't find anything matching
              "{{ searchQuery }}".
              Try another title, genre, or category.
            </template>
            <template v-else>
              There are no titles available yet.
              Check back soon.
            </template>
          </p>


          <button
            v-if="searchQuery.trim()"
            type="button"
            @click="resetSearch"
            class="mt-5 rounded-full
                   bg-blue-500
                   px-6 py-3
                   font-bold
                   text-white
                   transition
                   hover:bg-blue-600"
          >
            Clear Search
          </button>

        </div>

      </section>

    </main>


    <!-- =========================
         FOOTER
    ========================== -->

    <Footer />

  </div>
</template>


<script setup>

import {
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

import Header from './Header.vue'
import Footer from './Footer.vue'

import {
  SearchIcon,
  PlayIcon
} from 'lucide-vue-next'


/* =====================================================
   API
===================================================== */

const API_BASE =
  import.meta.env.VITE_API_BASE || '/api'


async function apiFetch(path) {

  const res =
    await fetch(`${API_BASE}${path}`)

  if (!res.ok) {

    const text =
      await res.text().catch(() => '')

    throw new Error(
      text || `Request failed (${res.status})`
    )

  }

  return res.json().catch(() => ({}))

}


/* =====================================================
   STATE
===================================================== */

const loading =
  ref(true)

const error =
  ref(null)

const latestMovies =
  ref([])

const searchQuery =
  ref('')


/* =====================================================
   NORMALISE
===================================================== */

function normaliseItem(item) {

  if (!item || typeof item !== 'object') {
    return null
  }

  const id =
    item.id ?? item._id

  if (!id) {
    return null
  }

  return {

    id: String(id),

    title:
      item.title ?? 'Untitled',

    genre:
      item.genre ?? '',

    type:
      item.type ??
      (item.episodes ? 'Series' : 'Movie'),

    year:
      item.year ?? '',

    rating:
      item.rating ?? '',

    image:
      item.image ??
      item.poster ??
      item.backdrop ??
      ''

  }

}


/* =====================================================
   FETCH LATEST
===================================================== */

async function fetchLatest() {

  loading.value = true
  error.value = null

  try {

    const params =
      new URLSearchParams()

    params.set('limit', '3')

    const q =
      searchQuery.value.trim()

    if (q) {
      params.set('q', q)
    }

    const data =
      await apiFetch(`/search?${params.toString()}`)

    const list =
      data?.data ??
      data?.items ??
      data?.results ??
      data ??
      []

    latestMovies.value =
      Array.isArray(list)
        ? list.map(normaliseItem).filter(Boolean)
        : []

  } catch (err) {

    error.value =
      err?.message ||
      'Failed to load titles.'

  } finally {

    loading.value = false

  }

}


/* =====================================================
   DEBOUNCED SEARCH
===================================================== */

let debounceTimer = null

watch(searchQuery, () => {

  if (debounceTimer) {
    window.clearTimeout(debounceTimer)
  }

  debounceTimer = window.setTimeout(() => {

    fetchLatest()

  }, 350)

})


/* =====================================================
   POSTER STYLE
===================================================== */

function posterStyle(image) {

  if (!image) {
    return {}
  }

  return {

    backgroundImage:
      `url("${image}")`,

    backgroundSize:
      'cover',

    backgroundPosition:
      'center'

  }

}


/* =====================================================
   WATCH ROUTE
===================================================== */

function watchRoute(movie) {

  return `/watch/${movie.id}`

}


/* =====================================================
   RESET
===================================================== */

function resetSearch() {

  searchQuery.value = ''

}


/* =====================================================
   LIFECYCLE
===================================================== */

onMounted(() => {

  fetchLatest()

})

onBeforeUnmount(() => {

  if (debounceTimer) {
    window.clearTimeout(debounceTimer)
  }

})

</script>