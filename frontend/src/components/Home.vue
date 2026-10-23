<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">

    <!-- =========================
         HEADER (fixed overlay on top of hero)
    ========================== -->
    <div class="fixed top-0 left-0 right-0 z-50">
      <Header />
    </div>

    <!-- =========================
         MAIN CONTENT
    ========================== -->
    <main>

      <!-- =========================
           HERO SECTION
           SIZE KEPT EXACTLY
      ========================== -->
      <section class="w-full h-120 sm:h-160 md:h-200 lg:h-240">
        <div
          class="relative w-full h-120 sm:h-160 md:h-200 lg:h-240 overflow-hidden bg-slate-900 shadow-2xl"
        >

          <!-- Loading state -->
          <div
            v-if="loading"
            class="absolute inset-0 flex items-center justify-center bg-slate-900"
          >
            <div class="text-center">
              <div
                class="mb-4 h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500 mx-auto"
              ></div>

              <p class="text-xs sm:text-sm font-bold text-white/70">
                Loading featured…
              </p>
            </div>
          </div>


          <!-- Error state -->
          <div
            v-else-if="error"
            class="absolute inset-0 flex items-center justify-center bg-slate-900 p-4 sm:p-6"
          >
            <div class="text-center max-w-md">

              <p class="text-base sm:text-lg font-black text-white">
                Failed to load content
              </p>

              <p class="mt-2 text-xs sm:text-sm text-white/70">
                {{ error }}
              </p>

              <button
                type="button"
                class="mt-4 rounded-full bg-blue-500 px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-black text-white transition hover:bg-blue-600"
                @click="fetchHome"
              >
                Try again
              </button>

            </div>
          </div>


          <!-- Hero content -->
          <template
            v-else-if="featuredMovies.length && featuredMovie"
          >

            <!-- =========================
                 TRAILER VIDEO
            ========================== -->

            <video
              v-if="heroTrailer"
              :key="`${featuredMovie.id}-${heroTrailer}`"
              ref="videoEl"
              class="absolute inset-0 h-full w-full object-cover"
              :src="heroTrailer"
              :poster="featuredMovie.backdrop || featuredMovie.image || undefined"
              :muted="isMuted"
              autoplay
              loop
              playsinline
              preload="metadata"
              @loadeddata="onVideoLoaded"
              @canplay="onVideoCanPlay"
              @error="onVideoError"
            ></video>


            <!-- =========================
                 FALLBACK IMAGE
            ========================== -->

            <div
              v-else
              class="absolute inset-0"
              :style="heroBackground"
            ></div>


            <!-- =========================
                 DARK OVERLAYS
            ========================== -->

            <div
              class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/10"
            ></div>

            <div
              class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
            ></div>


            <!-- =========================
                 HERO CONTENT
            ========================== -->

            <div
              class="relative z-10 flex min-h-[400px] sm:min-h-[500px] md:min-h-[560px] items-end p-4 sm:p-6 md:p-10 lg:p-14 pt-20 sm:pt-28 md:pt-32 lg:pt-40"
            >

              <div class="max-w-3xl">

                <!-- Featured -->
                <div
                  class="mb-3 sm:mb-4 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:mt-100 sm:text-sm font-bold text-blue-400"
                >

                  <span
                    class="rounded-full bg-blue-500/20 px-2 py-0.5 sm:px-3 sm:py-1 backdrop-blur text-[10px] sm:text-xs"
                  >
                    Featured
                  </span>

                  <span v-if="featuredMovie.year" class="text-[10px] sm:text-xs">
                    {{ featuredMovie.year }}
                  </span>

                  <span
                    v-if="featuredMovie.year && featuredMovie.genre"
                    class="text-[10px] sm:text-xs"
                  >
                    •
                  </span>

                  <span v-if="featuredMovie.genre" class="text-[10px] sm:text-xs">
                    {{ featuredMovie.genre }}
                  </span>

                  <span
                    v-if="featuredMovie.type"
                    class="text-[10px] sm:text-xs"
                  >
                    •
                  </span>

                  <span
                    v-if="featuredMovie.type"
                    class="capitalize text-[10px] sm:text-xs"
                  >
                    {{ featuredMovie.type }}
                  </span>

                </div>


                <!-- Title -->

                <h1
                  class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
                >
                  {{ featuredMovie.title }}
                </h1>


                <!-- Rating -->

                <div
                  v-if="featuredMovie.rating"
                  class="mt-2 sm:mt-3 md:mt-4 flex items-center gap-1.5 sm:gap-2 font-bold text-blue-400 text-sm sm:text-base"
                >

                  <LucideStar
                    class="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-300 text-yellow-300"
                  />

                  <span>
                    {{ featuredMovie.rating }}
                  </span>

                </div>


                <!-- Description -->

                <p
                  v-if="featuredMovie.description"
                  class="mt-2 sm:mt-3 md:mt-4 max-w-2xl text-xs leading-5 sm:text-sm sm:leading-6 md:text-base md:leading-7 text-slate-200 line-clamp-3 sm:line-clamp-4"
                >
                  {{ featuredMovie.description }}
                </p>


                <!-- Trailer indicator -->

                <div
                  v-if="heroTrailer"
                  class="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-white/70"
                >

                  <PlayIcon
                    class="h-3 w-3 sm:h-4 sm:w-4 fill-current text-blue-400"
                  />

                  Trailer playing

                </div>


                <!-- Buttons -->

                <div class="mt-4 sm:mt-5 md:mt-7 flex flex-wrap gap-2 sm:gap-3">

                  <router-link
                    :to="watchRoute(featuredMovie)"
                    class="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-blue-500 px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm md:px-7 md:py-3 md:text-base font-bold text-white transition hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25"
                  >

                    <PlayIcon
                      class="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 fill-current"
                    />

                    Watch Now

                  </router-link>


                  <button
                    type="button"
                    @click="scrollToContent"
                    class="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm md:px-6 md:py-3 md:text-base font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >

                    <ArrowRight class="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />

                    Explore

                  </button>

                </div>

              </div>

            </div>


            <!-- =========================
                 MUTE / UNMUTE
            ========================== -->

            <button
              v-if="heroTrailer"
              type="button"
              :aria-label="
                isMuted
                  ? 'Unmute trailer'
                  : 'Mute trailer'
              "
              @click="toggleMute"
              class="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 md:bottom-6 md:left-6 z-20 flex h-8 w-8 sm:h-9 sm:w-9 md:h-11 md:w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
            >

              <VolumeX
                v-if="isMuted"
                class="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5"
              />

              <Volume2
                v-else
                class="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5"
              />

            </button>


            <!-- =========================
                 HERO INDICATORS
            ========================== -->

            <div
              v-if="featuredMovies.length > 1"
              class="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 z-20 flex items-center gap-1.5 sm:gap-2"
            >

              <button
                v-for="(movie, index) in featuredMovies"
                :key="movie.id"
                type="button"
                :aria-label="`Show ${movie.title}`"
                @click="changeHero(index)"
                class="h-2 sm:h-2.5 rounded-full transition-all"
                :class="
                  index === activeHeroIndex
                    ? 'w-6 sm:w-8 bg-blue-500'
                    : 'w-2 sm:w-2.5 bg-white/50 hover:bg-white/80'
                "
              ></button>

            </div>

          </template>


          <!-- =========================
               EMPTY STATE
          ========================== -->

          <div
            v-else
            class="absolute inset-0 flex items-center justify-center bg-slate-900 p-4 sm:p-6"
          >

            <div class="text-center">

              <p class="text-base sm:text-lg font-black text-white">
                No featured content yet
              </p>

              <p class="mt-2 text-xs sm:text-sm text-white/70">
                Add titles from the admin panel to feature them here.
              </p>

            </div>

          </div>

        </div>
      </section>


      <!-- =========================
           SERIES SECTION
      ========================== -->

      <section
        id="content"
        class="px-3 py-8 sm:px-6 sm:py-10 lg:px-8"
      >

        <div class="mb-4 sm:mb-6 flex items-center justify-between gap-3 sm:gap-4">

          <h2
            class="text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl"
          >
            New
            <span class="text-blue-600">
              Series
            </span>
          </h2>

          <router-link
            to="/series"
            class="shrink-0 text-xs font-bold text-blue-600 transition hover:text-blue-800 sm:text-sm md:text-base"
          >
            See More →
          </router-link>

        </div>


        <!-- Loading -->

        <div
          v-if="loading"
          class="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
        >

          <div
            v-for="i in 4"
            :key="i"
            class="h-48 sm:h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
          ></div>

        </div>


        <!-- Series grid -->

        <div
          v-else-if="series.length"
          class="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
        >

          <article
            v-for="seriesItem in series"
            :key="seriesItem.id"
            class="group overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-black dark:text-white dark:shadow-white/20"
          >

            <router-link
              :to="watchRoute(seriesItem)"
              class="block"
            >

              <!-- Poster -->

              <div
                class="relative h-36 overflow-hidden bg-gradient-to-br from-slate-600 to-slate-800 sm:h-60"
                :style="posterStyle(seriesItem.image)"
              >

                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                ></div>


                <!-- Rating -->

                <div
                  v-if="seriesItem.rating"
                  class="absolute right-2 top-2 sm:right-3 sm:top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-sm font-bold text-white backdrop-blur"
                >
                  ★ {{ seriesItem.rating }}
                </div>


                <!-- Play -->

                <div
                  class="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100"
                >

                  <span
                    class="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg"
                  >

                    <PlayIcon
                      class="h-4 w-4 sm:h-6 sm:w-6 fill-current"
                    />

                  </span>

                </div>

              </div>


              <!-- Info -->

              <div class="p-3 sm:p-5 dark:text-white">

                <h3 class="truncate text-sm sm:text-xl font-bold">
                  {{ seriesItem.title }}
                </h3>


                <div
                  class="mt-1 flex items-center justify-between gap-2"
                >

                  <p
                    class="truncate text-xs sm:text-sm font-medium text-slate-700 dark:text-white"
                  >
                    {{ seriesItem.genre }}
                  </p>


                  <!-- FIXED EPISODE COUNT -->

                  <p
                    v-if="seriesItem.episodeCount > 0"
                    class="shrink-0 text-[10px] sm:text-sm text-slate-600 dark:text-white"
                  >
                    {{ seriesItem.episodeCount }}
                    {{
                      seriesItem.episodeCount === 1
                        ? 'Ep'
                        : 'Eps'
                    }}
                  </p>

                </div>


                <div class="mt-3 sm:mt-4">

                  <span
                    class="inline-flex items-center gap-1 sm:gap-2 rounded-full bg-blue-500 px-3 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm font-bold text-white transition group-hover:bg-blue-600"
                  >

                    <PlayIcon
                      class="h-3 w-3 sm:h-4 sm:w-4 fill-current"
                    />

                    Watch Now

                  </span>

                </div>

              </div>

            </router-link>

          </article>

        </div>


        <!-- Empty -->

        <div
          v-else
          class="rounded-2xl bg-white p-6 sm:p-8 text-center shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800"
        >

          <p
            class="text-xs sm:text-sm font-bold text-slate-500 dark:text-white/70"
          >
            No series available yet.
          </p>

        </div>

      </section>


      <!-- =========================
           MOVIES SECTION
      ========================== -->

      <section
        class="px-3 py-8 sm:px-6 sm:py-10 lg:px-8"
      >

        <div
          class="mb-4 sm:mb-6 flex items-center justify-between gap-3 sm:gap-4"
        >

          <h2
            class="text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl"
          >
            New
            <span class="text-blue-600">
              Movies
            </span>
          </h2>

          <router-link
            to="/movies"
            class="shrink-0 text-xs font-bold text-blue-600 transition hover:text-blue-800 sm:text-sm md:text-base"
          >
            See More →
          </router-link>

        </div>


        <!-- Loading -->

        <div
          v-if="loading"
          class="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
        >

          <div
            v-for="i in 4"
            :key="i"
            class="h-48 sm:h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
          ></div>

        </div>


        <!-- Movies grid -->

        <div
          v-else-if="movies.length"
          class="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
        >

          <article
            v-for="movie in movies"
            :key="movie.id"
            class="group overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-black dark:text-white dark:shadow-white/20"
          >

            <router-link
              :to="watchRoute(movie)"
              class="block"
            >

              <!-- Poster -->

              <div
                class="relative h-36 overflow-hidden bg-gradient-to-br from-slate-600 to-slate-800 sm:h-60"
                :style="posterStyle(movie.image)"
              >

                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                ></div>


                <!-- Rating -->

                <div
                  v-if="movie.rating"
                  class="absolute right-2 top-2 sm:right-3 sm:top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-sm font-bold text-white backdrop-blur"
                >
                  ★ {{ movie.rating }}
                </div>


                <!-- Play -->

                <div
                  class="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100"
                >

                  <span
                    class="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg"
                  >

                    <PlayIcon
                      class="h-4 w-4 sm:h-6 sm:w-6 fill-current"
                    />

                  </span>

                </div>

              </div>


              <!-- Info -->

              <div class="p-3 sm:p-5">

                <h3 class="truncate text-sm sm:text-xl font-bold">
                  {{ movie.title }}
                </h3>

                <p
                  class="mt-1 text-xs sm:text-sm font-medium text-slate-700 dark:text-white"
                >
                  {{ movie.genre }}
                </p>


                <div class="mt-3 sm:mt-4">

                  <span
                    class="inline-flex items-center gap-1 sm:gap-2 rounded-full bg-blue-500 px-3 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm font-bold text-white transition group-hover:bg-blue-600"
                  >

                    <PlayIcon
                      class="h-3 w-3 sm:h-4 sm:w-4 fill-current"
                    />

                    Watch Now

                  </span>

                </div>

              </div>

            </router-link>

          </article>

        </div>


        <!-- Empty -->

        <div
          v-else
          class="rounded-2xl bg-white p-6 sm:p-8 text-center shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800"
        >

          <p
            class="text-xs sm:text-sm font-bold text-slate-500 dark:text-white/70"
          >
            No movies available yet.
          </p>

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
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

import Footer from './Footer.vue'
import Header from './Header.vue'

import {
  PlayIcon,
  LucideStar,
  ArrowRight,
  Volume2,
  VolumeX
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
      text ||
      `Request failed (${res.status})`
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

const featuredMovies =
  ref([])

const series =
  ref([])

const movies =
  ref([])

const activeHeroIndex =
  ref(0)

const videoEl =
  ref(null)

const isMuted =
  ref(true)

let heroTimer =
  null


/* =====================================================
   NORMALIZE CONTENT
===================================================== */

function normalizeContent(item) {

  const rawEpisodes =
    Array.isArray(item?.episodes)
      ? item.episodes
      : []

  /*
   * IMPORTANT:
   * episodeCount must be a NUMBER.
   *
   * Do not put the whole episodes array
   * into the episodeCount field.
   */

  const episodeCount =
    rawEpisodes.length > 0
      ? rawEpisodes.length
      : Number(item?.episodeCount || 0)


  const type =
    String(
      item?.type ||
      ''
    ).toLowerCase() === 'series'
      ? 'series'
      : 'movie'


  return {

    id:
      item?.id ??
      item?._id ??
      '',

    title:
      item?.title ??
      'Untitled',

    type,

    genre:
      item?.genre ??
      '',

    year:
      item?.year ??
      '',

    rating:
      item?.rating ??
      '',

    description:
      item?.description ??
      '',

    image:
      item?.image ??
      item?.thumbnail ??
      item?.poster ??
      item?.backdrop ??
      '',

    thumbnail:
      item?.thumbnail ??
      item?.image ??
      '',

    backdrop:
      item?.backdrop ??
      item?.image ??
      item?.thumbnail ??
      '',

    /*
     * IMPORTANT:
     * Support both backend names.
     */

    trailer:
      item?.trailerUrl ??
      item?.trailer ??
      '',

    trailerUrl:
      item?.trailerUrl ??
      item?.trailer ??
      '',

    videoUrl:
      item?.videoUrl ??
      '',

    episodeCount,

    episodes:
      rawEpisodes

  }

}


/* =====================================================
   FETCH HOME
===================================================== */

async function fetchHome() {

  loading.value =
    true

  error.value =
    null

  try {

    const response =
      await apiFetch('/home')

    const payload =
      response?.data ??
      response ??
      {}


    /* =========================
       FEATURED
    ========================== */

    const featuredList =
      Array.isArray(payload.featured)
        ? payload.featured
        : Array.isArray(payload.hero)
          ? payload.hero
          : []


    featuredMovies.value =
      featuredList.map(
        normalizeContent
      )


    /* =========================
       SERIES
    ========================== */

    const seriesList =
      Array.isArray(payload.series)
        ? payload.series
        : []


    series.value =
      seriesList.map(
        normalizeContent
      )


    /* =========================
       MOVIES
    ========================== */

    const moviesList =
      Array.isArray(payload.movies)
        ? payload.movies
        : []


    movies.value =
      moviesList.map(
        normalizeContent
      )


    /*
     * If there is no explicit featured
     * content, use movies + series.
     */

    if (
      featuredMovies.value.length === 0
    ) {

      featuredMovies.value = [
        ...movies.value,
        ...series.value
      ].slice(0, 6)

    }


    activeHeroIndex.value =
      0


  } catch (err) {

    console.error(
      'Home fetch error:',
      err
    )

    error.value =
      err?.message ||
      'Failed to load home content.'

  } finally {

    loading.value =
      false

  }

}


/* =====================================================
   CURRENT HERO
===================================================== */

const featuredMovie =
  computed(() => {

    if (
      featuredMovies.value.length === 0
    ) {
      return null
    }

    return featuredMovies.value[
      activeHeroIndex.value %
      featuredMovies.value.length
    ]

  })


/* =====================================================
   HERO TRAILER
===================================================== */

const heroTrailer =
  computed(() => {

    const item =
      featuredMovie.value

    if (!item) {
      return ''
    }

    return (
      item.trailerUrl ||
      item.trailer ||
      ''
    )

  })


/* =====================================================
   HERO BACKGROUND
===================================================== */

const heroBackground =
  computed(() => {

    const image =
      featuredMovie.value?.backdrop ||
      featuredMovie.value?.image ||
      ''

    if (image) {

      return {

        backgroundImage:
          `url("${image}")`,

        backgroundSize:
          'cover',

        backgroundPosition:
          'center'

      }

    }


    return {

      backgroundImage: `
        radial-gradient(
          circle at 75% 30%,
          rgba(37,99,235,.45),
          transparent 30%
        ),
        linear-gradient(
          135deg,
          #0f172a 0%,
          #172554 48%,
          #020617 100%
        )
      `

    }

  })


/* =====================================================
   POSTER
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
   ROUTES
===================================================== */

function watchRoute(item) {

  return `/watch/${item.id}`

}


/* =====================================================
   CHANGE HERO
===================================================== */

function changeHero(index) {

  activeHeroIndex.value =
    index

  restartHeroTimer()

}


/* =====================================================
   VIDEO LOADED
===================================================== */

function onVideoLoaded() {

  const video =
    videoEl.value

  if (!video) {
    return
  }

  video.muted =
    isMuted.value

  video.play().catch(
    () => {}
  )

}


/* =====================================================
   VIDEO CAN PLAY
===================================================== */

function onVideoCanPlay() {

  const video =
    videoEl.value

  if (!video) {
    return
  }

  video.muted =
    isMuted.value

  video.play().catch(
    () => {}
  )

}


/* =====================================================
   VIDEO ERROR
===================================================== */

function onVideoError(event) {

  console.error(
    'Hero trailer failed:',
    event
  )

}


/* =====================================================
   MUTE / UNMUTE
===================================================== */

function toggleMute() {

  isMuted.value =
    !isMuted.value

  const video =
    videoEl.value

  if (!video) {
    return
  }

  video.muted =
    isMuted.value

  if (!isMuted.value) {

    video.play().catch(
      () => {}
    )

  }

}


/* =====================================================
   HERO AUTO ROTATE
===================================================== */

function restartHeroTimer() {

  window.clearInterval(
    heroTimer
  )


  if (
    featuredMovies.value.length <= 1
  ) {

    return

  }


  heroTimer =
    window.setInterval(() => {

      activeHeroIndex.value =
        (
          activeHeroIndex.value + 1
        ) %
        featuredMovies.value.length

    }, 7000)

}


/* =====================================================
   SCROLL
===================================================== */

function scrollToContent() {

  document
    .getElementById('content')
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })

}


/* =====================================================
   HERO CHANGE WATCHER
===================================================== */

watch(
  activeHeroIndex,
  async () => {

    await nextTick()

    const video =
      videoEl.value

    if (!video) {
      return
    }

    video.muted =
      isMuted.value

    try {

      await video.play()

    } catch {

      /*
       * Browser may block
       * autoplay with sound.
       * Video is muted by default,
       * so normally autoplay works.
       */

    }

  }
)


/* =====================================================
   LIFECYCLE
===================================================== */

onMounted(
  async () => {

    await fetchHome()

    restartHeroTimer()

  }
)


onBeforeUnmount(() => {

  window.clearInterval(
    heroTimer
  )

})

</script>