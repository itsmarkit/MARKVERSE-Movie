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
              Upload
              <span class="text-blue-600">Management</span>
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-slate-500 dark:text-white/70 sm:text-base">
              Add, edit, duplicate, and organize movies and series.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900 dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
              title="Export JSON (Ctrl+E)"
              @click="exportJSON"
            >
              <DownloadCloudIcon class="h-4 w-4" />
              Export
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
              title="New Title (Ctrl+N)"
              @click="openForm()"
            >
              <PlusIcon class="h-4 w-4" />
              Add New Title
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
            Loading content…
          </p>
        </div>

        <div
          v-else-if="loadError"
          class="mb-6 flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
        >
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">⚠️</div>
          <h2 class="text-2xl font-black">Failed to load content</h2>
          <p class="mt-2 max-w-md text-sm text-slate-500 dark:text-white/70">
            {{ loadError }}
          </p>
          <button
            type="button"
            class="mt-5 rounded-full bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
            @click="fetchContents"
          >
            Try again
          </button>
        </div>

        <template v-else>
          <!-- =========================
               STATS
          ========================== -->
          <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total" :value="contents.length" color="blue" />
            <StatCard label="Movies" :value="countByType('Movie')" color="emerald" />
            <StatCard label="Series" :value="countByType('Series')" color="purple" />
            <StatCard label="Avg Rating" :value="avgRating" color="amber" />
          </div>

          <!-- =========================
               FILTERS
          ========================== -->
          <div class="mb-6 space-y-3">
            <!-- Row 1 -->
            <div class="flex flex-wrap items-center gap-3">
              <div class="flex gap-2">
                <button
                  v-for="tab in typeTabs"
                  :key="tab.value"
                  type="button"
                  class="rounded-full px-4 py-2.5 text-sm font-bold transition"
                  :class="
                    activeType === tab.value
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-black dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-900'
                  "
                  @click="activeType = tab.value"
                >
                  {{ tab.label }}
                  <span class="ml-1 text-xs opacity-70">({{ countByType(tab.value) }})</span>
                </button>
              </div>

              <div class="ml-auto flex items-center gap-2">
                <select
                  v-model="sortBy"
                  class="rounded-xl bg-white px-3 py-2 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A–Z</option>
                  <option value="year">Year (high → low)</option>
                  <option value="rating">Rating (high → low)</option>
                </select>

                <div class="flex overflow-hidden rounded-xl bg-white shadow-sm dark:bg-black dark:border dark:border-slate-800">
                  <button
                    type="button"
                    class="px-3 py-2 transition"
                    :class="viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800'"
                    @click="viewMode = 'list'"
                    title="List view"
                  >
                    <ListIcon class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="px-3 py-2 transition"
                    :class="viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800'"
                    @click="viewMode = 'grid'"
                    title="Grid view"
                  >
                    <LayoutGridIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Row 2 -->
            <div class="flex flex-wrap items-center gap-3">
              <div class="relative w-full sm:w-72">
                <input
                  v-model="search"
                  type="search"
                  placeholder="Search by title, genre..."
                  class="w-full rounded-xl bg-white px-4 py-2.5 pr-10 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-blue-500/20 dark:bg-black dark:border dark:border-slate-800 dark:text-white"
                />
                <SearchIcon class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <select
                v-model="filterCountry"
                class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
              >
                <option value="">All countries</option>
                <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
              </select>

              <select
                v-model="filterQuality"
                class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
              >
                <option value="">All qualities</option>
                <option>HD</option>
                <option>4K</option>
                <option>720p</option>
                <option>1080p</option>
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

            <!-- Bulk actions -->
            <div
              v-if="selectedIds.length"
              class="flex flex-wrap items-center gap-2 rounded-2xl bg-blue-50 p-3 dark:bg-blue-500/10"
            >
              <span class="text-sm font-black text-blue-700 dark:text-blue-300">
                {{ selectedIds.length }} selected
              </span>
              <div class="ml-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-100 dark:bg-slate-800 dark:text-white"
                  @click="bulkPin"
                >
                  <PinIcon class="mr-1 inline h-3.5 w-3.5" />
                  Pin / Unpin
                </button>
                <button
                  type="button"
                  class="rounded-full bg-red-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-red-600"
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
          </div>

          <!-- =========================
               LIST VIEW
          ========================== -->
          <div v-if="filtered.length && viewMode === 'list'" class="space-y-3">

            <!-- Mobile cards -->
            <div class="space-y-3 md:hidden">
              <article
                v-for="item in filtered"
                :key="item.id"
                class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800"
                :class="item.pinned ? 'ring-2 ring-amber-400/60' : ''"
              >
                <div class="flex items-start gap-3">
                  <input
                    v-model="selectedIds"
                    type="checkbox"
                    :value="item.id"
                    class="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-500"
                  />

                  <div
                    class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-950 text-sm font-black text-white"
                    :style="posterStyle(item.thumbnail || item.image)"
                  >
                    <span v-if="!(item.thumbnail || item.image)">{{ initials(item.title) }}</span>
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="flex items-center gap-1.5 truncate font-black">
                      <PinIcon v-if="item.pinned" class="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      {{ item.title }}
                    </p>
                    <p class="truncate text-xs text-slate-500 dark:text-white/60">
                      {{ item.country }} • {{ item.quality }}
                    </p>
                    <div class="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        class="rounded-full px-2 py-0.5 text-[10px] font-black"
                        :class="item.type === 'Series' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                      >
                        {{ item.type }}
                      </span>
                      <span class="text-[11px] font-semibold text-slate-500 dark:text-white/70">{{ item.genre }}</span>
                      <span class="text-[11px] font-semibold text-slate-500 dark:text-white/70">{{ item.year }}</span>
                      <span class="text-[11px] font-semibold text-slate-500 dark:text-white/70">★ {{ item.rating }}</span>
                    </div>
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-amber-400 hover:text-white dark:bg-slate-800 dark:text-white"
                    :title="item.pinned ? 'Unpin' : 'Pin'"
                    @click="togglePin(item)"
                  >
                    <PinIcon class="h-4 w-4" :class="item.pinned ? 'fill-amber-500 text-amber-500' : ''" />
                  </button>

                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-emerald-600"
                    title="View details"
                    @click="openDetails(item)"
                  >
                    <EyeIcon class="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-blue-600"
                    title="Edit"
                    @click="openForm(item)"
                  >
                    <PencilIcon class="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    class="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                    title="Delete"
                    @click="confirmDelete(item)"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </button>
                </div>
              </article>
            </div>

            <!-- Desktop table -->
            <div class="hidden overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:shadow-white/10 md:block">
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
                    <th class="px-4 py-3 font-black">Title</th>
                    <th class="px-4 py-3 font-black">Type</th>
                    <th class="px-4 py-3 font-black">Genre</th>
                    <th class="px-4 py-3 font-black">Year</th>
                    <th class="px-4 py-3 font-black">Rating</th>
                    <th class="px-4 py-3 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr
                    v-for="item in filtered"
                    :key="item.id"
                    class="transition hover:bg-slate-50 dark:hover:bg-slate-900"
                    :class="item.pinned ? 'bg-amber-50/40 dark:bg-amber-500/5' : ''"
                  >
                    <td class="px-4 py-3">
                      <input
                        v-model="selectedIds"
                        type="checkbox"
                        :value="item.id"
                        class="h-4 w-4 rounded border-slate-300 text-blue-500"
                      />
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div
                          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-950 text-xs font-black text-white"
                          :style="posterStyle(item.thumbnail || item.image)"
                        >
                          <span v-if="!(item.thumbnail || item.image)">{{ initials(item.title) }}</span>
                        </div>
                        <div class="min-w-0">
                          <p class="flex items-center gap-1.5 truncate font-black">
                            <PinIcon v-if="item.pinned" class="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            {{ item.title }}
                          </p>
                          <p class="truncate text-xs text-slate-500 dark:text-white/60">
                            {{ item.country }} • {{ item.quality }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="rounded-full px-2.5 py-1 text-xs font-black"
                        :class="item.type === 'Series' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                      >
                        {{ item.type }}
                      </span>
                    </td>
                    <td class="px-4 py-3 font-semibold dark:text-white/80">{{ item.genre }}</td>
                    <td class="px-4 py-3 font-semibold dark:text-white/80">{{ item.year }}</td>
                    <td class="px-4 py-3 font-semibold dark:text-white/80">★ {{ item.rating }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-amber-400 hover:text-white dark:bg-slate-800 dark:text-white"
                          :title="item.pinned ? 'Unpin' : 'Pin'"
                          @click="togglePin(item)"
                        >
                          <PinIcon class="h-4 w-4" :class="item.pinned ? 'fill-amber-500 text-amber-500' : ''" />
                        </button>

                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-emerald-600"
                          title="View details"
                          @click="openDetails(item)"
                        >
                          <EyeIcon class="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-blue-600"
                          title="Edit"
                          @click="openForm(item)"
                        >
                          <PencilIcon class="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Delete"
                          @click="confirmDelete(item)"
                        >
                          <TrashIcon class="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- =========================
               GRID VIEW
          ========================== -->
          <div
            v-if="filtered.length && viewMode === 'grid'"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <article
              v-for="item in filtered"
              :key="item.id"
              class="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg dark:bg-black dark:border dark:border-slate-800"
            >
              <div class="absolute left-3 top-3 z-10">
                <input
                  v-model="selectedIds"
                  type="checkbox"
                  :value="item.id"
                  class="h-4 w-4 rounded border-white/70 text-blue-500 shadow"
                />
              </div>
              <div v-if="item.pinned" class="absolute right-3 top-3 z-10 rounded-full bg-amber-400 p-1.5 text-white shadow">
                <PinIcon class="h-3.5 w-3.5 fill-current" />
              </div>

              <div
                class="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-950 text-2xl font-black text-white"
                :style="posterStyle(item.thumbnail || item.image)"
              >
                <span v-if="!(item.thumbnail || item.image)">{{ initials(item.title) }}</span>
              </div>

              <div class="p-4">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="truncate font-black">{{ item.title }}</p>
                    <p class="truncate text-xs text-slate-500 dark:text-white/60">
                      {{ item.genre }} • {{ item.year }} • ★ {{ item.rating }}
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
                    :class="item.type === 'Series' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                  >
                    {{ item.type }}
                  </span>
                </div>

                <div class="mt-3 flex gap-1.5">
                  <button
                    type="button"
                    class="flex-1 rounded-full bg-emerald-500 py-2 text-center text-xs font-black text-white transition hover:bg-emerald-600"
                    @click="openDetails(item)"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    class="rounded-full bg-blue-500 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-600"
                    @click="openForm(item)"
                  >
                    <PencilIcon class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-100"
                    @click="confirmDelete(item)"
                  >
                    <TrashIcon class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          </div>

          <!-- =========================
               EMPTY
          ========================== -->
          <div
            v-if="!filtered.length"
            class="flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
          >
            <FolderIcon class="mb-3 h-12 w-12 text-slate-300" />
            <h2 class="text-xl font-black">No titles found</h2>
            <p class="mt-2 max-w-md text-sm text-slate-500 dark:text-white/70">
              Try a different filter, or upload a new title.
            </p>
            <button
              type="button"
              class="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
              @click="openForm()"
            >
              <PlusIcon class="h-4 w-4" />
              Add New Title
            </button>
          </div>
        </template>

      </section>
    </main>

    <!-- =========================================================
         FORM OVERLAY
    ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="formOpen"
          class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          @click.self="closeForm"
        >
          <div
            class="my-6 w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-slate-950 dark:border dark:border-slate-800"
          >
            <!-- Header -->
            <div class="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              <div>
                <h2 class="text-xl font-black">
                  {{ isEditing ? 'Edit' : 'Add New' }}
                  <span class="text-blue-600">Title</span>
                </h2>
                <p class="mt-0.5 text-xs text-slate-500 dark:text-white/60">
                  {{ isEditing ? `Editing "${form.title}"` : 'Fill in details to publish.' }}
                </p>
              </div>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-white"
                @click="closeForm"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>

            <!-- Body -->
            <form class="p-6" @submit.prevent="submit">
              <div v-if="saving" class="mb-5">
                <div class="mb-1 flex items-center justify-between text-xs font-black text-blue-600">
                  <span>{{ saveStage }}</span>
                  <span>{{ saveProgress }}%</span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    class="h-full bg-blue-500 transition-all duration-300"
                    :style="{ width: `${saveProgress}%` }"
                  ></div>
                </div>
              </div>

              <!-- Type selector -->
              <div class="mb-6">
                <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Type
                </label>
                <div class="flex gap-3">
                  <button
                    v-for="t in ['Movie', 'Series']"
                    :key="t"
                    type="button"
                    class="flex-1 rounded-xl border-2 px-4 py-3 text-sm font-black transition"
                    :class="
                      form.type === t
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-black dark:text-white/70'
                    "
                    @click="form.type = t"
                  >
                    {{ t }}
                  </button>
                </div>
              </div>

              <!-- Channel selector -->
              <div class="mb-6">
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Channel *
                </label>
                <select
                  v-model="form.channelId"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  :disabled="channelsLoading"
                >
                  <option value="" disabled>
                    {{ channelsLoading ? 'Loading channels…' : 'Select a channel' }}
                  </option>
                  <option v-for="ch in channels" :key="ch.id" :value="ch.id">
                    {{ ch.name }}
                  </option>
                </select>
                <p v-if="!channelsLoading && !channels.length" class="mt-1 text-[11px] text-amber-600">
                  No channels available. Create one in Channel Management first.
                </p>
                <p v-else class="mt-1 text-[11px] text-slate-400 dark:text-white/40">
                  The channel this title will be published under.
                </p>
              </div>

              <!-- Grid -->
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <!-- Title -->
                <div class="sm:col-span-2">
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    {{ form.type === 'Series' ? 'Series' : 'Movie' }} Name *
                  </label>
                  <input
                    v-model="form.title"
                    required
                    type="text"
                    placeholder="e.g. DEATH RACE"
                    class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                    :class="errors.title
                      ? 'border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-500/10'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white'"
                    @input="errors.title = ''"
                  />
                  <p v-if="errors.title" class="mt-1 text-xs font-bold text-red-500">{{ errors.title }}</p>
                </div>

                <!-- Genre -->
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Genre *
                  </label>

                  <div v-if="!genreCustom" class="flex gap-2">
                    <select
                      v-model="form.genre"
                      required
                      class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                      :class="errors.genre
                        ? 'border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-500/10'
                        : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white'"
                      @change="onGenreChange"
                    >
                      <option value="" disabled>Select a genre</option>
                      <option v-for="g in genreOptions" :key="g" :value="g">{{ g }}</option>
                      <option value="__custom__">+ Add custom genre…</option>
                    </select>
                  </div>

                  <div v-else class="flex gap-2">
                    <input
                      v-model="form.genre"
                      type="text"
                      placeholder="Type a new genre"
                      class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                      :class="errors.genre
                        ? 'border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-500/10'
                        : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white'"
                      @input="errors.genre = ''"
                    />
                    <button
                      type="button"
                      class="shrink-0 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
                      @click="cancelCustomGenre"
                    >
                      ×
                    </button>
                  </div>

                  <p v-if="errors.genre" class="mt-1 text-xs font-bold text-red-500">{{ errors.genre }}</p>
                  <p v-else-if="genreCustom" class="mt-1 text-[11px] font-bold text-blue-600">
                    Custom genre — will be added to the list on save.
                  </p>
                </div>

                <!-- Year -->
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Year
                  </label>
                  <input
                    v-model="form.year"
                    type="number"
                    placeholder="2026"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <!-- Rating -->
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Rating (0–10)
                  </label>
                  <input
                    v-model="form.rating"
                    type="text"
                    placeholder="8.0"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <!-- Country -->
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Country
                  </label>
                  <select
                    v-model="form.country"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">Select country</option>
                    <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>

                <!-- Quality -->
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Quality
                  </label>
                  <select
                    v-model="form.quality"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option>HD</option>
                    <option>4K</option>
                    <option>720p</option>
                    <option>1080p</option>
                  </select>
                </div>

                <!-- Language -->
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Language
                  </label>

                  <div v-if="!languageCustom" class="flex gap-2">
                    <select
                      v-model="form.language"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      @change="onLanguageChange"
                    >
                      <option value="" disabled>Select a language</option>
                      <option v-for="l in languageOptions" :key="l" :value="l">{{ l }}</option>
                      <option value="__custom__">+ Add custom language…</option>
                    </select>
                  </div>

                  <div v-else class="flex gap-2">
                    <input
                      v-model="form.language"
                      type="text"
                      placeholder="Type a new language"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      class="shrink-0 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
                      @click="cancelCustomLanguage"
                    >
                      ×
                    </button>
                  </div>

                  <p v-if="languageCustom" class="mt-1 text-[11px] font-bold text-blue-600">
                    Custom language — will be added to the list on save.
                  </p>
                </div>

                <!-- Duration -->
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Duration
                  </label>
                  <input
                    v-model="form.duration"
                    type="text"
                    placeholder="1h 52m"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <!-- Movie upload mode -->
                <template v-if="form.type === 'Movie'">
                  <div class="sm:col-span-2">
                    <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                      Upload Type
                    </label>
                    <div class="flex gap-3">
                      <button
                        type="button"
                        class="flex-1 rounded-xl border-2 px-4 py-3 text-sm font-black transition"
                        :class="
                          form.uploadMode === 'single'
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-black dark:text-white/70'
                        "
                        @click="setUploadMode('single')"
                      >
                        Single Video
                      </button>
                      <button
                        type="button"
                        class="flex-1 rounded-xl border-2 px-4 py-3 text-sm font-black transition"
                        :class="
                          form.uploadMode === 'parts'
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-black dark:text-white/70'
                        "
                        @click="setUploadMode('parts')"
                      >
                        Multiple Parts
                      </button>
                    </div>
                  </div>

                  <div v-if="form.uploadMode === 'single'" class="sm:col-span-2">
                    <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                      Video File
                    </label>
                    <div class="flex items-center gap-3">
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                        @click="openFileManager('movie-video')"
                      >
                        <FolderOpenIcon class="h-4 w-4" />
                        Upload Video
                      </button>
                      <span v-if="form.videoUrl" class="truncate text-xs font-semibold text-blue-600">
                        {{ form.videoUrl }}
                      </span>
                      <span v-else class="text-xs text-slate-400">No file selected</span>
                    </div>
                    <video
                      v-if="form.videoUrl"
                      :src="form.videoUrl"
                      controls
                      class="mt-3 h-40 w-full rounded-xl bg-black object-contain"
                    ></video>
                  </div>

                  <div v-else class="sm:col-span-2">
                    <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <label class="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                          Number of Parts
                        </label>
                        <input
                          v-model.number="form.partCount"
                          type="number"
                          min="1"
                          max="30"
                          class="mt-1 w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          @change="syncPartsWithCount"
                        />
                      </div>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-blue-600"
                        @click="addPart"
                      >
                        <PlusIcon class="h-3.5 w-3.5" />
                        Add Part
                      </button>
                    </div>

                    <div class="max-h-96 space-y-3 overflow-y-auto pr-1">
                      <div
                        v-for="(part, index) in form.parts"
                        :key="index"
                        class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div class="flex items-center justify-between gap-3">
                          <span class="text-xs font-black text-blue-600">
                            Part {{ partLabel(index) }}
                          </span>
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                              @click="openFileManager('movie-part', index)"
                            >
                              <FolderOpenIcon class="h-3.5 w-3.5" />
                              Upload Video
                            </button>
                            <button
                              type="button"
                              class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                              title="Remove part"
                              @click="removePart(index)"
                            >
                              <TrashIcon class="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <p v-if="part.url" class="mt-1 truncate text-[11px] font-semibold text-blue-600">
                          {{ part.url }}
                        </p>
                        <p v-else class="mt-1 text-[11px] text-slate-400">No file selected</p>
                        <video
                          v-if="part.url"
                          :src="part.url"
                          controls
                          class="mt-2 h-32 w-full rounded-lg bg-black object-contain"
                        ></video>
                      </div>
                    </div>
                    <p v-if="!form.parts.length" class="text-xs text-slate-400">
                      No parts added yet. Click "Add Part" to start.
                    </p>
                  </div>
                </template>

                <!-- Series: episode count -->
                <template v-else>
                  <div class="sm:col-span-2">
                    <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                      Number of Episodes
                    </label>
                    <input
                      v-model.number="form.episodeCount"
                      type="number"
                      min="1"
                      placeholder="12"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </template>

                <!-- Description -->
                <div class="sm:col-span-2">
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Description
                  </label>
                  <textarea
                    v-model="form.description"
                    rows="4"
                    placeholder="Short synopsis..."
                    class="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  ></textarea>
                </div>

                <!-- Thumbnail -->
                <div class="sm:col-span-2">
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Thumbnail Image
                  </label>
                  <div class="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                      @click="openFileManager('thumbnail')"
                    >
                      <FolderOpenIcon class="h-4 w-4" />
                      Upload Image
                    </button>
                    <span v-if="form.thumbnail" class="truncate text-xs font-semibold text-blue-600">
                      {{ form.thumbnail }}
                    </span>
                    <span v-else class="text-xs text-slate-400">No image selected</span>
                    <button
                      v-if="form.thumbnail"
                      type="button"
                      class="text-xs font-bold text-red-500 hover:underline"
                      @click="form.thumbnail = ''"
                    >
                      Remove
                    </button>
                  </div>
                  <img
                    v-if="form.thumbnail"
                    :src="form.thumbnail"
                    alt="Thumbnail preview"
                    class="mt-3 h-40 w-72 rounded-xl object-cover"
                  />
                </div>

                <!-- Trailer -->
                <div class="sm:col-span-2">
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Video Trailer
                  </label>
                  <div class="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                      @click="openFileManager('trailer')"
                    >
                      <FolderOpenIcon class="h-4 w-4" />
                      Upload Trailer
                    </button>
                    <span v-if="form.trailer" class="truncate text-xs font-semibold text-blue-600">
                      {{ form.trailer }}
                    </span>
                    <span v-else class="text-xs text-slate-400">No trailer selected</span>
                    <button
                      v-if="form.trailer"
                      type="button"
                      class="text-xs font-bold text-red-500 hover:underline"
                      @click="form.trailer = ''"
                    >
                      Remove
                    </button>
                  </div>
                  <video
                    v-if="form.trailer"
                    :src="form.trailer"
                    controls
                    class="mt-3 h-40 w-full rounded-xl bg-black object-contain"
                  ></video>
                </div>

                <!-- Series episode videos -->
                <div v-if="form.type === 'Series' && form.episodeCount > 0" class="sm:col-span-2">
                  <div class="mb-3 flex items-center justify-between">
                    <label class="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                      Episode Videos ({{ form.episodes.length }})
                    </label>
                    <button
                      type="button"
                      class="text-xs font-bold text-blue-600 hover:underline"
                      @click="fillAllEpisodesWithFirst"
                      v-if="form.episodes.some(e => e.url)"
                    >
                      Fill empty with first URL
                    </button>
                  </div>

                  <div class="max-h-96 space-y-3 overflow-y-auto pr-1">
                    <div
                      v-for="(ep, index) in form.episodes"
                      :key="index"
                      class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-xs font-black text-blue-600">
                          Episode {{ index + 1 }}
                        </span>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                            @click="openFileManager('episode', index)"
                          >
                            <FolderOpenIcon class="h-3.5 w-3.5" />
                            Upload Video
                          </button>
                        </div>
                      </div>
                      <input
                        v-model="ep.title"
                        type="text"
                        placeholder="Episode title"
                        class="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-black dark:text-white"
                      />
                      <p v-if="ep.url" class="mt-1 truncate text-[11px] font-semibold text-blue-600">
                        {{ ep.url }}
                      </p>
                      <video
                        v-if="ep.url"
                        :src="ep.url"
                        controls
                        class="mt-2 h-32 w-full rounded-lg bg-black object-contain"
                      ></video>
                    </div>
                  </div>
                </div>

                <!-- Preview -->
                <div class="sm:col-span-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p class="mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Preview
                  </p>
                  <div class="flex items-center gap-4">
                    <div
                      class="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-700 to-slate-950 text-sm font-black text-white"
                      :style="posterStyle(form.thumbnail)"
                    >
                      <span v-if="!form.thumbnail">{{ initials(form.title) }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-lg font-black">{{ form.title || 'Untitled' }}</p>
                      <p class="truncate text-xs font-semibold text-slate-500 dark:text-white/60">
                        {{ form.genre || 'Genre' }} • {{ form.type }} • {{ form.year || 'Year' }}
                      </p>
                      <p v-if="form.type === 'Series'" class="mt-1 text-xs font-bold text-blue-600">
                        {{ form.episodeCount || 0 }} Episode(s)
                      </p>
                      <p v-else class="mt-1 text-xs font-bold text-blue-600">
                        {{ form.uploadMode === 'parts' ? `${form.parts.length} Part(s)` : 'Single Video' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Buttons -->
              <div class="mt-8 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  class="rounded-full px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                  :disabled="saving"
                  @click="closeForm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  :disabled="saving"
                  class="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SaveIcon class="h-4 w-4" />
                  {{ saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Publish') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- =========================================================
         DETAILS OVERLAY
    ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="detailsOpen && detailsItem"
          class="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          @click.self="closeDetails"
        >
          <div
            class="my-6 w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-slate-950 dark:border dark:border-slate-800"
          >
            <div class="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Details</p>
                <h2 class="mt-0.5 text-xl font-black">{{ detailsItem.title }}</h2>
                <p class="text-xs text-slate-500 dark:text-white/60">
                  {{ detailsItem.type }} • {{ detailsItem.genre }} • {{ detailsItem.year }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-blue-100 hover:text-blue-600 dark:bg-slate-800 dark:text-white"
                  title="Print"
                  @click="printDetails"
                >
                  <PrinterIcon class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-white"
                  @click="closeDetails"
                >
                  <XIcon class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div class="space-y-5 p-6">
              <div class="flex flex-col gap-4 sm:flex-row">
                <div
                  class="flex h-44 w-72 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-950 text-lg font-black text-white"
                  :style="posterStyle(detailsItem.thumbnail || detailsItem.image)"
                >
                  <span v-if="!(detailsItem.thumbnail || detailsItem.image)">
                    {{ initials(detailsItem.title) }}
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <DetailField label="Type" :value="detailsItem.type" />
                    <DetailField label="Genre" :value="detailsItem.genre" />
                    <DetailField label="Year" :value="detailsItem.year" />
                    <DetailField label="Rating" :value="`★ ${detailsItem.rating}`" />
                    <DetailField label="Country" :value="detailsItem.country" />
                    <DetailField label="Quality" :value="detailsItem.quality" />
                    <DetailField label="Language" :value="detailsItem.language" />
                    <DetailField label="Duration" :value="detailsItem.duration" />
                    <DetailField
                      v-if="detailsItem.type === 'Movie'"
                      label="Upload Mode"
                      :value="detailsItem.uploadMode === 'parts'
                        ? `Multiple Parts (${(detailsItem.parts || []).length})`
                        : 'Single Video'"
                    />
                    <DetailField
                      v-else
                      label="Episodes"
                      :value="String(detailsItem.episodeCount || (detailsItem.episodes || []).length)"
                    />
                  </div>
                </div>
              </div>

              <div v-if="detailsItem.description">
                <p class="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Description
                </p>
                <p class="text-sm text-slate-700 dark:text-white/80">{{ detailsItem.description }}</p>
              </div>

              <div v-if="detailsItem.trailer">
                <p class="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Trailer
                </p>
                <video
                  :src="detailsItem.trailer"
                  controls
                  class="h-44 w-full rounded-xl bg-black object-contain"
                ></video>
              </div>

              <div v-if="detailsItem.type === 'Movie' && detailsItem.uploadMode !== 'parts' && detailsItem.videoUrl">
                <p class="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Main Video
                </p>
                <video
                  :src="detailsItem.videoUrl"
                  controls
                  class="h-44 w-full rounded-xl bg-black object-contain"
                ></video>
              </div>

              <div v-if="detailsItem.type === 'Movie' && (detailsItem.parts || []).length">
                <p class="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Parts ({{ detailsItem.parts.length }})
                </p>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div
                    v-for="(part, i) in detailsItem.parts"
                    :key="i"
                    class="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                  >
                    <p class="mb-2 text-xs font-black text-blue-600">Part {{ partLabel(i) }}</p>
                    <video
                      v-if="part.url"
                      :src="part.url"
                      controls
                      class="h-32 w-full rounded-lg bg-black object-contain"
                    ></video>
                    <p v-else class="text-[11px] text-slate-400">No file uploaded</p>
                  </div>
                </div>
              </div>

              <div v-if="detailsItem.type === 'Series' && (detailsItem.episodes || []).length">
                <p class="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Episodes ({{ detailsItem.episodes.length }})
                </p>
                <div class="max-h-96 space-y-3 overflow-y-auto pr-1">
                  <div
                    v-for="(ep, i) in detailsItem.episodes"
                    :key="i"
                    class="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                  >
                    <p class="mb-2 text-xs font-black text-blue-600">
                      {{ ep.title || `Episode ${i + 1}` }}
                    </p>
                    <video
                      v-if="ep.url || ep.videoUrl"
                      :src="ep.url || ep.videoUrl"
                      controls
                      class="h-32 w-full rounded-lg bg-black object-contain"
                    ></video>
                    <p v-else class="text-[11px] text-slate-400">No file uploaded</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                class="rounded-full px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                @click="closeDetails"
              >
                Close
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
                @click="editFromDetails"
              >
                <PencilIcon class="h-4 w-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- =========================================================
         FILE UPLOAD MODAL (real uploads via API)
    ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="fileManager.open"
          class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          @click.self="closeFileManager"
        >
          <div class="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-950 dark:border dark:border-slate-800">
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div>
                <h3 class="text-lg font-black">Upload File</h3>
                <p class="text-xs text-slate-500 dark:text-white/60">
                  Choose a {{ fileManager.accept }} file to upload
                </p>
              </div>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-white"
                @click="closeFileManager"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>

            <div class="px-6 pt-4">
              <div
                class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition"
                :class="fileManager.dragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                  : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'"
                @dragover.prevent="fileManager.dragging = true"
                @dragleave.prevent="fileManager.dragging = false"
                @drop.prevent="handleDrop"
              >
                <UploadCloudIcon class="mb-2 h-8 w-8 text-slate-400" />
                <p class="text-sm font-black">
                  Drag & drop your {{ fileManager.accept }} here
                </p>
                <p class="text-xs text-slate-400">
                  Or browse your computer
                </p>
                <input
                  ref="dropInput"
                  type="file"
                  class="hidden"
                  :accept="fileManager.accept === 'image' ? 'image/*' : 'video/*'"
                  @change="handleFileInput"
                />
                <button
                  type="button"
                  class="mt-3 rounded-full bg-blue-500 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-600"
                  @click="$refs.dropInput.click()"
                >
                  Browse files
                </button>
              </div>

              <!-- Upload progress -->
              <div v-if="fileManager.uploading" class="mt-4">
                <div class="mb-1 flex items-center justify-between text-xs font-black text-blue-600">
                  <span>Uploading…</span>
                  <span>{{ fileManager.progress }}%</span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    class="h-full bg-blue-500 transition-all duration-200"
                    :style="{ width: `${fileManager.progress}%` }"
                  ></div>
                </div>
                <p v-if="fileManager.uploadError" class="mt-2 text-xs font-bold text-red-500">
                  {{ fileManager.uploadError }}
                </p>
              </div>
            </div>

            <div class="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                class="rounded-full px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                @click="closeFileManager"
              >
                Close
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
import { computed, reactive, ref, watch, h, onMounted, onBeforeUnmount } from 'vue'
import AdminHeader from '../admin/AdminHeader.vue'

import {
  contents,
  loading,
  loadError,
  fetchContents,
  addContent,
  updateContent,
  deleteContent,
  getContentById,
  uploadFile
} from '../../stores/contentStore.js'
import {
  PlusIcon,
  SearchIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  FolderOpenIcon,
  SaveIcon,
  XIcon,
  EyeIcon,
  PinIcon,
  DownloadCloudIcon,
  ListIcon,
  LayoutGridIcon,
  PrinterIcon,
  UploadCloudIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  InfoIcon
} from 'lucide-vue-next'

/* =====================================================
   INLINE COMPONENTS
===================================================== */
const DetailField = (props) => h('div', { class: 'min-w-0' }, [
  h('p', { class: 'text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70' }, props.label),
  h('p', { class: 'mt-0.5 truncate text-sm font-bold dark:text-white' }, props.value ?? '—')
])
DetailField.props = ['label', 'value']

const StatCard = (props) => h('div', {
  class: 'rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800'
}, [
  h('p', { class: 'text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70' }, props.label),
  h('p', { class: 'mt-1 text-2xl font-black' }, String(props.value))
])
StatCard.props = ['label', 'value', 'color']

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

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

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
    const error = new Error(message || `Request failed (${res.status})`)
    error.status = res.status
throw error
  }
  if (res.status === 204) return null
  return res.json().catch(() => ({}))
}

/* =====================================================
   CHANNELS (for the selector)
===================================================== */
const channels = ref([])
const channelsLoading = ref(false)

async function fetchChannelsForSelect() {
  channelsLoading.value = true
  try {
    const response = await apiFetch('/admin/channels')
    const payload = response?.data ?? response ?? {}
    const list = Array.isArray(payload.channels)
      ? payload.channels
      : Array.isArray(payload)
        ? payload
        : []
    channels.value = list.map(c => ({
      id: c?.id ?? c?._id ?? '',
      name: c?.name ?? 'Untitled Channel',
      avatar: c?.avatar ?? c?.logo ?? ''
    }))
  } catch (err) {
    console.error('Failed to load channels for selector:', err)
    channels.value = []
  } finally {
    channelsLoading.value = false
  }
}

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
   OPTIONS
===================================================== */
const genreOptions = ref([
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
])

const languageOptions = ref([
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Russian', 'Japanese', 'Korean', 'Chinese', 'Hindi', 'Arabic',
  'Turkish', 'Dutch', 'Swedish', 'Polish'
])

const genreCustom = ref(false)
const languageCustom = ref(false)

function onGenreChange(e) {
  if (e.target.value === '__custom__') {
    genreCustom.value = true
    form.genre = ''
  }
}
function cancelCustomGenre() {
  genreCustom.value = false
  form.genre = ''
}
function onLanguageChange(e) {
  if (e.target.value === '__custom__') {
    languageCustom.value = true
    form.language = ''
  }
}
function cancelCustomLanguage() {
  languageCustom.value = false
  form.language = ''
}

function mergeOption(list, value) {
  if (!value) return
  const v = String(value).trim()
  if (!v) return
  if (!list.value.includes(v)) list.value.push(v)
}

/* =====================================================
   LIST STATE
===================================================== */
const search = ref('')
const activeType = ref('all')
const sortBy = ref('newest')
const viewMode = ref('list')
const filterCountry = ref('')
const filterQuality = ref('')
const selectedIds = ref([])

const typeTabs = [
  { label: 'All', value: 'all' },
  { label: 'Movies', value: 'Movie' },
  { label: 'Series', value: 'Series' }
]

const countries = [
  'USA', 'UK', 'France', 'Germany', 'Spain', 'Italy',
  'South Korea', 'Japan', 'China', 'India', 'Nigeria',
  'Canada', 'Australia', 'Brazil', 'Mexico', 'Other'
]

const hasActiveFilters = computed(() =>
  Boolean(search.value || filterCountry.value || filterQuality.value || activeType.value !== 'all')
)

const avgRating = computed(() => {
  if (!contents.value.length) return '—'
  const nums = contents.value.map(c => parseFloat(c.rating)).filter(n => !isNaN(n))
  if (!nums.length) return '—'
  const sum = nums.reduce((a, b) => a + b, 0)
  return (sum / nums.length).toFixed(1)
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = contents.value.filter(c => {
    const matchType = activeType.value === 'all' || c.type === activeType.value
    const matchSearch =
      !q ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.genre || '').toLowerCase().includes(q)
    const matchCountry = !filterCountry.value || c.country === filterCountry.value
    const matchQuality = !filterQuality.value || c.quality === filterQuality.value
    return matchType && matchSearch && matchCountry && matchQuality
  })

  const pinned = list.filter(c => c.pinned)
  const rest = list.filter(c => !c.pinned)

  const sorter = (a, b) => {
    switch (sortBy.value) {
      case 'title': return (a.title || '').localeCompare(b.title || '')
      case 'year': return (Number(b.year) || 0) - (Number(a.year) || 0)
      case 'rating': return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0)
      case 'oldest': return (a._createdAt || 0) - (b._createdAt || 0)
      case 'newest':
      default: return (b._createdAt || 0) - (a._createdAt || 0)
    }
  }

  pinned.sort(sorter)
  rest.sort(sorter)
  return [...pinned, ...rest]
})

const allSelected = computed(() =>
  filtered.value.length > 0 && filtered.value.every(i => selectedIds.value.includes(i.id))
)

function toggleSelectAll(e) {
  selectedIds.value = e.target.checked ? filtered.value.map(i => i.id) : []
}

function clearFilters() {
  search.value = ''
  activeType.value = 'all'
  filterCountry.value = ''
  filterQuality.value = ''
}

function countByType(type) {
  if (type === 'all') return contents.value.length
  return contents.value.filter(c => c.type === type).length
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

function partLabel(index) {
  let n = index
  let label = ''
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

/* =====================================================
   ROW ACTIONS
===================================================== */
async function confirmDelete(item) {
  if (!window.confirm(`Delete "${item.title}"?`)) return
  try {
    await deleteContent(item.id)
    toast(`Deleted "${item.title}"`, 'success')
  } catch (err) {
    toast(err?.message || 'Failed to delete.', 'error')
  }
}

async function togglePin(item) {
  try {
    await updateContent(item.id, { pinned: !item.pinned })
    toast(item.pinned ? 'Unpinned' : 'Pinned', 'info')
  } catch (err) {
    toast(err?.message || 'Failed to update pin.', 'error')
  }
}

async function bulkDelete() {
  if (!window.confirm(`Delete ${selectedIds.value.length} item(s)?`)) return
  try {
    await Promise.all(selectedIds.value.map(id => deleteContent(id)))
    toast(`Deleted ${selectedIds.value.length} item(s)`, 'success')
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk delete failed.', 'error')
  }
}

async function bulkPin() {
  try {
    await Promise.all(
      selectedIds.value.map(id => {
        const item = getContentById(id)
        return item ? updateContent(id, { pinned: !item.pinned }) : null
      })
    )
    toast(`Toggled pin for ${selectedIds.value.length} item(s)`, 'info')
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk pin failed.', 'error')
  }
}

function exportJSON() {
  const data = JSON.stringify(contents.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `content-export-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast('Exported content as JSON', 'success')
}

/* =====================================================
   FORM STATE
===================================================== */
const formOpen = ref(false)
const editingId = ref(null)
const isEditing = computed(() => Boolean(editingId.value))

const saving = ref(false)
const saveProgress = ref(0)
const saveStage = ref('')

const errors = reactive({ title: '', genre: '', channel: '' })

const blankForm = () => ({
  title: '',
  type: 'Movie',
  genre: '',
  year: new Date().getFullYear(),
  rating: '',
  country: '',
  quality: 'HD',
  language: '',
  duration: '',
  description: '',
  thumbnail: '',
  trailer: '',
  uploadMode: 'single',
  videoUrl: '',
  partCount: 2,
  parts: [],
  episodeCount: 0,
  episodes: [],
  channelId: ''
})

const form = reactive(blankForm())

function openForm(item = null) {
  genreCustom.value = false
  languageCustom.value = false

  if (item) {
    editingId.value = item.id
    const loaded = getContentById(item.id) || item

    let parts = []
    if (Array.isArray(loaded.parts) && loaded.parts.length) {
      parts = loaded.parts.map(p => ({ url: p.url || '' }))
    } else if (loaded.partA || loaded.partB) {
      if (loaded.partA) parts.push({ url: loaded.partA })
      if (loaded.partB) parts.push({ url: loaded.partB })
    }

    Object.assign(form, blankForm(), {
      title: loaded.title || '',
      type: loaded.type || 'Movie',
      genre: loaded.genre || '',
      year: loaded.year || new Date().getFullYear(),
      rating: loaded.rating || '',
      country: loaded.country || '',
      quality: loaded.quality || 'HD',
      language: loaded.language || '',
      duration: loaded.duration || '',
      description: loaded.description || '',
      thumbnail: loaded.thumbnail || loaded.image || '',
      trailer: loaded.trailer || '',
      uploadMode: loaded.uploadMode || (parts.length ? 'parts' : 'single'),
      videoUrl: loaded.videoUrl || '',
      partCount: parts.length || 2,
      parts,
      episodeCount: loaded.episodeCount || (loaded.episodes ? loaded.episodes.length : 0),
      episodes: loaded.episodes
        ? loaded.episodes.map(e => ({
            title: e.title || '',
            url: e.url || e.videoUrl || ''
          }))
        : [],
      channelId: loaded.channelId || loaded.channel?.id || ''
    })

    mergeOption(genreOptions, loaded.genre)
    mergeOption(languageOptions, loaded.language)
  } else {
    editingId.value = null
    Object.assign(form, blankForm())
  }

  errors.title = ''
  errors.genre = ''
  errors.channel = ''
  syncEpisodesWithCount()
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingId.value = null
  Object.assign(form, blankForm())
  saving.value = false
  saveProgress.value = 0
  saveStage.value = ''
  genreCustom.value = false
  languageCustom.value = false
}

/* =====================================================
   PARTS / EPISODES
===================================================== */
function setUploadMode(mode) {
  form.uploadMode = mode
  if (mode === 'parts' && form.parts.length === 0) {
    form.partCount = 2
    form.parts.push({ url: '' }, { url: '' })
  }
}

function syncPartsWithCount() {
  const target = Math.max(1, Number(form.partCount) || 1)
  const current = form.parts.length

  if (target > current) {
    for (let i = current; i < target; i++) form.parts.push({ url: '' })
  } else if (target < current) {
    form.parts.splice(target)
  }
}

function addPart() {
  form.parts.push({ url: '' })
  form.partCount = form.parts.length
}

function removePart(index) {
  form.parts.splice(index, 1)
  form.partCount = Math.max(1, form.parts.length)
}

function syncEpisodesWithCount() {
  if (form.type !== 'Series') return
  const target = Math.max(0, Number(form.episodeCount) || 0)
  const current = form.episodes.length

  if (target > current) {
    for (let i = current; i < target; i++) {
      form.episodes.push({ title: `Episode ${i + 1}`, url: '' })
    }
  } else if (target < current) {
    form.episodes.splice(target)
  }
}

function fillAllEpisodesWithFirst() {
  const first = form.episodes.find(e => e.url)
  if (!first) return
  form.episodes.forEach(e => {
    if (!e.url) e.url = first.url
  })
  toast('Filled empty episodes', 'success')
}

watch(() => form.episodeCount, syncEpisodesWithCount)
watch(() => form.type, t => {
  if (t === 'Series') syncEpisodesWithCount()
})

/* =====================================================
   DETAILS
===================================================== */
const detailsOpen = ref(false)
const detailsItem = ref(null)

function openDetails(item) {
  detailsItem.value = item
  detailsOpen.value = true
}

function closeDetails() {
  detailsOpen.value = false
  detailsItem.value = null
}

function editFromDetails() {
  const item = detailsItem.value
  closeDetails()
  if (item) openForm(item)
}

function printDetails() {
  window.print()
}

/* =====================================================
   FILE UPLOAD — real API upload
===================================================== */
const dropInput = ref(null)

const fileManager = reactive({
  open: false,
  target: null,
  partIndex: -1,
  episodeIndex: -1,
  accept: 'file',
  dragging: false,
  uploading: false,
  progress: 0,
  uploadError: ''
})

function openFileManager(target, index = -1) {
  fileManager.open = true
  fileManager.target = target
  fileManager.partIndex = target === 'movie-part' ? index : -1
  fileManager.episodeIndex = target === 'episode' ? index : -1
  fileManager.accept = target === 'thumbnail' ? 'image' : 'video'
  fileManager.dragging = false
  fileManager.uploading = false
  fileManager.progress = 0
  fileManager.uploadError = ''
}

function closeFileManager() {
  fileManager.open = false
  fileManager.target = null
  fileManager.partIndex = -1
  fileManager.episodeIndex = -1
  fileManager.dragging = false
  fileManager.uploading = false
  fileManager.progress = 0
  fileManager.uploadError = ''
}

async function uploadAndApply(file) {
  const isImage = file.type.startsWith('image/')
  const type = isImage ? 'image' : 'video'

  if (fileManager.target === 'thumbnail' && type !== 'image') {
    toast('Please choose an image file.', 'error')
    return
  }
  if (fileManager.target !== 'thumbnail' && type !== 'video') {
    toast('Please choose a video file.', 'error')
    return
  }

  fileManager.uploading = true
  fileManager.progress = 0
  fileManager.uploadError = ''

  try {
    const url = await uploadFile(file, (percent) => {
      fileManager.progress = percent
    })

    switch (fileManager.target) {
      case 'thumbnail':
        form.thumbnail = url
        break
      case 'trailer':
        form.trailer = url
        break
      case 'movie-video':
        form.videoUrl = url
        break
      case 'movie-part':
        if (fileManager.partIndex >= 0 && form.parts[fileManager.partIndex]) {
          form.parts[fileManager.partIndex].url = url
        }
        break
      case 'episode':
        if (fileManager.episodeIndex >= 0 && form.episodes[fileManager.episodeIndex]) {
          form.episodes[fileManager.episodeIndex].url = url
          if (!form.episodes[fileManager.episodeIndex].title) {
            form.episodes[fileManager.episodeIndex].title = `Episode ${fileManager.episodeIndex + 1}`
          }
        }
        break
    }

    closeFileManager()
    toast('Upload complete', 'success')
  } catch (err) {
    fileManager.uploadError = err?.message || 'Upload failed.'
    toast(fileManager.uploadError, 'error')
  } finally {
    fileManager.uploading = false
  }
}

function handleDrop(e) {
  fileManager.dragging = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  uploadAndApply(file)
}

function handleFileInput(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploadAndApply(file)
  e.target.value = ''
}

/* =====================================================
   SUBMIT
===================================================== */
async function runProgress() {
  saveProgress.value = 0
  saveStage.value = 'Validating...'
  await new Promise(r => setTimeout(r, 150))
  saveProgress.value = 30
  saveStage.value = 'Preparing metadata...'
  await new Promise(r => setTimeout(r, 150))
  saveProgress.value = 65
  saveStage.value = 'Uploading assets...'
  await new Promise(r => setTimeout(r, 150))
  saveProgress.value = 90
  saveStage.value = 'Finalizing...'
  await new Promise(r => setTimeout(r, 150))
  saveProgress.value = 100
  saveStage.value = 'Done'
}

async function submit() {
  errors.title = ''
  errors.genre = ''
  errors.channel = ''

  if (!form.title.trim()) errors.title = 'Title is required.'
  if (!form.genre.trim()) errors.genre = 'Genre is required.'
  if (!form.channelId) errors.channel = 'Channel is required.'

  if (errors.title || errors.genre || errors.channel) {
    toast('Please fix the highlighted fields.', 'error')
    return
  }

  mergeOption(genreOptions, form.genre)
  mergeOption(languageOptions, form.language)

  saving.value = true
  await runProgress()

  const payload = {
    title: form.title.trim(),
    type: form.type,
    genre: form.genre.trim(),
    year: form.year,
    rating: form.rating,
    country: form.country,
    quality: form.quality,
    language: form.language,
    duration: form.duration,
    description: form.description,
    thumbnail: form.thumbnail,
    image: form.thumbnail,
    trailer: form.trailer,
    channelId: form.channelId
  }

  if (form.type === 'Movie') {
    payload.uploadMode = form.uploadMode
    payload.videoUrl = form.videoUrl
    payload.parts = form.parts
      .filter(p => p.url && p.url.trim() !== '')
      .map(p => ({ url: p.url }))
    payload.partA = payload.parts[0]?.url || ''
    payload.partB = payload.parts[1]?.url || ''
    payload.episodes = []
    payload.episodeCount = 0
  } else {
    const valid = form.episodes
      .filter(e => e.url && e.url.trim() !== '')
      .map((e, i) => ({
        title: e.title || `Episode ${i + 1}`,
        url: e.url,
        videoUrl: e.url
      }))
    payload.episodes = valid
    payload.episodeCount = valid.length
    payload.uploadMode = 'single'
    payload.videoUrl = ''
    payload.parts = []
    payload.partA = ''
    payload.partB = ''
  }

  try {
    if (isEditing.value) {
      await updateContent(editingId.value, payload)
      toast('Changes saved', 'success')
    } else {
      await addContent(payload)
      toast('Published successfully', 'success')
    }
    closeForm()
  } catch (err) {
    toast(err?.message || 'Something went wrong.', 'error')
  } finally {
    saving.value = false
  }
}

/* =====================================================
   KEYBOARD SHORTCUTS
===================================================== */
function handleKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault()
    if (!formOpen.value && !detailsOpen.value) openForm()
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
    e.preventDefault()
    exportJSON()
  }
  if (e.key === 'Escape') {
    if (fileManager.open) closeFileManager()
    else if (detailsOpen.value) closeDetails()
    else if (formOpen.value) closeForm()
  }
}

/* =====================================================
   LIFECYCLE
===================================================== */
onMounted(async () => {
  window.addEventListener('keydown', handleKey)
  await Promise.all([
    fetchContents(),
    fetchChannelsForSelect()
  ])
  contents.value.forEach(c => {
    if (!c._createdAt) c._createdAt = Date.now() - Math.random() * 1e9
    mergeOption(genreOptions, c.genre)
    mergeOption(languageOptions, c.language)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>