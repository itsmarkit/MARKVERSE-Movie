<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">
    <header class="fixed left-0 right-0 top-0 z-50">
      <AdminHeader />
    </header>

    <main class="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-8xl">

        <!-- ========================= HEADING ========================= -->
        <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Admin</p>
            <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Channel
              <span class="text-blue-600">Management</span>
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-slate-500 dark:text-white/70 sm:text-base">
              Create, edit, delete channels, manage their content, and view followers.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900 dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
              title="Refresh"
              @click="refresh"
            >
              <RefreshCwIcon class="h-4 w-4" :class="refreshing ? 'animate-spin' : ''" />
              Refresh
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900 dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
              title="Export JSON (Ctrl+E)"
              @click="exportChannels"
            >
              <DownloadIcon class="h-4 w-4" />
              Export
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
              title="New Channel (Ctrl+N)"
              @click="openCreateChannel"
            >
              <PlusIcon class="h-4 w-4" />
              New Channel
            </button>
          </div>
        </div>

        <!-- ========================= LOADING ========================= -->
        <div
          v-if="loading"
          class="mb-6 flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
        >
          <div class="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
          <p class="text-sm font-bold text-slate-500 dark:text-white/70">
            Loading channels…
          </p>
        </div>

        <!-- ========================= ERROR ========================= -->
        <div
          v-else-if="error"
          class="mb-6 flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
        >
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">⚠️</div>
          <h2 class="text-2xl font-black">Failed to load channels</h2>
          <p class="mt-2 max-w-md text-sm text-slate-500 dark:text-white/70">
            {{ error }}
          </p>
          <p
            v-if="isAuthError"
            class="mt-2 text-xs font-bold text-amber-600"
          >
            Your session may have expired. Try logging in again.
          </p>
          <div class="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              class="rounded-full bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
              @click="fetchChannels"
            >
              Try again
            </button>
            <router-link
              v-if="isAuthError"
              to="/login"
              class="rounded-full bg-white px-6 py-3 font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              Go to Login
            </router-link>
          </div>
        </div>

        <template v-else>
          <!-- ========================= STATS ========================= -->
          <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Total</p>
              <p class="mt-1 text-2xl font-black text-blue-600">{{ counts.total }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Followers</p>
              <p class="mt-1 text-2xl font-black text-emerald-600">{{ formatNumber(counts.followers) }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Titles</p>
              <p class="mt-1 text-2xl font-black text-purple-600">{{ counts.titles }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">New Today</p>
              <p class="mt-1 text-2xl font-black text-amber-600">{{ counts.newToday }}</p>
            </div>
          </div>

          <!-- ========================= FILTERS ROW 1 ========================= -->
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="t in sortTabs"
                :key="t.value"
                type="button"
                class="rounded-full px-4 py-2.5 text-sm font-bold transition"
                :class="
                  sortBy === t.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    :  'bg-white text-slate-700 hover:bg-slate-100 dark:bg-black dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-900'
                "
                @click="sortBy = t.value"
              >
                {{ t.label }}
              </button>
            </div>

            <div class="ml-auto flex items-center gap-2">
              <div class="flex overflow-hidden rounded-xl bg-white shadow-sm dark:bg-black dark:border dark:border-slate-800">
                <button
                  type="button"
                  class="px-3 py-2 transition"
                  :class="viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800'"
                  @click="viewMode = 'grid'"
                  title="Grid view"
                >
                  <LayoutGridIcon class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="px-3 py-2 transition"
                  :class="viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800'"
                  @click="viewMode = 'list'"
                  title="List view"
                >
                  <ListIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- ========================= FILTERS ROW 2 ========================= -->
          <div class="mb-6 flex flex-wrap items-center gap-3">
            <div class="relative w-full sm:w-72">
              <input
                v-model="search"
                type="search"
                placeholder="Search channel name or description..."
                class="w-full rounded-xl bg-white px-4 py-2.5 pr-10 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-blue-500/20 dark:bg-black dark:border dark:border-slate-800 dark:text-white"
              />
              <SearchIcon class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              v-if="hasActiveFilters"
              type="button"
              class="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-100"
              @click="clearFilters"
            >
              Clear filters
            </button>
          </div>

          <!-- ========================= BULK ACTIONS ========================= -->
          <div
            v-if="selectedIds.length"
            class="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-blue-50 p-3 dark:bg-blue-500/10"
          >
            <span class="text-sm font-black text-blue-700 dark:text-blue-300">
              {{ selectedIds.length }} selected
            </span>
            <div class="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-full bg-red-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-red-700"
                @click="bulkDelete"
              >
                <TrashIcon class="mr-1 inline h-3.5 w-3.5" />
                Delete
              </button>
              <button
                type="button"
                class="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-100 dark:bg-slate-800 dark:text-white"
                @click="selectedIds = []"
              >
                Cancel
              </button>
            </div>
          </div>

          <!-- ========================= EMPTY ========================= -->
          <div
            v-if="!filtered.length"
            class="flex min-h-[260px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
          >
            <RadioIcon class="mb-3 h-12 w-12 text-slate-300" />
            <h2 class="text-xl font-black">No channels found</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-white/70">
              {{ hasActiveFilters ? 'Try a different filter or search term.' : 'Create one to get started.' }}
            </p>
            <button
              type="button"
              class="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
              @click="openCreateChannel"
            >
              <PlusIcon class="h-4 w-4" />
              New Channel
            </button>
          </div>

          <!-- ========================= GRID VIEW ========================= -->
          <div
            v-else-if="viewMode === 'grid'"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <article
              v-for="channel in paginated"
              :key="channel.id"
              class="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-black dark:text-white dark:shadow-white/20"
            >
              <div class="absolute left-3 top-3 z-20">
                <input
                  v-model="selectedIds"
                  type="checkbox"
                  :value="channel.id"
                  class="h-4 w-4 rounded border-white/70 text-blue-500 shadow"
                />
              </div>

              <div
                class="relative h-24 overflow-hidden bg-gradient-to-br from-blue-500/70 to-slate-800 sm:h-28"
                :style="bannerStyle(channel.banner)"
              >
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <span
                  class="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-black text-white shadow sm:right-3 sm:top-3"
                >
                  ADMIN
                </span>
              </div>

              <div class="relative px-3 pb-3 pt-0 sm:px-5 sm:pb-5">
                <div class="-mt-6 mb-2 flex items-end justify-between gap-2 sm:-mt-8 sm:mb-3">
                  <div
                    class="block h-12 w-12 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow sm:h-16 sm:w-16 dark:border-black dark:bg-slate-800"
                  >
                    <img
                      v-if="channel.avatar && !avatarErrors[channel.id]"
                      :src="resolveImageUrl(channel.avatar)"
                      :alt="channel.name"
                      class="h-full w-full object-cover"
                      @error="onAvatarError(channel.id)"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-base font-black text-slate-500 sm:text-xl dark:text-white/70"
                    >
                      {{ initials(channel.name) }}
                    </div>
                  </div>

                  <div class="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      @click="openEditChannel(channel)"
                      class="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700 transition hover:bg-slate-200 sm:px-3 sm:py-1.5 sm:text-xs dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      @click="confirmDeleteChannel(channel)"
                      class="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-500/20 sm:px-3 sm:py-1.5 sm:text-xs dark:bg-red-500/20 dark:text-red-400"
                    >
                      Del
                    </button>
                  </div>
                </div>

                <h3 class="truncate text-sm font-bold sm:text-lg">
                  {{ channel.name }}
                </h3>

                <p class="mt-0.5 truncate text-[10px] font-medium text-slate-600 sm:text-sm dark:text-white/70">
                  {{ formatSubscribers(channel.subscribers) }} followers
                  <span v-if="channel.contentCount">
                    • {{ channel.contentCount }} titles
                  </span>
                </p>

                <p
                  v-if="channel.description"
                  class="mt-1.5 line-clamp-2 text-[10px] leading-4 text-slate-500 sm:mt-2 sm:text-xs sm:leading-5 dark:text-white/60"
                >
                  {{ channel.description }}
                </p>

                <div class="mt-3 space-y-2 sm:mt-4">
                  <button
                    type="button"
                    @click="openContentManager(channel)"
                    class="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition group-hover:bg-blue-600 sm:px-5 sm:py-2 sm:text-sm"
                  >
                    <PlayIcon class="h-3 w-3 fill-current sm:h-4 sm:w-4" />
                    Manage Content
                  </button>

                  <!-- NEW: Followers button -->
                  <button
                    type="button"
                    @click="openFollowersModal(channel)"
                    class="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/20 sm:px-5 sm:py-2 sm:text-sm dark:bg-emerald-500/20 dark:text-emerald-300"
                  >
                    <UsersIcon class="h-3 w-3 sm:h-4 sm:w-4" />
                    View Followers ({{ channel.subscribers }})
                  </button>
                </div>
              </div>
            </article>
          </div>

          <!-- ========================= LIST VIEW ========================= -->
          <div v-else class="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-black dark:border dark:border-slate-800">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-white/70">
                <tr>
                  <th class="px-4 py-3">
                    <input
                      type="checkbox"
                      class="h-4 w-4 rounded border-slate-300 text-blue-500"
                      :checked="allSelected"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th class="px-4 py-3 font-black">Channel</th>
                  <th class="px-4 py-3 font-black">Followers</th>
                  <th class="px-4 py-3 font-black">Titles</th>
                  <th class="px-4 py-3 font-black">Created</th>
                  <th class="px-4 py-3 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr
                  v-for="channel in paginated"
                  :key="channel.id"
                  class="transition hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <td class="px-4 py-3">
                    <input
                      v-model="selectedIds"
                      type="checkbox"
                      :value="channel.id"
                      class="h-4 w-4 rounded border-slate-300 text-blue-500"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-black text-white"
                      >
                        <img
                          v-if="channel.avatar && !avatarErrors[channel.id]"
                          :src="resolveImageUrl(channel.avatar)"
                          :alt="channel.name"
                          class="h-full w-full object-cover"
                          @error="onAvatarError(channel.id)"
                        />
                        <span v-else>{{ initials(channel.name) }}</span>
                      </div>
                      <div class="min-w-0">
                        <p class="truncate font-black">{{ channel.name }}</p>
                        <p class="truncate text-xs text-slate-500 dark:text-white/60">
                          {{ channel.description || '—' }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 font-semibold dark:text-white/80">
                    <button
                      type="button"
                      class="font-bold text-emerald-600 hover:underline"
                      title="View followers"
                      @click="openFollowersModal(channel)"
                    >
                      {{ formatNumber(channel.subscribers) }}
                    </button>
                  </td>
                  <td class="px-4 py-3 font-semibold dark:text-white/80">
                    {{ channel.contentCount }}
                  </td>
                  <td class="px-4 py-3 font-semibold text-slate-500 dark:text-white/70">
                    {{ relativeTime(channel._createdAt) }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-blue-600"
                        title="Manage Content"
                        @click="openContentManager(channel)"
                      >
                        <PlayIcon class="h-4 w-4" />
                      </button>

                      <!-- NEW: Followers icon button -->
                      <button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-emerald-600"
                        title="View Followers"
                        @click="openFollowersModal(channel)"
                      >
                        <UsersIcon class="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-blue-600"
                        title="Edit"
                        @click="openEditChannel(channel)"
                      >
                        <PencilIcon class="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                        title="Delete"
                        @click="confirmDeleteChannel(channel)"
                      >
                        <TrashIcon class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ========================= PAGINATION ========================= -->
          <div
            v-if="filtered.length"
            class="mt-5 flex flex-wrap items-center justify-between gap-3"
          >
            <p class="text-xs font-bold text-slate-500 dark:text-white/60">
              Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filtered.length) }} of {{ filtered.length }}
            </p>

            <div class="flex items-center gap-2">
              <select
                v-model.number="pageSize"
                class="rounded-xl bg-white px-3 py-2 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
                @change="currentPage = 1"
              >
                <option :value="8">8 / page</option>
                <option :value="16">16 / page</option>
                <option :value="32">32 / page</option>
              </select>

              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-black dark:border dark:border-slate-800 dark:text-white"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <ChevronLeftIcon class="h-4 w-4" />
              </button>

              <span class="text-xs font-black dark:text-white">
                {{ currentPage }} / {{ totalPages || 1 }}
              </span>

              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-black dark:border dark:border-slate-800 dark:text-white"
                :disabled="currentPage >= totalPages"
                @click="currentPage++"
              >
                <ChevronRightIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </template>

      </section>
    </main>

    <!-- ============================================= -->
    <!-- CHANNEL MODAL (create / edit) — FILE UPLOAD -->
    <!-- ============================================= -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="channelModal.open"
          class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          @click.self="closeChannelModal"
        >
          <div
            class="my-6 w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-slate-950 dark:border dark:border-slate-800"
          >
            <!-- Sticky header -->
            <div
              class="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
            >
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                  {{ channelModal.mode === 'create' ? 'Create' : 'Edit' }}
                </p>
                <h2 class="mt-0.5 text-xl font-black">
                  {{ channelModal.mode === 'create' ? 'New' : 'Edit' }}
                  <span class="text-blue-600">Channel</span>
                </h2>
                <p class="mt-0.5 text-xs text-slate-500 dark:text-white/60">
                  {{ channelModal.mode === 'create'
                    ? 'Fill in the details to create a new channel.'
                    : `Editing "${channelModal.form.name}"` }}
                </p>
              </div>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-white"
                @click="closeChannelModal"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>

            <!-- Body -->
            <form class="p-6" @submit.prevent="saveChannel">
              <!-- Save progress -->
              <div v-if="channelModal.saving" class="mb-5">
                <div class="mb-1 flex items-center justify-between text-xs font-black text-blue-600">
                  <span>{{ channelModal.saveStage || 'Saving…' }}</span>
                  <span>{{ channelModal.saveProgress }}%</span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    class="h-full bg-blue-500 transition-all duration-300"
                    :style="{ width: `${channelModal.saveProgress}%` }"
                  ></div>
                </div>
              </div>

              <!-- Live preview card -->
              <div class="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <div
                  class="relative h-24 bg-gradient-to-br from-blue-500/70 to-slate-800"
                  :style="bannerStyle(channelModal.form.banner)"
                >
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <span class="absolute right-3 top-3 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-black text-white">
                    PREVIEW
                  </span>
                </div>
                <div class="relative px-4 pb-4">
                  <div class="-mt-7 mb-2 flex items-end gap-3">
                    <div
                      class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow dark:border-slate-900 dark:bg-slate-800"
                    >
                      <img
                        v-if="channelModal.form.avatar && !previewAvatarError"
                        :src="resolveImageUrl(channelModal.form.avatar)"
                        alt="Avatar preview"
                        class="h-full w-full object-cover"
                        @error="previewAvatarError = true"
                        @load="previewAvatarError = false"
                      />
                      <span
                        v-else
                        class="text-lg font-black text-slate-500 dark:text-white/70"
                      >
                        {{ initials(channelModal.form.name || '?') }}
                      </span>
                    </div>
                    <div class="min-w-0 flex-1 pb-1">
                      <p class="truncate text-sm font-black sm:text-base">
                        {{ channelModal.form.name || 'Channel name' }}
                      </p>
                      <p class="truncate text-[11px] font-semibold text-slate-500 dark:text-white/60">
                        {{ formatNumber(channelModal.form.subscribers) }} followers
                        • {{ channelModal.mode === 'edit' ? channelModal.form.contentCount || 0 : 0 }} titles
                      </p>
                    </div>
                  </div>
                  <p
                    v-if="channelModal.form.description"
                    class="line-clamp-2 text-xs text-slate-500 dark:text-white/60"
                  >
                    {{ channelModal.form.description }}
                  </p>
                  <p v-else class="text-xs italic text-slate-400 dark:text-white/40">
                    No description yet.
                  </p>
                </div>
              </div>

              <!-- Section: Identity -->
              <p class="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
                Identity
              </p>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <!-- Name -->
                <div class="sm:col-span-2">
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Channel Name *
                  </label>
                  <input
                    v-model="channelModal.form.name"
                    type="text"
                    placeholder="e.g. MarkVerse Originals"
                    class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                    :class="channelModal.errors.name
                      ? 'border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-500/10'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white'"
                    @input="channelModal.errors.name = ''"
                  />
                  <p v-if="channelModal.errors.name" class="mt-1 text-xs font-bold text-red-500">
                    {{ channelModal.errors.name }}
                  </p>
                  <p v-else class="mt-1 text-[11px] text-slate-400 dark:text-white/40">
                    Displayed on channel cards and in the channel header.
                  </p>
                </div>

                <!-- Description -->
                <div class="sm:col-span-2">
                  <div class="mb-1.5 flex items-center justify-between">
                    <label class="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                      Description
                    </label>
                    <span
                      class="text-[10px] font-bold"
                      :class="(channelModal.form.description || '').length > 280 ? 'text-red-500' : 'text-slate-400 dark:text-white/40'"
                    >
                      {{ (channelModal.form.description || '').length }} / 320
                    </span>
                  </div>
                  <textarea
                    v-model="channelModal.form.description"
                    rows="3"
                    maxlength="320"
                    placeholder="Short description of this channel…"
                    class="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  ></textarea>
                </div>
              </div>

              <!-- Section: Visuals — FILE UPLOAD -->
              <p class="mb-3 mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
                Visuals
              </p>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <!-- Avatar upload -->
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Avatar
                  </label>

                  <input
                    ref="avatarInput"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    class="hidden"
                    @change="onAvatarFileChange"
                  />

                  <div
                    v-if="!channelModal.form.avatar"
                    class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-500/10"
                    :class="dragOver.avatar ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20' : ''"
                    @click="triggerAvatarPicker"
                    @dragover.prevent="dragOver.avatar = true"
                    @dragleave.prevent="dragOver.avatar = false"
                    @drop.prevent="onAvatarDrop"
                  >
                    <UploadIcon class="mb-2 h-7 w-7 text-slate-400" />
                    <p class="text-xs font-black text-slate-700 dark:text-white">
                      Click to browse
                    </p>
                    <p class="mt-0.5 text-[10px] text-slate-500 dark:text-white/50">
                      or drag &amp; drop · PNG, JPG, WEBP · max 5 MB
                    </p>
                  </div>

                  <div
                    v-else
                    class="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <img
                      :src="resolveImageUrl(channelModal.form.avatar)"
                      alt="Avatar"
                      class="h-14 w-14 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                    />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-black text-slate-700 dark:text-white">
                        Avatar uploaded
                      </p>
                      <p class="truncate text-[10px] text-slate-500 dark:text-white/50">
                        {{ fileNameFromUrl(channelModal.form.avatar) }}
                      </p>
                    </div>
                    <div class="flex shrink-0 gap-1">
                      <button
                        type="button"
                        class="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-black text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-white"
                        @click="triggerAvatarPicker"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        class="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-500/20"
                        @click="removeAvatar"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <!-- Upload progress -->
                  <div v-if="uploads.avatar.busy" class="mt-2">
                    <div class="mb-1 flex items-center justify-between text-[10px] font-black text-blue-600">
                      <span>Uploading…</span>
                      <span>{{ uploads.avatar.progress }}%</span>
                    </div>
                    <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-full bg-blue-500 transition-all" :style="{ width: `${uploads.avatar.progress}%` }"></div>
                    </div>
                  </div>
                  <p v-if="uploads.avatar.error" class="mt-1 text-xs font-bold text-red-500">
                    {{ uploads.avatar.error }}
                  </p>
                  <p v-else-if="!channelModal.form.avatar" class="mt-1 text-[11px] text-slate-400 dark:text-white/40">
                    Square image, at least 256×256 recommended.
                  </p>
                </div>

                <!-- Banner upload -->
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Banner
                  </label>

                  <input
                    ref="bannerInput"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    class="hidden"
                    @change="onBannerFileChange"
                  />

                  <div
                    v-if="!channelModal.form.banner"
                    class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-500/10"
                    :class="dragOver.banner ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20' : ''"
                    @click="triggerBannerPicker"
                    @dragover.prevent="dragOver.banner = true"
                    @dragleave.prevent="dragOver.banner = false"
                    @drop.prevent="onBannerDrop"
                  >
                    <UploadIcon class="mb-2 h-7 w-7 text-slate-400" />
                    <p class="text-xs font-black text-slate-700 dark:text-white">
                      Click to browse
                    </p>
                    <p class="mt-0.5 text-[10px] text-slate-500 dark:text-white/50">
                      or drag &amp; drop · PNG, JPG, WEBP · max 5 MB
                    </p>
                  </div>

                  <div
                    v-else
                    class="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <img
                      :src="resolveImageUrl(channelModal.form.banner)"
                      alt="Banner"
                      class="h-16 w-full object-cover"
                    />
                    <div class="flex items-center justify-between gap-2 p-2">
                      <p class="truncate text-[10px] text-slate-500 dark:text-white/50">
                        {{ fileNameFromUrl(channelModal.form.banner) }}
                      </p>
                      <div class="flex shrink-0 gap-1">
                        <button
                          type="button"
                          class="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-black text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-white"
                          @click="triggerBannerPicker"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          class="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-500/20"
                          @click="removeBanner"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Upload progress -->
                  <div v-if="uploads.banner.busy" class="mt-2">
                    <div class="mb-1 flex items-center justify-between text-[10px] font-black text-blue-600">
                      <span>Uploading…</span>
                      <span>{{ uploads.banner.progress }}%</span>
                    </div>
                    <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-full bg-blue-500 transition-all" :style="{ width: `${uploads.banner.progress}%` }"></div>
                    </div>
                  </div>
                  <p v-if="uploads.banner.error" class="mt-1 text-xs font-bold text-red-500">
                    {{ uploads.banner.error }}
                  </p>
                  <p v-else-if="!channelModal.form.banner" class="mt-1 text-[11px] text-slate-400 dark:text-white/40">
                    Wide image, 1200×400 recommended.
                  </p>
                </div>
              </div>

              <!-- Section: Stats (edit only) -->
              <template v-if="channelModal.mode === 'edit'">
                <p class="mb-3 mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
                  Stats
                </p>

                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                      Subscribers
                    </label>
                    <input
                      v-model.number="channelModal.form.subscribers"
                      type="number"
                      min="0"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <p class="mt-1 text-[11px] text-slate-400 dark:text-white/40">
                      Real follower count comes from the Followers list.
                    </p>
                  </div>

                  <div class="flex items-end">
                    <div class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                      <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                        Content Titles
                      </p>
                      <p class="mt-0.5 text-lg font-black text-slate-700 dark:text-white">
                        {{ channelModal.form.contentCount || 0 }}
                      </p>
                      <p class="text-[10px] text-slate-400 dark:text-white/40">
                        Managed via "Manage Content"
                      </p>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Error -->
              <p v-if="channelModal.error" class="mt-5 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600 dark:bg-red-500/10">
                {{ channelModal.error }}
              </p>

              <!-- Actions -->
              <div class="mt-8 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  class="rounded-full px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                  :disabled="channelModal.saving"
                  @click="closeChannelModal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="channelModal.saving || uploads.avatar.busy || uploads.banner.busy"
                  class="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Loader2Icon v-if="channelModal.saving" class="h-4 w-4 animate-spin" />
                  <SaveIcon v-else class="h-4 w-4" />
                  {{ channelModal.saving ? 'Saving…' : channelModal.mode === 'create' ? 'Create Channel' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ============================================= -->
    <!-- CONTENT MANAGER MODAL -->
    <!-- ============================================= -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="contentModal.open"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          @click.self="closeContentModal"
        >
          <div class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-6 sm:py-4">
              <div class="min-w-0">
                <h2 class="truncate text-sm font-black sm:text-lg">
                  Content — {{ contentModal.channel?.name }}
                </h2>
                <p class="text-[10px] text-slate-500 dark:text-white/60 sm:text-xs">
                  Add, edit or remove titles for this channel.
                </p>
              </div>
              <button
                type="button"
                @click="closeContentModal"
                class="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 dark:text-white/70 dark:hover:bg-slate-800"
              >
                <span class="sr-only">Close</span>
                <XIcon class="h-5 w-5" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div v-if="contentModal.loading" class="space-y-2">
                <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"></div>
              </div>

              <p v-else-if="contentModal.error" class="text-sm font-bold text-red-500">
                {{ contentModal.error }}
              </p>

              <p
                v-else-if="!contentModal.items.length"
                class="py-8 text-center text-xs font-bold text-slate-500 dark:text-white/70"
              >
                No content yet. Add the first title below.
              </p>

              <ul v-else class="space-y-2">
                <li
                  v-for="item in contentModal.items"
                  :key="item.id"
                  class="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                >
                  <div class="min-w-0">
                    <p class="truncate text-xs font-bold sm:text-sm">{{ item.title }}</p>
                    <p class="truncate text-[10px] text-slate-500 dark:text-white/60 sm:text-xs">
                      {{ item.type || 'Movie' }} • {{ item.views ? formatNumber(item.views) : '0' }} views
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      @click="openEditContent(item)"
                      class="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      @click="confirmDeleteContent(item)"
                      class="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-400"
                    >
                      Del
                    </button>
                  </div>
                </li>
              </ul>

              <div class="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:p-4">
                <p class="mb-2 text-xs font-black text-slate-700 dark:text-white/80">
                  {{ contentModal.editItem ? 'Edit Content' : 'Add New Content' }}
                </p>

                <div class="space-y-2">
                  <input
                    v-model="contentModal.form.title"
                    type="text"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Title"
                  />
                  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <select
                      v-model="contentModal.form.type"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="Movie">Movie</option>
                      <option value="Series">Series</option>
                    </select>
                    <input
                      v-model="contentModal.form.url"
                      type="url"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="Content URL (optional)"
                    />
                  </div>
                </div>

                <p v-if="contentModal.formError" class="mt-1 text-xs font-bold text-red-500">
                  {{ contentModal.formError }}
                </p>

                <div class="mt-2 flex items-center justify-end gap-2">
                  <button
                    v-if="contentModal.editItem"
                    type="button"
                    @click="cancelEditContent"
                    class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-700 transition hover:bg-slate-100 sm:text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    @click="saveContent"
                    :disabled="contentModal.saving"
                    class="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
                  >
                    <Loader2Icon v-if="contentModal.saving" class="h-3 w-3 animate-spin" />
                    {{ contentModal.saving ? 'Saving…' : contentModal.editItem ? 'Update' : 'Add' }}
                  </button>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-6 sm:py-4">
              <button
                type="button"
                @click="closeContentModal"
                class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ============================================= -->
    <!-- FOLLOWERS MODAL  (NEW) -->
    <!-- ============================================= -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="followersModal.open"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          @click.self="closeFollowersModal"
        >
          <div class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-6 sm:py-4">
              <div class="min-w-0">
                <h2 class="truncate text-sm font-black sm:text-lg">
                  Followers — {{ followersModal.channel?.name }}
                </h2>
                <p class="text-[10px] text-slate-500 dark:text-white/60 sm:text-xs">
                  {{ followersModal.total }} total follower{{ followersModal.total === 1 ? '' : 's' }}
                </p>
              </div>
              <button
                type="button"
                @click="closeFollowersModal"
                class="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 dark:text-white/70 dark:hover:bg-slate-800"
              >
                <span class="sr-only">Close</span>
                <XIcon class="h-5 w-5" />
              </button>
            </div>

            <!-- Search -->
            <div class="border-b border-slate-100 px-4 py-2 dark:border-slate-800 sm:px-6">
              <div class="relative">
                <input
                  v-model="followersModal.search"
                  type="search"
                  placeholder="Search followers by name, username or email…"
                  class="w-full rounded-xl bg-slate-50 px-4 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-950 dark:border dark:border-slate-800 dark:text-white"
                  @input="onFollowersSearch"
                />
                <SearchIcon class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <!-- List -->
            <div class="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
              <div v-if="followersModal.loading" class="space-y-2">
                <div v-for="i in 4" :key="i" class="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"></div>
              </div>

              <p v-else-if="followersModal.error" class="text-sm font-bold text-red-500">
                {{ followersModal.error }}
              </p>

              <p
                v-else-if="!followersModal.items.length"
                class="py-8 text-center text-xs font-bold text-slate-500 dark:text-white/70"
              >
                No followers yet.
              </p>

              <ul v-else class="space-y-2">
                <li
                  v-for="f in followersModal.items"
                  :key="f.followId"
                  class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                >
                  <div class="flex min-w-0 items-center gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-black text-white">
                      <img
                        v-if="f.avatar"
                        :src="resolveImageUrl(f.avatar)"
                        :alt="f.name"
                        class="h-full w-full object-cover"
                      />
                      <span v-else>{{ initials(f.name) }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-xs font-bold sm:text-sm">{{ f.name }}</p>
                      <p class="truncate text-[10px] text-slate-500 dark:text-white/60 sm:text-xs">
                        {{ f.email }}
                        <span v-if="f.country"> • {{ f.country }}</span>
                      </p>
                      <p class="text-[10px] text-slate-400 dark:text-white/40">
                        Followed {{ relativeTime(f.followedAt) }}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-500/20"
                    title="Remove follower"
                    @click="confirmRemoveFollower(f)"
                  >
                    Remove
                  </button>
                </li>
              </ul>
            </div>

            <!-- Pagination -->
            <div class="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-6">
              <p class="text-[10px] font-bold text-slate-500 dark:text-white/60 sm:text-xs">
                Page {{ followersModal.page }} / {{ followersModal.totalPages || 1 }}
              </p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-40 dark:bg-slate-900 dark:border dark:border-slate-700 dark:text-white"
                  :disabled="followersModal.page <= 1"
                  @click="changeFollowersPage(followersModal.page - 1)"
                >
                  <ChevronLeftIcon class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-40 dark:bg-slate-900 dark:border dark:border-slate-700 dark:text-white"
                  :disabled="followersModal.page >= followersModal.totalPages"
                  @click="changeFollowersPage(followersModal.page + 1)"
                >
                  <ChevronRightIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ============================================= -->
    <!-- CONFIRM DELETE MODAL -->
    <!-- ============================================= -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="confirmModal.open"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          @click.self="closeConfirmModal"
        >
          <div class="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <div class="px-4 py-5 sm:px-6">
              <h2 class="text-sm font-black sm:text-lg">{{ confirmModal.title }}</h2>
              <p class="mt-1 text-xs text-slate-600 dark:text-white/70 sm:text-sm">
                {{ confirmModal.message }}
              </p>
            </div>
            <div class="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-6 sm:py-4">
              <button
                type="button"
                @click="closeConfirmModal"
                class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="confirmModal.onConfirm"
                class="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600 sm:text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ============================================= -->
    <!-- TOASTS -->
    <!-- ============================================= -->
    <Teleport to="body">
      <div class="pointer-events-none fixed bottom-4 right-4 z-[300] flex flex-col gap-2">
        <TransitionGroup
          enter-active-class="transition duration-200"
          enter-from-class="translate-x-4 opacity-0"
          leave-active-class="transition duration-200"
          leave-to-class="translate-x-4 opacity-0"
        >
          <div
            v-for="t in toasts"
            :key="t.id"
            class="pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black shadow-lg"
            :class="{
              'bg-emerald-500 text-white': t.type === 'success',
              'bg-red-500 text-white': t.type === 'error',
              'bg-slate-900 text-white': t.type === 'info'
            }"
          >
            <CheckCircle2Icon v-if="t.type === 'success'" class="h-4 w-4" />
            <AlertCircleIcon v-else-if="t.type === 'error'" class="h-4 w-4" />
            <InfoIcon v-else class="h-4 w-4" />
            {{ t.message }}
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import AdminHeader from '../admin/AdminHeader.vue'

import {
  PlayIcon,
  PlusIcon,
  SearchIcon,
  PencilIcon,
  TrashIcon,
  RefreshCwIcon,
  DownloadIcon,
  ListIcon,
  LayoutGridIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  InfoIcon,
  XIcon,
  SaveIcon,
  Loader2Icon,
  RadioIcon,
  UploadIcon,
  UsersIcon
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

function clearAuthToken() {
  TOKEN_KEYS.forEach(k => {
    sessionStorage.removeItem(k)
    localStorage.removeItem(k)
  })
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

const UPLOAD_ENDPOINT = `${API_BASE}/admin/upload`

async function apiFetch(path, options = {}) {
  const token = getAuthToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers,
    ...options
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = text
    try {
      const json = JSON.parse(text)
      message = json.error || json.message || text
    } catch (_) {}

    if (res.status === 401) {
      clearAuthToken()
    }

    const error = new Error(message || `Request failed (${res.status})`)
    error.status = res.status
    throw error
  }

  if (res.status === 204) return null
  return res.json().catch(() => ({}))
}

/* =====================================================
   RESOLVE IMAGE URLS
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
const error = ref(null)
const isAuthError = ref(false)
const refreshing = ref(false)
const channels = ref([])
const avatarErrors = reactive({})

const search = ref('')
const sortBy = ref('newest')
const viewMode = ref('grid')
const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(8)

const sortTabs = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Followers', value: 'followers' },
  { label: 'Titles', value: 'titles' },
  { label: 'A–Z', value: 'name' }
]

/* =====================================================
   TOASTS
===================================================== */
const toasts = ref([])
function toast(message, type = 'success') {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

/* =====================================================
   NORMALISE
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
    _createdAt: item?.createdAt
      ? new Date(item.createdAt).getTime()
      : item?._createdAt ?? 0
  }
}

function normalizeContent(item) {
  return {
    id: item?.id ?? item?._id ?? '',
    title: item?.title ?? 'Untitled',
    type: item?.type === 'Series' ? 'Series' : 'Movie',
    views: Number(item?.views ?? 0),
    url: item?.videoUrl ?? item?.url ?? ''
  }
}

/* =====================================================
   FETCH CHANNELS
===================================================== */
async function fetchChannels() {
  loading.value = true
  error.value = null
  isAuthError.value = false

  try {
    const response = await apiFetch('/admin/channels')
    const payload = response?.data ?? response ?? {}
    const list = Array.isArray(payload.channels)
      ? payload.channels
      : Array.isArray(payload)
        ? payload
        : []

    channels.value = list.map(normalizeChannel)
  } catch (err) {
    console.error('Admin channels fetch error:', err)
    error.value = err?.message || 'Failed to load channels.'
    if (err?.status === 401 || /unauthorized/i.test(error.value)) {
      isAuthError.value = true
    }
  } finally {
    loading.value = false
  }
}

async function refresh() {
  refreshing.value = true
  try {
    await fetchChannels()
  } finally {
    setTimeout(() => { refreshing.value = false }, 400)
  }
}

/* =====================================================
   FILTERS / SORTING / PAGINATION
===================================================== */
const hasActiveFilters = computed(() => Boolean(search.value))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = channels.value.filter(c => {
    if (!q) return true
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    )
  })

  const sorter = (a, b) => {
    switch (sortBy.value) {
      case 'oldest': return (a._createdAt || 0) - (b._createdAt || 0)
      case 'followers': return (b.subscribers || 0) - (a.subscribers || 0)
      case 'titles': return (b.contentCount || 0) - (a.contentCount || 0)
      case 'name': return (a.name || '').localeCompare(b.name || '')
      case 'newest':
      default: return (b._createdAt || 0) - (a._createdAt || 0)
    }
  }

  return [...list].sort(sorter)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

const allSelected = computed(() =>
  paginated.value.length > 0 && paginated.value.every(c => selectedIds.value.includes(c.id))
)

function toggleSelectAll(e) {
  if (e.target.checked) {
    const ids = paginated.value.map(c => c.id)
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...ids]))
  } else {
    const ids = new Set(paginated.value.map(c => c.id))
    selectedIds.value = selectedIds.value.filter(id => !ids.has(id))
  }
}

function clearFilters() {
  search.value = ''
  currentPage.value = 1
}

watch([search, sortBy, pageSize], () => {
  currentPage.value = 1
})

watch(filtered, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})

/* =====================================================
   COUNTS
===================================================== */
const counts = computed(() => {
  const all = channels.value
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return {
    total: all.length,
    followers: all.reduce((s, c) => s + (c.subscribers || 0), 0),
    titles: all.reduce((s, c) => s + (c.contentCount || 0), 0),
    newToday: all.filter(c => (c._createdAt || 0) >= today.getTime()).length
  }
})

/* =====================================================
   IMAGE UPLOAD HELPERS
===================================================== */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']

const avatarInput = ref(null)
const bannerInput = ref(null)

const uploads = reactive({
  avatar: { busy: false, progress: 0, error: '' },
  banner: { busy: false, progress: 0, error: '' }
})

const dragOver = reactive({ avatar: false, banner: false })

function triggerAvatarPicker() {
  if (!uploads.avatar.busy) avatarInput.value?.click()
}
function triggerBannerPicker() {
  if (!uploads.banner.busy) bannerInput.value?.click()
}

function validateImage(file) {
  if (!file) return 'No file selected.'
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Please choose a PNG, JPG, WEBP, GIF or AVIF image.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 5 MB.`
  }
  return ''
}

function uploadImage(file, field) {
  return new Promise((resolve) => {
    const validationError = validateImage(file)
    if (validationError) {
      uploads[field].error = validationError
      return resolve(null)
    }

    uploads[field].error = ''
    uploads[field].busy = true
    uploads[field].progress = 0

    const token = getAuthToken()
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', UPLOAD_ENDPOINT)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        uploads[field].progress = Math.round((e.loaded / e.total) * 100)
      }
    }

    xhr.onload = () => {
      uploads[field].busy = false
      uploads[field].progress = 0
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          const rawUrl = json?.data?.url || json?.url || json?.data?.path || json?.path
          if (!rawUrl) {
            uploads[field].error = 'Upload succeeded but no URL returned.'
            return resolve(null)
          }
          resolve(rawUrl)
        } catch (e) {
          uploads[field].error = 'Invalid upload response.'
          resolve(null)
        }
      } else {
        let msg = `Upload failed (${xhr.status})`
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          msg = json.error || json.message || msg
        } catch (_) {}
        uploads[field].error = msg
        resolve(null)
      }
    }

    xhr.onerror = () => {
      uploads[field].busy = false
      uploads[field].progress = 0
      uploads[field].error = 'Network error during upload.'
      resolve(null)
    }

    xhr.send(formData)
  })
}

async function onAvatarFileChange(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  const url = await uploadImage(file, 'avatar')
  if (url) {
    channelModal.form.avatar = url
    previewAvatarError.value = false
    toast('Avatar uploaded', 'success')
  }
}

async function onBannerFileChange(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  const url = await uploadImage(file, 'banner')
  if (url) {
    channelModal.form.banner = url
    toast('Banner uploaded', 'success')
  }
}

function onAvatarDrop(e) {
  dragOver.avatar = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  ;(async () => {
    const url = await uploadImage(file, 'avatar')
    if (url) {
      channelModal.form.avatar = url
      previewAvatarError.value = false
      toast('Avatar uploaded', 'success')
    }
  })()
}

function onBannerDrop(e) {
  dragOver.banner = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  ;(async () => {
    const url = await uploadImage(file, 'banner')
    if (url) {
      channelModal.form.banner = url
      toast('Banner uploaded', 'success')
    }
  })()
}

function removeAvatar() {
  channelModal.form.avatar = ''
  previewAvatarError.value = false
  uploads.avatar.error = ''
}

function removeBanner() {
  channelModal.form.banner = ''
  uploads.banner.error = ''
}

function fileNameFromUrl(url) {
  if (!url) return ''
  try {
    const clean = url.split('?')[0].split('#')[0]
    const parts = clean.split('/')
    return decodeURIComponent(parts[parts.length - 1] || clean)
  } catch (_) {
    return url
  }
}

/* =====================================================
   CHANNEL MODAL
===================================================== */
const previewAvatarError = ref(false)

const channelModal = reactive({
  open: false,
  mode: 'create',
  channelId: null,
  saving: false,
  saveProgress: 0,
  saveStage: '',
  error: null,
  errors: { name: '' },
  form: {
    name: '',
    description: '',
    avatar: '',
    banner: '',
    subscribers: 0,
    contentCount: 0
  }
})

function resetUploadState() {
  uploads.avatar.busy = false
  uploads.avatar.progress = 0
  uploads.avatar.error = ''
  uploads.banner.busy = false
  uploads.banner.progress = 0
  uploads.banner.error = ''
  dragOver.avatar = false
  dragOver.banner = false
}

function openCreateChannel() {
  channelModal.open = true
  channelModal.mode = 'create'
  channelModal.channelId = null
  channelModal.error = null
  channelModal.errors.name = ''
  channelModal.saveProgress = 0
  channelModal.saveStage = ''
  previewAvatarError.value = false
  resetUploadState()
  channelModal.form = {
    name: '',
    description: '',
    avatar: '',
    banner: '',
    subscribers: 0,
    contentCount: 0
  }
}

function openEditChannel(channel) {
  channelModal.open = true
  channelModal.mode = 'edit'
  channelModal.channelId = channel.id
  channelModal.error = null
  channelModal.errors.name = ''
  channelModal.saveProgress = 0
  channelModal.saveStage = ''
  previewAvatarError.value = false
  resetUploadState()
  channelModal.form = {
    name: channel.name,
    description: channel.description,
    avatar: channel.avatar,
    banner: channel.banner,
    subscribers: channel.subscribers,
    contentCount: channel.contentCount
  }
}

function closeChannelModal() {
  channelModal.open = false
  channelModal.saving = false
  channelModal.error = null
  channelModal.errors.name = ''
  channelModal.saveProgress = 0
  channelModal.saveStage = ''
  previewAvatarError.value = false
  resetUploadState()
}

async function runSaveProgress() {
  channelModal.saveProgress = 0
  channelModal.saveStage = 'Validating…'
  await new Promise(r => setTimeout(r, 120))
  channelModal.saveProgress = 30
  channelModal.saveStage = 'Preparing metadata…'
  await new Promise(r => setTimeout(r, 120))
  channelModal.saveProgress = 65
  channelModal.saveStage = 'Saving…'
  await new Promise(r => setTimeout(r, 120))
  channelModal.saveProgress = 90
  channelModal.saveStage = 'Finalizing…'
  await new Promise(r => setTimeout(r, 120))
  channelModal.saveProgress = 100
  channelModal.saveStage = 'Done'
}

async function saveChannel() {
  channelModal.errors.name = ''
  const { name } = channelModal.form

  if (!name || !name.trim()) {
    channelModal.errors.name = 'Channel name is required.'
    return
  }

  if (uploads.avatar.busy || uploads.banner.busy) {
    channelModal.error = 'Please wait for image uploads to finish.'
    return
  }

  channelModal.saving = true
  channelModal.error = null

  try {
    await runSaveProgress()

    const payload = {
      name: channelModal.form.name.trim(),
      description: channelModal.form.description,
      avatar: channelModal.form.avatar,
      banner: channelModal.form.banner,
      subscribers: Number(channelModal.form.subscribers) || 0
    }

    if (channelModal.mode === 'create') {
      const res = await apiFetch('/admin/channels', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      const created = normalizeChannel(res?.data ?? res)
      if (created.id) {
        channels.value.unshift(created)
      } else {
        await fetchChannels()
      }
      toast(`Created "${payload.name}"`, 'success')
    } else {
      const res = await apiFetch(`/admin/channels/${channelModal.channelId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      const updated = normalizeChannel(res?.data ?? res)
      const idx = channels.value.findIndex(c => c.id === channelModal.channelId)
      if (idx !== -1) {
        channels.value[idx] = {
          ...channels.value[idx],
          ...updated,
          contentCount: updated.contentCount || channels.value[idx].contentCount
        }
      }
      toast(`Updated "${payload.name}"`, 'success')
    }
    closeChannelModal()
  } catch (err) {
    console.error('Save channel error:', err)
    channelModal.error = err?.message || 'Failed to save channel.'
  } finally {
    channelModal.saving = false
  }
}

/* =====================================================
   CHANNEL DELETE
===================================================== */
async function confirmDeleteChannel(channel) {
  openConfirm({
    title: 'Delete channel',
    message: `Are you sure you want to delete "${channel.name}" and all its content? This action cannot be undone.`,
    onConfirm: async () => {
      closeConfirmModal()
      try {
        await apiFetch(`/admin/channels/${channel.id}`, { method: 'DELETE' })
        channels.value = channels.value.filter(c => c.id !== channel.id)
        selectedIds.value = selectedIds.value.filter(id => id !== channel.id)
        toast(`Deleted "${channel.name}"`, 'success')
      } catch (err) {
        console.error('Delete channel error:', err)
        toast(err?.message || 'Failed to delete channel.', 'error')
      }
    }
  })
}

async function bulkDelete() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  if (!window.confirm(`Delete ${ids.length} channel(s)?`)) return
  try {
    await apiFetch('/admin/channels/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    })
    channels.value = channels.value.filter(c => !ids.includes(c.id))
    toast(`Deleted ${ids.length} channel(s)`, 'success')
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk delete failed.', 'error')
  }
}

/* =====================================================
   CONTENT MANAGER MODAL
===================================================== */
const contentModal = reactive({
  open: false,
  channel: null,
  loading: false,
  error: null,
  items: [],
  saving: false,
  formError: null,
  editItem: null,
  form: {
    title: '',
    type: 'Movie',
    url: ''
  }
})

async function openContentManager(channel) {
  contentModal.open = true
  contentModal.channel = channel
  contentModal.items = []
  contentModal.error = null
  contentModal.loading = true
  contentModal.editItem = null
  resetContentForm()
  await loadChannelContent(channel.id)
}

async function loadChannelContent(channelId) {
  contentModal.loading = true
  contentModal.error = null

  try {
    const res = await apiFetch(`/admin/channels/${channelId}/content`)
    const payload = res?.data ?? res ?? {}
    const list = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : []
    contentModal.items = list.map(normalizeContent)
  } catch (err) {
    console.error('Load content error:', err)
    contentModal.error = err?.message || 'Failed to load content.'
  } finally {
    contentModal.loading = false
  }
}

function resetContentForm() {
  contentModal.form = { title: '', type: 'Movie', url: '' }
  contentModal.formError = null
  contentModal.editItem = null
}

function openEditContent(item) {
  contentModal.editItem = item
  contentModal.form = {
    title: item.title,
    type: item.type === 'Series' ? 'Series' : 'Movie',
    url: item.url || ''
  }
  contentModal.formError = null
}

function cancelEditContent() {
  resetContentForm()
}

async function saveContent() {
  const { title } = contentModal.form
  if (!title || !title.trim()) {
    contentModal.formError = 'Title is required.'
    return
  }

  contentModal.saving = true
  contentModal.formError = null

  const payload = {
    title: contentModal.form.title.trim(),
    type: contentModal.form.type === 'Series' ? 'Series' : 'Movie',
    url: contentModal.form.url || ''
  }

  try {
    if (contentModal.editItem) {
      const res = await apiFetch(
        `/admin/channels/${contentModal.channel.id}/content/${contentModal.editItem.id}`,
        { method: 'PUT', body: JSON.stringify(payload) }
      )
      const updated = normalizeContent(res?.data ?? res)
      const idx = contentModal.items.findIndex(i => i.id === contentModal.editItem.id)
      if (idx !== -1) {
        contentModal.items[idx] = {
          ...contentModal.items[idx],
          ...updated,
          id: contentModal.items[idx].id
        }
      }
      toast('Content updated', 'success')
    } else {
      const res = await apiFetch(
        `/admin/channels/${contentModal.channel.id}/content`,
        { method: 'POST', body: JSON.stringify(payload) }
      )
      const created = normalizeContent(res?.data ?? res)
      if (created.id) {
        contentModal.items.unshift(created)
      } else {
        await loadChannelContent(contentModal.channel.id)
      }
      const ch = channels.value.find(c => c.id === contentModal.channel.id)
      if (ch) ch.contentCount = (ch.contentCount || 0) + 1
      toast('Content added', 'success')
    }
    resetContentForm()
  } catch (err) {
    console.error('Save content error:', err)
    contentModal.formError = err?.message || 'Failed to save content.'
  } finally {
    contentModal.saving = false
  }
}

async function confirmDeleteContent(item) {
  openConfirm({
    title: 'Delete content',
    message: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
    onConfirm: async () => {
      closeConfirmModal()
      try {
        await apiFetch(
          `/admin/channels/${contentModal.channel.id}/content/${item.id}`,
          { method: 'DELETE' }
        )
        contentModal.items = contentModal.items.filter(i => i.id !== item.id)
        const ch = channels.value.find(c => c.id === contentModal.channel.id)
        if (ch && ch.contentCount > 0) ch.contentCount -= 1
        toast('Content deleted', 'success')
      } catch (err) {
        console.error('Delete content error:', err)
        toast(err?.message || 'Failed to delete content.', 'error')
      }
    }
  })
}

function closeContentModal() {
  contentModal.open = false
  contentModal.channel = null
  contentModal.items = []
  contentModal.loading = false
  contentModal.error = null
  resetContentForm()
}

/* =====================================================
   FOLLOWERS MODAL  (NEW)
===================================================== */
const followersModal = reactive({
  open: false,
  channel: null,
  loading: false,
  error: null,
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  search: ''
})

let followersSearchTimer = null

async function openFollowersModal(channel) {
  followersModal.open = true
  followersModal.channel = channel
  followersModal.items = []
  followersModal.total = Number(channel.subscribers) || 0
  followersModal.page = 1
  followersModal.search = ''
  followersModal.error = null
  await loadFollowers()
}

async function loadFollowers() {
  if (!followersModal.channel) return
  followersModal.loading = true
  followersModal.error = null
  try {
    const params = new URLSearchParams({
      page: String(followersModal.page),
      limit: String(followersModal.limit)
    })
    if (followersModal.search.trim()) params.set('q', followersModal.search.trim())

    const res = await apiFetch(
      `/admin/channels/${followersModal.channel.id}/followers?${params.toString()}`
    )
    const payload = res?.data ?? res ?? {}
    followersModal.items = Array.isArray(payload.followers) ? payload.followers : []
    followersModal.total = Number(payload.total) || 0
    followersModal.totalPages = Number(payload.totalPages) || 1
    followersModal.page = Number(payload.page) || 1

    // Sync the channel's displayed count with the real total
    const ch = channels.value.find(c => c.id === followersModal.channel.id)
    if (ch) ch.subscribers = followersModal.total
  } catch (err) {
    console.error('Load followers error:', err)
    followersModal.error = err?.message || 'Failed to load followers.'
  } finally {
    followersModal.loading = false
  }
}

function onFollowersSearch() {
  clearTimeout(followersSearchTimer)
  followersSearchTimer = setTimeout(() => {
    followersModal.page = 1
    loadFollowers()
  }, 300)
}

function changeFollowersPage(page) {
  if (page < 1 || page > followersModal.totalPages) return
  followersModal.page = page
  loadFollowers()
}

function closeFollowersModal() {
  followersModal.open = false
  followersModal.channel = null
  followersModal.items = []
  followersModal.total = 0
  followersModal.page = 1
  followersModal.search = ''
  followersModal.error = null
}

function confirmRemoveFollower(follower) {
  openConfirm({
    title: 'Remove follower',
    message: `Remove "${follower.name}" from the followers of "${followersModal.channel?.name}"?`,
    onConfirm: async () => {
      closeConfirmModal()
      try {
        await apiFetch(
          `/admin/channels/${followersModal.channel.id}/followers/${follower.userId}`,
          { method: 'DELETE' }
        )
        followersModal.items = followersModal.items.filter(
          f => f.followId !== follower.followId
        )
        followersModal.total = Math.max(0, followersModal.total - 1)
        const ch = channels.value.find(c => c.id === followersModal.channel.id)
        if (ch && ch.subscribers > 0) ch.subscribers -= 1
        toast(`Removed "${follower.name}"`, 'success')
      } catch (err) {
        console.error('Remove follower error:', err)
        toast(err?.message || 'Failed to remove follower.', 'error')
      }
    }
  })
}

/* =====================================================
   CONFIRM MODAL
===================================================== */
const confirmModal = reactive({
  open: false,
  title: '',
  message: '',
  onConfirm: () => {}
})

function openConfirm({ title, message, onConfirm }) {
  confirmModal.open = true
  confirmModal.title = title
  confirmModal.message = message
  confirmModal.onConfirm = onConfirm
}

function closeConfirmModal() {
  confirmModal.open = false
  confirmModal.onConfirm = () => {}
}

/* =====================================================
   HELPERS
===================================================== */
function bannerStyle(url) {
  if (!url) return {}
  const resolved = resolveImageUrl(url)
  return {
    backgroundImage: `url("${resolved}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
}

function initials(name) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

function formatSubscribers(n) {
  return formatNumber(n)
}

function formatNumber(n) {
  n = Number(n) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function relativeTime(ts) {
  if (!ts) return '—'
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

function onAvatarError(id) {
  avatarErrors[id] = true
}

/* =====================================================
   EXPORT
===================================================== */
function exportChannels() {
  const data = JSON.stringify(channels.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `channels-export-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast('Exported channels', 'success')
}

/* =====================================================
   KEYBOARD SHORTCUTS
===================================================== */
function handleKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault()
    if (!channelModal.open && !contentModal.open && !followersModal.open) openCreateChannel()
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
    e.preventDefault()
    exportChannels()
  }
  if (e.key === 'Escape') {
    if (confirmModal.open) closeConfirmModal()
    else if (followersModal.open) closeFollowersModal()
    else if (contentModal.open) closeContentModal()
    else if (channelModal.open) closeChannelModal()
  }
}

/* =====================================================
   LIFECYCLE
===================================================== */
onMounted(async () => {
  window.addEventListener('keydown', handleKey)
  await fetchChannels()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.5);
  border-radius: 3px;
}
</style>