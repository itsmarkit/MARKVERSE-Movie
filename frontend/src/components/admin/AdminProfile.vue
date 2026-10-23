<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">
    <header class="fixed left-0 right-0 top-0 z-50">
      <AdminHeader />
    </header>

    <main class="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-4xl">

        <!-- =========================
             HEADING
        ========================== -->
        <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Admin</p>
            <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Admin
              <span class="text-blue-600">Profile</span>
            </h1>
            <p class="mt-2 text-sm text-slate-500 dark:text-white/70">
              Manage your personal information, security, and preferences.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900 dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
              title="Export profile (Ctrl+E)"
              @click="exportProfile"
            >
              <DownloadIcon class="h-4 w-4" />
              Export
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-900 dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
              title="Import profile"
              @click="triggerImport"
            >
              <UploadIcon class="h-4 w-4" />
              Import
            </button>

            <input
              ref="importInput"
              type="file"
              accept="application/json"
              class="hidden"
              @change="importProfile"
            />
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
            Loading profile…
          </p>
        </div>

        <div
          v-else-if="loadError"
          class="mb-6 flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-black dark:border dark:border-slate-800"
        >
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">⚠️</div>
          <h2 class="text-2xl font-black">Failed to load profile</h2>
          <p class="mt-2 max-w-md text-sm text-slate-500 dark:text-white/70">
            {{ loadError }}
          </p>
          <button
            type="button"
            class="mt-5 rounded-full bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
            @click="fetchProfile"
          >
            Try again
          </button>
        </div>

        <template v-else>
          <!-- =========================
               TABS
          ========================== -->
          <div class="mb-6 flex flex-wrap gap-2">
            <button
              v-for="t in tabs"
              :key="t.value"
              type="button"
              class="rounded-full px-4 py-2.5 text-sm font-black transition"
              :class="
                activeTab === t.value
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-black dark:border dark:border-slate-800 dark:text-white dark:hover:bg-slate-900'
              "
              @click="activeTab = t.value"
            >
              <component :is="t.icon" class="mr-1.5 inline h-4 w-4" />
              {{ t.label }}
            </button>
          </div>

          <!-- =========================
               PROFILE TAB
          ========================== -->
          <form
            v-if="activeTab === 'profile'"
            class="rounded-2xl bg-white p-6 shadow-sm dark:bg-black dark:border dark:border-slate-800 dark:shadow-white/10 sm:p-8"
            @submit.prevent="save"
          >
            <!-- AVATAR + STATS -->
            <div class="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div class="flex flex-col items-center gap-3">
                <div class="group relative">
                  <div
                    class="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-3xl font-black text-white shadow-lg ring-4 ring-white dark:ring-slate-900"
                  >
                    <img
                      v-if="profile.avatar && !avatarError"
                      :src="profile.avatar"
                      alt="Avatar"
                      class="h-full w-full object-cover"
                      @error="avatarError = true"
                      @load="avatarError = false"
                    />
                    <span v-else>{{ initials(profile.name) }}</span>
                  </div>

                  <button
                    type="button"
                    class="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100"
                    @click="openAvatarPicker"
                  >
                    <CameraIcon class="h-6 w-6 text-white" />
                    <span class="mt-1 text-[10px] font-black text-white">CHANGE</span>
                  </button>
                </div>

                <div class="flex flex-wrap justify-center gap-1.5">
                  <button
                    type="button"
                    class="rounded-full bg-blue-500 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-blue-600"
                    @click="openAvatarPicker"
                  >
                    <ImageIcon class="mr-1 inline h-3 w-3" />
                    Choose
                  </button>
                  <button
                    v-if="profile.avatar"
                    type="button"
                    class="rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-black text-red-600 transition hover:bg-red-100"
                    @click="profile.avatar = ''; avatarError = false"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div class="flex-1 text-center sm:text-left">
                <p class="text-xl font-black">{{ profile.name || 'Unnamed Admin' }}</p>
                <p class="text-sm text-slate-500 dark:text-white/70">
                  {{ profile.role || 'Administrator' }}
                </p>
                <p class="mt-1 text-xs text-slate-400 dark:text-white/50">
                  {{ profile.email || '—' }}
                </p>

                <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div class="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-900">
                    <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/60">Uploads</p>
                    <p class="mt-0.5 text-lg font-black text-blue-600">{{ stats.uploads }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-900">
                    <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/60">Downloads</p>
                    <p class="mt-0.5 text-lg font-black text-emerald-600">{{ stats.downloads }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-900">
                    <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/60">Joined</p>
                    <p class="mt-0.5 text-xs font-black dark:text-white">{{ stats.joined }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-900">
                    <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/60">2FA</p>
                    <p class="mt-0.5 text-xs font-black" :class="profile.has2FA ? 'text-emerald-600' : 'text-red-500'">
                      {{ profile.has2FA ? 'Enabled' : 'Off' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- FIELDS -->
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Full Name *
                </label>
                <input
                  v-model="profile.name"
                  type="text"
                  class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                  :class="errors.name
                    ? 'border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-500/10'
                    : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white'"
                  @input="errors.name = ''"
                />
                <p v-if="errors.name" class="mt-1 text-xs font-bold text-red-500">{{ errors.name }}</p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Email *
                </label>
                <input
                  v-model="profile.email"
                  type="email"
                  class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                  :class="errors.email
                    ? 'border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-500/10'
                    : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white'"
                  @input="errors.email = ''"
                />
                <p v-if="errors.email" class="mt-1 text-xs font-bold text-red-500">{{ errors.email }}</p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Role *
                </label>
                <input
                  v-model="profile.role"
                  type="text"
                  class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                  :class="errors.role
                    ? 'border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-500/10'
                    : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white'"
                  @input="errors.role = ''"
                />
                <p v-if="errors.role" class="mt-1 text-xs font-bold text-red-500">{{ errors.role }}</p>
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Bio
                </label>
                <textarea
                  v-model="profile.bio"
                  rows="3"
                  maxlength="200"
                  placeholder="Tell people a little about yourself..."
                  class="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                ></textarea>
                <p class="mt-1 text-right text-[10px] font-bold text-slate-400">
                  {{ (profile.bio || '').length }} / 200
                </p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Country
                </label>
                <select
                  v-model="profile.country"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Select country</option>
                  <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Phone
                </label>
                <input
                  v-model="profile.phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <!-- Save bar -->
            <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
              <p v-if="dirty" class="text-xs font-bold text-amber-600">
                ⚠ You have unsaved changes
              </p>
              <p v-else class="text-xs font-bold text-slate-400">
                All changes saved
              </p>

              <div class="flex flex-wrap gap-3">
                <button
                  type="button"
                  class="rounded-full px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:hover:bg-slate-800"
                  :disabled="saving"
                  @click="reset"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  :disabled="saving"
                  class="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Loader2Icon v-if="saving" class="h-4 w-4 animate-spin" />
                  <SaveIcon v-else class="h-4 w-4" />
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </div>
          </form>

          <!-- =========================
               SECURITY TAB
          ========================== -->
          <div v-else-if="activeTab === 'security'" class="space-y-5">

            <div class="rounded-2xl bg-white p-6 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <h2 class="text-lg font-black">Change Password</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-white/60">
                Choose a strong password you don't use anywhere else.
              </p>

              <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Current Password
                  </label>
                  <div class="relative">
                    <input
                      v-model="password.current"
                      :type="showPasswords.current ? 'text' : 'password'"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      @click="showPasswords.current = !showPasswords.current"
                    >
                      <component :is="showPasswords.current ? EyeOffIcon : EyeIcon" class="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    New Password
                  </label>
                  <div class="relative">
                    <input
                      v-model="password.next"
                      :type="showPasswords.next ? 'text' : 'password'"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      @click="showPasswords.next = !showPasswords.next"
                    >
                      <component :is="showPasswords.next ? EyeOffIcon : EyeIcon" class="h-4 w-4" />
                    </button>
                  </div>

                  <div v-if="password.next" class="mt-2">
                    <div class="flex h-1.5 gap-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        v-for="i in 4"
                        :key="i"
                        class="flex-1 rounded-full transition-colors"
                        :class="i <= strength.score ? strength.color : 'bg-transparent'"
                      ></div>
                    </div>
                    <p class="mt-1 text-[10px] font-black uppercase tracking-wider" :class="strength.textColor">
                      {{ strength.label }}
                    </p>
                  </div>
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Confirm New Password
                  </label>
                  <div class="relative">
                    <input
                      v-model="password.confirm"
                      :type="showPasswords.confirm ? 'text' : 'password'"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      @click="showPasswords.confirm = !showPasswords.confirm"
                    >
                      <component :is="showPasswords.confirm ? EyeOffIcon : EyeIcon" class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div class="mt-4 flex justify-end">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="!canChangePassword || savingPassword"
                  @click="changePassword"
                >
                  <Loader2Icon v-if="savingPassword" class="h-4 w-4 animate-spin" />
                  <LockIcon v-else class="h-4 w-4" />
                  Update Password
                </button>
              </div>
            </div>

            <div class="rounded-2xl bg-white p-6 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <h2 class="text-lg font-black">Two-Factor Authentication</h2>
                  <p class="mt-1 text-xs text-slate-500 dark:text-white/60">
                    Add an extra layer of security to your account.
                  </p>
                </div>
                <button
                  type="button"
                  class="relative h-7 w-12 shrink-0 rounded-full transition"
                  :class="profile.has2FA ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'"
                  @click="toggle2FA"
                >
                  <span
                    class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
                    :class="profile.has2FA ? 'left-[22px]' : 'left-0.5'"
                  ></span>
                </button>
              </div>

              <div
                v-if="profile.has2FA"
                class="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                ✓ 2FA is currently enabled. Recovery codes can be generated below.
                <button
                  type="button"
                  class="ml-1 underline hover:no-underline"
                  @click="regenerateRecoveryCodes"
                >
                  Regenerate codes
                </button>
              </div>
            </div>

            <div class="rounded-2xl bg-white p-6 shadow-sm dark:bg-black dark:border dark:border-slate-800">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <h2 class="text-lg font-black">Active Sessions</h2>
                  <p class="mt-1 text-xs text-slate-500 dark:text-white/60">
                    Devices currently signed in to your account.
                  </p>
                </div>
                <button
                  type="button"
                  class="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-600 transition hover:bg-red-100"
                  @click="signOutAll"
                >
                  Sign out all
                </button>
              </div>

              <div v-if="sessions.length" class="mt-4 space-y-2">
                <div
                  v-for="(s, i) in sessions"
                  :key="s.id ?? i"
                  class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900"
                >
                  <div class="flex items-center gap-3">
                    <component :is="s.icon" class="h-5 w-5 text-slate-500 dark:text-white/70" />
                    <div class="min-w-0">
                      <p class="truncate text-sm font-black">{{ s.device }}</p>
                      <p class="truncate text-[11px] text-slate-500 dark:text-white/60">
                        {{ s.location }} • {{ s.lastActive }}
                      </p>
                    </div>
                  </div>
                  <span
                    v-if="s.current"
                    class="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  >
                    This device
                  </span>
                  <button
                    v-else
                    type="button"
                    class="rounded-full bg-red-50 px-3 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-100"
                    @click="revokeSession(s, i)"
                  >
                    Revoke
                  </button>
                </div>
              </div>

              <p v-else class="mt-4 text-xs text-slate-400 dark:text-white/60">
                No active sessions.
              </p>
            </div>

            <div class="rounded-2xl border-2 border-red-200 bg-red-50/50 p-6 dark:border-red-500/30 dark:bg-red-500/5">
              <h2 class="text-lg font-black text-red-700 dark:text-red-400">Danger Zone</h2>
              <p class="mt-1 text-xs text-red-600 dark:text-red-400/80">
                Irreversible actions. Please be careful.
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-full bg-red-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-600"
                  @click="deleteAccount"
                >
                  <TrashIcon class="mr-1 inline h-3.5 w-3.5" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          <!-- =========================
               NOTIFICATIONS TAB
          ========================== -->
          <div v-else-if="activeTab === 'notifications'" class="rounded-2xl bg-white p-6 shadow-sm dark:bg-black dark:border dark:border-slate-800">
            <h2 class="text-lg font-black">Notification Preferences</h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-white/60">
              Choose how you'd like to be notified.
            </p>

            <div class="mt-6 space-y-3">
              <label
                v-for="(pref, key) in profile.notifications"
                :key="key"
                class="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <div>
                  <p class="text-sm font-black">{{ prefLabels[key]?.title || key }}</p>
                  <p class="text-xs text-slate-500 dark:text-white/60">
                    {{ prefLabels[key]?.description || '' }}
                  </p>
                </div>
                <input
                  v-model="profile.notifications[key]"
                  type="checkbox"
                  class="h-5 w-5 shrink-0 rounded border-slate-300 text-blue-500"
                />
              </label>
            </div>
          </div>

          <!-- =========================
               PREFERENCES TAB
          ========================== -->
          <div v-else-if="activeTab === 'preferences'" class="rounded-2xl bg-white p-6 shadow-sm dark:bg-black dark:border dark:border-slate-800">
            <h2 class="text-lg font-black">Preferences</h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-white/60">
              Customize your experience.
            </p>

            <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Language
                </label>
                <select
                  v-model="profile.preferences.language"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option>English</option>
                  <option>French</option>
                  <option>Spanish</option>
                  <option>German</option>
                  <option>Korean</option>
                  <option>Japanese</option>
                  <option>Chinese</option>
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Timezone
                </label>
                <select
                  v-model="profile.preferences.timezone"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option>UTC</option>
                  <option>GMT (London)</option>
                  <option>CET (Paris)</option>
                  <option>EST (New York)</option>
                  <option>PST (Los Angeles)</option>
                  <option>KST (Seoul)</option>
                  <option>JST (Tokyo)</option>
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Theme
                </label>
                <select
                  v-model="profile.preferences.theme"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option>System</option>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Landing page
                </label>
                <select
                  v-model="profile.preferences.landing"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option>Dashboard</option>
                  <option>Uploads</option>
                  <option>Users</option>
                  <option>Movies</option>
                  <option>Series</option>
                </select>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                class="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
                @click="savePreferences"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </template>

      </section>
    </main>

    <!-- =========================================================
         AVATAR PICKER MODAL
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
                  Upload a new file or pick a random avatar.
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
                <div class="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    class="rounded-full bg-blue-500 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-600"
                    @click="$refs.avatarInput.click()"
                  >
                    Browse files
                  </button>
                  <button
                    type="button"
                    class="rounded-full bg-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-white"
                    @click="useRandomAvatar"
                  >
                    <SparklesIcon class="mr-1 inline h-3.5 w-3.5" />
                    Random
                  </button>
                </div>
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
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import AdminHeader from '../admin/AdminHeader.vue'

import {
  SaveIcon,
  DownloadIcon,
  UploadIcon,
  ImageIcon,
  CameraIcon,
  XIcon,
  CheckIcon,
  SparklesIcon,
  UploadCloudIcon,
  Loader2Icon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  TrashIcon,
  UserIcon,
  BellIcon,
  SettingsIcon,
  ShieldIcon,
  MonitorIcon,
  SmartphoneIcon,
  CheckCircle2Icon,
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

function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/admin/upload`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText)
          const url = json?.url ?? json?.data?.url ?? json?.path ?? ''
          if (!url) return reject(new Error('Upload succeeded but no URL returned.'))
          resolve(url)
        } catch {
          reject(new Error('Invalid response from upload endpoint.'))
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status}).`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload.'))
    xhr.send(formData)
  })
}

/* =====================================================
   TABS
===================================================== */
const tabs = [
  { label: 'Profile', value: 'profile', icon: UserIcon },
  { label: 'Security', value: 'security', icon: ShieldIcon },
  { label: 'Notifications', value: 'notifications', icon: BellIcon },
  { label: 'Preferences', value: 'preferences', icon: SettingsIcon }
]

const activeTab = ref('profile')

/* =====================================================
   STATE
===================================================== */
const loading = ref(true)
const loadError = ref(null)

const profile = ref({
  name: '',
  email: '',
  role: 'Admin',
  bio: '',
  avatar: '',
  phone: '',
  country: '',
  has2FA: false,
  notifications: {
    email: true,
    push: false,
    weeklyDigest: true,
    securityAlerts: true
  },
  preferences: {
    language: 'English',
    timezone: 'UTC',
    theme: 'System',
    landing: 'Dashboard'
  }
})

const stats = ref({ uploads: 0, downloads: 0, joined: '—' })
const countries = ref([
  'USA', 'UK', 'France', 'Germany', 'Spain', 'Italy',
  'South Korea', 'Japan', 'China', 'India', 'Nigeria',
  'Canada', 'Australia', 'Brazil', 'Mexico', 'Egypt',
  'Czechia', 'Other'
])

const avatarLibrary = ref([])

const sessions = ref([])

const prefLabels = {
  email: { title: 'Email notifications', description: 'Receive updates via email.' },
  push: { title: 'Push notifications', description: 'Browser push notifications.' },
  weeklyDigest: { title: 'Weekly digest', description: 'Weekly summary of your account.' },
  securityAlerts: { title: 'Security alerts', description: 'Important login and security events.' }
}

/* Saved snapshot for reset / dirty detection */
const savedSnapshot = ref('')
const dirty = computed(() => JSON.stringify(profile.value) !== savedSnapshot.value)

/* =====================================================
   FETCH PROFILE
===================================================== */
function mapIcon(name) {
  const map = {
    monitor: MonitorIcon,
    smartphone: SmartphoneIcon
  }
  if (!name) return MonitorIcon
  return map[String(name).toLowerCase()] || MonitorIcon
}

async function fetchProfile() {
  loading.value = true
  loadError.value = null

  try {
    const data = await apiFetch('/admin/profile')
    const payload = data?.data ?? data

    if (payload.profile) {
      Object.assign(profile.value, {
        name: payload.profile.name ?? '',
        email: payload.profile.email ?? '',
        role: payload.profile.role ?? 'Admin',
        bio: payload.profile.bio ?? '',
        avatar: payload.profile.avatar ?? '',
        phone: payload.profile.phone ?? '',
        country: payload.profile.country ?? '',
        has2FA: Boolean(payload.profile.has2FA),
        notifications: {
          ...profile.value.notifications,
          ...(payload.profile.notifications || {})
        },
        preferences: {
          ...profile.value.preferences,
          ...(payload.profile.preferences || {})
        }
      })
    }

    if (payload.stats) {
      stats.value = {
        uploads: payload.stats.uploads ?? 0,
        downloads: payload.stats.downloads ?? 0,
        joined: payload.stats.joined ?? '—'
      }
    }

    if (Array.isArray(payload.countries)) {
      countries.value = payload.countries
    }

    if (Array.isArray(payload.avatarLibrary)) {
      avatarLibrary.value = payload.avatarLibrary
    }

    if (Array.isArray(payload.sessions)) {
      sessions.value = payload.sessions.map(s => ({
        id: s.id ?? null,
        device: s.device ?? 'Unknown device',
        location: s.location ?? 'Unknown',
        lastActive: s.lastActive ?? '—',
        current: Boolean(s.current),
        icon: mapIcon(s.icon)
      }))
    }

    savedSnapshot.value = JSON.stringify(profile.value)
  } catch (err) {
    loadError.value = err?.message || 'Failed to load profile.'
  } finally {
    loading.value = false
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
   AVATAR
===================================================== */
const avatarError = ref(false)
const avatarPickerOpen = ref(false)
const avatarDragging = ref(false)
const avatarInput = ref(null)
const importInput = ref(null)

function openAvatarPicker() {
  avatarPickerOpen.value = true
  avatarDragging.value = false
}

function pickAvatar(url) {
  profile.value.avatar = url
  avatarError.value = false
  avatarPickerOpen.value = false
  toast('Avatar updated', 'success')
}

async function onAvatarFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast('Please choose an image file.', 'error')
    return
  }
  try {
    const url = await uploadFile(file)
    pickAvatar(url)
  } catch (err) {
    toast(err?.message || 'Upload failed.', 'error')
  } finally {
    e.target.value = ''
  }
}

async function onAvatarDrop(e) {
  avatarDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast('Please drop an image file.', 'error')
    return
  }
  try {
    const url = await uploadFile(file)
    pickAvatar(url)
  } catch (err) {
    toast(err?.message || 'Upload failed.', 'error')
  }
}

function useRandomAvatar() {
  if (!avatarLibrary.value.length) {
    toast('No avatars available.', 'error')
    return
  }
  const url = avatarLibrary.value[Math.floor(Math.random() * avatarLibrary.value.length)]
  pickAvatar(url)
}

function initials(name) {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/* =====================================================
   VALIDATION + SAVE
===================================================== */
const errors = reactive({ name: '', email: '', role: '' })
const saving = ref(false)

function validate() {
  errors.name = ''
  errors.email = ''
  errors.role = ''

  if (!profile.value.name?.trim()) errors.name = 'Full name is required.'
  if (!profile.value.email?.trim()) errors.email = 'Email is required.'
  else if (!/^\S+@\S+\.\S+$/.test(profile.value.email)) errors.email = 'Invalid email format.'
  if (!profile.value.role?.trim()) errors.role = 'Role is required.'

  return !errors.name && !errors.email && !errors.role
}

async function save() {
  if (!validate()) {
    toast('Please fix the highlighted fields.', 'error')
    return
  }

  saving.value = true
  try {
    await apiFetch('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: profile.value.name,
        email: profile.value.email,
        role: profile.value.role,
        bio: profile.value.bio,
        avatar: profile.value.avatar,
        phone: profile.value.phone,
        country: profile.value.country,
        notifications: profile.value.notifications,
        preferences: profile.value.preferences
      })
    })
    savedSnapshot.value = JSON.stringify(profile.value)
    toast('Profile saved successfully.', 'success')
  } catch (err) {
    toast(err?.message || 'Failed to save profile.', 'error')
  } finally {
    saving.value = false
  }
}

function reset() {
  if (!dirty.value) {
    toast('No changes to reset.', 'info')
    return
  }
  if (window.confirm('Discard unsaved changes?')) {
    const snapshot = JSON.parse(savedSnapshot.value)
    Object.assign(profile.value, snapshot)
    toast('Changes discarded', 'info')
  }
}

/* =====================================================
   EXPORT / IMPORT
===================================================== */
function exportProfile() {
  const data = JSON.stringify(profile.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `admin-profile-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast('Exported profile', 'success')
}

function triggerImport() {
  importInput.value?.click()
}

async function importProfile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result)
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid')

      Object.assign(profile.value, parsed)

      await apiFetch('/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(profile.value)
      })
      savedSnapshot.value = JSON.stringify(profile.value)
      toast('Profile imported', 'success')
    } catch (err) {
      toast(err?.message || 'Invalid JSON file.', 'error')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

/* =====================================================
   PASSWORD
===================================================== */
const password = reactive({ current: '', next: '', confirm: '' })
const showPasswords = reactive({ current: false, next: false, confirm: false })
const savingPassword = ref(false)

const strength = computed(() => {
  const p = password.next || ''
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++

  const table = [
    { label: 'Very weak', color: 'bg-red-500', textColor: 'text-red-500' },
    { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-500' },
    { label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-500' },
    { label: 'Good', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
    { label: 'Strong', color: 'bg-emerald-600', textColor: 'text-emerald-600' }
  ]
  return { score, ...table[score] }
})

const canChangePassword = computed(() =>
  password.current.length > 0 &&
  password.next.length >= 6 &&
  password.next === password.confirm
)

async function changePassword() {
  if (!canChangePassword.value) return
  savingPassword.value = true
  try {
    await apiFetch('/admin/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        current: password.current,
        next: password.next
      })
    })
    password.current = ''
    password.next = ''
    password.confirm = ''
    toast('Password updated', 'success')
  } catch (err) {
    toast(err?.message || 'Failed to update password.', 'error')
  } finally {
    savingPassword.value = false
  }
}

/* =====================================================
   TWO-FACTOR
===================================================== */
async function toggle2FA() {
  const next = !profile.value.has2FA
  try {
    await apiFetch('/admin/profile/2fa', {
      method: 'PUT',
      body: JSON.stringify({ enabled: next })
    })
    profile.value.has2FA = next
    toast(next ? '2FA enabled' : '2FA disabled', 'info')
  } catch (err) {
    toast(err?.message || 'Failed to update 2FA.', 'error')
  }
}

async function regenerateRecoveryCodes() {
  try {
    await apiFetch('/admin/profile/2fa/recovery-codes', { method: 'POST' })
    toast('New recovery codes generated', 'success')
  } catch (err) {
    toast(err?.message || 'Failed to regenerate codes.', 'error')
  }
}

/* =====================================================
   SESSIONS
===================================================== */
async function signOutAll() {
  if (!window.confirm('Sign out all other devices?')) return
  try {
    await apiFetch('/admin/profile/sessions', { method: 'DELETE' })
    sessions.value = sessions.value.filter(s => s.current)
    toast('Signed out all other devices', 'success')
  } catch (err) {
    toast(err?.message || 'Failed to sign out.', 'error')
  }
}

async function revokeSession(s, i) {
  try {
    await apiFetch(`/admin/profile/sessions/${s.id}`, { method: 'DELETE' })
    sessions.value.splice(i, 1)
    toast('Session revoked', 'info')
  } catch (err) {
    toast(err?.message || 'Failed to revoke session.', 'error')
  }
}

/* =====================================================
   DELETE ACCOUNT
===================================================== */
async function deleteAccount() {
  const confirm1 = window.confirm('Are you sure you want to delete your account?')
  if (!confirm1) return
  const confirm2 = window.prompt('Type "DELETE" to confirm:')
  if (confirm2 !== 'DELETE') {
    toast('Deletion cancelled', 'info')
    return
  }
  try {
    await apiFetch('/admin/profile', { method: 'DELETE' })
    toast('Account deletion requested', 'error')
  } catch (err) {
    toast(err?.message || 'Failed to delete account.', 'error')
  }
}

/* =====================================================
   SAVE PREFERENCES
===================================================== */
async function savePreferences() {
  try {
    await apiFetch('/admin/profile/preferences', {
      method: 'PUT',
      body: JSON.stringify(profile.value.preferences)
    })
    savedSnapshot.value = JSON.stringify(profile.value)
    toast('Preferences saved', 'success')
  } catch (err) {
    toast(err?.message || 'Failed to save preferences.', 'error')
  }
}

/* =====================================================
   KEYBOARD SHORTCUTS
===================================================== */
function handleKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    save()
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
    e.preventDefault()
    exportProfile()
  }
  if (e.key === 'Escape') {
    if (avatarPickerOpen.value) avatarPickerOpen.value = false
  }
}

/* =====================================================
   UNSAVED CHANGES WARNING
===================================================== */
function beforeUnload(e) {
  if (dirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

/* =====================================================
   LIFECYCLE
===================================================== */
onMounted(() => {
  window.addEventListener('keydown', handleKey)
  window.addEventListener('beforeunload', beforeUnload)
  fetchProfile()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
  window.removeEventListener('beforeunload', beforeUnload)
})
</script>