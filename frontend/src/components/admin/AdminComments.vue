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
              Comment
              <span class="text-blue-600">Management</span>
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-slate-500 dark:text-white/70 sm:text-base">
              Moderate, filter, and manage comments across all titles and users.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900 dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
              title="Export (Ctrl+E)"
              @click="exportComments"
            >
              <DownloadIcon class="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <!-- =========================
             LOADING / ERROR
        ========================== -->
        <div
          v-if="loading"
          class="mb-6 flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
        >
          <div class="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
          <p class="text-sm font-bold text-slate-500 dark:text-white/70">
            Loading comments…
          </p>
        </div>

        <div
          v-else-if="loadError"
          class="mb-6 flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
        >
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">⚠️</div>
          <h2 class="text-2xl font-black">Failed to load comments</h2>
          <p class="mt-2 max-w-md text-sm text-slate-500 dark:text-white/70">
            {{ loadError }}
          </p>
          <button
            type="button"
            class="mt-5 rounded-full bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
            @click="fetchComments"
          >
            Try again
          </button>
        </div>

        <template v-else>
          <!-- =========================
               STATS
          ========================== -->
          <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Total</p>
              <p class="mt-1 text-2xl font-black text-blue-600">{{ counts.total }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Approved</p>
              <p class="mt-1 text-2xl font-black text-emerald-600">{{ counts.approved }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Pending</p>
              <p class="mt-1 text-2xl font-black text-amber-600">{{ counts.pending }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Flagged</p>
              <p class="mt-1 text-2xl font-black text-rose-600">{{ counts.flagged }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Spam</p>
              <p class="mt-1 text-2xl font-black text-red-600">{{ counts.spam }}</p>
            </div>
          </div>

          <!-- =========================
               FILTERS ROW 1
          ========================== -->
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="t in statusTabs"
                :key="t.value"
                type="button"
                class="rounded-full px-4 py-2.5 text-sm font-bold transition"
                :class="
                  activeStatus === t.value
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-black dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-900'
                "
                @click="activeStatus = t.value"
              >
                {{ t.label }}
                <span class="ml-1 text-xs opacity-70">({{ countByStatus(t.value) }})</span>
              </button>
            </div>

            <div class="ml-auto flex items-center gap-2">
              <select
                v-model="sortBy"
                class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="likes">Most liked</option>
                <option value="replies">Most replies</option>
              </select>

              <div class="flex overflow-hidden rounded-xl bg-white shadow-sm dark:bg-black dark:border dark:border-slate-800">
                <button
                  type="button"
                  class="px-3 py-2 transition"
                  :class="viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800'"
                  @click="viewMode = 'list'"
                >
                  <ListIcon class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="px-3 py-2 transition"
                  :class="viewMode === 'cards' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800'"
                  @click="viewMode = 'cards'"
                >
                  <LayoutGridIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- =========================
               FILTERS ROW 2
          ========================== -->
          <div class="mb-6 flex flex-wrap items-center gap-3">
            <div class="relative w-full sm:w-72">
              <input
                v-model="search"
                type="search"
                placeholder="Search comment, user, or title..."
                class="w-full rounded-xl bg-white px-4 py-2.5 pr-10 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-blue-500/20 dark:bg-black dark:border dark:border-slate-800 dark:text-white"
              />
              <SearchIcon class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <select
              v-model="filterTitle"
              class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
            >
              <option value="">All titles</option>
              <option v-for="t in titles" :key="t.id" :value="t.id">{{ t.title }}</option>
            </select>

            <select
              v-model="filterUser"
              class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
            >
              <option value="">All users</option>
              <option v-for="u in usersList" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>

            <select
              v-model="filterRating"
              class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
            >
              <option value="">Any rating</option>
              <option value="5">★★★★★ (5)</option>
              <option value="4">★★★★ (4)</option>
              <option value="3">★★★ (3)</option>
              <option value="2">★★ (2)</option>
              <option value="1">★ (1)</option>
            </select>

            <button
              v-if="hasActiveFilters"
              type="button"
              class="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-100"
              @click="clearFilters"
            >
              Clear filters
            </button>
          </div>

          <!-- =========================
               BULK ACTIONS
          ========================== -->
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
                class="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-600"
                @click="bulkStatus('approved')"
              >
                <CheckCircleIcon class="mr-1 inline h-3.5 w-3.5" />
                Approve
              </button>
              <button
                type="button"
                class="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-amber-600"
                @click="bulkStatus('pending')"
              >
                <ClockIcon class="mr-1 inline h-3.5 w-3.5" />
                Pending
              </button>
              <button
                type="button"
                class="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-rose-600"
                @click="bulkStatus('flagged')"
              >
                <FlagIcon class="mr-1 inline h-3.5 w-3.5" />
                Flag
              </button>
              <button
                type="button"
                class="rounded-full bg-red-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-red-700"
                @click="bulkStatus('spam')"
              >
                <BanIcon class="mr-1 inline h-3.5 w-3.5" />
                Spam
              </button>
              <button
                type="button"
                class="rounded-full bg-red-700 px-3 py-1.5 text-xs font-black text-white transition hover:bg-red-800"
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

          <!-- =========================
               LIST VIEW
          ========================== -->
          <div v-if="filtered.length && viewMode === 'list'">

            <!-- Mobile: card list -->
            <div class="space-y-3 md:hidden">
              <article
                v-for="c in paginated"
                :key="c.id"
                class="relative rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800"
                :class="c.pinned ? 'ring-2 ring-amber-400' : ''"
              >
                <div class="flex items-start gap-3">
                  <input
                    v-model="selectedIds"
                    type="checkbox"
                    :value="c.id"
                    class="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-500"
                  />

                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-black text-white">
                    {{ initials(c.userName) }}
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-black">{{ c.userName }}</p>
                    <p class="truncate text-[10px] text-slate-400">{{ relativeTime(c._createdAt) }}</p>
                  </div>

                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
                    :class="statusClass(c.status)"
                  >
                    {{ c.status }}
                  </span>
                </div>

                <div v-if="c.pinned" class="absolute right-3 top-3 rounded-full bg-amber-400 p-1 text-white">
                  <PinIcon class="h-3 w-3" />
                </div>

                <div class="mt-3 flex items-center gap-0.5">
                  <StarIcon
                    v-for="n in 5"
                    :key="n"
                    class="h-3.5 w-3.5"
                    :class="n <= (c.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'"
                  />
                </div>

                <p class="mt-2 line-clamp-3 text-sm dark:text-white/85">
                  {{ c.text }}
                </p>

                <p v-if="c.replies?.length" class="mt-2 text-[10px] font-bold text-slate-400">
                  {{ c.replies.length }} repl{{ c.replies.length === 1 ? 'y' : 'ies' }}
                </p>

                <div class="mt-3 flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-white/70">
                  <span class="inline-flex items-center gap-1">
                    <ThumbsUpIcon class="h-3 w-3" />
                    {{ c.likes || 0 }}
                  </span>
                  <div class="flex items-center gap-1.5 min-w-0">
                    <div
                      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slate-700 to-slate-950 text-[9px] font-black text-white"
                      :style="posterStyle(c.titleImage)"
                    >
                      <span v-if="!c.titleImage">{{ initials(c.titleName) }}</span>
                    </div>
                    <span class="truncate">{{ c.titleName }}</span>
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-amber-400 hover:text-white dark:bg-slate-800 dark:text-white"
                    :title="c.pinned ? 'Unpin' : 'Pin'"
                    @click="togglePin(c)"
                  >
                    <PinIcon class="h-3.5 w-3.5" :class="c.pinned ? 'fill-amber-500 text-amber-500' : ''" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:text-white"
                    title="Approve"
                    @click="setStatus(c, 'approved')"
                  >
                    <CheckIcon class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:text-white"
                    title="Flag"
                    @click="setStatus(c, 'flagged')"
                  >
                    <FlagIcon class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:text-white"
                    title="Edit"
                    @click="openEdit(c)"
                  >
                    <PencilIcon class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-indigo-500 hover:text-white dark:bg-slate-800 dark:text-white"
                    title="Reply"
                    @click="openReply(c)"
                  >
                    <ReplyIcon class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                    title="Delete"
                    @click="confirmDelete(c)"
                  >
                    <TrashIcon class="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            </div>

            <!-- Desktop: table -->
            <div class="hidden overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-black dark:border dark:border-slate-800 md:block">
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
                    <th class="px-4 py-3 font-black">Comment</th>
                    <th class="px-4 py-3 font-black">User</th>
                    <th class="px-4 py-3 font-black">Title</th>
                    <th class="px-4 py-3 font-black">Rating</th>
                    <th class="px-4 py-3 font-black">Status</th>
                    <th class="px-4 py-3 font-black">Likes</th>
                    <th class="px-4 py-3 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr
                    v-for="c in paginated"
                    :key="c.id"
                    class="transition hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <td class="px-4 py-3 align-top">
                      <input
                        v-model="selectedIds"
                        type="checkbox"
                        :value="c.id"
                        class="h-4 w-4 rounded border-slate-300 text-blue-500"
                      />
                    </td>
                    <td class="px-4 py-3 align-top">
                      <div class="flex items-start gap-2">
                        <div
                          v-if="c.pinned"
                          class="mt-0.5 shrink-0 rounded-full bg-amber-400 p-1 text-white"
                          title="Pinned"
                        >
                          <PinIcon class="h-3 w-3" />
                        </div>
                        <p class="line-clamp-2 max-w-md text-sm dark:text-white/90">
                          {{ c.text }}
                        </p>
                      </div>
                      <p v-if="c.replies?.length" class="mt-1 text-[10px] font-bold text-slate-400">
                        {{ c.replies.length }} repl{{ c.replies.length === 1 ? 'y' : 'ies' }}
                      </p>
                    </td>
                    <td class="px-4 py-3 align-top">
                      <div class="flex items-center gap-2">
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[10px] font-black text-white">
                          {{ initials(c.userName) }}
                        </div>
                        <div class="min-w-0">
                          <p class="truncate text-xs font-black">{{ c.userName }}</p>
                          <p class="truncate text-[10px] text-slate-400">
                            {{ relativeTime(c._createdAt) }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 align-top">
                      <div class="flex items-center gap-2">
                        <div
                          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slate-700 to-slate-950 text-[10px] font-black text-white"
                          :style="posterStyle(c.titleImage)"
                        >
                          <span v-if="!c.titleImage">{{ initials(c.titleName) }}</span>
                        </div>
                        <div class="min-w-0">
                          <p class="truncate text-xs font-black">{{ c.titleName }}</p>
                          <p class="truncate text-[10px] text-slate-400">{{ c.titleType }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 align-top">
                      <div class="flex items-center gap-0.5">
                        <StarIcon
                          v-for="n in 5"
                          :key="n"
                          class="h-3.5 w-3.5"
                          :class="n <= (c.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'"
                        />
                      </div>
                    </td>
                    <td class="px-4 py-3 align-top">
                      <span
                        class="rounded-full px-2.5 py-1 text-[10px] font-black"
                        :class="statusClass(c.status)"
                      >
                        {{ c.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3 align-top text-xs font-black dark:text-white/80">
                      <span class="inline-flex items-center gap-1">
                        <ThumbsUpIcon class="h-3.5 w-3.5" />
                        {{ c.likes || 0 }}
                      </span>
                    </td>
                    <td class="px-4 py-3 align-top">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-amber-400 hover:text-white dark:bg-slate-800 dark:text-white"
                          :title="c.pinned ? 'Unpin' : 'Pin'"
                          @click="togglePin(c)"
                        >
                          <PinIcon class="h-3.5 w-3.5" :class="c.pinned ? 'fill-amber-500 text-amber-500' : ''" />
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:text-white"
                          title="Approve"
                          @click="setStatus(c, 'approved')"
                        >
                          <CheckIcon class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:text-white"
                          title="Flag"
                          @click="setStatus(c, 'flagged')"
                        >
                          <FlagIcon class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:text-white"
                          title="Edit"
                          @click="openEdit(c)"
                        >
                          <PencilIcon class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-indigo-500 hover:text-white dark:bg-slate-800 dark:text-white"
                          title="Reply"
                          @click="openReply(c)"
                        >
                          <ReplyIcon class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Delete"
                          @click="confirmDelete(c)"
                        >
                          <TrashIcon class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- =========================
               CARD VIEW
          ========================== -->
          <div
            v-if="filtered.length && viewMode === 'cards'"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <article
              v-for="c in paginated"
              :key="c.id"
              class="relative rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-black dark:border dark:border-slate-800"
              :class="c.pinned ? 'ring-2 ring-amber-400' : ''"
            >
              <div class="absolute left-3 top-3">
                <input
                  v-model="selectedIds"
                  type="checkbox"
                  :value="c.id"
                  class="h-4 w-4 rounded border-slate-300 text-blue-500"
                />
              </div>
              <div v-if="c.pinned" class="absolute right-3 top-3 rounded-full bg-amber-400 p-1 text-white">
                <PinIcon class="h-3 w-3" />
              </div>

              <div class="flex items-center gap-3 pl-6">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-black text-white">
                  {{ initials(c.userName) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-xs font-black">{{ c.userName }}</p>
                  <p class="truncate text-[10px] text-slate-400">{{ relativeTime(c._createdAt) }}</p>
                </div>
                <span
                  class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
                  :class="statusClass(c.status)"
                >
                  {{ c.status }}
                </span>
              </div>

              <div class="mt-3 flex items-center gap-0.5">
                <StarIcon
                  v-for="n in 5"
                  :key="n"
                  class="h-3.5 w-3.5"
                  :class="n <= (c.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'"
                />
              </div>

              <p class="mt-2 line-clamp-3 text-sm dark:text-white/85">
                {{ c.text }}
              </p>

              <div v-if="c.replies?.length" class="mt-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/60">
                  {{ c.replies.length }} Repl{{ c.replies.length === 1 ? 'y' : 'ies' }}
                </p>
              </div>

              <div class="mt-3 flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-white/70">
                <span class="inline-flex items-center gap-1">
                  <ThumbsUpIcon class="h-3 w-3" />
                  {{ c.likes || 0 }}
                </span>
                <div class="flex items-center gap-1.5">
                  <div
                    class="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-slate-700 to-slate-950 text-[9px] font-black text-white"
                    :style="posterStyle(c.titleImage)"
                  >
                    <span v-if="!c.titleImage">{{ initials(c.titleName) }}</span>
                  </div>
                  <span class="truncate">{{ c.titleName }}</span>
                </div>
              </div>

              <div class="mt-3 flex gap-1.5">
                <button
                  type="button"
                  class="flex-1 rounded-full bg-emerald-500 py-2 text-[11px] font-black text-white transition hover:bg-emerald-600"
                  @click="setStatus(c, 'approved')"
                >
                  Approve
                </button>
                <button
                  type="button"
                  class="rounded-full bg-blue-500 px-3 py-2 text-[11px] font-black text-white transition hover:bg-blue-600"
                  @click="openEdit(c)"
                >
                  <PencilIcon class="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  class="rounded-full bg-indigo-500 px-3 py-2 text-[11px] font-black text-white transition hover:bg-indigo-600"
                  @click="openReply(c)"
                >
                  <ReplyIcon class="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  class="rounded-full bg-red-50 px-3 py-2 text-[11px] font-black text-red-600 transition hover:bg-red-100"
                  @click="confirmDelete(c)"
                >
                  <TrashIcon class="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          </div>

          <!-- =========================
               PAGINATION
          ========================== -->
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
                <option :value="10">10 / page</option>
                <option :value="25">25 / page</option>
                <option :value="50">50 / page</option>
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

          <!-- =========================
               EMPTY
          ========================== -->
          <div
            v-if="!filtered.length"
            class="flex min-h-[260px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
          >
            <MessageSquareIcon class="mb-3 h-12 w-12 text-slate-300" />
            <h2 class="text-xl font-black">No comments found</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-white/70">
              Try a different filter or search term.
            </p>
          </div>
        </template>

      </section>
    </main>

    <!-- =========================================================
         EDIT MODAL
    ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="editing"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          @click.self="closeEdit"
        >
          <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h3 class="text-xl font-black">Edit Comment</h3>
                <p class="mt-1 text-xs text-slate-500 dark:text-white/70">
                  By {{ editing.userName }} on "{{ editing.titleName }}"
                </p>
              </div>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-white"
                @click="closeEdit"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Comment Text
                </label>
                <textarea
                  v-model="editing.text"
                  rows="4"
                  class="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Status
                  </label>
                  <select
                    v-model="editing.status"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="flagged">Flagged</option>
                    <option value="spam">Spam</option>
                  </select>
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Rating
                  </label>
                  <select
                    v-model.number="editing.rating"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option :value="5">★★★★★ (5)</option>
                    <option :value="4">★★★★ (4)</option>
                    <option :value="3">★★★ (3)</option>
                    <option :value="2">★★ (2)</option>
                    <option :value="1">★ (1)</option>
                  </select>
                </div>
              </div>

              <label class="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <input v-model="editing.pinned" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-500" />
                <span class="text-sm font-bold">Pin this comment</span>
              </label>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button
                class="rounded-full px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                @click="closeEdit"
              >
                Cancel
              </button>
              <button
                class="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-60"
                :disabled="saving"
                @click="saveEdit"
              >
                {{ saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- =========================================================
         REPLY MODAL
    ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="replyTarget"
          class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          @click.self="closeReply"
        >
          <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h3 class="text-xl font-black">Reply to Comment</h3>
                <p class="mt-1 text-xs text-slate-500 dark:text-white/70">
                  Replying as Admin on "{{ replyTarget.titleName }}"
                </p>
              </div>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-white"
                @click="closeReply"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>

            <div class="mb-4 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800">
              <p class="font-black text-slate-500 dark:text-white/70">
                {{ replyTarget.userName }} said:
              </p>
              <p class="mt-1 line-clamp-3 dark:text-white/90">{{ replyTarget.text }}</p>
            </div>

            <textarea
              v-model="replyText"
              rows="4"
              placeholder="Write your reply..."
              class="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            ></textarea>

            <div class="mt-5 flex justify-end gap-3">
              <button
                class="rounded-full px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                @click="closeReply"
              >
                Cancel
              </button>
              <button
                class="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-60"
                :disabled="saving"
                @click="submitReply"
              >
                <ReplyIcon class="mr-1 inline h-4 w-4" />
                {{ saving ? 'Posting…' : 'Post Reply' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- =========================================================
         TOASTS
    ========================================================== -->
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
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import AdminHeader from '../admin/AdminHeader.vue'

import {
  SearchIcon,
  TrashIcon,
  PencilIcon,
  StarIcon,
  ThumbsUpIcon,
  MessageSquareIcon,
  DownloadIcon,
  ListIcon,
  LayoutGridIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  CheckCircle2Icon,
  CheckIcon,
  BanIcon,
  FlagIcon,
  PinIcon,
  ReplyIcon,
  ClockIcon,
  XIcon,
  AlertCircleIcon,
  InfoIcon
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
   STATE
===================================================== */
const loading = ref(true)
const loadError = ref(null)
const saving = ref(false)

const comments = ref([])
const contents = ref([])
const users = ref([])

const search = ref('')
const activeStatus = ref('all')
const sortBy = ref('newest')
const viewMode = ref('list')
const filterTitle = ref('')
const filterUser = ref('')
const filterRating = ref('')

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const editing = ref(null)
const replyTarget = ref(null)
const replyText = ref('')

const statusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
  { label: 'Flagged', value: 'flagged' },
  { label: 'Spam', value: 'spam' }
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
function normaliseComment(c) {
  if (!c || typeof c !== 'object') return null
  const id = c.id ?? c._id
  if (!id) return null

  return {
    id: String(id),
    userId: String(c.userId ?? c.user?.id ?? c.user?._id ?? ''),
    userName: c.userName ?? c.user?.name ?? c.user?.username ?? 'Unknown',
    titleId: String(c.titleId ?? c.title?.id ?? c.title?._id ?? ''),
    titleName: c.titleName ?? c.title?.title ?? 'Unknown',
    titleType: c.titleType ?? c.title?.type ?? 'Movie',
    titleImage:
      c.titleImage ??
      c.title?.thumbnail ??
      c.title?.image ??
      '',
    text: c.text ?? '',
    rating: Number(c.rating ?? 0),
    likes: Number(c.likes ?? 0),
    status: c.status ?? 'pending',
    pinned: Boolean(c.pinned),
    replies: Array.isArray(c.replies) ? c.replies.map(r => ({
      id: String(r.id ?? r._id ?? Date.now()),
      user: r.user ?? r.userName ?? 'Unknown',
      text: r.text ?? '',
      _createdAt: r.createdAt
        ? new Date(r.createdAt).getTime()
        : r._createdAt ?? Date.now()
    })) : [],
    _createdAt: c.createdAt
      ? new Date(c.createdAt).getTime()
      : c._createdAt ?? Date.now()
  }
}

/* =====================================================
   FETCH
===================================================== */
async function fetchComments() {
  loading.value = true
  loadError.value = null

  try {
    const data = await apiFetch('/admin/comments')
    const list = data?.data ?? data?.items ?? data ?? []
    comments.value = Array.isArray(list)
      ? list.map(normaliseComment).filter(Boolean)
      : []
  } catch (err) {
    loadError.value = err?.message || 'Failed to load comments.'
  } finally {
    loading.value = false
  }
}

async function fetchTitles() {
  try {
    const data = await apiFetch('/admin/content')
    const list = data?.data ?? data?.items ?? data ?? []
    contents.value = Array.isArray(list)
      ? list.map(c => ({
          id: String(c.id ?? c._id),
          title: c.title ?? 'Untitled'
        }))
      : []
  } catch {
    contents.value = []
  }
}

async function fetchUsers() {
  try {
    const data = await apiFetch('/admin/users')
    const list = data?.data ?? data?.items ?? data ?? []
    users.value = Array.isArray(list)
      ? list.map(u => ({
          id: String(u.id ?? u._id),
          name: u.name ?? u.username ?? 'Unknown'
        }))
      : []
  } catch {
    users.value = []
  }
}

/* =====================================================
   HELPERS
===================================================== */
const titles = computed(() => contents.value)
const usersList = computed(() => users.value)

function initials(name) {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function posterStyle(image) {
  if (!image) return {}
  return {
    backgroundImage: `url("${image}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
}

function statusClass(status) {
  return {
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    pending:  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    flagged:  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    spam:     'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
  }[status] || 'bg-slate-100 text-slate-700'
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

/* =====================================================
   FILTERS
===================================================== */
const hasActiveFilters = computed(() =>
  Boolean(search.value || filterTitle.value || filterUser.value || filterRating.value || activeStatus.value !== 'all')
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = comments.value.filter(c => {
    const matchStatus = activeStatus.value === 'all' || c.status === activeStatus.value
    const matchTitle = !filterTitle.value || c.titleId === filterTitle.value
    const matchUser = !filterUser.value || c.userId === filterUser.value
    const matchRating = !filterRating.value || c.rating === Number(filterRating.value)
    const matchSearch =
      !q ||
      (c.text || '').toLowerCase().includes(q) ||
      (c.userName || '').toLowerCase().includes(q) ||
      (c.titleName || '').toLowerCase().includes(q)
    return matchStatus && matchTitle && matchUser && matchRating && matchSearch
  })

  const sorter = (a, b) => {
    switch (sortBy.value) {
      case 'oldest': return (a._createdAt || 0) - (b._createdAt || 0)
      case 'likes': return (b.likes || 0) - (a.likes || 0)
      case 'replies': return (b.replies?.length || 0) - (a.replies?.length || 0)
      case 'newest':
      default: return (b._createdAt || 0) - (a._createdAt || 0)
    }
  }

  const pinned = list.filter(c => c.pinned)
  const rest = list.filter(c => !c.pinned)
  pinned.sort(sorter)
  rest.sort(sorter)
  return [...pinned, ...rest]
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([search, activeStatus, sortBy, filterTitle, filterUser, filterRating, pageSize], () => {
  currentPage.value = 1
})

watch(filtered, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
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
  activeStatus.value = 'all'
  filterTitle.value = ''
  filterUser.value = ''
  filterRating.value = ''
  currentPage.value = 1
}

/* =====================================================
   COUNTS
===================================================== */
const counts = computed(() => {
  const all = comments.value
  return {
    total: all.length,
    approved: all.filter(c => c.status === 'approved').length,
    pending: all.filter(c => c.status === 'pending').length,
    flagged: all.filter(c => c.status === 'flagged').length,
    spam: all.filter(c => c.status === 'spam').length
  }
})

function countByStatus(status) {
  if (status === 'all') return comments.value.length
  return comments.value.filter(c => c.status === status).length
}

/* =====================================================
   ROW ACTIONS
===================================================== */
async function setStatus(c, status) {
  try {
    await apiFetch(`/admin/comments/${c.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
    c.status = status
    toast(`Comment marked as ${status}`, 'success')
  } catch (err) {
    toast(err?.message || 'Failed to update status.', 'error')
  }
}

async function togglePin(c) {
  const next = !c.pinned
  try {
    await apiFetch(`/admin/comments/${c.id}`, {
      method: 'PUT',
      body: JSON.stringify({ pinned: next })
    })
    c.pinned = next
    toast(next ? 'Pinned' : 'Unpinned', 'info')
  } catch (err) {
    toast(err?.message || 'Failed to update pin.', 'error')
  }
}

async function confirmDelete(c) {
  if (!window.confirm('Delete this comment?')) return
  try {
    await apiFetch(`/admin/comments/${c.id}`, { method: 'DELETE' })
    comments.value = comments.value.filter(x => x.id !== c.id)
    toast('Comment deleted', 'success')
  } catch (err) {
    toast(err?.message || 'Failed to delete.', 'error')
  }
}

function openEdit(c) {
  editing.value = { ...c }
}

function closeEdit() {
  editing.value = null
}

async function saveEdit() {
  if (!editing.value) return
  saving.value = true
  const { id, text, status, rating, pinned } = editing.value

  try {
    await apiFetch(`/admin/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ text, status, rating, pinned })
    })

    const target = comments.value.find(c => c.id === id)
    if (target) Object.assign(target, { text, status, rating, pinned })

    toast('Comment updated', 'success')
    closeEdit()
  } catch (err) {
    toast(err?.message || 'Failed to save.', 'error')
  } finally {
    saving.value = false
  }
}

/* =====================================================
   REPLY
===================================================== */
function openReply(c) {
  replyTarget.value = c
  replyText.value = ''
}

function closeReply() {
  replyTarget.value = null
  replyText.value = ''
}

async function submitReply() {
  const text = replyText.value.trim()
  if (!text) {
    toast('Reply cannot be empty.', 'error')
    return
  }
  if (!replyTarget.value) return

  saving.value = true
  try {
    const data = await apiFetch(`/admin/comments/${replyTarget.value.id}/replies`, {
      method: 'POST',
      body: JSON.stringify({ text })
    })

    const reply = data?.data ?? data
    const target = comments.value.find(c => c.id === replyTarget.value.id)
    if (target) {
      if (!Array.isArray(target.replies)) target.replies = []
      target.replies.push({
        id: String(reply?.id ?? Date.now()),
        user: reply?.user ?? 'Admin',
        text: reply?.text ?? text,
        _createdAt: reply?.createdAt
          ? new Date(reply.createdAt).getTime()
          : Date.now()
      })
    }

    toast('Reply posted', 'success')
    closeReply()
  } catch (err) {
    toast(err?.message || 'Failed to post reply.', 'error')
  } finally {
    saving.value = false
  }
}

/* =====================================================
   BULK ACTIONS
===================================================== */
async function bulkStatus(status) {
  const ids = [...selectedIds.value]
  try {
    await apiFetch('/admin/comments/bulk/status', {
      method: 'PUT',
      body: JSON.stringify({ ids, status })
    })
    comments.value.forEach(c => { if (ids.includes(c.id)) c.status = status })
    toast(`${ids.length} comment(s) marked as ${status}`, 'success')
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk update failed.', 'error')
  }
}

async function bulkDelete() {
  const ids = [...selectedIds.value]
  if (!window.confirm(`Delete ${ids.length} comment(s)?`)) return
  try {
    await apiFetch('/admin/comments/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    })
    comments.value = comments.value.filter(c => !ids.includes(c.id))
    toast(`Deleted ${ids.length} comment(s)`, 'success')
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk delete failed.', 'error')
  }
}

/* =====================================================
   EXPORT
===================================================== */
function exportComments() {
  const data = JSON.stringify(comments.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `comments-export-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast('Exported comments', 'success')
}

/* =====================================================
   KEYBOARD SHORTCUTS
===================================================== */
function handleKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
    e.preventDefault()
    exportComments()
  }
  if (e.key === 'Escape') {
    if (replyTarget.value) closeReply()
    else if (editing.value) closeEdit()
  }
}

/* =====================================================
   LIFECYCLE
===================================================== */
onMounted(async () => {
  window.addEventListener('keydown', handleKey)
  await Promise.all([fetchComments(), fetchTitles(), fetchUsers()])
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>