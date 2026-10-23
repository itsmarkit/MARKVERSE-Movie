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
              User
              <span class="text-blue-600">Management</span>
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-slate-500 dark:text-white/70 sm:text-base">
              View, filter, and manage all registered accounts.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900 dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
              title="Export JSON (Ctrl+E)"
              @click="exportUsers"
            >
              <DownloadIcon class="h-4 w-4" />
              Export
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
              title="Add user"
              @click="openCreate"
            >
              <UserPlusIcon class="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>

        <!-- =========================
             LOADING
        ========================== -->
        <div
          v-if="loading"
          class="mb-6 flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
        >
          <div class="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
          <p class="text-sm font-bold text-slate-500 dark:text-white/70">
            Loading users…
          </p>
        </div>

        <!-- =========================
             ERROR
        ========================== -->
        <div
          v-else-if="loadError"
          class="mb-6 flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
        >
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">
            ⚠️
          </div>
          <h2 class="text-2xl font-black">Failed to load users</h2>
          <p class="mt-2 max-w-md text-sm text-slate-500 dark:text-white/70">
            {{ loadError }}
          </p>
          <button
            type="button"
            class="mt-5 rounded-full bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
            @click="fetchUsers"
          >
            Try again
          </button>
        </div>

        <template v-else>
          <!-- =========================
               STATS
          ========================== -->
          <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div
              v-for="s in statusCounts"
              :key="s.label"
              class="rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800"
            >
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                {{ s.label }}
              </p>
              <p class="mt-1 text-2xl font-black" :class="s.color">{{ s.value }}</p>
            </div>
          </div>

          <!-- =========================
               FILTERS ROW 1
          ========================== -->
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tab in tabs"
                :key="tab.value"
                type="button"
                class="rounded-full px-4 py-2.5 text-sm font-bold transition"
                :class="
                  activeStatus === tab.value
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-black dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-900'
                "
                @click="activeStatus = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="ml-auto flex items-center gap-2">
              <select
                v-model="sortBy"
                class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A–Z</option>
                <option value="downloads">Most downloads</option>
                <option value="active">Recently active</option>
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

          <!-- =========================
               FILTERS ROW 2
          ========================== -->
          <div class="mb-6 flex flex-wrap items-center gap-3">
            <div class="relative w-full sm:w-72">
              <input
                v-model="search"
                type="search"
                placeholder="Search name, email, or ID..."
                class="w-full rounded-xl bg-white px-4 py-2.5 pr-10 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-blue-500/20 dark:bg-black dark:border dark:border-slate-800 dark:text-white"
              />
              <SearchIcon class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <select
              v-model="filterRole"
              class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
            >
              <option value="">All roles</option>
              <option>User</option>
              <option>Moderator</option>
              <option>Admin</option>
            </select>

            <select
              v-model="filterHas2FA"
              class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
            >
              <option value="">2FA: any</option>
              <option value="yes">2FA enabled</option>
              <option value="no">2FA disabled</option>
            </select>

            <select
              v-model="filterUploadPermission"
              class="rounded-xl bg-white px-3 py-2.5 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
            >
              <option value="">Upload: any</option>
              <option value="granted">Upload allowed</option>
              <option value="denied">Upload blocked</option>
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
               BULK ACTIONS BAR
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
                class="rounded-full bg-green-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-green-600"
                @click="bulkStatus('Active')"
              >
                <CheckCircleIcon class="mr-1 inline h-3.5 w-3.5" />
                Activate
              </button>
              <button
                type="button"
                class="rounded-full bg-red-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-red-600"
                @click="bulkStatus('Banned')"
              >
                <BanIcon class="mr-1 inline h-3.5 w-3.5" />
                Ban
              </button>
              <button
                type="button"
                class="rounded-full bg-purple-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-purple-600"
                @click="bulkRole('Moderator')"
              >
                <ShieldIcon class="mr-1 inline h-3.5 w-3.5" />
                Make Moderator
              </button>
              <button
                type="button"
                class="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-700"
                @click="bulkUploadPermission(true)"
              >
                <UploadCloudIcon class="mr-1 inline h-3.5 w-3.5" />
                Allow Upload
              </button>
              <button
                type="button"
                class="rounded-full bg-slate-700 px-3 py-1.5 text-xs font-black text-white transition hover:bg-slate-800"
                @click="bulkUploadPermission(false)"
              >
                <BanIcon class="mr-1 inline h-3.5 w-3.5" />
                Block Upload
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
               LIST VIEW (RESPONSIVE)
          ========================== -->
          <div v-if="filtered.length && viewMode === 'list'">

            <!-- ===== Mobile: card list ===== -->
            <div class="space-y-3 md:hidden">
              <article
                v-for="user in paginated"
                :key="user.id"
                class="relative rounded-2xl bg-white p-4 shadow-sm dark:bg-black dark:border dark:border-slate-800"
                :class="user.featured ? 'ring-2 ring-amber-400' : ''"
              >
                <div class="flex items-start gap-3">
                  <input
                    v-model="selectedIds"
                    type="checkbox"
                    :value="user.id"
                    class="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-500"
                  />

                  <div
                    class="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-black text-white"
                  >
                    <img
                      v-if="user.avatar && !avatarErrors[user.id]"
                      :src="user.avatar"
                      :alt="user.name"
                      class="h-full w-full object-cover"
                      @error="onAvatarError(user.id)"
                    />
                    <span v-else>{{ initials(user.name) }}</span>

                    <span
                      v-if="user.has2FA"
                      class="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-black"
                      title="2FA enabled"
                    >
                      ✓
                    </span>
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="flex items-center gap-1.5 truncate font-black">
                      <StarIcon v-if="user.featured" class="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />
                      {{ user.name }}
                    </p>
                    <p class="truncate text-xs text-slate-500 dark:text-white/60">
                      {{ user.email }}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-amber-400 hover:text-white dark:bg-slate-800 dark:text-white"
                    :title="user.featured ? 'Unstar' : 'Star'"
                    @click="toggleFeatured(user)"
                  >
                    <StarIcon class="h-4 w-4" :class="user.featured ? 'fill-amber-500 text-amber-500' : ''" />
                  </button>
                </div>

                <div class="mt-3 flex flex-wrap items-center gap-1.5">
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-black" :class="roleClass(user.role)">
                    {{ user.role }}
                  </span>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-black" :class="statusClass(user.status)">
                    {{ user.status }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                    :class="user.canUpload
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-white/80'"
                  >
                    <component :is="user.canUpload ? UploadCloudIcon : BanIcon" class="h-3 w-3" />
                    {{ user.canUpload ? 'Can Upload' : 'No Upload' }}
                  </span>
                </div>

                <div class="mt-3 grid grid-cols-3 gap-1 text-center text-[10px] font-bold text-slate-500 dark:text-white/60">
                  <div>
                    <p class="uppercase">Joined</p>
                    <p class="truncate dark:text-white">{{ user.joined }}</p>
                  </div>
                  <div>
                    <p class="uppercase">Active</p>
                    <p class="truncate dark:text-white">{{ relativeTime(user.lastActive) }}</p>
                  </div>
                  <div>
                    <p class="uppercase">DLs</p>
                    <p class="dark:text-white">{{ user.downloads }}</p>
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition"
                    :class="user.canUpload
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-white'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'"
                    @click="toggleUploadPermission(user)"
                  >
                    <component :is="user.canUpload ? BanIcon : UploadCloudIcon" class="h-3.5 w-3.5" />
                    {{ user.canUpload ? 'Revoke Upload' : 'Allow Upload' }}
                  </button>

                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:text-white"
                    title="View details"
                    @click="openDetails(user)"
                  >
                    <EyeIcon class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:text-white"
                    title="Edit user"
                    @click="openEdit(user)"
                  >
                    <PencilIcon class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-indigo-500 hover:text-white dark:bg-slate-800 dark:text-white"
                    title="Send email"
                    @click="sendEmail(user)"
                  >
                    <MailIcon class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                    title="Delete user"
                    @click="confirmDelete(user)"
                  >
                    <TrashIcon class="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            </div>

            <!-- ===== Desktop: table ===== -->
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
                    <th class="px-4 py-3 font-black">User</th>
                    <th class="px-4 py-3 font-black">Role</th>
                    <th class="px-4 py-3 font-black">Status</th>
                    <th class="px-4 py-3 font-black">Upload</th>
                    <th class="px-4 py-3 font-black">Joined</th>
                    <th class="px-4 py-3 font-black">Last Active</th>
                    <th class="px-4 py-3 font-black">Downloads</th>
                    <th class="px-4 py-3 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr
                    v-for="user in paginated"
                    :key="user.id"
                    class="transition hover:bg-slate-50 dark:hover:bg-slate-900"
                    :class="user.featured ? 'bg-amber-50/40 dark:bg-amber-500/5' : ''"
                  >
                    <td class="px-4 py-3">
                      <input
                        v-model="selectedIds"
                        type="checkbox"
                        :value="user.id"
                        class="h-4 w-4 rounded border-slate-300 text-blue-500"
                      />
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div
                          class="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-black text-white"
                        >
                          <img
                            v-if="user.avatar && !avatarErrors[user.id]"
                            :src="user.avatar"
                            :alt="user.name"
                            class="h-full w-full object-cover"
                            @error="onAvatarError(user.id)"
                          />
                          <span v-else>{{ initials(user.name) }}</span>

                          <span
                            v-if="user.has2FA"
                            class="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-white ring-2 ring-white dark:ring-black"
                            title="2FA enabled"
                          >
                            ✓
                          </span>
                        </div>
                        <div class="min-w-0">
                          <p class="flex items-center gap-1.5 truncate font-black">
                            <StarIcon v-if="user.featured" class="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />
                            {{ user.name }}
                          </p>
                          <p class="truncate text-xs text-slate-500 dark:text-white/60">
                            {{ user.email }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="rounded-full px-2.5 py-1 text-xs font-black"
                        :class="roleClass(user.role)"
                      >
                        {{ user.role }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="rounded-full px-2.5 py-1 text-xs font-black"
                        :class="statusClass(user.status)"
                      >
                        {{ user.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black transition"
                        :class="user.canUpload
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-white/80 dark:hover:bg-slate-600'"
                        @click="toggleUploadPermission(user)"
                      >
                        <component :is="user.canUpload ? UploadCloudIcon : BanIcon" class="h-3.5 w-3.5" />
                        {{ user.canUpload ? 'Allowed' : 'Blocked' }}
                      </button>
                    </td>
                    <td class="px-4 py-3 font-semibold dark:text-white/80">{{ user.joined }}</td>
                    <td class="px-4 py-3 font-semibold dark:text-white/80">
                      {{ relativeTime(user.lastActive) }}
                    </td>
                    <td class="px-4 py-3 font-semibold dark:text-white/80">
                      {{ user.downloads }}
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-amber-400 hover:text-white dark:bg-slate-800 dark:text-white"
                          :title="user.featured ? 'Unstar' : 'Star'"
                          @click="toggleFeatured(user)"
                        >
                          <StarIcon class="h-4 w-4" :class="user.featured ? 'fill-amber-500 text-amber-500' : ''" />
                        </button>

                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:text-white"
                          title="View details"
                          @click="openDetails(user)"
                        >
                          <EyeIcon class="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:text-white"
                          title="Edit user"
                          @click="openEdit(user)"
                        >
                          <PencilIcon class="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-indigo-500 hover:text-white dark:bg-slate-800 dark:text-white"
                          title="Send email"
                          @click="sendEmail(user)"
                        >
                          <MailIcon class="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Delete user"
                          @click="confirmDelete(user)"
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
              v-for="user in paginated"
              :key="user.id"
              class="group relative rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-lg dark:bg-black dark:border dark:border-slate-800"
              :class="user.featured ? 'ring-2 ring-amber-400' : ''"
            >
              <div class="absolute left-3 top-3">
                <input
                  v-model="selectedIds"
                  type="checkbox"
                  :value="user.id"
                  class="h-4 w-4 rounded border-slate-300 text-blue-500"
                />
              </div>
              <div v-if="user.featured" class="absolute right-3 top-3 rounded-full bg-amber-400 p-1.5 text-white shadow">
                <StarIcon class="h-3.5 w-3.5 fill-current" />
              </div>

              <div class="mt-2 flex flex-col items-center text-center">
                <div
                  class="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-black text-white"
                >
                  <img
                    v-if="user.avatar && !avatarErrors[user.id]"
                    :src="user.avatar"
                    :alt="user.name"
                    class="h-full w-full object-cover"
                    @error="onAvatarError(user.id)"
                  />
                  <span v-else>{{ initials(user.name) }}</span>

                  <span
                    v-if="user.has2FA"
                    class="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-black"
                    title="2FA enabled"
                  >
                    ✓
                  </span>
                </div>

                <p class="mt-3 truncate font-black">{{ user.name }}</p>
                <p class="truncate text-xs text-slate-500 dark:text-white/60">{{ user.email }}</p>

                <div class="mt-2 flex flex-wrap justify-center gap-1.5">
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-black" :class="roleClass(user.role)">
                    {{ user.role }}
                  </span>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-black" :class="statusClass(user.status)">
                    {{ user.status }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                    :class="user.canUpload
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-white/80'"
                  >
                    <component :is="user.canUpload ? UploadCloudIcon : BanIcon" class="h-3 w-3" />
                    {{ user.canUpload ? 'Upload' : 'No Upload' }}
                  </span>
                </div>

                <div class="mt-3 grid w-full grid-cols-3 gap-1 text-center text-[10px] font-bold text-slate-500 dark:text-white/60">
                  <div>
                    <p class="text-[10px] uppercase">Joined</p>
                    <p class="truncate dark:text-white">{{ user.joined }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] uppercase">Active</p>
                    <p class="truncate dark:text-white">{{ relativeTime(user.lastActive) }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] uppercase">DLs</p>
                    <p class="dark:text-white">{{ user.downloads }}</p>
                  </div>
                </div>
              </div>

              <div class="mt-4 flex gap-1.5">
                <button
                  type="button"
                  class="flex-1 rounded-full bg-emerald-500 py-2 text-xs font-black text-white transition hover:bg-emerald-600"
                  @click="openDetails(user)"
                >
                  View
                </button>
                <button
                  type="button"
                  class="rounded-full px-3 py-2 text-xs font-black text-white transition"
                  :class="user.canUpload ? 'bg-slate-600 hover:bg-slate-700' : 'bg-blue-500 hover:bg-blue-600'"
                  @click="toggleUploadPermission(user)"
                >
                  <component :is="user.canUpload ? BanIcon : UploadCloudIcon" class="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  class="rounded-full bg-blue-500 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-600"
                  @click="openEdit(user)"
                >
                  <PencilIcon class="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  class="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-100"
                  @click="confirmDelete(user)"
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
              Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filtered.length) }}
              of {{ filtered.length }}
            </p>

            <div class="flex items-center gap-2">
              <select
                v-model.number="pageSize"
                class="rounded-xl bg-white px-3 py-2 text-xs font-bold outline-none shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:text-white"
                @change="currentPage = 1"
              >
                <option :value="5">5 / page</option>
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
            <UsersIcon class="mb-3 h-12 w-12 text-slate-300" />
            <h2 class="text-xl font-black">No users found</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-white/70">
              Try a different filter or search term.
            </p>
          </div>
        </template>

      </section>
    </main>

    <!-- =========================================================
         EDIT / CREATE MODAL
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
          class="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          @click.self="closeEdit"
        >
          <div class="my-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h3 class="text-xl font-black">
                  {{ editing.isNew ? 'Add User' : 'Edit User' }}
                </h3>
                <p class="mt-1 text-xs text-slate-500 dark:text-white/70">
                  {{ editing.isNew ? 'Create a new account.' : 'Update user details.' }}
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

            <div class="flex flex-col gap-4">
              <!-- Avatar preview + picker -->
              <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p class="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Profile Picture
                </p>

                <div class="flex items-center gap-4">
                  <div
                    class="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-black text-white ring-2 ring-white dark:ring-slate-900"
                  >
                    <img
                      v-if="editing.avatar && !editingAvatarError"
                      :src="editing.avatar"
                      :alt="editing.name || 'Avatar'"
                      class="h-full w-full object-cover"
                      @error="editingAvatarError = true"
                      @load="editingAvatarError = false"
                    />
                    <span v-else>{{ initials(editing.name || '?') }}</span>
                  </div>

                  <div class="min-w-0 flex-1">
                    <input
                      v-model="editing.avatar"
                      placeholder="https://... or click Choose File"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      @input="editingAvatarError = false"
                    />

                    <div class="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-blue-600"
                        @click="openAvatarPicker"
                      >
                        <ImageIcon class="h-3.5 w-3.5" />
                        Choose File
                      </button>

                      <button
                        v-if="editing.avatar"
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-black text-red-600 transition hover:bg-red-100"
                        @click="editing.avatar = ''; editingAvatarError = false"
                      >
                        <TrashIcon class="h-3.5 w-3.5" />
                        Remove
                      </button>

                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-white"
                        @click="useRandomAvatar"
                      >
                        <SparklesIcon class="h-3.5 w-3.5" />
                        Random
                      </button>
                    </div>

                    <p v-if="editingAvatarError" class="mt-1 text-[10px] font-bold text-red-500">
                      Couldn't load that image.
                    </p>
                  </div>
                </div>

                <div class="mt-3">
                  <p class="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Quick presets
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="(url, i) in presetAvatars"
                      :key="i"
                      type="button"
                      class="h-9 w-9 overflow-hidden rounded-full ring-2 ring-transparent transition hover:ring-blue-500"
                      :class="{ 'ring-blue-500': editing.avatar === url }"
                      @click="editing.avatar = url; editingAvatarError = false"
                    >
                      <img :src="url" class="h-full w-full object-cover" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Name -->
              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Name
                </label>
                <input
                  v-model="editing.name"
                  class="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  :class="errors.name
                    ? 'border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-500/10'
                    : 'border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white'"
                  @input="errors.name = ''"
                />
                <p v-if="errors.name" class="mt-1 text-xs font-bold text-red-500">{{ errors.name }}</p>
              </div>

              <!-- Email -->
              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Email
                </label>
                <input
                  v-model="editing.email"
                  class="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  :class="errors.email
                    ? 'border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-500/10'
                    : 'border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white'"
                  @input="errors.email = ''"
                />
                <p v-if="errors.email" class="mt-1 text-xs font-bold text-red-500">{{ errors.email }}</p>
              </div>

              <!-- Role + Status -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Role
                  </label>
                  <select
                    v-model="editing.role"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option>User</option>
                    <option>Moderator</option>
                    <option>Admin</option>
                  </select>
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Status
                  </label>
                  <select
                    v-model="editing.status"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Banned</option>
                  </select>
                </div>
              </div>

              <!-- Upload permission -->
              <div class="rounded-xl border-2 p-3 transition"
                   :class="editing.canUpload
                     ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                     : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'">
                <label class="flex items-start gap-3 cursor-pointer">
                  <input
                    v-model="editing.canUpload"
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-500"
                  />
                  <div class="min-w-0">
                    <p class="text-sm font-black">
                      Allow video uploads
                    </p>
                    <p class="mt-0.5 text-[11px] text-slate-500 dark:text-white/70">
                      When enabled, this user can upload movies/series.
                    </p>
                  </div>
                </label>
              </div>

              <!-- Notes -->
              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Admin Notes
                </label>
                <textarea
                  v-model="editing.notes"
                  rows="3"
                  placeholder="Internal notes about this user..."
                  class="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                ></textarea>
              </div>

              <label class="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <input v-model="editing.has2FA" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-500" />
                <span class="text-sm font-bold">2FA enabled</span>
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
                class="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-50"
                :disabled="saving"
                @click="saveEdit"
              >
                {{ saving ? 'Saving…' : (editing.isNew ? 'Create User' : 'Save') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- =========================================================
         AVATAR PICKER
    ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="avatarPickerOpen"
          class="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          @click.self="avatarPickerOpen = false"
        >
          <div class="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-950 dark:border dark:border-slate-800">
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div>
                <h3 class="text-lg font-black">Choose Profile Picture</h3>
                <p class="text-xs text-slate-500 dark:text-white/60">
                  Pick from library or upload a new file.
                </p>
              </div>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-white"
                @click="avatarPickerOpen = false"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>

            <div class="px-6 pt-4">
              <div
                class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition"
                :class="avatarDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                  : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'"
                @dragover.prevent="avatarDragging = true"
                @dragleave.prevent="avatarDragging = false"
                @drop.prevent="onAvatarDrop"
              >
                <UploadCloudIcon class="mb-2 h-8 w-8 text-slate-400" />
                <p class="text-sm font-black">Drag & drop an image here</p>
                <p class="text-xs text-slate-400">Or browse your computer</p>
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onAvatarFile"
                />
                <button
                  type="button"
                  class="mt-3 rounded-full bg-blue-500 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-600"
                  @click="$refs.avatarInput.click()"
                >
                  Browse files
                </button>
              </div>
            </div>

            <div class="max-h-[50vh] overflow-y-auto p-6">
              <p class="mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                Library
              </p>
              <div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
                <button
                  v-for="url in avatarLibrary"
                  :key="url"
                  type="button"
                  class="group relative aspect-square overflow-hidden rounded-xl border-2 border-slate-200 transition hover:border-blue-500 dark:border-slate-700"
                  @click="pickAvatar(url)"
                >
                  <img :src="url" class="h-full w-full object-cover" />
                  <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <CheckIcon class="h-6 w-6 text-white" />
                  </div>
                </button>
              </div>
            </div>

            <div class="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                class="rounded-full px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                @click="avatarPickerOpen = false"
              >
                Cancel
              </button>
            </div>
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
          v-if="detailsUser"
          class="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          @click.self="closeDetails"
        >
          <div class="my-6 w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-950 dark:border dark:border-slate-800">
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">User Profile</p>
                <h2 class="mt-0.5 text-xl font-black">{{ detailsUser.name }}</h2>
                <p class="text-xs text-slate-500 dark:text-white/60">{{ detailsUser.email }}</p>
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
              <div class="flex items-center gap-4">
                <div
                  class="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-black text-white"
                >
                  <img
                    v-if="detailsUser.avatar && !avatarErrors[detailsUser.id]"
                    :src="detailsUser.avatar"
                    :alt="detailsUser.name"
                    class="h-full w-full object-cover"
                    @error="onAvatarError(detailsUser.id)"
                  />
                  <span v-else>{{ initials(detailsUser.name) }}</span>
                </div>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full px-2.5 py-1 text-xs font-black" :class="roleClass(detailsUser.role)">
                      {{ detailsUser.role }}
                    </span>
                    <span class="rounded-full px-2.5 py-1 text-xs font-black" :class="statusClass(detailsUser.status)">
                      {{ detailsUser.status }}
                    </span>
                    <span v-if="detailsUser.has2FA" class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                      2FA
                    </span>
                    <span v-if="detailsUser.featured" class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700">
                      ★ Starred
                    </span>
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black"
                      :class="detailsUser.canUpload
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'"
                    >
                      <component :is="detailsUser.canUpload ? UploadCloudIcon : BanIcon" class="h-3 w-3" />
                      {{ detailsUser.canUpload ? 'Upload Allowed' : 'Upload Blocked' }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-slate-500 dark:text-white/60">
                    ID: {{ detailsUser.id }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <DetailField label="Joined" :value="detailsUser.joined" />
                <DetailField label="Last Active" :value="relativeTime(detailsUser.lastActive)" />
                <DetailField label="Downloads" :value="detailsUser.downloads" />
                <DetailField label="Uploads" :value="detailsUser.uploads || 0" />
                <DetailField label="Storage Used" :value="detailsUser.storage || '—'" />
                <DetailField label="Country" :value="detailsUser.country || '—'" />
              </div>

              <div class="rounded-xl border-2 p-3"
                   :class="detailsUser.canUpload
                     ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                     : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm font-black">Upload Permission</p>
                    <p class="mt-0.5 text-[11px] text-slate-500 dark:text-white/70">
                      {{ detailsUser.canUpload
                        ? 'This user can upload videos.'
                        : 'This user cannot upload videos until granted.' }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 rounded-full px-4 py-2 text-xs font-black text-white transition"
                    :class="detailsUser.canUpload
                      ? 'bg-slate-700 hover:bg-slate-800'
                      : 'bg-emerald-500 hover:bg-emerald-600'"
                    @click="toggleUploadPermission(detailsUser)"
                  >
                    {{ detailsUser.canUpload ? 'Revoke' : 'Grant' }}
                  </button>
                </div>
              </div>

              <div v-if="detailsUser.notes">
                <p class="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Admin Notes
                </p>
                <p class="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
                  {{ detailsUser.notes }}
                </p>
              </div>

              <div>
                <p class="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Activity (last 12 weeks)
                </p>
                <div class="flex h-16 items-end gap-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div
                    v-for="(h, i) in sparkline"
                    :key="i"
                    class="flex-1 rounded-t bg-blue-500/60"
                    :style="{ height: `${h}%` }"
                  ></div>
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
                class="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-indigo-600"
                @click="sendEmail(detailsUser)"
              >
                <MailIcon class="h-4 w-4" />
                Send Email
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
         EMAIL MODAL
    ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="emailTarget"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          @click.self="closeEmail"
        >
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <h3 class="text-xl font-black">Send Email</h3>
            <p class="mt-1 text-xs text-slate-500 dark:text-white/70">
              To: {{ emailTarget.email }}
            </p>

            <div class="mt-4 space-y-3">
              <input
                v-model="emailSubject"
                placeholder="Subject"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <textarea
                v-model="emailBody"
                rows="5"
                placeholder="Write your message..."
                class="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              ></textarea>
            </div>

            <div class="mt-5 flex justify-end gap-3">
              <button
                class="rounded-full px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                @click="closeEmail"
              >
                Cancel
              </button>
              <button
                class="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
                @click="submitEmail"
              >
                Send
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
  SearchIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  EyeIcon,
  MailIcon,
  StarIcon,
  XIcon,
  DownloadIcon,
  UserPlusIcon,
  ListIcon,
  LayoutGridIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  BanIcon,
  ShieldIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  InfoIcon,
  ImageIcon,
  UploadCloudIcon,
  SparklesIcon,
  CheckIcon
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
   INLINE COMPONENT — DetailField
===================================================== */
const DetailField = (props) => h('div', { class: 'min-w-0' }, [
  h('p', { class: 'text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70' }, props.label),
  h('p', { class: 'mt-0.5 truncate text-sm font-bold dark:text-white' }, props.value ?? '—')
])
DetailField.props = ['label', 'value']

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
   STATE
===================================================== */
const users = ref([])

const loading = ref(true)
const loadError = ref(null)
const saving = ref(false)

const search = ref('')
const activeStatus = ref('all')
const sortBy = ref('newest')
const viewMode = ref('list')
const filterRole = ref('')
const filterHas2FA = ref('')
const filterUploadPermission = ref('')

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const editing = ref(null)
const detailsUser = ref(null)
const emailTarget = ref(null)
const emailSubject = ref('')
const emailBody = ref('')

const errors = reactive({ name: '', email: '' })

/* Track broken avatar URLs so we fall back to initials */
const avatarErrors = reactive({})

/* Edit-modal avatar state */
const editingAvatarError = ref(false)

/* Avatar picker modal */
const avatarPickerOpen = ref(false)
const avatarDragging = ref(false)
const avatarInput = ref(null)

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Banned', value: 'Banned' }
]

/* =====================================================
   AVATAR LIBRARY
===================================================== */
const avatarLibrary = Array.from(
  { length: 16 },
  (_, i) => `https://i.pravatar.cc/150?img=${i + 1}`
)

const presetAvatars = avatarLibrary.slice(0, 6)

/* =====================================================
   HELPERS
===================================================== */
function initials(name) {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function roleClass(role) {
  return {
    Admin: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    Moderator: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    User: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white'
  }[role] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white'
}

function statusClass(status) {
  return {
    Active: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    Banned: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
  }[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white'
}

function relativeTime(ts) {
  if (!ts) return '—'
  const now = Date.now()
  const diff = Math.max(0, now - Number(ts))
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
   NORMALISE API USER
===================================================== */
function normaliseUser(u) {
  if (!u || typeof u !== 'object') return null

  const id = u.id ?? u._id
  if (!id) return null

  return {
    id: String(id),
    name: u.name ?? u.username ?? 'Unnamed',
    email: u.email ?? '',
    role: u.role ?? 'User',
    status: u.status ?? 'Active',
    avatar: u.avatar ?? '',
    has2FA: Boolean(u.has2FA ?? u.twoFactorEnabled),
    canUpload: Boolean(u.canUpload ?? u.uploadPermission),
    notes: u.notes ?? '',
    downloads: Number(u.downloads ?? 0),
    uploads: Number(u.uploads ?? 0),
    storage: u.storage ?? '',
    country: u.country ?? '',
    featured: Boolean(u.featured),
    joined: u.joined
      ? typeof u.joined === 'string'
        ? u.joined
        : new Date(u.joined).toISOString().slice(0, 10)
      : u.createdAt
      ? new Date(u.createdAt).toISOString().slice(0, 10)
      : '—',
    lastActive:
      u.lastActive ??
      u.lastSeen ??
      (u.updatedAt ? new Date(u.updatedAt).getTime() : Date.now()),
    _createdAt: u.createdAt
      ? new Date(u.createdAt).getTime()
      : u._createdAt ?? 0
  }
}

/* =====================================================
   FETCH USERS
===================================================== */
async function fetchUsers() {
  loading.value = true
  loadError.value = null

  try {
    const data = await apiFetch('/admin/users')
    const list = data?.data ?? data?.items ?? data ?? []

    users.value = Array.isArray(list)
      ? list.map(normaliseUser).filter(Boolean)
      : []
  } catch (err) {
    loadError.value = err?.message || 'Failed to load users.'
  } finally {
    loading.value = false
  }
}

/* =====================================================
   FILTERS + SORTING + PAGINATION
===================================================== */
const hasActiveFilters = computed(() =>
  Boolean(
    search.value ||
    filterRole.value ||
    filterHas2FA.value ||
    filterUploadPermission.value ||
    activeStatus.value !== 'all'
  )
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = users.value.filter(u => {
    const matchStatus = activeStatus.value === 'all' || u.status === activeStatus.value
    const matchRole = !filterRole.value || u.role === filterRole.value
    const match2FA =
      !filterHas2FA.value ||
      (filterHas2FA.value === 'yes' && u.has2FA) ||
      (filterHas2FA.value === 'no' && !u.has2FA)
    const matchUpload =
      !filterUploadPermission.value ||
      (filterUploadPermission.value === 'granted' && u.canUpload) ||
      (filterUploadPermission.value === 'denied' && !u.canUpload)
    const matchSearch =
      !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      String(u.id).includes(q)
    return matchStatus && matchRole && match2FA && matchUpload && matchSearch
  })

  const featured = list.filter(u => u.featured)
  const rest = list.filter(u => !u.featured)

  const sorter = (a, b) => {
    switch (sortBy.value) {
      case 'name': return (a.name || '').localeCompare(b.name || '')
      case 'downloads': return (b.downloads || 0) - (a.downloads || 0)
      case 'active': return (b.lastActive || 0) - (a.lastActive || 0)
      case 'oldest': return (a._createdAt || 0) - (b._createdAt || 0)
      case 'newest':
      default: return (b._createdAt || 0) - (a._createdAt || 0)
    }
  }

  featured.sort(sorter)
  rest.sort(sorter)
  return [...featured, ...rest]
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / pageSize.value))
)

const paginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch(
  [search, activeStatus, filterRole, filterHas2FA, filterUploadPermission, sortBy, pageSize],
  () => { currentPage.value = 1 }
)

watch(filtered, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})

const allSelected = computed(() =>
  paginated.value.length > 0 && paginated.value.every(u => selectedIds.value.includes(u.id))
)

function toggleSelectAll(e) {
  if (e.target.checked) {
    const ids = paginated.value.map(u => u.id)
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...ids]))
  } else {
    const ids = new Set(paginated.value.map(u => u.id))
    selectedIds.value = selectedIds.value.filter(id => !ids.has(id))
  }
}

function clearFilters() {
  search.value = ''
  activeStatus.value = 'all'
  filterRole.value = ''
  filterHas2FA.value = ''
  filterUploadPermission.value = ''
  currentPage.value = 1
}

/* =====================================================
   STATS
===================================================== */
const statusCounts = computed(() => [
  { label: 'Total', value: users.value.length, color: 'text-blue-600' },
  { label: 'Active', value: users.value.filter(u => u.status === 'Active').length, color: 'text-green-600' },
  { label: 'Pending', value: users.value.filter(u => u.status === 'Pending').length, color: 'text-amber-600' },
  { label: 'Banned', value: users.value.filter(u => u.status === 'Banned').length, color: 'text-red-600' },
  { label: 'Can Upload', value: users.value.filter(u => u.canUpload).length, color: 'text-emerald-600' },
  { label: 'No Upload', value: users.value.filter(u => !u.canUpload).length, color: 'text-slate-600' }
])

/* =====================================================
   DETAILS
===================================================== */
const sparkline = computed(() => {
  const id = detailsUser.value?.id || ''
  const seed = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return Array.from({ length: 12 }, (_, i) => {
    const v = (seed * (i + 3)) % 100
    return Math.max(15, Math.min(95, v))
  })
})

function openDetails(user) {
  detailsUser.value = user
}

function closeDetails() {
  detailsUser.value = null
}

function editFromDetails() {
  const u = detailsUser.value
  closeDetails()
  if (u) openEdit(u)
}

/* =====================================================
   EDIT / CREATE
===================================================== */
function openEdit(user) {
  editing.value = { ...user, isNew: false }
  errors.name = ''
  errors.email = ''
  editingAvatarError.value = false
}

function openCreate() {
  editing.value = {
    isNew: true,
    name: '',
    email: '',
    role: 'User',
    status: 'Pending',
    avatar: '',
    has2FA: false,
    canUpload: false,
    notes: '',
    downloads: 0,
    uploads: 0,
    storage: '0 MB',
    country: '',
    featured: false
  }
  errors.name = ''
  errors.email = ''
  editingAvatarError.value = false
}

function closeEdit() {
  editing.value = null
  editingAvatarError.value = false
}

async function saveEdit() {
  errors.name = ''
  errors.email = ''

  if (!editing.value.name?.trim()) errors.name = 'Name is required.'
  if (!editing.value.email?.trim()) errors.email = 'Email is required.'
  else if (!/^\S+@\S+\.\S+$/.test(editing.value.email)) errors.email = 'Invalid email format.'
  if (errors.name || errors.email) {
    toast('Please fix the errors.', 'error')
    return
  }

  saving.value = true

  try {
    if (editing.value.isNew) {
      const { isNew, ...payload } = editing.value
      const data = await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      const created = normaliseUser(data?.data ?? data) ?? {
        ...payload,
        id: String(Date.now()),
        _createdAt: Date.now()
      }
      users.value.unshift(created)
      toast(`Created user "${created.name}"`, 'success')
    } else {
      const { isNew, ...payload } = editing.value
      await apiFetch(`/admin/users/${payload.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      const idx = users.value.findIndex(u => u.id === payload.id)
      if (idx !== -1) {
        users.value[idx] = { ...users.value[idx], ...payload }
      }
      toast(`Updated "${payload.name}"`, 'success')
    }
    closeEdit()
  } catch (err) {
    toast(err?.message || 'Failed to save user.', 'error')
  } finally {
    saving.value = false
  }
}

/* =====================================================
   UPLOAD PERMISSION
===================================================== */
async function toggleUploadPermission(user) {
  const next = !user.canUpload
  try {
    await apiFetch(`/admin/users/${user.id}/upload-permission`, {
      method: 'PUT',
      body: JSON.stringify({ canUpload: next })
    })
    user.canUpload = next
    toast(
      next
        ? `Upload permission granted to ${user.name}`
        : `Upload permission revoked from ${user.name}`,
      next ? 'success' : 'info'
    )
  } catch (err) {
    toast(err?.message || 'Failed to update upload permission.', 'error')
  }
}

/* =====================================================
   AVATAR PICKER
===================================================== */
function openAvatarPicker() {
  avatarPickerOpen.value = true
  avatarDragging.value = false
}

function pickAvatar(url) {
  if (!editing.value) return
  editing.value.avatar = url
  editingAvatarError.value = false
  avatarPickerOpen.value = false
}

function onAvatarFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast('Please choose an image file.', 'error')
    return
  }
  const url = URL.createObjectURL(file)
  pickAvatar(url)
  e.target.value = ''
}

function onAvatarDrop(e) {
  avatarDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast('Please drop an image file.', 'error')
    return
  }
  const url = URL.createObjectURL(file)
  pickAvatar(url)
}

function useRandomAvatar() {
  const url = avatarLibrary[Math.floor(Math.random() * avatarLibrary.length)]
  if (editing.value) {
    editing.value.avatar = url
    editingAvatarError.value = false
  }
}

/* =====================================================
   EMAIL
===================================================== */
function sendEmail(user) {
  emailTarget.value = user
  emailSubject.value = ''
  emailBody.value = ''
  if (detailsUser.value) closeDetails()
}

function closeEmail() {
  emailTarget.value = null
  emailSubject.value = ''
  emailBody.value = ''
}

async function submitEmail() {
  if (!emailSubject.value.trim() || !emailBody.value.trim()) {
    toast('Subject and body required.', 'error')
    return
  }

  try {
    await apiFetch(`/admin/users/${emailTarget.value.id}/email`, {
      method: 'POST',
      body: JSON.stringify({
        subject: emailSubject.value,
        body: emailBody.value
      })
    })
    toast(`Email sent to ${emailTarget.value.email}`, 'success')
    closeEmail()
  } catch (err) {
    toast(err?.message || 'Failed to send email.', 'error')
  }
}

/* =====================================================
   ROW ACTIONS
===================================================== */
async function confirmDelete(user) {
  if (!window.confirm(`Delete user "${user.name}"?`)) return
  try {
    await apiFetch(`/admin/users/${user.id}`, { method: 'DELETE' })
    users.value = users.value.filter(u => u.id !== user.id)
    delete avatarErrors[user.id]
    toast(`Deleted "${user.name}"`, 'success')
  } catch (err) {
    toast(err?.message || 'Failed to delete user.', 'error')
  }
}

async function toggleFeatured(user) {
  const next = !user.featured
  try {
    await apiFetch(`/admin/users/${user.id}/featured`, {
      method: 'PUT',
      body: JSON.stringify({ featured: next })
    })
    user.featured = next
    toast(next ? 'Starred user' : 'Removed star', 'info')
  } catch (err) {
    toast(err?.message || 'Failed to update feature.', 'error')
  }
}

/* =====================================================
   BULK ACTIONS
===================================================== */
async function bulkStatus(status) {
  const ids = [...selectedIds.value]
  try {
    await apiFetch('/admin/users/bulk/status', {
      method: 'PUT',
      body: JSON.stringify({ ids, status })
    })
    users.value.forEach(u => { if (ids.includes(u.id)) u.status = status })
    toast(`${ids.length} user(s) → ${status}`, 'success')
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk update failed.', 'error')
  }
}

async function bulkRole(role) {
  const ids = [...selectedIds.value]
  try {
    await apiFetch('/admin/users/bulk/role', {
      method: 'PUT',
      body: JSON.stringify({ ids, role })
    })
    users.value.forEach(u => { if (ids.includes(u.id)) u.role = role })
    toast(`${ids.length} user(s) → ${role}`, 'success')
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk update failed.', 'error')
  }
}

async function bulkUploadPermission(granted) {
  const ids = [...selectedIds.value]
  try {
    await apiFetch('/admin/users/bulk/upload-permission', {
      method: 'PUT',
      body: JSON.stringify({ ids, canUpload: granted })
    })
    users.value.forEach(u => { if (ids.includes(u.id)) u.canUpload = granted })
    toast(
      `${ids.length} user(s) → ${granted ? 'upload allowed' : 'upload blocked'}`,
      granted ? 'success' : 'info'
    )
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk update failed.', 'error')
  }
}

async function bulkDelete() {
  const ids = [...selectedIds.value]
  if (!window.confirm(`Delete ${ids.length} user(s)?`)) return
  try {
    await apiFetch('/admin/users/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    })
    users.value = users.value.filter(u => !ids.includes(u.id))
    ids.forEach(id => delete avatarErrors[id])
    toast(`Deleted ${ids.length} user(s)`, 'success')
    selectedIds.value = []
  } catch (err) {
    toast(err?.message || 'Bulk delete failed.', 'error')
  }
}

/* =====================================================
   EXPORT
===================================================== */
function exportUsers() {
  const data = JSON.stringify(users.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `users-export-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast('Exported users as JSON', 'success')
}

/* =====================================================
   KEYBOARD SHORTCUTS
===================================================== */
function handleKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault()
    if (!editing.value && !detailsUser.value && !emailTarget.value && !avatarPickerOpen.value) openCreate()
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
    e.preventDefault()
    exportUsers()
  }
  if (e.key === 'Escape') {
    if (avatarPickerOpen.value) avatarPickerOpen.value = false
    else if (emailTarget.value) closeEmail()
    else if (detailsUser.value) closeDetails()
    else if (editing.value) closeEdit()
  }
}

/* =====================================================
   LIFECYCLE
===================================================== */
onMounted(() => {
  window.addEventListener('keydown', handleKey)
  fetchUsers()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>