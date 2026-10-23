<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:text-white dark:bg-black">

    <!-- =========================
         HEADER
    ========================== -->

    <header class="fixed left-0 right-0 top-0 z-50">
      <Header />
    </header>


    <!-- =========================
         MAIN
    ========================== -->

    <main class="px-3 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8">

      <!-- =========================
           FILTER BAR
      ========================== -->

      <section
        class="mb-8 flex flex-col gap-3
               sm:mb-10 sm:gap-4
               lg:flex-row lg:items-center lg:justify-between"
      >

        <!-- Category -->

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">

          <label
            for="category"
            class="text-sm font-bold text-slate-700 dark:text-white sm:text-base"
          >
            Category
          </label>

          <select
            id="category"
            v-model="selectedCategory"
            class="cursor-pointer rounded-xl
                   border border-slate-300
                   bg-white dark:bg-black
                   px-3 py-2.5
                   text-sm font-bold text-black dark:text-white
                   shadow-sm outline-none
                   transition
                   focus:border-blue-500
                   focus:ring-2
                   focus:ring-blue-500/20
                   sm:px-5 sm:py-3 sm:text-base"
          >
            <option value="All">
              All Categories
            </option>

            <option
              v-for="category in categories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>

        </div>


        <!-- Search -->

        <div class="relative w-full lg:w-80">

          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search movies..."
            class="w-full rounded-xl
                   dark:shadow-white/40 dark:border-gray-300
                   bg-white dark:bg-black
                   px-4 py-2.5 pr-10
                   text-sm
                   outline-none
                   shadow-sm
                   transition
                   focus:border-blue-500
                   focus:ring-2
                   focus:ring-blue-500/20
                   sm:px-5 sm:py-3 sm:pr-11 sm:text-base"
          />

          <button
            v-if="searchQuery"
            type="button"
            aria-label="Clear search"
            @click="searchQuery = ''"
            class="absolute right-2 top-1/2
                   -translate-y-1/2
                   rounded-full
                   px-2 py-1
                   text-lg
                   text-slate-400
                   hover:bg-slate-100
                   hover:text-slate-900
                   dark:text-slate-500
                   dark:hover:bg-slate-800
                   dark:hover:text-white
                   sm:right-3"
          >
            ×
          </button>

        </div>

      </section>


      <!-- =========================
           PAGE TITLE
      ========================== -->

      <section class="mb-6 sm:mb-8">

        <div
          class="flex flex-col gap-1
                 sm:flex-row
                 sm:items-end
                 sm:justify-between
                 sm:gap-2"
        >

          <h1
            class="text-2xl font-extrabold tracking-tight
                   sm:text-3xl
                   md:text-4xl"
          >
            All Categories
            <span class="text-blue-600">
              Movies
            </span>
          </h1>

          <p class="text-xs dark:text-white text-slate-500 sm:text-sm">
            {{ filteredMovies.length }}
            {{ filteredMovies.length === 1 ? 'movie' : 'movies' }}
          </p>

        </div>

      </section>


      <!-- =========================
           LOADING
      ========================== -->

      <section
        v-if="loading"
        class="flex min-h-[280px]
               flex-col items-center
               justify-center
               rounded-2xl
               bg-white
               p-6
               text-center
               shadow-lg
               dark:bg-black dark:ring-1 dark:ring-slate-800
               sm:min-h-[350px] sm:p-10"
      >
        <div
          class="mb-4 h-8 w-8 animate-spin rounded-full
                 border-4 border-slate-200 border-t-blue-500
                 sm:h-10 sm:w-10"
        ></div>
        <p class="text-xs font-bold text-slate-500 dark:text-white/70 sm:text-sm">
          Loading movies…
        </p>
      </section>


      <!-- =========================
           ERROR
      ========================== -->

      <section
        v-else-if="error"
        class="flex min-h-[280px]
               flex-col items-center
               justify-center
               rounded-2xl
               bg-white
               p-6
               text-center
               shadow-lg
               dark:bg-black dark:ring-1 dark:ring-slate-800
               sm:min-h-[350px] sm:p-10"
      >
        <div
          class="mb-4 flex h-12 w-12
                 items-center justify-center
                 rounded-full
                 bg-red-100
                 text-xl
                 sm:h-16 sm:w-16 sm:text-2xl"
        >
          ⚠️
        </div>

        <h2 class="text-xl font-extrabold sm:text-2xl">
          Something went wrong
        </h2>

        <p class="mt-2 max-w-md text-xs text-slate-500 dark:text-white/70 sm:text-sm">
          {{ error }}
        </p>

        <button
          type="button"
          @click="fetchMovies"
          class="mt-5 rounded-full
                 bg-blue-500
                 px-5 py-2.5
                 text-sm font-bold
                 text-white
                 transition
                 hover:bg-blue-600
                 sm:px-6 sm:py-3 sm:text-base"
        >
          Try again
        </button>
      </section>


      <!-- =========================
           MOVIES
      ========================== -->

      <section v-else>

        <!-- Movie grid -->

        <div
          v-if="filteredMovies.length"
          class="grid grid-cols-2 gap-2
                 sm:grid-cols-2 sm:gap-4
                 lg:grid-cols-3
                 xl:grid-cols-4"
        >

          <article
            v-for="movie in filteredMovies"
            :key="movie.id"
            class="group overflow-hidden
                   rounded-2xl
                   bg-white dark:bg-black
                   shadow-lg dark:shadow-white/10
                   transition duration-300
                   hover:-translate-y-1
                   hover:shadow-2xl"
          >

            <!-- Clickable movie -->

            <router-link
              :to="watchRoute(movie)"
              class="block"
            >

              <!-- Poster -->

              <div
                class="relative h-36 overflow-hidden
                       bg-gradient-to-br
                       from-slate-600
                       to-slate-900
                       sm:h-60"
                :style="posterStyle(movie.image)"
              >

                <!-- Overlay -->

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
                  class="absolute right-2 top-2
                         rounded-full
                         bg-black/70
                         px-2 py-0.5
                         text-xs font-bold
                         text-white
                         backdrop-blur
                         sm:right-3 sm:top-3
                         sm:px-3 sm:py-1 sm:text-sm"
                >
                  ★ {{ movie.rating }}
                </div>


                <!-- Category -->

                <div
                  v-if="movie.genre"
                  class="absolute bottom-2 left-2
                         rounded-full
                         bg-blue-500/90
                         px-2 py-0.5
                         text-[10px] font-bold
                         text-white
                         backdrop-blur
                         sm:bottom-3 sm:left-3
                         sm:px-3 sm:py-1 sm:text-xs"
                >
                  {{ movie.genre }}
                </div>


                <!-- Play overlay -->

                <div
                  class="absolute inset-0
                         flex items-center
                         justify-center
                         opacity-0
                         transition duration-300
                         group-hover:opacity-100"
                >

                  <span
                    class="flex h-12 w-12
                           items-center justify-center
                           rounded-full
                           bg-blue-500
                           text-white
                           shadow-xl
                           transition
                           group-hover:scale-110
                           sm:h-16 sm:w-16"
                  >

                    <PlayIcon
                      class="ml-0.5 h-5 w-5
                             fill-current
                             sm:ml-1 sm:h-7 sm:w-7"
                    />

                  </span>

                </div>

              </div>


              <!-- Movie information -->

              <div class="p-3 sm:p-5">

                <h2
                  class="truncate text-sm
                         font-bold
                         sm:text-xl
                         md:text-2xl"
                >
                  {{ movie.title }}
                </h2>


                <div
                  class="mt-1 flex items-center
                         justify-between
                         sm:mt-2"
                >

                  <span
                    class="text-xs font-medium
                           text-slate-700 dark:text-white
                           sm:text-sm"
                  >
                    {{ movie.genre }}
                  </span>

                  <span
                    v-if="movie.year"
                    class="text-[10px]
                           text-slate-600 dark:text-white
                           sm:text-sm"
                  >
                    {{ movie.year }}
                  </span>

                </div>


                <!-- Watch button -->

                <div class="mt-3 sm:mt-5">

                  <span
                    class="inline-flex
                           items-center
                           gap-1
                           rounded-full
                           bg-blue-500
                           px-3 py-1.5
                           text-xs font-bold
                           text-white
                           transition
                           group-hover:bg-blue-600
                           sm:gap-2 sm:px-6 sm:py-2.5 sm:text-base"
                  >

                    <PlayIcon
                      class="h-3 w-3
                             fill-current
                             sm:h-4 sm:w-4"
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
          class="flex min-h-[280px]
                 flex-col items-center
                 justify-center
                 rounded-2xl
                 bg-white
                 p-6
                 text-center
                 shadow-lg
                 dark:bg-black dark:ring-1 dark:ring-slate-800
                 sm:min-h-[350px] sm:p-10"
        >

          <div
            class="mb-4 flex h-12 w-12
                   items-center justify-center
                   rounded-full
                   bg-blue-100
                   text-xl
                   sm:h-16 sm:w-16 sm:text-2xl"
          >
            🎬
          </div>

          <h2
            class="text-xl
                   font-extrabold
                   sm:text-2xl"
          >
            No movies found
          </h2>

          <p
            class="mt-2 max-w-md
                   text-xs
                   text-slate-500 dark:text-white/70
                   sm:text-sm"
          >
            We couldn't find any movies matching
            your current category or search.
          </p>

          <button
            type="button"
            @click="resetFilters"
            class="mt-5 rounded-full
                   bg-blue-500
                   px-5 py-2.5
                   text-sm font-bold
                   text-white
                   transition
                   hover:bg-blue-600
                   sm:px-6 sm:py-3 sm:text-base"
          >
            Clear Filters
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
  computed,
  onMounted,
  ref
} from 'vue'

import Header from './Header.vue'
import Footer from './Footer.vue'

import {
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

  return res.json()

}


/* =====================================================
   STATE
===================================================== */

const loading =
  ref(true)

const error =
  ref(null)

const movies =
  ref([])

const selectedCategory =
  ref('All')

const searchQuery =
  ref('')


/* =====================================================
   FETCH MOVIES FROM BACKEND
===================================================== */

async function fetchMovies() {

  loading.value = true
  error.value = null

  try {

    const data =
      await apiFetch('/movies')

    const list =
      data?.data ??
      data?.items ??
      data ??
      []

    if (!Array.isArray(list)) {

      movies.value = []
      return

    }

    movies.value =
      list.map(item => ({

        id:
          item.id ?? item._id,

        title:
          item.title ?? 'Untitled',

        genre:
          item.genre ?? '',

        year:
          item.year ?? '',

        rating:
          item.rating ?? '',

        image:
          item.image ??
          item.poster ??
          item.backdrop ??
          ''

      }))

  } catch (err) {

    error.value =
      err?.message ||
      'Failed to load movies.'

  } finally {

    loading.value = false

  }

}


/* =====================================================
   CATEGORIES (derived from API data)
===================================================== */

const categories =
  computed(() => {

    const genres =
      movies.value
        .map(movie => movie.genre)
        .filter(Boolean)

    return [
      ...new Set(genres)
    ]

  })


/* =====================================================
   FILTERED MOVIES
===================================================== */

const filteredMovies =
  computed(() => {

    const search =
      searchQuery.value
        .trim()
        .toLowerCase()

    return movies.value.filter(
      movie => {

        const matchesCategory =
          selectedCategory.value === 'All' ||
          movie.genre === selectedCategory.value

        const matchesSearch =
          !search ||
          movie.title
            .toLowerCase()
            .includes(search) ||
          movie.genre
            .toLowerCase()
            .includes(search)

        return (
          matchesCategory &&
          matchesSearch
        )

      }
    )

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
   RESET FILTERS
===================================================== */

function resetFilters() {

  selectedCategory.value =
    'All'

  searchQuery.value =
    ''

}


/* =====================================================
   LIFECYCLE
===================================================== */

onMounted(() => {

  fetchMovies()

})

</script>