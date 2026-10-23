<template>
  <div class="min-h-screen bg-white text-black dark:bg-black dark:text-white">

    <!-- HEADER -->
    <header class="fixed left-0 right-0 top-0 z-50">
      <Header />
    </header>

    <!-- MAIN -->
    <main class="px-3 pb-20 pt-24 sm:px-4 lg:px-6 lg:pb-4 2xl:px-10">

      <!-- LOADING -->
      <section
        v-if="loading"
        class="mx-auto flex min-h-[400px] max-w-2xl flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-lg dark:bg-black dark:text-white"
      >
        <div class="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
        <p class="text-sm font-bold text-slate-500 dark:text-white">Loading title…</p>
      </section>

      <!-- ERROR -->
      <section
        v-else-if="error"
        class="mx-auto flex min-h-[400px] max-w-2xl flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-lg dark:bg-black dark:text-white"
      >
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">⚠️</div>
        <h2 class="text-2xl font-extrabold">Something went wrong</h2>
        <p class="mt-2 max-w-md text-sm text-slate-500 dark:text-white/70">{{ error }}</p>
        <button
          type="button"
          @click="goBack"
          class="mt-5 rounded-full bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
        >
          Go Back
        </button>
      </section>

      <!-- NOT FOUND -->
      <section
        v-else-if="!media"
        class="mx-auto flex min-h-[400px] max-w-2xl flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-lg dark:bg-black dark:text-white"
      >
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl">🎬</div>
        <h2 class="text-2xl font-extrabold">Title not found</h2>
        <p class="mt-2 max-w-md text-slate-500 dark:text-white">
          We couldn't find the movie or series you're looking for.
        </p>
        <p class="mt-2 text-xs text-slate-400">
          Requested ID:
          <code class="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{{ route.params.id }}</code>
        </p>
        <button
          type="button"
          @click="goBack"
          class="mt-5 rounded-full bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
        >
          Go Back
        </button>
      </section>

      <!-- WATCH LAYOUT (full width on desktop, viewport-locked with independent scroll columns) -->
      <div
        v-else
        class="grid w-full grid-cols-1 gap-6 lg:h-[calc(100vh-7rem)] lg:grid-cols-[minmax(0,1fr)_380px] lg:overflow-hidden xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_420px]"
      >

        <!-- LEFT COLUMN (scrolls independently on desktop) -->
        <div class="min-w-0 lg:overflow-y-auto lg:pr-2 watch-scroll">

          <!-- BACK + TRAILER TOGGLE -->
          <div class="relative z-30 mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              @click="goBack"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-blue-600 dark:bg-black dark:text-white dark:shadow-white/40"
            >
              <ArrowLeft class="h-4 w-4" />
              Back
            </button>

            <button
              v-if="hasTrailer"
              type="button"
              @click.stop="toggleTrailer"
              @touchstart.prevent="toggleTrailer"
              class="relative z-40 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-blue-600 dark:bg-black dark:text-white dark:shadow-white/40 touch-manipulation select-none"
              :class="isTrailerMode ? 'ring-2 ring-blue-500 text-blue-600 dark:text-blue-400' : ''"
              :aria-pressed="isTrailerMode"
            >
              <PlaySquare class="h-4 w-4 pointer-events-none" />
              <span class="pointer-events-none">
                {{ isTrailerMode ? 'Official Video' : 'Video Trailer' }}
              </span>
            </button>
          </div>

          <!-- VIDEO PLAYER -->
          <section class="mb-4">
            <div class="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl lg:max-h-[calc(100vh-220px)]">

              <video
                v-if="activeVideoUrl"
                :key="activeVideoUrl"
                ref="videoPlayer"
                :src="activeVideoUrl"
                :poster="media.backdrop || media.image"
                controls
                playsinline
                webkit-playsinline
                preload="metadata"
                class="h-full w-full object-cover"
                @play="isPlaying = true"
                @pause="isPlaying = false"
                @ended="onEnded"
                @timeupdate="onTimeUpdate"
                @loadedmetadata="onLoadedMetadata"
                @canplay="onCanPlay"
                @error="onVideoError"
                @click="togglePlay"
              ></video>

              <div
                v-else
                class="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950"
                :style="posterStyle(media.backdrop || media.image)"
              >
                <div class="absolute inset-0 bg-black/60"></div>
                <div class="relative z-10 text-center">
                  <span class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-500 text-white shadow-xl">
                    <PlayIcon class="ml-1 h-9 w-9 fill-current" />
                  </span>
                  <p class="text-lg font-bold text-white">Video not available</p>
                  <p class="mt-1 text-sm text-slate-300">This title has no video source yet.</p>
                </div>
              </div>

              <div
                v-if="videoSourceError"
                class="absolute inset-x-0 bottom-0 z-20 bg-red-950/90 px-4 py-3 text-center text-xs font-bold text-white backdrop-blur"
              >
                Unable to play this video source.
              </div>

              <Transition
                enter-active-class="transition duration-300"
                enter-from-class="opacity-0"
                leave-active-class="transition duration-300"
                leave-to-class="opacity-0"
              >
                <div
                  v-if="showAutoNext"
                  class="absolute bottom-16 right-4 z-20 flex items-center gap-3 rounded-xl bg-black/80 px-4 py-3 backdrop-blur"
                >
                  <span class="text-xs font-bold text-white">
                    Up next in {{ autoNextCountdown }}s
                  </span>
                  <button
                    type="button"
                    @click="cancelAutoNext"
                    class="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    @click="playNextNow"
                    class="rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-blue-600"
                  >
                    Play now
                  </button>
                </div>
              </Transition>
            </div>

            <div
              v-if="activeVideoUrl"
              class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-black dark:text-white dark:shadow-white/40"
            >
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-500 dark:text-white">
                  {{ isTrailerMode ? 'Trailer' : 'Server' }}
                </span>

                <div v-if="!isTrailerMode && servers.length" class="flex gap-1">
                  <button
                    v-for="server in servers"
                    :key="server.id"
                    type="button"
                    @click="selectedServer = server.id"
                    class="rounded-lg px-3 py-1.5 text-xs font-bold transition"
                    :class="selectedServer === server.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-white'"
                  >
                    {{ server.label }}
                  </button>
                </div>

                <span v-else-if="isTrailerMode" class="text-xs font-bold text-blue-600">
                  Official Trailer
                </span>
              </div>

              <div class="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-white">
                <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
                <span class="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-600">
                  {{ media.quality || 'HD' }}
                </span>
              </div>
            </div>
          </section>

          <!-- TITLE + ACTIONS -->
          <section class="mb-6">
            <h1 class="text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
              {{ media.title }}
              <span v-if="currentPart && currentPart.label" class="text-blue-600">— {{ currentPart.label }}</span>
              <span v-if="currentEpisode" class="text-blue-600">— Ep {{ currentEpisode.number }}</span>
              <span v-if="media.year" class="text-slate-400">({{ media.year }})</span>
            </h1>

            <div class="mt-2 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600 dark:text-white/80">
              <span v-if="media.genre" class="rounded-full bg-blue-500/10 px-3 py-1 text-blue-600">
                {{ media.genre }}
              </span>

              <span v-if="media.rating" class="inline-flex items-center gap-1">
                <LucideStar class="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {{ media.rating }} / 10
              </span>

              <template v-if="media.type === 'series'">
                <span>•</span>
                <span>{{ episodes.length }} {{ episodes.length === 1 ? 'Episode' : 'Episodes' }}</span>
              </template>

              <template v-else-if="movieParts.length">
                <span>•</span>
                <span>{{ movieParts.length }} {{ movieParts.length === 1 ? 'Part' : 'Parts' }}</span>
              </template>

              <template v-if="media.runtime">
                <span>•</span>
                <span>{{ media.runtime }}</span>
              </template>

              <template v-if="media.country">
                <span>•</span>
                <span>{{ media.country }}</span>
              </template>
            </div>

            <div v-if="media.description" class="mt-3">
              <p
                class="text-sm leading-7 text-slate-600 dark:text-white/80"
                :class="!descriptionExpanded ? 'line-clamp-3' : ''"
              >
                {{ media.description }}
              </p>
              <button
                type="button"
                @click="descriptionExpanded = !descriptionExpanded"
                class="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                {{ descriptionExpanded ? 'Show less' : 'Show more' }}
              </button>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-2 py-3">
              <button
                type="button"
                @click="togglePlay"
                class="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600"
              >
                <component :is="isPlaying ? PauseIcon : PlayIcon" class="h-4 w-4 fill-current" />
                {{ isPlaying ? 'Pause' : 'Play' }}
              </button>

              <div class="flex items-center overflow-hidden rounded-full bg-slate-100 dark:bg-black dark:text-white dark:shadow-white/40">
                <button
                  type="button"
                  @click="toggleLike"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-200 dark:hover:bg-slate-800"
                  :class="liked ? 'text-blue-600' : 'text-slate-700 dark:text-white'"
                >
                  <ThumbsUpIcon class="h-4 w-4" :class="liked ? 'fill-blue-600' : ''" />
                  {{ likeCount }}
                </button>
                <span class="h-6 w-px bg-slate-300"></span>
                <button
                  type="button"
                  @click="toggleDislike"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-200 dark:hover:bg-slate-800"
                  :class="disliked ? 'text-red-600' : 'text-slate-700 dark:text-white'"
                >
                  <ThumbsDownIcon class="h-4 w-4" :class="disliked ? 'fill-red-600' : ''" />
                </button>
              </div>

              <button
                type="button"
                @click="shareMedia"
                class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-black dark:text-white dark:border dark:border-slate-800"
              >
                <ShareIcon class="h-4 w-4" />
                Share
              </button>

              <button
                v-if="activeVideoUrl"
                type="button"
                @click="downloadMedia(activeDownloadItem)"
                class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-black dark:text-white dark:border dark:border-slate-800"
              >
                <DownloadIcon class="h-4 w-4" />
                Download
              </button>

              <button
                type="button"
                @click="showComments = !showComments"
                class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-black dark:text-white dark:border dark:border-slate-800"
                :class="showComments ? 'ring-2 ring-blue-500 text-blue-600 dark:text-blue-400' : ''"
                :aria-expanded="showComments"
                aria-controls="comments-section"
              >
                <MessageSquareIcon class="h-4 w-4" />
                {{ showComments ? 'Hide Comments' : 'Comments' }}
                <span class="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600">
                  {{ comments.length }}
                </span>
              </button>
            </div>
          </section>

          <!-- RATING -->
          <section class="mb-6 rounded-2xl bg-white p-5 shadow-sm dark:bg-black">
            <div class="mb-4 flex flex-wrap items-center gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-white">
                  Your Rating
                </p>
                <div class="mt-1 flex items-center gap-3">
                  <div class="flex gap-1">
                    <button
                      v-for="star in 5"
                      :key="star"
                      type="button"
                      @click="setRating(star)"
                      @mouseenter="hoverRating = star"
                      @mouseleave="hoverRating = 0"
                      class="transition-transform hover:scale-110"
                      :aria-label="`Rate ${star} star${star > 1 ? 's' : ''}`"
                    >
                      <StarIcon
                        class="h-6 w-6"
                        :class="star <= (hoverRating || userRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300'"
                      />
                    </button>
                  </div>
                  <span v-if="userRating" class="text-sm font-bold text-slate-600 dark:text-white/80">
                    {{ userRating }}/5
                  </span>
                  <span v-else class="text-sm text-slate-400 dark:text-white/80">Not rated</span>
                </div>
              </div>

              <div v-if="media.rating" class="ml-auto text-right">
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-white/80">
                  Community
                </p>
                <p class="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {{ media.rating }}
                  <span class="text-sm text-slate-400 dark:text-white/80">/10</span>
                </p>
              </div>
            </div>
          </section>

          <!-- CHANNEL SECTION -->
          <section
            v-if="channel.id || media?.channelId"
            class="mb-6"
          >
            <div
              class="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm transition dark:bg-black dark:text-white dark:shadow-white/40 sm:flex-nowrap"
            >
              <component
                :is="channel.id ? 'router-link' : 'div'"
                v-bind="channel.id ? { to: `/channels/${channel.id}` } : {}"
                class="group/link flex min-w-0 items-center gap-3 sm:gap-4"
              >
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-extrabold text-white shadow-md ring-2 ring-blue-500/20 transition group-hover/link:ring-4 sm:h-14 sm:w-14 sm:text-xl"
                  aria-hidden="true"
                >
                  <img
                    v-if="channel.avatar && !channelAvatarBroken"
                    :src="resolveImageUrl(channel.avatar)"
                    :alt="channel.name"
                    class="h-full w-full object-cover"
                    @error="channelAvatarBroken = true"
                  />
                  <span v-else>
                    {{ (channel.name || 'M').charAt(0).toUpperCase() }}
                  </span>
                </div>

                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="truncate text-base font-extrabold text-slate-900 transition group-hover/link:text-blue-600 dark:text-white sm:text-lg">
                      {{ channel.name }}
                    </p>

                    <span
                      v-if="channel.verified"
                      class="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400"
                    >
                      <svg class="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      Verified
                    </span>
                  </div>

                  <p class="mt-0.5 text-xs font-medium text-slate-500 dark:text-white/70">
                    <span class="font-bold text-blue-600 dark:text-blue-400">
                      {{ formatSubscribers(channel.subscribers) }}
                    </span>
                    subscribers
                  </p>
                </div>
              </component>

              <button
                v-if="channel.id"
                type="button"
                class="inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-black active:scale-95"
                :class="channel.isFollowing
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                  : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600 hover:shadow-blue-500/40'"
                :disabled="followSubmitting"
                :aria-pressed="channel.isFollowing"
                @click="toggleFollow"
              >
                <svg
                  v-if="!channel.isFollowing"
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <svg
                  v-else
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {{ channel.isFollowing ? 'Subscribing' : 'Subscribe' }}
              </button>
            </div>
          </section>

          <!-- COMMENTS -->
          <section v-if="showComments" id="comments-section" class="mb-6">
            <div class="rounded-2xl bg-white p-5 shadow-sm dark:bg-black">
              <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 class="text-lg font-extrabold">
                  Comments
                  <span class="text-blue-600">({{ comments.length }})</span>
                </h2>
                <div class="flex items-center gap-2">
                  <select
                    v-model="commentSort"
                    class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-black dark:text-white"
                  >
                    <option value="top">Top comments</option>
                    <option value="newest">Newest first</option>
                  </select>
                  <button
                    type="button"
                    @click="showComments = false"
                    class="rounded-full px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                  >
                    Hide
                  </button>
                </div>
              </div>

              <form @submit.prevent="submitComment" class="mb-6 flex gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                  {{ userInitial }}
                </div>
                <div class="flex-1">
                  <textarea
                    v-model="newComment"
                    rows="2"
                    placeholder="Add a comment..."
                    :disabled="commentSubmitting"
                    class="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-black dark:text-white"
                  ></textarea>
                  <div class="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      @click="newComment = ''"
                      :disabled="commentSubmitting"
                      class="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-white/80 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      :disabled="!newComment.trim() || commentSubmitting"
                      class="rounded-full bg-blue-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {{ commentSubmitting ? 'Posting...' : 'Comment' }}
                    </button>
                  </div>
                  <p v-if="commentError" class="mt-2 text-xs font-bold text-red-500">
                    {{ commentError }}
                  </p>
                </div>
              </form>

              <div v-if="commentsLoading" class="py-8 text-center">
                <div class="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
                <p class="mt-2 text-xs font-bold text-slate-500 dark:text-white/70">
                  Loading comments...
                </p>
              </div>

              <div
                v-else-if="sortedComments.length === 0"
                class="rounded-xl bg-slate-50 p-6 text-center dark:bg-slate-900"
              >
                <MessageSquareIcon class="mx-auto h-8 w-8 text-slate-400" />
                <p class="mt-2 text-sm font-bold text-slate-500 dark:text-white/70">
                  No comments yet.
                </p>
                <p class="mt-1 text-xs text-slate-400">Be the first to comment.</p>
              </div>

              <div v-else class="space-y-5">
                <div v-for="comment in sortedComments" :key="comment.id" class="flex gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600">
                    {{ comment.user.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold text-slate-900 dark:text-white">
                        {{ comment.user }}
                      </span>
                      <span class="text-xs text-slate-400 dark:text-white/80">
                        {{ comment.time }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-slate-600 dark:text-white/80">
                      {{ comment.text }}
                    </p>
                    <div class="mt-2 flex items-center gap-4 text-xs font-bold text-slate-500">
                      <button type="button" class="inline-flex items-center gap-1 hover:text-blue-600">
                        <ThumbsUpIcon class="h-3.5 w-3.5" />
                        Like
                      </button>
                      <button type="button" class="hover:text-blue-600">Reply</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- RIGHT COLUMN — UP NEXT (scrolls independently on desktop) -->
        <aside class="min-w-0 lg:overflow-y-auto lg:pr-1 watch-scroll">
          <div class="mb-4 flex items-center justify-between gap-3 lg:sticky lg:top-0 lg:z-10 lg:bg-white lg:py-2 dark:lg:bg-black">
            <h2 class="text-lg font-extrabold">
              Up Next
              <span class="text-blue-600">Movies & Series</span>
            </h2>
            <label
              v-if="nextUpNextItem"
              class="inline-flex items-center gap-2 text-xs font-bold text-slate-500"
            >
              <input
                v-model="autoplay"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
              Autoplay
            </label>
          </div>

          <div
            v-if="upNext.length === 0"
            class="rounded-xl bg-slate-50 p-5 text-center dark:bg-black dark:shadow-white/20"
          >
            <p class="text-sm font-bold text-slate-500 dark:text-white/80">
              No recommendations available.
            </p>
          </div>

          <div
            v-else
            class="w-full space-y-3 pr-1"
          >
            <div
              v-for="(item, index) in upNext"
              :key="`${item.type}-${item.mediaId || item.id || 'x'}-${item.id || index}`"
              class="group flex cursor-pointer items-center gap-3 rounded-xl bg-white p-2 transition hover:bg-slate-100 dark:bg-black dark:hover:bg-slate-800"
              :class="isCurrentItem(item) ? 'ring-2 ring-blue-500' : ''"
              @click="playItem(item)"
            >
              <div
                class="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-slate-600 to-slate-900"
                :style="posterStyle(item.image)"
              >
                <div class="absolute inset-0 bg-black/30 transition group-hover:bg-black/10"></div>

                <span
                  v-if="isCurrentItem(item)"
                  class="absolute bottom-1.5 left-1.5 rounded bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold text-white"
                >
                  NOW PLAYING
                </span>
                <span
                  v-else
                  class="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded bg-black/70 text-[10px] font-bold text-white backdrop-blur"
                >
                  {{ item.type === 'episode' ? item.number : item.type === 'part' ? item.number : index + 1 }}
                </span>

                <span
                  v-if="item.duration"
                  class="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur"
                >
                  {{ item.duration }}
                </span>
              </div>

              <div class="min-w-0 flex-1">
                <p v-if="item.type === 'part'" class="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                  Movie Part
                </p>
                <p v-else-if="item.type === 'episode'" class="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                  Episode {{ item.number }}
                </p>
                <p v-else-if="item.type === 'movie'" class="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                  {{ item.genre || 'Movie' }}
                </p>
                <p v-else class="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                  Series
                </p>

                <h3 class="mt-0.5 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                  {{ item.title }}
                </h3>

                <div class="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-white/80">
                  <LucideStar class="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{{ item.rating || 'N/A' }}</span>
                  <span>•</span>
                  <span>{{ item.year || '—' }}</span>
                </div>
              </div>

              <button
                v-if="item.videoUrl"
                type="button"
                @click.stop="downloadMedia(item)"
                class="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-blue-500 hover:text-white dark:bg-slate-700 dark:text-white"
                :aria-label="`Download ${item.title}`"
                title="Download"
              >
                <DownloadIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
/* =====================================================
   IMPORTS
===================================================== */
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Header from './Header.vue'
import {
  PlayIcon,
  PauseIcon,
  ArrowLeft,
  ShareIcon,
  DownloadIcon,
  StarIcon,
  LucideStar,
  ThumbsUpIcon,
  ThumbsDownIcon,
  PlaySquare,
  MessageSquareIcon,
} from 'lucide-vue-next'


/* =====================================================
   AUTH TOKEN HELPERS
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
   ROUTER
===================================================== */
const route = useRoute()
const router = useRouter()


/* =====================================================
   API
===================================================== */
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const API_ORIGIN = (() => {
  try {
    if (/^https?:/i.test(API_BASE)) return new URL(API_BASE).origin
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

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers,
    ...options,
  })

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed (${response.status})`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
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
   CHANNEL NORMALIZER
===================================================== */
function normalizeChannel(item) {
  if (!item || typeof item !== 'object') return null

  const id = item?.id ?? item?._id ?? item?.channelId ?? item?.channel_id ?? ''
  const name = item?.name ?? item?.username ?? item?.channelName ?? item?.channel_name ?? item?.title ?? ''

  return {
    id: String(id || ''),
    name: name || 'Unknown Channel',
    avatar: item?.avatar ?? item?.logo ?? item?.image ?? '',
    banner: item?.banner ?? '',
    description: item?.description ?? '',
    subscribers: Number(
      item?.subscribers ??
      item?.subscriberCount ??
      item?.followerCount ??
      item?.followers ??
      0
    ),
    contentCount: Number(item?.contentCount ?? 0),
    isFollowing: Boolean(item?.isFollowing ?? item?.following ?? false),
    verified: Boolean(item?.verified ?? item?.isVerified ?? false),
    hasNewContent: Boolean(item?.hasNewContent ?? false),
    latestUploadAt: item?.latestUploadAt ?? null,
  }
}

function makeFallbackChannel() {
  return {
    id: '',
    name: 'Unknown Channel',
    avatar: '',
    banner: '',
    description: '',
    subscribers: 0,
    contentCount: 0,
    isFollowing: false,
    verified: false,
    hasNewContent: false,
    latestUploadAt: null,
  }
}


/* =====================================================
   EXTRACT CHANNEL ID FROM MEDIA PAYLOAD
===================================================== */
function extractChannelIdFromMedia(item) {
  if (!item || typeof item !== 'object') return ''
  const nested =
    item.channel?.id ??
    item.channel?._id ??
    item.channelId ??
    item.channel_id ??
    item.ownerId ??
    item.owner_id ??
    item.creatorId ??
    item.creator_id ??
    item.uploaderId ??
    item.uploader_id ??
    ''
  return String(nested || '')
}

function extractEmbeddedChannel(item) {
  if (!item || typeof item !== 'object') return null
  if (item.channel && typeof item.channel === 'object') {
    return normalizeChannel(item.channel)
  }
  return null
}


/* =====================================================
   FETCH CHANNEL BY ID
===================================================== */
async function fetchChannelById(channelId) {
  if (!channelId) return null
  try {
    const data = await apiFetch(`/channels/${encodeURIComponent(channelId)}`)
    const raw = data?.data?.channel ?? data?.channel ?? data?.data ?? data
    const normalized = normalizeChannel(raw)
    return normalized?.id ? normalized : null
  } catch (err) {
    console.warn(`Failed to fetch channel ${channelId}:`, err?.message)
    return null
  }
}


/* =====================================================
   RESOLVE CHANNEL FOR MEDIA
   Priority: embedded → /channels/:id → /channels list by name → fallback
===================================================== */
async function resolveChannelForMedia(item) {
  const embedded = extractEmbeddedChannel(item)
  if (embedded && embedded.id) {
    const fetched = await fetchChannelById(embedded.id)
    return fetched || embedded
  }

  const channelId = extractChannelIdFromMedia(item)
  if (channelId) {
    const fetched = await fetchChannelById(channelId)
    if (fetched) return fetched
  }

  const flatName =
    item?.channelName ??
    item?.channel_name ??
    item?.ownerName ??
    item?.creatorName ??
    item?.uploaderName ??
    ''

  if (flatName) {
    try {
      const data = await apiFetch('/channels')
      const payload = data?.data ?? data ?? {}
      const list = Array.isArray(payload.channels)
        ? payload.channels
        : Array.isArray(payload)
          ? payload
          : []
      const match = list.find(
        (ch) => String(ch?.name || '').toLowerCase() === String(flatName).toLowerCase()
      )
      if (match) {
        const normalized = normalizeChannel(match)
        if (normalized?.id) return normalized
      }
    } catch (err) {
      console.warn('Channel name match failed:', err?.message)
    }
  }

  return makeFallbackChannel()
}


/* =====================================================
   STATE
===================================================== */
const loading = ref(false)
const error = ref(null)
const media = ref(null)

const relatedMovies = ref([])
const relatedSeries = ref([])

const channel = ref(makeFallbackChannel())
const followSubmitting = ref(false)
const channelAvatarBroken = ref(false)


/* =====================================================
   PLAYER
===================================================== */
const videoPlayer = ref(null)
const isPlaying = ref(false)

const currentEpisode = ref(null)
const currentPart = ref(null)

const currentTime = ref(0)
const duration = ref(0)

const isTrailerMode = ref(false)
const videoSourceError = ref(false)


/* =====================================================
   SERVER
===================================================== */
const servers = [
  { id: 'main', label: 'Main' },
  { id: 'backup', label: 'Backup' },
  { id: 'hls', label: 'HLS' },
]
const selectedServer = ref('main')


/* =====================================================
   AUTOPLAY
===================================================== */
const autoplay = ref(true)
const showAutoNext = ref(false)
const autoNextCountdown = ref(5)
let autoNextTimer = null


/* =====================================================
   USER
===================================================== */
const userInitial = 'G'
const userRating = ref(0)
const hoverRating = ref(0)
const liked = ref(false)
const disliked = ref(false)
const descriptionExpanded = ref(false)

const likeCount = computed(() => (liked.value ? 1 : 0))


/* =====================================================
   COMMENTS
===================================================== */
const showComments = ref(false)
const comments = ref([])
const newComment = ref('')
const commentsLoading = ref(false)
const commentSubmitting = ref(false)
const commentError = ref('')
const commentSort = ref('top')


/* =====================================================
   HELPERS
===================================================== */
function getId(item) {
  if (!item) return ''
  return String(item.id ?? item._id ?? '')
}

function normalizeType(item) {
  const type = String(item?.type || '').toLowerCase()
  return type === 'series' ? 'series' : 'movie'
}

function partLabel(index) {
  let number = Number(index) + 1
  let label = ''
  while (number > 0) {
    const remainder = (number - 1) % 26
    label = String.fromCharCode(65 + remainder) + label
    number = Math.floor((number - 1) / 26)
  }
  return `Part ${label}`
}

function episodeLabel(number) {
  return `Ep ${number}`
}

function formatSubscribers(n) {
  const value = Number(n) || 0
  if (value >= 1e9) return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (value >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (value >= 1e3) return (value / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(value)
}


/* =====================================================
   FOLLOW TOGGLE
===================================================== */
async function toggleFollow() {
  if (!channel.value?.id || followSubmitting.value) return

  const next = !channel.value.isFollowing
  const prevSubs = channel.value.subscribers

  channel.value.isFollowing = next
  channel.value.subscribers += next ? 1 : -1
  followSubmitting.value = true

  try {
    const res = await apiFetch(
      `/channels/${encodeURIComponent(channel.value.id)}/follow`,
      { method: 'POST', body: JSON.stringify({ follow: next }) }
    )

    const payload = res?.data ?? res ?? {}
    if (typeof payload.subscribers === 'number') {
      channel.value.subscribers = payload.subscribers
    }
    if (typeof payload.isFollowing === 'boolean') {
      channel.value.isFollowing = payload.isFollowing
    }

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
    channel.value.isFollowing = !next
    channel.value.subscribers = prevSubs
  } finally {
    followSubmitting.value = false
  }
}


/* =====================================================
   MEDIA NORMALIZER
===================================================== */
function normalizeMedia(item) {
  if (!item) return null

  const episodes = Array.isArray(item.episodes)
    ? item.episodes
    : Array.isArray(item.episodesData)
      ? item.episodesData
      : []

  return {
    ...item,
    id: getId(item),
    type: normalizeType(item),
    image: item.image || item.poster || item.thumbnail || '',
    backdrop: item.backdrop || item.image || item.poster || item.thumbnail || '',
    trailerUrl: item.trailerUrl || item.trailer || '',
    videoUrl: item.videoUrl || item.video || '',
    episodes,
    episodeCount: Number(item.episodeCount) || episodes.length,
  }
}


/* =====================================================
   NORMALIZE MOVIE PARTS
===================================================== */
function normalizeMovieParts(item) {
  if (!item) return []

  const possibleParts = Array.isArray(item.parts)
    ? item.parts
    : Array.isArray(item.videoParts)
      ? item.videoParts
      : Array.isArray(item.videos)
        ? item.videos
        : Array.isArray(item.files)
          ? item.files
          : []

  return possibleParts
    .map((part, index) => {
      if (!part) return null
      const videoUrl = part.videoUrl || part.video || part.url || ''
      if (!videoUrl) return null

      const number = Number(part.number) > 0
        ? Number(part.number)
        : Number(part.partNumber) > 0
          ? Number(part.partNumber)
          : index + 1

      const label = part.label || part.partLabel || partLabel(index)

      return {
        ...part,
        id: getId(part) || `${getId(item)}-part-${index + 1}`,
        mediaId: getId(item),
        parentMediaId: getId(item),
        parentTitle: item.title || 'Movie',
        number,
        label,
        title: `${item.title || 'Movie'} — ${label}`,
        partTitle: part.title || '',
        duration: part.duration || '',
        rating: part.rating || item.rating || '',
        year: part.year || item.year || '',
        genre: part.genre || item.genre || '',
        image: part.image || part.thumbnail || item.image || item.poster || item.thumbnail || '',
        videoUrl,
        trailerUrl: part.trailerUrl || part.trailer || item.trailerUrl || item.trailer || '',
        type: 'part',
      }
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.number) - Number(b.number))
}


/* =====================================================
   EPISODES
===================================================== */
const episodes = computed(() => {
  if (!media.value || media.value.type !== 'series') return []

  const rawEpisodes = Array.isArray(media.value.episodes) ? media.value.episodes : []

  return rawEpisodes
    .map((episode, index) => {
      if (!episode) return null
      const videoUrl = episode.videoUrl || episode.video || episode.url || ''
      if (!videoUrl) return null

      const number = Number(episode.number) > 0
        ? Number(episode.number)
        : Number(episode.episodeNumber) > 0
          ? Number(episode.episodeNumber)
          : index + 1

      return {
        ...episode,
        id: getId(episode) || `${media.value.id}-episode-${index + 1}`,
        mediaId: media.value.id,
        parentMediaId: media.value.id,
        parentTitle: media.value.title,
        number,
        title: `${media.value.title || 'Series'} — ${episodeLabel(number)}`,
        episodeTitle: episode.title || '',
        duration: episode.duration || '',
        description: episode.description || '',
        rating: episode.rating || media.value.rating || '',
        year: episode.year || media.value.year || '',
        genre: episode.genre || media.value.genre || '',
        image: episode.image || episode.thumbnail || media.value.image || '',
        videoUrl,
        trailerUrl: episode.trailerUrl || episode.trailer || '',
        type: 'episode',
      }
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.number) - Number(b.number))
})


/* =====================================================
   MOVIE PARTS
===================================================== */
const movieParts = computed(() => {
  if (!media.value || media.value.type === 'series') return []
  return normalizeMovieParts(media.value)
})


/* =====================================================
   TRAILER
===================================================== */
const hasTrailer = computed(() => {
  if (!media.value) return false
  return Boolean(
    currentEpisode.value?.trailerUrl ||
    currentPart.value?.trailerUrl ||
    media.value.trailerUrl
  )
})


/* =====================================================
   ACTIVE VIDEO URL
===================================================== */
const activeVideoUrl = computed(() => {
  if (!media.value) return ''

  if (isTrailerMode.value) {
    return (
      currentEpisode.value?.trailerUrl ||
      currentPart.value?.trailerUrl ||
      media.value.trailerUrl ||
      ''
    )
  }

  if (media.value.type === 'series') {
    return currentEpisode.value?.videoUrl || ''
  }

  if (currentPart.value) {
    return currentPart.value.videoUrl || ''
  }

  return media.value.videoUrl || ''
})


/* =====================================================
   ACTIVE DOWNLOAD ITEM
===================================================== */
const activeDownloadItem = computed(() => {
  if (currentEpisode.value) return currentEpisode.value
  if (currentPart.value) return currentPart.value
  return media.value
})


/* =====================================================
   RELATED
===================================================== */
function flattenMovie(movie) {
  const normalized = normalizeMedia(movie)
  if (!normalized) return []

  const parts = normalizeMovieParts(normalized)
  if (parts.length) {
    return parts.map((part) => ({ ...part, type: 'part' }))
  }

  if (normalized.videoUrl) {
    return [{ ...normalized, mediaId: normalized.id, type: 'movie' }]
  }
  return []
}

function flattenSeries(series) {
  const normalized = normalizeMedia(series)
  if (!normalized) return []

  const rawEpisodes = Array.isArray(normalized.episodes) ? normalized.episodes : []

  return rawEpisodes
    .map((episode, index) => {
      if (!episode) return null
      const videoUrl = episode.videoUrl || episode.video || episode.url || ''
      if (!videoUrl) return null

      const number = Number(episode.number) > 0
        ? Number(episode.number)
        : Number(episode.episodeNumber) > 0
          ? Number(episode.episodeNumber)
          : index + 1

      return {
        ...episode,
        id: getId(episode) || `${normalized.id}-episode-${index + 1}`,
        mediaId: normalized.id,
        parentMediaId: normalized.id,
        parentTitle: normalized.title,
        number,
        title: `${normalized.title || 'Series'} — ${episodeLabel(number)}`,
        episodeTitle: episode.title || '',
        duration: episode.duration || '',
        rating: episode.rating || normalized.rating || '',
        year: episode.year || normalized.year || '',
        genre: episode.genre || normalized.genre || '',
        image: episode.image || episode.thumbnail || normalized.image || '',
        videoUrl,
        trailerUrl: episode.trailerUrl || episode.trailer || normalized.trailerUrl || '',
        type: 'episode',
      }
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.number) - Number(b.number))
}

function buildRelatedList() {
  const output = []
  const seenMovies = new Set()
  const seenSeries = new Set()

  relatedMovies.value.forEach((movie) => {
    const normalized = normalizeMedia(movie)
    if (!normalized?.id) return
    if (normalized.id === media.value?.id) return
    if (seenMovies.has(normalized.id)) return
    seenMovies.add(normalized.id)
    output.push(...flattenMovie(normalized))
  })

  relatedSeries.value.forEach((series) => {
    const normalized = normalizeMedia(series)
    if (!normalized?.id) return
    if (normalized.id === media.value?.id) return
    if (seenSeries.has(normalized.id)) return
    seenSeries.add(normalized.id)
    output.push(...flattenSeries(normalized))
  })

  return output.slice(0, 100)
}

const upNext = computed(() => {
  if (!media.value) return []

  if (media.value.type === 'series') {
    return [...episodes.value, ...buildRelatedList()]
  }

  if (movieParts.value.length) {
    return [...movieParts.value, ...buildRelatedList()]
  }

  return buildRelatedList()
})

function isCurrentItem(item) {
  if (!item) return false
  if (item.type === 'episode' && currentEpisode.value) {
    return String(currentEpisode.value.id) === String(item.id)
  }
  if (item.type === 'part' && currentPart.value) {
    return String(currentPart.value.id) === String(item.id)
  }
  if (
    item.type === 'movie' &&
    media.value &&
    media.value.type === 'movie' &&
    !movieParts.value.length
  ) {
    return String(item.mediaId || item.id) === String(media.value.id)
  }
  return false
}

const nextUpNextItem = computed(() => {
  if (!upNext.value.length) return null
  const currentIndex = upNext.value.findIndex((item) => isCurrentItem(item))
  if (currentIndex >= 0 && currentIndex < upNext.value.length - 1) {
    return upNext.value[currentIndex + 1]
  }
  if (currentIndex < 0) return upNext.value[0] || null
  return null
})


/* =====================================================
   COMMENTS SORT
===================================================== */
const sortedComments = computed(() => {
  const list = [...comments.value]
  if (commentSort.value === 'newest') {
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }
  return list
})


/* =====================================================
   FETCH MEDIA
===================================================== */
async function fetchMedia(id) {
  loading.value = true
  error.value = null
  media.value = null
  relatedMovies.value = []
  relatedSeries.value = []
  currentEpisode.value = null
  currentPart.value = null
  videoSourceError.value = false
  channel.value = makeFallbackChannel()
  channelAvatarBroken.value = false

  try {
    const data = await apiFetch(`/media/${encodeURIComponent(id)}`)
    const item = data?.data ?? data?.media ?? data

    if (!item || !getId(item)) {
      media.value = null
      return
    }

    media.value = normalizeMedia(item)
    channel.value = await resolveChannelForMedia(item)

    await fetchRelated(media.value)

    if (media.value.type === 'series' && episodes.value.length) {
      currentEpisode.value = episodes.value[0]
    }

    if (media.value.type !== 'series' && movieParts.value.length) {
      currentPart.value = movieParts.value[0]
    }

    await fetchComments(media.value.id)
  } catch (err) {
    error.value = err?.message || 'Failed to load this title.'
  } finally {
    loading.value = false
  }
}


/* =====================================================
   FETCH RELATED
===================================================== */
async function fetchRelated(item) {
  relatedMovies.value = []
  relatedSeries.value = []

  let list = []

  try {
    const data = await apiFetch(`/media/${encodeURIComponent(item.id)}/related`)
    list = extractList(data)
  } catch (err) {
    console.warn('related endpoint failed:', err?.message)
    list = []
  }

  if (!list.length) {
    try {
      const [moviesData, seriesData] = await Promise.all([
        apiFetch('/movies').catch(() => null),
        apiFetch('/series').catch(() => null),
      ])
      list = [...extractList(moviesData), ...extractList(seriesData)]
    } catch (err) {
      console.warn('fallback fetch failed:', err?.message)
    }
  }

  const normalized = list
    .map((raw, index) => {
      const normalizedItem = normalizeMedia(raw)
      if (!normalizedItem) return null
      if (!normalizedItem.id) normalizedItem.id = `related-${index}`
      return normalizedItem
    })
    .filter(Boolean)

  relatedMovies.value = normalized.filter((i) => i.type === 'movie')
  relatedSeries.value = normalized.filter((i) => i.type === 'series')
}


/* =====================================================
   EXTRACT LIST
===================================================== */
function extractList(data) {
  if (!data) return []
  if (Array.isArray(data)) return data

  const candidates = [
    data.data,
    data.items,
    data.results,
    data.related,
    data.movies,
    data.series,
    data.media,
    data.list,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
    if (candidate && typeof candidate === 'object') {
      const nested = [candidate.data, candidate.items, candidate.results, candidate.list]
      for (const value of nested) {
        if (Array.isArray(value)) return value
      }
    }
  }

  return []
}


/* =====================================================
   FETCH COMMENTS
===================================================== */
async function fetchComments(mediaId) {
  commentsLoading.value = true
  commentError.value = ''

  try {
    const data = await apiFetch(`/media/${encodeURIComponent(mediaId)}/comments`)
    const list = extractList(data)
    comments.value = list.map(normalizeComment)
  } catch (err) {
    comments.value = []
    commentError.value = err?.message || 'Failed to load comments.'
  } finally {
    commentsLoading.value = false
  }
}

function normalizeComment(comment) {
  const user =
    comment.user ||
    comment.userName ||
    comment.username ||
    comment.name ||
    comment.author ||
    'Guest'

  return {
    ...comment,
    id: getId(comment) || `${Date.now()}-${Math.random()}`,
    user: typeof user === 'object'
      ? user.username || user.name || 'Guest'
      : String(user),
    text: comment.text || comment.content || comment.comment || '',
    createdAt: comment.createdAt || comment._createdAt || comment.created_at || null,
    time: formatCommentTime(
      comment.createdAt || comment._createdAt || comment.created_at
    ),
  }
}

function formatCommentTime(date) {
  if (!date) return 'Just now'
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return 'Just now'

  const seconds = Math.floor((Date.now() - value.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

async function submitComment() {
  const text = newComment.value.trim()
  if (!text || !media.value) return

  commentSubmitting.value = true
  commentError.value = ''

  try {
    const data = await apiFetch(
      `/media/${encodeURIComponent(media.value.id)}/comments`,
      { method: 'POST', body: JSON.stringify({ text }) }
    )

    const saved = data?.data ?? data?.comment ?? data

    if (saved) {
      comments.value.unshift(normalizeComment(saved))
    } else {
      await fetchComments(media.value.id)
    }

    newComment.value = ''
  } catch (err) {
    commentError.value = err?.message || 'Failed to post comment.'
  } finally {
    commentSubmitting.value = false
  }
}


/* =====================================================
   POSTER
===================================================== */
function posterStyle(image) {
  if (!image) return {}
  return {
    backgroundImage: `url("${resolveImageUrl(image)}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}


/* =====================================================
   TIME FORMAT
===================================================== */
function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}


/* =====================================================
   TRAILER / PLAYER
===================================================== */
function toggleTrailer() {
  if (!hasTrailer.value) {
    console.warn('[Trailer] No trailer available')
    return
  }
  cancelAutoNext()
  videoSourceError.value = false
  isTrailerMode.value = !isTrailerMode.value
}

watch(activeVideoUrl, async (newUrl) => {
  cancelAutoNext()
  videoSourceError.value = false
  currentTime.value = 0
  duration.value = 0
  isPlaying.value = false

  if (!newUrl) {
    const oldVideo = videoPlayer.value
    if (oldVideo) {
      try { oldVideo.pause() } catch {}
    }
    return
  }

  await nextTick()
  const video = videoPlayer.value
  if (!video) return
  try { video.pause() } catch {}
  try { video.currentTime = 0 } catch {}
  try { video.load() } catch {}
})

function onCanPlay(event) {
  const video = event.target
  if (!video) return
  if (video.src && activeVideoUrl.value && video.src.includes(activeVideoUrl.value)) {
    video.play().then(() => { isPlaying.value = true }).catch(() => { isPlaying.value = false })
  }
}

function selectEpisode(episode) {
  if (!episode) return
  cancelAutoNext()
  isTrailerMode.value = false
  currentPart.value = null
  currentEpisode.value = episode
}

function selectPart(part) {
  if (!part) return
  cancelAutoNext()
  isTrailerMode.value = false
  currentEpisode.value = null
  currentPart.value = part
}

function playItem(item) {
  if (!item) return

  if (item.type === 'episode') {
    if (media.value && String(item.mediaId) === String(media.value.id) && media.value.type === 'series') {
      selectEpisode(item)
      return
    }
    if (item.mediaId) {
      router.push(`/watch/${item.mediaId}`)
      return
    }
  }

  if (item.type === 'part') {
    if (media.value && String(item.mediaId) === String(media.value.id) && media.value.type !== 'series') {
      selectPart(item)
      return
    }
    if (item.mediaId) {
      router.push(`/watch/${item.mediaId}`)
      return
    }
  }

  if (item.type === 'movie' || item.type === 'series') {
    const id = item.mediaId || item.id
    if (!id) return
    router.push(`/watch/${id}`)
  }
}

function togglePlay() {
  const video = videoPlayer.value
  if (!video) return
  if (video.paused) {
    video.play().then(() => { isPlaying.value = true }).catch(() => { isPlaying.value = false })
  } else {
    video.pause()
    isPlaying.value = false
  }
}

function onTimeUpdate(event) {
  const video = event.target
  if (!video) return
  currentTime.value = video.currentTime

  if (
    autoplay.value &&
    video.duration &&
    video.duration - video.currentTime <= 5 &&
    video.duration - video.currentTime > 0 &&
    !showAutoNext.value &&
    nextUpNextItem.value
  ) {
    startAutoNextCountdown()
  }
}

function onLoadedMetadata(event) {
  const video = event.target
  duration.value = Number.isFinite(video.duration) ? video.duration : 0
}

function onVideoError(event) {
  const video = event.target
  isPlaying.value = false
  videoSourceError.value = true
  console.error('Video playback error:', video?.error)
}

function onEnded() {
  isPlaying.value = false
  cancelAutoNext()
  if (!autoplay.value) return
  const next = nextUpNextItem.value
  if (!next) return
  playItem(next)
}

function startAutoNextCountdown() {
  if (showAutoNext.value) return
  if (!nextUpNextItem.value) return

  showAutoNext.value = true
  autoNextCountdown.value = 5
  autoNextTimer = window.setInterval(() => {
    autoNextCountdown.value -= 1
    if (autoNextCountdown.value <= 0) {
      cancelAutoNext()
      playNextNow()
    }
  }, 1000)
}

function cancelAutoNext() {
  if (autoNextTimer) window.clearInterval(autoNextTimer)
  autoNextTimer = null
  showAutoNext.value = false
  autoNextCountdown.value = 5
}

function playNextNow() {
  cancelAutoNext()
  const next = nextUpNextItem.value
  if (!next) return
  playItem(next)
}


/* =====================================================
   RATING / LIKE / SHARE / DOWNLOAD
===================================================== */
function setRating(star) {
  userRating.value = star
}

function toggleLike() {
  liked.value = !liked.value
  if (liked.value) disliked.value = false
}

function toggleDislike() {
  disliked.value = !disliked.value
  if (disliked.value) liked.value = false
}

function shareMedia() {
  if (!media.value) return
  const url = window.location.href

  if (navigator.share) {
    navigator.share({
      title: media.value.title,
      text: `Watch ${media.value.title}`,
      url,
    }).catch(() => {})
    return
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
      .then(() => alert('Link copied to clipboard!'))
      .catch(() => {})
  }
}

function downloadMedia(item) {
  const url = item?.videoUrl || item?.video || ''
  if (!url) {
    alert('No download source available.')
    return
  }

  let baseTitle = ''
  if (item?.type === 'part') {
    baseTitle = item.title || `${media.value?.title || 'Movie'} — ${item.label || 'Part'}`
  } else if (item?.type === 'episode') {
    baseTitle = item.title || `${media.value?.title || 'Series'} — Ep ${item.number || ''}`
  } else {
    baseTitle = item?.title || media.value?.title || 'download'
  }

  const cleanTitle = String(baseTitle).replace(/[\\/:*?"<>|]+/g, '_').trim() || 'download'

  let ext = ''
  try {
    const pathname = new URL(url, window.location.origin).pathname
    const match = pathname.match(/\.([a-z0-9]{2,5})$/i)
    if (match) ext = '.' + match[1].toLowerCase()
  } catch {
    ext = ''
  }
  if (!ext) ext = '.mp4'

  const link = document.createElement('a')
  link.href = url
  link.download = cleanTitle + ext
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link)
  }, 0)
}


/* =====================================================
   BACK
===================================================== */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}


/* =====================================================
   ROUTE CHANGE
===================================================== */
watch(
  () => route.params.id,
  async (newId) => {
    if (!newId) {
      media.value = null
      return
    }

    cancelAutoNext()
    isPlaying.value = false
    currentEpisode.value = null
    currentPart.value = null
    liked.value = false
    disliked.value = false
    descriptionExpanded.value = false
    currentTime.value = 0
    duration.value = 0
    newComment.value = ''
    comments.value = []
    commentError.value = ''
    userRating.value = 0
    hoverRating.value = 0
    isTrailerMode.value = false
    showComments.value = false
    videoSourceError.value = false
    relatedMovies.value = []
    relatedSeries.value = []
    channel.value = makeFallbackChannel()
    followSubmitting.value = false
    channelAvatarBroken.value = false

    if (videoPlayer.value) {
      try {
        videoPlayer.value.pause()
        videoPlayer.value.currentTime = 0
      } catch {}
    }

    await nextTick()
    await fetchMedia(newId)
  },
  { immediate: true }
)


/* =====================================================
   CLEANUP
===================================================== */
onBeforeUnmount(() => {
  cancelAutoNext()
  if (videoPlayer.value) {
    try { videoPlayer.value.pause() } catch {}
  }
})
</script>

<style scoped>
/* Custom scrollbar for both desktop columns */
.watch-scroll::-webkit-scrollbar {
  width: 8px;
}
.watch-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.watch-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}
.watch-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.watch-scroll {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

/* Dark-mode friendly scrollbar */
:global(.dark) .watch-scroll::-webkit-scrollbar-thumb,
.dark .watch-scroll::-webkit-scrollbar-thumb {
  background: #334155;
}
:global(.dark) .watch-scroll::-webkit-scrollbar-thumb:hover,
.dark .watch-scroll::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>