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
              Notification
              <span class="text-blue-600">Center</span>
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-slate-500 dark:text-white/70 sm:text-base">
              Send, schedule, and manage system notifications.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900 dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
              title="Export (Ctrl+E)"
              @click="exportNotifications"
            >
              <DownloadIcon class="h-4 w-4" />
              Export
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
              title="New notification (Ctrl+N)"
              @click="openCompose"
            >
              <PlusIcon class="h-4 w-4" />
              New Notification
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
            Loading notifications…
          </p>
        </div>

        <div
          v-else-if="loadError"
          class="mb-6 flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
        >
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">⚠️</div>
          <h2 class="text-2xl font-black">Failed to load notifications</h2>
          <p class="mt-2 max-w-md text-sm text-slate-500 dark:text-white/70">
            {{ loadError }}
          </p>
          <button
            type="button"
            class="mt-5 rounded-full bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
            @click="fetchNotifications"
          >
            Try again
          </button>
        </div>

        <template v-else>
          <!-- =========================
               STATS
          ========================== -->
          <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Total</p>
              <p class="mt-1 text-2xl font-black text-blue-600">{{ counts.total }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Unread</p>
              <p class="mt-1 text-2xl font-black text-amber-600">{{ counts.unread }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Sent</p>
              <p class="mt-1 text-2xl font-black text-emerald-600">{{ counts.sent }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Scheduled</p>
              <p class="mt-1 text-2xl font-black text-purple-600">{{ counts.scheduled }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Failed</p>
              <p class="mt-1 text-2xl font-black text-red-600">{{ counts.failed }}</p>
            </div>
            <div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Read Rate</p>
              <p class="mt-1 text-2xl font-black text-indigo-600">{{ counts.readRate }}%</p>
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
                <option value="priority">Priority (high → low)</option>
                <option value="title">Title A–Z</option>
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
                placeholder="Search title, message, or recipient..."
                class="w-full rounded-xl bg-white px-4 py-2.5 pr-10 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-blue-500/20 dark:bg-black dark:border dark:border-slate-800 dark:text-white"
              />
              <SearchIcon class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <select
              v-model="filterType"
              class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
            >
              <option value="">All types</option>
              <option value="system">System</option>
              <option value="user">User</option>
              <option value="content">Content</option>
              <option value="security">Security</option>
              <option value="promo">Promotion</option>
            </select>

            <select
              v-model="filterPriority"
              class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
            >
              <option value="">Any priority</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
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
                @click="bulkMarkRead"
              >
                <CheckCheckIcon class="mr-1 inline h-3.5 w-3.5" />
                Mark Read
              </button>
              <button
                type="button"
                class="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-amber-600"
                @click="bulkMarkUnread"
              >
                <MailIcon class="mr-1 inline h-3.5 w-3.5" />
                Mark Unread
              </button>
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

          <!-- =========================
               LIST VIEW
          ========================== -->
          <div v-if="filtered.length && viewMode === 'list'">

            <!-- Mobile cards -->
            <div class="space-y-3 md:hidden">
              <article
                v-for="n in paginated"
                :key="n.id"
                class="relative cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition active:scale-[0.99] dark:bg-black dark:border dark:border-slate-800"
                :class="{
                  'ring-2 ring-amber-400': n.pinned,
                  'ring-2 ring-blue-500': !n.read && !n.pinned
                }"
                @click="openDetails(n)"
              >
                <div class="flex items-start gap-3">
                  <input
                    v-model="selectedIds"
                    type="checkbox"
                    :value="n.id"
                    class="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-500"
                    @click.stop
                  />

                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    :class="typeBg(n.type)"
                  >
                    <component :is="typeIcon(n.type)" class="h-5 w-5" :class="typeColor(n.type)" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="flex items-center gap-1.5 truncate text-sm font-black">
                      <span v-if="!n.read" class="h-2 w-2 shrink-0 rounded-full bg-blue-500"></span>
                      {{ n.title }}
                    </p>
                    <p class="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-white/70">
                      {{ n.message }}
                    </p>
                  </div>

                  <div v-if="n.pinned" class="shrink-0 rounded-full bg-amber-400 p-1 text-white">
                    <PinIcon class="h-3 w-3" />
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap items-center gap-1.5">
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-black" :class="typeBg(n.type)">
                    {{ n.type }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                    :class="priorityClass(n.priority)"
                  >
                    <component :is="priorityIcon(n.priority)" class="h-3 w-3" />
                    {{ n.priority }}
                  </span>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-black" :class="statusClass(n.status)">
                    {{ n.status }}
                  </span>
                </div>

                <div class="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-white/60">
                  <span class="inline-flex items-center gap-1">
                    <UsersIcon class="h-3 w-3" />
                    {{ n.audience }}
                  </span>
                  <span>{{ relativeTime(n._createdAt) }}</span>
                </div>

                <div class="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800" @click.stop>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-amber-400 hover:text-white dark:bg-slate-800 dark:text-white"
                    :title="n.pinned ? 'Unpin' : 'Pin'"
                    @click="togglePin(n)"
                  >
                    <PinIcon class="h-3.5 w-3.5" :class="n.pinned ? 'fill-amber-500 text-amber-500' : ''" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:text-white"
                    :title="n.read ? 'Mark as unread' : 'Mark as read'"
                    @click="toggleRead(n)"
                  >
                    <component :is="n.read ? MailIcon : CheckCheckIcon" class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:text-white"
                    title="Edit"
                    @click="openCompose(n)"
                  >
                    <PencilIcon class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                    title="Delete"
                    @click="confirmDelete(n)"
                  >
                    <TrashIcon class="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            </div>

            <!-- Desktop table -->
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
                    <th class="px-4 py-3 font-black">Notification</th>
                    <th class="px-4 py-3 font-black">Type</th>
                    <th class="px-4 py-3 font-black">Priority</th>
                    <th class="px-4 py-3 font-black">Recipients</th>
                    <th class="px-4 py-3 font-black">Status</th>
                    <th class="px-4 py-3 font-black">Date</th>
                    <th class="px-4 py-3 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr
                    v-for="n in paginated"
                    :key="n.id"
                    class="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-900"
                    :class="{
                      'bg-blue-50/40 dark:bg-blue-500/5': !n.read,
                      'opacity-60': n.status === 'sent' && n.read
                    }"
                    @click="openDetails(n)"
                  >
                    <td class="px-4 py-3 align-top" @click.stop>
                      <input
                        v-model="selectedIds"
                        type="checkbox"
                        :value="n.id"
                        class="h-4 w-4 rounded border-slate-300 text-blue-500"
                      />
                    </td>
                    <td class="px-4 py-3 align-top">
                      <div class="flex items-start gap-3">
                        <div
                          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          :class="typeBg(n.type)"
                        >
                          <component :is="typeIcon(n.type)" class="h-4 w-4" :class="typeColor(n.type)" />
                        </div>
                        <div class="min-w-0">
                          <p class="flex items-center gap-2 truncate font-black">
                            <span
                              v-if="!n.read"
                              class="h-2 w-2 shrink-0 rounded-full bg-blue-500"
                            ></span>
                            {{ n.title }}
                          </p>
                          <p class="truncate text-xs text-slate-500 dark:text-white/60">
                            {{ n.message }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 align-top">
                      <span class="rounded-full px-2.5 py-1 text-[10px] font-black" :class="typeBg(n.type)">
                        {{ n.type }}
                      </span>
                    </td>
                    <td class="px-4 py-3 align-top">
                      <span
                        class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black"
                        :class="priorityClass(n.priority)"
                      >
                        <component :is="priorityIcon(n.priority)" class="h-3 w-3" />
                        {{ n.priority }}
                      </span>
                    </td>
                    <td class="px-4 py-3 align-top text-xs font-bold dark:text-white/80">
                      {{ n.audience }}
                    </td>
                    <td class="px-4 py-3 align-top">
                      <span
                        class="rounded-full px-2.5 py-1 text-[10px] font-black"
                        :class="statusClass(n.status)"
                      >
                        {{ n.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3 align-top text-xs font-semibold text-slate-500 dark:text-white/70">
                      {{ relativeTime(n._createdAt) }}
                    </td>
                    <td class="px-4 py-3 align-top" @click.stop>
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-amber-400 hover:text-white dark:bg-slate-800 dark:text-white"
                          :title="n.pinned ? 'Unpin' : 'Pin'"
                          @click="togglePin(n)"
                        >
                          <PinIcon class="h-3.5 w-3.5" :class="n.pinned ? 'fill-amber-500 text-amber-500' : ''" />
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:text-white"
                          :title="n.read ? 'Mark as unread' : 'Mark as read'"
                          @click="toggleRead(n)"
                        >
                          <component :is="n.read ? MailIcon : CheckCheckIcon" class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:text-white"
                          title="Edit"
                          @click="openCompose(n)"
                        >
                          <PencilIcon class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Delete"
                          @click="confirmDelete(n)"
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
              v-for="n in paginated"
              :key="n.id"
              class="group relative cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-black dark:border dark:border-slate-800"
              :class="{
                'ring-2 ring-amber-400': n.pinned,
                'ring-2 ring-blue-500': !n.read && !n.pinned
              }"
              @click="openDetails(n)"
            >
              <div class="absolute left-3 top-3" @click.stop>
                <input
                  v-model="selectedIds"
                  type="checkbox"
                  :value="n.id"
                  class="h-4 w-4 rounded border-slate-300 text-blue-500"
                />
              </div>
              <div v-if="n.pinned" class="absolute right-3 top-3 rounded-full bg-amber-400 p-1 text-white">
                <PinIcon class="h-3 w-3" />
              </div>
              <div v-else-if="!n.read" class="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-blue-500"></div>

              <div class="flex items-start gap-3 pl-6">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  :class="typeBg(n.type)"
                >
                  <component :is="typeIcon(n.type)" class="h-5 w-5" :class="typeColor(n.type)" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-black">{{ n.title }}</p>
                  <p class="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-white/70">
                    {{ n.message }}
                  </p>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-1.5">
                <span class="rounded-full px-2 py-0.5 text-[10px] font-black" :class="typeBg(n.type)">
                  {{ n.type }}
                </span>
                <span class="rounded-full px-2 py-0.5 text-[10px] font-black" :class="priorityClass(n.priority)">
                  {{ n.priority }}
                </span>
                <span class="rounded-full px-2 py-0.5 text-[10px] font-black" :class="statusClass(n.status)">
                  {{ n.status }}
                </span>
              </div>

              <div class="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-white/60">
                <span class="inline-flex items-center gap-1">
                  <UsersIcon class="h-3 w-3" />
                  {{ n.audience }}
                </span>
                <span>{{ relativeTime(n._createdAt) }}</span>
              </div>

              <div class="mt-3 flex gap-1.5" @click.stop>
                <button
                  type="button"
                  class="flex-1 rounded-full bg-blue-500 py-2 text-[11px] font-black text-white transition hover:bg-blue-600"
                  @click="openDetails(n)"
                >
                  View
                </button>
                <button
                  type="button"
                  class="rounded-full bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
                  @click="toggleRead(n)"
                >
                  <component :is="n.read ? MailIcon : CheckCheckIcon" class="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  class="rounded-full bg-red-50 px-3 py-2 text-[11px] font-black text-red-600 transition hover:bg-red-100"
                  @click="confirmDelete(n)"
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
            <BellOffIcon class="mb-3 h-12 w-12 text-slate-300" />
            <h2 class="text-xl font-black">No notifications</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-white/70">
              Try a different filter or create a new notification.
            </p>
            <button
              type="button"
              class="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
              @click="openCompose"
            >
              <PlusIcon class="h-4 w-4" />
              New Notification
            </button>
          </div>
        </template>

      </section>
    </main>

    <!-- =========================================================
         COMPOSE / EDIT MODAL
    ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="composeOpen"
          class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          @click.self="closeCompose"
        >
          <div class="my-6 w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-950 dark:border dark:border-slate-800">
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div>
                <h3 class="text-xl font-black">
                  {{ editingId ? 'Edit' : 'New' }} Notification
                </h3>
                <p class="text-xs text-slate-500 dark:text-white/60">
                  Compose and send to your audience.
                </p>
              </div>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-white"
                @click="closeCompose"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>

            <form class="space-y-4 p-6" @submit.prevent="saveCompose">
              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Title *
                </label>
                <input
                  v-model="form.title"
                  required
                  type="text"
                  placeholder="e.g. New Content Available"
                  class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                  :class="errors.title
                    ? 'border-red-400 bg-red-50 dark:bg-red-500/10'
                    : 'border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'"
                  @input="errors.title = ''"
                />
                <p v-if="errors.title" class="mt-1 text-xs font-bold text-red-500">{{ errors.title }}</p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Message *
                </label>
                <textarea
                  v-model="form.message"
                  required
                  rows="4"
                  maxlength="300"
                  placeholder="Write your notification message..."
                  class="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                  :class="errors.message
                    ? 'border-red-400 bg-red-50 dark:bg-red-500/10'
                    : 'border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'"
                  @input="errors.message = ''"
                ></textarea>
                <div class="mt-1 flex justify-between">
                  <p v-if="errors.message" class="text-xs font-bold text-red-500">{{ errors.message }}</p>
                  <p class="ml-auto text-[10px] font-bold text-slate-400">
                    {{ (form.message || '').length }} / 300
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Type
                  </label>
                  <select
                    v-model="form.type"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="system">System</option>
                    <option value="user">User</option>
                    <option value="content">Content</option>
                    <option value="security">Security</option>
                    <option value="promo">Promotion</option>
                  </select>
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Priority
                  </label>
                  <select
                    v-model="form.priority"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Audience
                </label>
                <select
                  v-model="form.audience"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="All users">All users</option>
                  <option value="Admins only">Admins only</option>
                  <option value="Moderators">Moderators</option>
                  <option value="Active users">Active users</option>
                  <option value="New users">New users</option>
                  <option value="Specific user">Specific user</option>
                </select>
              </div>

              <div v-if="form.audience === 'Specific user'">
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Select User
                </label>
                <select
                  v-model="form.specificUserId"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Choose a user...</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">
                    {{ u.name }} — {{ u.email }}
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Link (optional)
                  </label>
                  <input
                    v-model="form.link"
                    type="url"
                    placeholder="https://..."
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Icon
                  </label>
                  <select
                    v-model="form.icon"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="bell">🔔 Bell</option>
                    <option value="star">⭐ Star</option>
                    <option value="check">✅ Check</option>
                    <option value="alert">⚠️ Alert</option>
                    <option value="info">ℹ️ Info</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <input v-model="form.scheduled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-500" />
                  <span class="text-sm font-bold">Schedule for later</span>
                </label>

                <div v-if="form.scheduled" class="mt-3">
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Date & Time
                  </label>
                  <input
                    v-model="form.scheduledAt"
                    type="datetime-local"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div class="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  class="rounded-full px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                  @click="closeCompose"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  class="rounded-full bg-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-700 dark:text-white"
                  :disabled="saving"
                  @click="saveDraft"
                >
                  Save as Draft
                </button>

                <button
                  type="submit"
                  :disabled="saving"
                  class="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:opacity-60"
                >
                  <SendIcon class="h-4 w-4" />
                  {{ saving ? 'Sending…' : (form.scheduled ? 'Schedule' : 'Send Now') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- =========================================================
         DETAILS MODAL
    ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="detailsItem"
          class="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          @click.self="closeDetails"
        >
          <div class="my-6 w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-slate-950 dark:border dark:border-slate-800">
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-xl"
                  :class="typeBg(detailsItem.type)"
                >
                  <component :is="typeIcon(detailsItem.type)" class="h-5 w-5" :class="typeColor(detailsItem.type)" />
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                    {{ detailsItem.type }}
                  </p>
                  <h2 class="text-lg font-black">{{ detailsItem.title }}</h2>
                </div>
              </div>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-white"
                @click="closeDetails"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>

            <div class="space-y-5 p-6">
              <div class="flex flex-wrap gap-2">
                <span class="rounded-full px-2.5 py-1 text-[10px] font-black" :class="priorityClass(detailsItem.priority)">
                  {{ detailsItem.priority }} priority
                </span>
                <span class="rounded-full px-2.5 py-1 text-[10px] font-black" :class="statusClass(detailsItem.status)">
                  {{ detailsItem.status }}
                </span>
                <span class="rounded-full px-2.5 py-1 text-[10px] font-black" :class="typeBg(detailsItem.type)">
                  {{ detailsItem.type }}
                </span>
                <span v-if="detailsItem.pinned" class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">
                  📌 Pinned
                </span>
                <span v-if="!detailsItem.read" class="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700">
                  Unread
                </span>
              </div>

              <div>
                <p class="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Message
                </p>
                <p class="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
                  {{ detailsItem.message }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Audience</p>
                  <p class="mt-0.5 text-sm font-bold dark:text-white">{{ detailsItem.audience }}</p>
                </div>
                <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Created</p>
                  <p class="mt-0.5 text-sm font-bold dark:text-white">{{ relativeTime(detailsItem._createdAt) }}</p>
                </div>
                <div v-if="detailsItem.scheduledAt" class="col-span-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">Scheduled for</p>
                  <p class="mt-0.5 text-sm font-bold dark:text-white">{{ formatDateTime(detailsItem.scheduledAt) }}</p>
                </div>
              </div>

              <div v-if="detailsItem.link">
                <p class="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Link
                </p>
                <a
                  :href="detailsItem.link"
                  target="_blank"
                  class="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
                >
                  {{ detailsItem.link }}
                  <ExternalLinkIcon class="h-3.5 w-3.5" />
                </a>
              </div>

              <div v-if="detailsItem.status === 'sent'" class="grid grid-cols-3 gap-3">
                <div class="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-500/10">
                  <p class="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Delivered</p>
                  <p class="mt-1 text-xl font-black text-emerald-700 dark:text-emerald-300">
                    {{ (detailsItem.stats && detailsItem.stats.delivered) || 0 }}
                  </p>
                </div>
                <div class="rounded-xl bg-blue-50 p-3 text-center dark:bg-blue-500/10">
                  <p class="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">Opened</p>
                  <p class="mt-1 text-xl font-black text-blue-700 dark:text-blue-300">
                    {{ (detailsItem.stats && detailsItem.stats.opened) || 0 }}
                  </p>
                </div>
                <div class="rounded-xl bg-amber-50 p-3 text-center dark:bg-amber-500/10">
                  <p class="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Clicked</p>
                  <p class="mt-1 text-xl font-black text-amber-700 dark:text-amber-300">
                    {{ (detailsItem.stats && detailsItem.stats.clicked) || 0 }}
                  </p>
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
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import AdminHeader from '../admin/AdminHeader.vue'

import {
  SearchIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  DownloadIcon,
  ListIcon,
  LayoutGridIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  CheckCheckIcon,
  AlertCircleIcon,
  InfoIcon,
  XIcon,
  BellIcon,
  BellOffIcon,
  MailIcon,
  PinIcon,
  SendIcon,
  UsersIcon,
  ShieldAlertIcon,
  SparklesIcon,
  FilmIcon,
  ExternalLinkIcon
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

const notifications = ref([])
const users = ref([])

const search = ref('')
const activeStatus = ref('all')
const sortBy = ref('newest')
const viewMode = ref('list')
const filterType = ref('')
const filterPriority = ref('')

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const composeOpen = ref(false)
const editingId = ref(null)
const detailsItem = ref(null)

const statusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Sent', value: 'sent' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Draft', value: 'draft' },
  { label: 'Failed', value: 'failed' }
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
function normaliseNotification(n) {
  if (!n || typeof n !== 'object') return null
  const id = n.id ?? n._id
  if (!id) return null

  return {
    id: String(id),
    title: n.title ?? 'Untitled',
    message: n.message ?? '',
    type: n.type ?? 'system',
    priority: n.priority ?? 'normal',
    audience: n.audience ?? 'All users',
    specificUserId: n.specificUserId ?? '',
    link: n.link ?? '',
    icon: n.icon ?? 'bell',
    scheduled: Boolean(n.scheduled),
    scheduledAt: n.scheduledAt ?? '',
    status: n.status ?? 'draft',
    read: Boolean(n.read),
    pinned: Boolean(n.pinned),
    stats: n.stats ?? { delivered: 0, opened: 0, clicked: 0 },
    _createdAt: n.createdAt
      ? new Date(n.createdAt).getTime()
      : n._createdAt ?? Date.now()
  }
}

/* =====================================================
   FETCH
===================================================== */
async function fetchNotifications() {
  loading.value = true
  loadError.value = null

  try {
    const data = await apiFetch('/admin/notifications')
    const list = data?.data ?? data?.items ?? data ?? []
    notifications.value = Array.isArray(list)
      ? list.map(normaliseNotification).filter(Boolean)
      : []
  } catch (err) {
    loadError.value = err?.message || 'Failed to load notifications.'
  } finally {
    loading.value = false
  }
}

async function fetchUsers() {
  try {
    const data = await apiFetch('/admin/users')
    const list = data?.data ?? data?.items ?? data ?? []
    users.value = Array.isArray(list)
      ? list.map(u => ({
          id: String(u.id ?? u._id),
          name: u.name ?? u.username ?? 'Unnamed',
          email: u.email ?? ''
        }))
      : []
  } catch {
    users.value = []
  }
}

/* =====================================================
   FORM
===================================================== */
const form = reactive({
  title: '',
  message: '',
  type: 'system',
  priority: 'normal',
  audience: 'All users',
  specificUserId: '',
  link: '',
  icon: 'bell',
  scheduled: false,
  scheduledAt: ''
})

const errors = reactive({ title: '', message: '' })

function resetForm() {
  Object.assign(form, {
    title: '',
    message: '',
    type: 'system',
    priority: 'normal',
    audience: 'All users',
    specificUserId: '',
    link: '',
    icon: 'bell',
    scheduled: false,
    scheduledAt: ''
  })
  errors.title = ''
  errors.message = ''
}

function openCompose(n = null) {
  if (n) {
    editingId.value = n.id
    Object.assign(form, {
      title: n.title || '',
      message: n.message || '',
      type: n.type || 'system',
      priority: n.priority || 'normal',
      audience: n.audience || 'All users',
      specificUserId: n.specificUserId || '',
      link: n.link || '',
      icon: n.icon || 'bell',
      scheduled: Boolean(n.scheduled),
      scheduledAt: n.scheduledAt || ''
    })
  } else {
    editingId.value = null
    resetForm()
  }
  composeOpen.value = true
}

function closeCompose() {
  composeOpen.value = false
  editingId.value = null
  resetForm()
}

function validate() {
  errors.title = ''
  errors.message = ''

  if (!form.title.trim()) errors.title = 'Title is required.'
  if (!form.message.trim()) errors.message = 'Message is required.'

  return !errors.title && !errors.message
}

function buildPayload(status) {
  return {
    title: form.title.trim(),
    message: form.message.trim(),
    type: form.type,
    priority: form.priority,
    audience: form.audience,
    specificUserId: form.specificUserId,
    link: form.link,
    icon: form.icon,
    scheduled: Boolean(form.scheduled),
    scheduledAt: form.scheduled ? form.scheduledAt : '',
    status,
    read: false
  }
}

async function saveCompose() {
  if (!validate()) {
    toast('Please fix the highlighted fields.', 'error')
    return
  }

  saving.value = true
  const status = form.scheduled ? 'scheduled' : 'sent'

  try {
    if (editingId.value) {
      const data = await apiFetch(`/admin/notifications/${editingId.value}`, {
        method: 'PUT',
        body: JSON.stringify(buildPayload(status))
      })
      const updated = normaliseNotification(data?.data ?? data)
      const idx = notifications.value.findIndex(n => n.id === editingId.value)
      if (idx !== -1) notifications.value[idx] = updated ?? { ...notifications.value[idx], ...buildPayload(status) }
      toast('Notification updated', 'success')
    } else {
      const data = await apiFetch('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(buildPayload(status))
      })
      const created = normaliseNotification(data?.data ?? data) ?? {
        id: String(Date.now()),
        ...buildPayload(status),
        pinned: false,
        stats: { delivered: 0, opened: 0, clicked: 0 },
        _createdAt: Date.now()
      }
      notifications.value.unshift(created)
      toast(form.scheduled ? 'Notification scheduled' : 'Notification sent', 'success')
    }
    closeCompose()
  } catch (err) {
    toast(err?.message || 'Failed to save notification.', 'error')
  } finally {
    saving.value = false
  }
}

async function saveDraft() {
  if (!validate()) {
    toast('Please fix the highlighted fields.', 'error')
    return
  }

  saving.value = true
  try {
    if (editingId.value) {
      await apiFetch(`/admin/notifications/${editingId.value}`, {
        method: 'PUT',
        body: JSON.stringify(buildPayload('draft'))
      })
      toast('Draft updated', 'info')
    } else {
      const data = await apiFetch('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(buildPayload('draft'))
      })
      const created = normaliseNotification(data?.data ?? data) ?? {
        id: String(Date.now()),
        ...buildPayload('draft'),
        pinned: false,
        stats: { delivered: 0, opened: 0, clicked: 0 },
        _createdAt: Date.now()
      }
      notifications.value.unshift(created)
      toast('Draft saved', 'info')
    }
    closeCompose()
  } catch (err) {
    toast(err?.message || 'Failed to save draft.', 'error')
  } finally {
    saving.value = false
  }
}

/* =====================================================
   DETAILS
===================================================== */
function openDetails(n) {
  detailsItem.value = n
  if (!n.read) {
    updateNotificationApi(n.id, { read: true })
    n.read = true
  }
}

function closeDetails() {
  detailsItem.value = null
}

function editFromDetails() {
  const n = detailsItem.value
  closeDetails()
  if (n) openCompose(n)
}

/* =====================================================
   HELPERS
===================================================== */
function typeIcon(type) {
  return {
    system: BellIcon,
    user: UsersIcon,
    content: FilmIcon,
    security: ShieldAlertIcon,
    promo: SparklesIcon
  }[type] || BellIcon
}

function typeBg(type) {
  return {
    system: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    user: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    content: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    security: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    promo: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
  }[type] || 'bg-slate-100 text-slate-700'
}

function typeColor(type) {
  return {
    system: 'text-blue-600',
    user: 'text-emerald-600',
    content: 'text-purple-600',
    security: 'text-rose-600',
    promo: 'text-amber-600'
  }[type] || 'text-slate-600'
}

function priorityClass(priority) {
  return {
    high: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    normal: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    low: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white'
  }[priority] || 'bg-slate-100 text-slate-700'
}

function priorityIcon(priority) {
  return {
    high: AlertCircleIcon,
    normal: InfoIcon,
    low: BellIcon
  }[priority] || BellIcon
}

function statusClass(status) {
  return {
    sent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white',
    failed: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
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

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

/* =====================================================
   FILTERS
===================================================== */
const hasActiveFilters = computed(() =>
  Boolean(search.value || filterType.value || filterPriority.value || activeStatus.value !== 'all')
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = notifications.value.filter(n => {
    let matchStatus = true
    if (activeStatus.value === 'unread') matchStatus = !n.read
    else if (activeStatus.value !== 'all') matchStatus = n.status === activeStatus.value

    const matchType = !filterType.value || n.type === filterType.value
    const matchPriority = !filterPriority.value || n.priority === filterPriority.value
    const matchSearch =
      !q ||
      (n.title || '').toLowerCase().includes(q) ||
      (n.message || '').toLowerCase().includes(q) ||
      (n.audience || '').toLowerCase().includes(q)

    return matchStatus && matchType && matchPriority && matchSearch
  })

  const sorter = (a, b) => {
    switch (sortBy.value) {
      case 'oldest': return (a._createdAt || 0) - (b._createdAt || 0)
      case 'priority': {
        const rank = { high: 3, normal: 2, low: 1 }
        return (rank[b.priority] || 0) - (rank[a.priority] || 0)
      }
      case 'title': return (a.title || '').localeCompare(b.title || '')
      case 'newest':
      default: return (b._createdAt || 0) - (a._createdAt || 0)
    }
  }

  const pinned = list.filter(n => n.pinned)
  const rest = list.filter(n => !n.pinned)
  pinned.sort(sorter)
  rest.sort(sorter)
  return [...pinned, ...rest]
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const paginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([search, activeStatus, sortBy, filterType, filterPriority, pageSize], () => {
  currentPage.value = 1
})

watch(filtered, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})

const allSelected = computed(() =>
  paginated.value.length > 0 && paginated.value.every(n => selectedIds.value.includes(n.id))
)

function toggleSelectAll(e) {
  if (e.target.checked) {
    const ids = paginated.value.map(n => n.id)
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...ids]))
  } else {
    const ids = new Set(paginated.value.map(n => n.id))
    selectedIds.value = selectedIds.value.filter(id => !ids.has(id))
  }
}

function clearFilters() {
  search.value = ''
  activeStatus.value = 'all'
  filterType.value = ''
  filterPriority.value = ''
  currentPage.value = 1
}

/* =====================================================
   COUNTS
===================================================== */
const counts = computed(() => {
  const all = notifications.value
  const total = all.length
  const unread = all.filter(n => !n.read).length
  const read = total - unread
  return {
    total,
    unread,
    sent: all.filter(n => n.status === 'sent').length,
    scheduled: all.filter(n => n.status === 'scheduled').length,
    failed: all.filter(n => n.status === 'failed').length,
    readRate: total ? Math.round((read / total) * 100) : 0
  }
})

function countByStatus(status) {
  if (status === 'all') return notifications.value.length
  if (status === 'unread') return notifications.value.filter(n => !n.read).length
  return notifications.value.filter(n => n.status === status).length
}

/* =====================================================
   API MUTATIONS
===================================================== */
async function updateNotificationApi(id, patch) {
  try {
    await apiFetch(`/admin/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch)
    })
  } catch (err) {
    // Silently fail for read-toggle; toast for user-visible actions
    console.warn('updateNotification failed', err)
  }
}

async function togglePin(n) {
  const next = !n.pinned
  n.pinned = next
  await updateNotificationApi(n.id, { pinned: next })
  toast(next ? 'Pinned' : 'Unpinned', 'info')
}

async function toggleRead(n) {
  const next = !n.read
  n.read = next
  await updateNotificationApi(n.id, { read: next })
  toast(next ? 'Marked as read' : 'Marked as unread', 'info')
}

async function confirmDelete(n) {
  if (!window.confirm(`Delete notification "${n.title}"?`)) return
  try {
    await apiFetch(`/admin/notifications/${n.id}`, { method: 'DELETE' })
    notifications.value = notifications.value.filter(x => x.id !== n.id)
    toast('Notification deleted', 'success')
  } catch (err) {
    toast(err?.message || 'Failed to delete.', 'error')
  }
}

/* =====================================================
   BULK
===================================================== */
async function bulkMarkRead() {
  const ids = [...selectedIds.value]
  try {
    await apiFetch('/admin/notifications/bulk/read', {
      method: 'PUT',
      body: JSON.stringify({ ids, read: true })
    })
    notifications.value.forEach(n => { if (ids.includes(n.id)) n.read = true })
    toast(`${ids.length} marked read`, 'success')
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk update failed.', 'error')
  }
}

async function bulkMarkUnread() {
  const ids = [...selectedIds.value]
  try {
    await apiFetch('/admin/notifications/bulk/read', {
      method: 'PUT',
      body: JSON.stringify({ ids, read: false })
    })
    notifications.value.forEach(n => { if (ids.includes(n.id)) n.read = false })
    toast(`${ids.length} marked unread`, 'info')
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk update failed.', 'error')
  }
}

async function bulkDelete() {
  const ids = [...selectedIds.value]
  if (!window.confirm(`Delete ${ids.length} notification(s)?`)) return
  try {
    await apiFetch('/admin/notifications/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    })
    notifications.value = notifications.value.filter(n => !ids.includes(n.id))
    toast(`Deleted ${ids.length} notification(s)`, 'success')
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk delete failed.', 'error')
  }
}

/* =====================================================
   EXPORT
===================================================== */
function exportNotifications() {
  const data = JSON.stringify(notifications.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `notifications-export-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast('Exported notifications', 'success')
}

/* =====================================================
   KEYBOARD SHORTCUTS
===================================================== */
function handleKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault()
    if (!composeOpen.value && !detailsItem.value) openCompose()
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
    e.preventDefault()
    exportNotifications()
  }
  if (e.key === 'Escape') {
    if (detailsItem.value) closeDetails()
    else if (composeOpen.value) closeCompose()
  }
}

/* =====================================================
   LIFECYCLE
===================================================== */
onMounted(async () => {
  window.addEventListener('keydown', handleKey)
  await Promise.all([fetchNotifications(), fetchUsers()])
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>