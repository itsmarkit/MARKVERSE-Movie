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
    <main class="px-4 pb-24 pt-24 sm:px-6 lg:px-8">

      <!-- =========================
           LOADING
      ========================== -->
      <section
        v-if="loading"
        class="mx-auto flex min-h-[400px] max-w-7xl flex-col
               items-center justify-center rounded-3xl bg-white p-10
               text-center shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800"
      >
        <div class="relative mb-4 h-12 w-12">
          <div class="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-500/20"></div>
          <div class="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500"></div>
        </div>
        <p class="text-sm font-bold text-slate-500 dark:text-white/70">
          Loading profile…
        </p>
      </section>

      <!-- =========================
           ERROR
      ========================== -->
      <section
        v-else-if="error"
        class="mx-auto flex min-h-[400px] max-w-7xl flex-col
               items-center justify-center rounded-3xl bg-white p-10
               text-center shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800"
      >
        <div class="mb-4 flex h-16 w-16 items-center justify-center
                    rounded-full bg-red-100 text-2xl dark:bg-red-500/10">⚠️</div>
        <h2 class="text-2xl font-black">Something went wrong</h2>
        <p class="mt-2 max-w-md text-sm text-slate-500 dark:text-white/70">
          {{ error }}
        </p>
        <button
          type="button"
          class="mt-5 rounded-full bg-blue-500 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-600"
          @click="fetchProfile"
        >
          Try again
        </button>
      </section>

      <section v-else class="mx-auto max-w-7xl">

        <!-- =====================================================
             HERO — Split panel with floating identity card
        ====================================================== -->
        <div class="relative">
          <!-- Cover -->
          <div class="relative h-56 w-full overflow-hidden rounded-3xl sm:h-80">
            <div
              class="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800"
              :style="coverStyle"
            ></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>

            <!-- Cover actions -->
            <div class="absolute right-4 top-4 flex gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 text-xs font-black text-white backdrop-blur transition hover:bg-black/60"
                @click="triggerCoverPicker"
              >
                <ImageIcon class="h-3.5 w-3.5" />
                <span class="hidden sm:inline">Change Cover</span>
              </button>
              <button
                v-if="cover"
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-red-500"
                @click="cover = ''"
              >
                <TrashIcon class="h-3.5 w-3.5" />
              </button>
            </div>

            <!-- Online dot -->
            <div class="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur">
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              <span class="text-[10px] font-black uppercase tracking-wider text-white">Online</span>
            </div>
          </div>

          <!-- Floating identity card -->
          <div class="relative -mt-20 px-4 sm:-mt-24 sm:px-8">
            <div class="rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800 sm:p-6">
              <div class="flex flex-col gap-5 sm:flex-row sm:items-center">

                <!-- Avatar -->
                <div class="relative shrink-0 self-center sm:self-auto">
                  <div
                    class="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-4xl font-black text-white ring-4 ring-white dark:ring-black sm:h-32 sm:w-32"
                  >
                    <img
                      v-if="form.avatar && !avatarError"
                      :src="form.avatar"
                      :alt="form.name"
                      class="h-full w-full object-cover"
                      @error="avatarError = true"
                      @load="avatarError = false"
                    />
                    <span v-else>{{ initials(form.name) }}</span>
                  </div>

                  <span
                    class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-blue-500 dark:border-black"
                  >
                    <CheckIcon class="h-3 w-3 text-white" />
                  </span>

                  <button
                    type="button"
                    class="absolute -bottom-2 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg ring-4 ring-white transition hover:bg-blue-600 dark:ring-black"
                    @click="openAvatarPicker"
                  >
                    <CameraIcon class="h-3.5 w-3.5" />
                  </button>
                </div>

                <!-- Identity -->
                <div class="min-w-0 flex-1 text-center sm:text-left">
                  <div class="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 class="truncate text-2xl font-black tracking-tight sm:text-3xl">
                      {{ form.name || 'Your Name' }}
                    </h1>
                    <span
                      class="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    >
                      {{ profile.role }}
                    </span>
                  </div>

                  <p class="mt-1.5 text-sm font-bold text-slate-500 dark:text-white/60">
                    @{{ form.username }} · {{ form.email }}
                  </p>

                  <div class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500 dark:text-white/60 sm:justify-start">
                    <span class="inline-flex items-center gap-1.5">
                      <MapPinIcon class="h-3.5 w-3.5" />
                      {{ form.country || 'Location not set' }}
                    </span>
                    <span v-if="profile.joined" class="inline-flex items-center gap-1.5">
                      <CalendarIcon class="h-3.5 w-3.5" />
                      Joined {{ profile.joined }}
                    </span>
                    <span v-if="profile.lastActive" class="inline-flex items-center gap-1.5">
                      <ClockIcon class="h-3.5 w-3.5" />
                      Active {{ profile.lastActive }}
                    </span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex shrink-0 justify-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    class="rounded-full bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
                    @click="activeTab = 'security'"
                  >
                    <LockIcon class="mr-1.5 inline h-3.5 w-3.5" />
                    Security
                  </button>
                  <button
                    type="button"
                    class="rounded-full bg-blue-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600"
                    @click="activeTab = 'edit'"
                  >
                    <PencilIcon class="mr-1.5 inline h-3.5 w-3.5" />
                    Edit Profile
                  </button>
                </div>
              </div>

              <!-- Bio -->
              <p v-if="form.bio" class="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-white/70">
                {{ form.bio }}
              </p>
            </div>
          </div>
        </div>

        <!-- =====================================================
             STATS BAR (unified with dividers)
        ====================================================== -->
        <div class="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800">
          <div class="grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
            <div
              v-for="stat in quickStats"
              :key="stat.label"
              class="group flex items-center gap-3 p-4 transition hover:bg-blue-50/50 dark:hover:bg-blue-500/5"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-500 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400">
                <component :is="stat.icon" class="h-4 w-4" />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/60">
                  {{ stat.label }}
                </p>
                <p class="text-xl font-black leading-tight">
                  {{ stat.value }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- =====================================================
             TAB BAR (horizontal on desktop)
        ====================================================== -->
        <div class="mt-6 overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800">
          <nav class="flex gap-1 overflow-x-auto">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              type="button"
              class="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition"
              :class="
                activeTab === tab.value
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 hover:bg-blue-50 dark:text-white/70 dark:hover:bg-blue-500/10'
              "
              @click="activeTab = tab.value"
            >
              <component :is="tab.icon" class="h-4 w-4 shrink-0" />
              <span class="whitespace-nowrap">{{ tab.label }}</span>
              <span
                v-if="tab.badge"
                class="rounded-full px-1.5 py-0.5 text-[10px] font-black"
                :class="
                  activeTab === tab.value
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                "
              >
                {{ tab.badge }}
              </span>
            </button>
          </nav>
        </div>

        <!-- =====================================================
             CONTENT AREA
        ====================================================== -->
        <div class="mt-6">

          <!-- =====================================================
               TAB: OVERVIEW (bento grid)
          ====================================================== -->
          <section v-if="activeTab === 'overview'" class="grid grid-cols-1 gap-6 lg:grid-cols-3">

            <!-- Continue Watching (spans 2) -->
            <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800 lg:col-span-2">
              <div class="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-lg font-black">Continue Watching</h2>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-white/60">
                    Pick up where you left off
                  </p>
                </div>
                <router-link
                  to="/browser"
                  class="text-xs font-black text-blue-600 hover:text-blue-700"
                >
                  Browse all →
                </router-link>
              </div>

              <div v-if="continueWatching.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <router-link
                  v-for="item in continueWatching"
                  :key="item.id"
                  :to="`/watch/${item.id}`"
                  class="group overflow-hidden rounded-xl bg-blue-50/60 transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-blue-500/5"
                >
                  <div
                    class="relative h-32 overflow-hidden bg-gradient-to-br from-blue-600 to-blue-900 sm:h-40"
                    :style="posterStyle(item.image)"
                  >
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                      <span class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
                        <PlayIcon class="h-4 w-4 fill-current" />
                      </span>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                      <div class="h-full bg-blue-500" :style="{ width: `${item.progress}%` }"></div>
                    </div>
                  </div>
                  <div class="p-3">
                    <p class="truncate text-xs font-black">{{ item.title }}</p>
                    <p class="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-white/60">
                      {{ item.progress }}% · {{ item.timeLeft }}
                    </p>
                  </div>
                </router-link>
              </div>

              <div v-else class="rounded-xl bg-blue-50/40 p-6 text-center dark:bg-blue-500/5">
                <FilmIcon class="mx-auto mb-2 h-8 w-8 text-blue-300 dark:text-blue-500/40" />
                <p class="text-sm font-bold text-slate-500 dark:text-white/70">
                  Nothing to continue watching yet.
                </p>
              </div>
            </div>

            <!-- Genre preferences (1 col) -->
            <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800">
              <h2 class="text-lg font-black">Your Top Genres</h2>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-white/60">
                Based on your watch history
              </p>

              <div v-if="genrePreferences.length" class="mt-5 flex flex-col gap-3">
                <div v-for="g in genrePreferences" :key="g.genre">
                  <div class="flex items-center justify-between gap-2 text-xs font-black">
                    <span>{{ g.genre }}</span>
                    <span class="text-slate-500 dark:text-white/60">{{ g.percent }}%</span>
                  </div>
                  <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-blue-50 dark:bg-blue-500/10">
                    <div
                      class="h-full rounded-full bg-blue-500 transition-all"
                      :style="{ width: `${g.percent}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <p v-else class="mt-4 text-xs text-slate-400 dark:text-white/60">
                No genre data yet.
              </p>
            </div>

            <!-- Weekly activity (spans 2) -->
            <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800 lg:col-span-2">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-lg font-black">Weekly Activity</h2>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-white/60">
                    Hours watched this week
                  </p>
                </div>
                <span class="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {{ weeklyTotal }}h total
                </span>
              </div>

              <div v-if="weeklyActivity.length" class="mt-6 flex h-40 items-end gap-2">
                <div
                  v-for="(day, i) in weeklyActivity"
                  :key="i"
                  class="group flex flex-1 flex-col items-center gap-2"
                >
                  <div class="relative w-full">
                    <div
                      class="w-full rounded-t-lg bg-blue-500 transition-all group-hover:bg-blue-600"
                      :style="{ height: `${(day.hours / maxWeeklyHours) * 130}px` }"
                    ></div>
                    <span class="absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-black text-white opacity-0 transition group-hover:opacity-100">
                      {{ day.hours }}h
                    </span>
                  </div>
                  <span class="text-[10px] font-black uppercase text-slate-400">
                    {{ day.label }}
                  </span>
                </div>
              </div>

              <p v-else class="mt-4 text-xs text-slate-400 dark:text-white/60">
                No activity data yet.
              </p>
            </div>

            <!-- Achievements (1 col) -->
            <div
              v-if="achievements.length"
              class="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-5 shadow-lg"
            >
              <div class="flex items-center gap-2">
                <TrophyIcon class="h-5 w-5 text-white" />
                <p class="text-xs font-black uppercase tracking-wider text-white/90">
                  Achievements
                </p>
              </div>

              <!-- Progress ring -->
              <div class="mt-4 flex items-center gap-4">
                <div class="relative h-20 w-20 shrink-0">
                  <svg class="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none" stroke="white" stroke-width="3"
                      stroke-linecap="round"
                      :stroke-dasharray="`${achievementProgress}, 100`"
                    />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-lg font-black text-white">{{ achievementProgress }}%</span>
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="text-3xl font-black text-white">
                    {{ achievements.filter(a => a.unlocked).length }}
                    <span class="text-lg text-white/70">/ {{ achievements.length }}</span>
                  </p>
                  <p class="mt-0.5 text-[10px] font-bold text-white/80">unlocked</p>
                </div>
              </div>

              <!-- Badges strip -->
              <div class="mt-4 flex gap-2 overflow-x-auto pb-1">
                <div
                  v-for="a in achievements"
                  :key="a.id"
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition"
                  :class="
                    a.unlocked
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/30'
                  "
                  :title="a.name"
                >
                  <component :is="a.icon" class="h-4 w-4" />
                </div>
              </div>
            </div>

          </section>

          <!-- =====================================================
               TAB: EDIT PROFILE
          ====================================================== -->
          <section v-else-if="activeTab === 'edit'" class="flex flex-col gap-6">

            <!-- Personal Information -->
            <div class="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800">
              <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                <div>
                  <h2 class="text-lg font-black">Personal Information</h2>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-white/60">
                    Update your public profile details
                  </p>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-600 disabled:opacity-50"
                  :disabled="savingProfile"
                  @click="saveProfile"
                >
                  <SaveIcon class="h-3.5 w-3.5" />
                  {{ savingProfile ? 'Saving...' : 'Save' }}
                </button>
              </div>

              <div class="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Full Name
                  </label>
                  <input
                    v-model="form.name"
                    type="text"
                    class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                    :class="inputClass(errors.name)"
                    @input="errors.name = ''"
                  />
                  <p v-if="errors.name" class="mt-1 text-xs font-bold text-red-500">{{ errors.name }}</p>
                </div>

                <div>
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Username
                  </label>
                  <div class="relative">
                    <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">@</span>
                    <input
                      v-model="form.username"
                      type="text"
                      class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-black dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Email
                  </label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                    :class="inputClass(errors.email)"
                    @input="errors.email = ''"
                  />
                  <p v-if="errors.email" class="mt-1 text-xs font-bold text-red-500">{{ errors.email }}</p>
                </div>

                <div>
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Country
                  </label>
                  <input
                    v-model="form.country"
                    type="text"
                    placeholder="e.g. United States"
                    class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-black dark:text-white"
                  />
                </div>

                <div class="sm:col-span-2">
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Bio
                  </label>
                  <textarea
                    v-model="form.bio"
                    rows="4"
                    maxlength="240"
                    placeholder="Tell us a little about yourself..."
                    class="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-black dark:text-white"
                  ></textarea>
                  <p class="mt-1 text-right text-[10px] font-bold text-slate-400">
                    {{ (form.bio || '').length }} / 240
                  </p>
                </div>
              </div>
            </div>

            <!-- Preferences -->
            <div class="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800">
              <div class="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                <h2 class="text-lg font-black">Preferences</h2>
                <p class="mt-0.5 text-xs text-slate-500 dark:text-white/60">
                  Fine-tune your Markverse experience
                </p>
              </div>
              <div class="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
                <ToggleRow
                  v-model="prefs.autoplay"
                  label="Autoplay next episode"
                  hint="Automatically play the next episode when one ends."
                />
                <ToggleRow
                  v-model="prefs.notifications"
                  label="Email notifications"
                  hint="Get notified about new releases and account activity."
                />
                <ToggleRow
                  v-model="prefs.publicProfile"
                  label="Public profile"
                  hint="Allow other users to see your profile and activity."
                />
                <ToggleRow
                  v-model="prefs.reduceMotion"
                  label="Reduce motion"
                  hint="Minimize animations across the app."
                />
              </div>
            </div>

          </section>

          <!-- =====================================================
               TAB: ACTIVITY (timeline)
          ====================================================== -->
          <section v-else-if="activeTab === 'activity'">
            <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800">
              <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="text-lg font-black">Recent Activity</h2>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-white/60">
                    Your latest actions across Markverse
                  </p>
                </div>
                <select
                  v-model="activityFilter"
                  class="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 outline-none dark:bg-blue-500/10 dark:text-blue-300"
                >
                  <option value="all">All activity</option>
                  <option value="watch">Watching</option>
                  <option value="download">Downloads</option>
                  <option value="social">Social</option>
                </select>
              </div>

              <div v-if="filteredActivity.length" class="relative flex flex-col gap-0">
                <!-- Timeline line -->
                <div class="absolute bottom-2 left-5 top-2 w-px bg-slate-100 dark:bg-slate-800"></div>

                <div
                  v-for="a in filteredActivity"
                  :key="a.id"
                  class="relative flex items-start gap-4 py-3"
                >
                  <div
                    class="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-4 ring-white dark:bg-blue-500/20 dark:text-blue-300 dark:ring-black"
                  >
                    <component :is="a.icon" class="h-4 w-4" />
                  </div>
                  <div class="min-w-0 flex-1 pt-1">
                    <p class="text-sm font-bold">{{ a.text }}</p>
                    <p class="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-white/60">
                      {{ a.time }}
                    </p>
                  </div>
                  <button
                    v-if="a.actionLabel"
                    type="button"
                    class="shrink-0 rounded-full bg-blue-500 px-3 py-1.5 text-[10px] font-black text-white transition hover:bg-blue-600"
                    @click="a.action?.()"
                  >
                    {{ a.actionLabel }}
                  </button>
                </div>
              </div>

              <div v-else class="rounded-xl bg-blue-50/40 p-6 text-center dark:bg-blue-500/5">
                <ClockIcon class="mx-auto mb-2 h-8 w-8 text-blue-300 dark:text-blue-500/40" />
                <p class="text-sm font-bold text-slate-500 dark:text-white/70">
                  No activity yet.
                </p>
              </div>
            </div>
          </section>

          <!-- =====================================================
               TAB: DOWNLOADS (card grid)
          ====================================================== -->
          <section v-else-if="activeTab === 'downloads'">
            <div v-if="downloads.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="d in downloads"
                :key="d.id"
                class="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-black dark:ring-slate-800"
              >
                <div
                  class="relative h-32 bg-gradient-to-br from-blue-600 to-blue-900"
                  :style="posterStyle(d.image)"
                >
                  <div class="absolute inset-0 flex items-center justify-center text-3xl font-black text-white/40">
                    <span v-if="!d.image">{{ initials(d.title) }}</span>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                    <div
                      class="h-full bg-blue-500 transition-all"
                      :style="{ width: `${d.progress}%` }"
                    ></div>
                  </div>
                </div>
                <div class="p-4">
                  <p class="truncate text-sm font-black">{{ d.title }}</p>
                  <div class="mt-1.5 flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-white/60">
                    <span>{{ d.quality }}</span>
                    <span>•</span>
                    <span>{{ d.size }}</span>
                    <span class="ml-auto text-blue-600 dark:text-blue-400">
                      {{ d.progress >= 100 ? 'Completed' : `${d.progress}%` }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else
              class="flex min-h-[280px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800"
            >
              <DownloadIcon class="mb-3 h-12 w-12 text-blue-200 dark:text-blue-500/40" />
              <h2 class="text-xl font-black">No downloads yet</h2>
              <p class="mt-2 text-sm text-slate-500 dark:text-white/70">
                Download titles to watch offline.
              </p>
            </div>
          </section>

          <!-- =====================================================
               TAB: NOTIFICATIONS
          ====================================================== -->
          <section v-else-if="activeTab === 'notifications'" class="flex flex-col gap-3">
            <div
              v-for="n in notifications"
              :key="n.id"
              class="relative flex items-start gap-3 overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 transition hover:shadow-md dark:bg-black"
              :class="!n.read
                ? 'ring-blue-500/30 dark:ring-blue-500/40'
                : 'ring-slate-100 dark:ring-slate-800'"
            >
              <div v-if="!n.read" class="absolute left-0 top-0 h-full w-1 bg-blue-500"></div>

              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                <component :is="n.icon" class="h-4 w-4" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-black">{{ n.title }}</p>
                  <span v-if="!n.read" class="h-2 w-2 shrink-0 rounded-full bg-blue-500"></span>
                </div>
                <p class="mt-0.5 text-xs text-slate-600 dark:text-white/70">{{ n.text }}</p>
                <p class="mt-1 text-[10px] font-bold text-slate-400">{{ n.time }}</p>
              </div>

              <button
                v-if="!n.read"
                type="button"
                class="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
                @click="n.read = true"
              >
                Mark read
              </button>
            </div>

            <div
              v-if="!notifications.length"
              class="flex min-h-[280px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800"
            >
              <BellIcon class="mb-3 h-12 w-12 text-blue-200 dark:text-blue-500/40" />
              <h2 class="text-xl font-black">No notifications</h2>
              <p class="mt-2 text-sm text-slate-500 dark:text-white/70">
                You're all caught up.
              </p>
            </div>
          </section>

          <!-- =====================================================
               TAB: SECURITY (2-column)
          ====================================================== -->
          <section v-else-if="activeTab === 'security'" class="grid grid-cols-1 gap-6 lg:grid-cols-2">

            <!-- Password -->
            <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800">
              <div class="flex items-center gap-2">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <LockIcon class="h-5 w-5" />
                </div>
                <div>
                  <h2 class="text-lg font-black">Password</h2>
                  <p class="text-xs text-slate-500 dark:text-white/60">
                    {{ security.passwordHint || 'Manage your account password.' }}
                  </p>
                </div>
              </div>

              <div class="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  class="rounded-xl bg-blue-500 px-5 py-3 text-xs font-black text-white transition hover:bg-blue-600"
                  @click="openPasswordModal"
                >
                  <KeyIcon class="mr-1.5 inline h-3.5 w-3.5" />
                  Change Password
                </button>
                <button
                  type="button"
                  class="rounded-xl bg-blue-50 px-5 py-3 text-xs font-black text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
                  @click="toast('Reset link sent to your email', 'success')"
                >
                  <MailIcon class="mr-1.5 inline h-3.5 w-3.5" />
                  Send Reset Link
                </button>
              </div>
            </div>

            <!-- Active Sessions -->
            <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800">
              <div class="mb-4 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <MonitorIcon class="h-5 w-5" />
                  </div>
                  <h2 class="text-lg font-black">Active Sessions</h2>
                </div>
                <span class="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {{ sessions.length }}
                </span>
              </div>

              <div v-if="sessions.length" class="flex flex-col gap-2">
                <div
                  v-for="s in sessions"
                  :key="s.id"
                  class="flex items-center gap-3 rounded-xl bg-blue-50/50 p-3 dark:bg-blue-500/5"
                >
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 dark:bg-black dark:text-blue-300">
                    <component :is="s.icon" class="h-4 w-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="truncate text-xs font-black">{{ s.device }}</p>
                      <span
                        v-if="s.current"
                        class="rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-black text-white"
                      >
                        Current
                      </span>
                    </div>
                    <p class="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-white/60">
                      {{ s.location }} · {{ s.lastActive }}
                    </p>
                  </div>
                  <button
                    v-if="!s.current"
                    type="button"
                    class="shrink-0 rounded-full bg-red-50 px-2.5 py-1.5 text-[10px] font-black text-red-600 transition hover:bg-red-100 dark:bg-red-500/10"
                    @click="revokeSession(s)"
                  >
                    Revoke
                  </button>
                </div>
              </div>

              <p v-else class="text-xs text-slate-400 dark:text-white/60">
                No active sessions found.
              </p>

              <button
                v-if="sessions.length > 1"
                type="button"
                class="mt-4 w-full rounded-xl bg-blue-50 py-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
                @click="signOutAll"
              >
                <LogOutIcon class="mr-1.5 inline h-3.5 w-3.5" />
                Sign out of all other devices
              </button>
            </div>

            <!-- Danger zone (full width) -->
            <div class="rounded-2xl bg-red-50/40 p-6 ring-2 ring-red-200 dark:bg-red-500/5 dark:ring-red-500/30 lg:col-span-2">
              <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20">
                    <AlertTriangleIcon class="h-5 w-5" />
                  </div>
                  <div>
                    <h2 class="text-lg font-black text-red-600">Danger Zone</h2>
                    <p class="text-xs text-slate-600 dark:text-white/70">
                      Once you delete your account, there is no going back.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  class="rounded-full bg-red-500 px-5 py-2.5 text-xs font-black text-white transition hover:bg-red-600"
                  @click="confirmDeleteAccount"
                >
                  <TrashIcon class="mr-1.5 inline h-3.5 w-3.5" />
                  Delete Account
                </button>
              </div>
            </div>

          </section>

        </div>
      </section>
    </main>

    <!-- =========================================================
         AVATAR PICKER (slide-up sheet)
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
          class="fixed inset-0 z-[150] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
          @click.self="avatarPickerOpen = false"
        >
          <Transition
            appear
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="translate-y-full sm:translate-y-4 sm:opacity-0"
            leave-active-class="transition duration-200 ease-in"
            leave-to-class="translate-y-full sm:translate-y-4 sm:opacity-0"
          >
            <div class="w-full max-w-2xl rounded-t-3xl bg-white shadow-2xl dark:bg-black dark:ring-1 dark:ring-slate-800 sm:rounded-2xl">
              <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                <div>
                  <h3 class="text-lg font-black">Choose Profile Picture</h3>
                  <p class="text-xs text-slate-500 dark:text-white/60">
                    Pick from the library or upload a new file.
                  </p>
                </div>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
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
                    : 'border-slate-300 bg-blue-50/40 dark:border-slate-700 dark:bg-blue-500/5'"
                  @dragover.prevent="avatarDragging = true"
                  @dragleave.prevent="avatarDragging = false"
                  @drop.prevent="onAvatarDrop"
                >
                  <UploadCloudIcon class="mb-2 h-8 w-8 text-blue-500" />
                  <p class="text-sm font-black">Drag & drop an image here</p>
                  <p class="text-xs text-slate-400">Or browse your computer</p>
                  <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarFile" />
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
                    <div class="absolute inset-0 flex items-center justify-center bg-blue-500/40 opacity-0 transition group-hover:opacity-100">
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
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- =========================================================
         PASSWORD MODAL
    ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="passwordModalOpen"
          class="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          @click.self="passwordModalOpen = false"
        >
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-black dark:ring-1 dark:ring-slate-800">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h3 class="text-xl font-black">Change Password</h3>
                <p class="mt-0.5 text-xs text-slate-500 dark:text-white/70">
                  Choose a strong, unique password.
                </p>
              </div>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
                @click="passwordModalOpen = false"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>

            <div class="flex flex-col gap-3">
              <div>
                <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Current Password
                </label>
                <div class="relative">
                  <input
                    v-model="passwordForm.current"
                    :type="showPassword.current ? 'text' : 'password'"
                    class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-black dark:text-white"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                    @click="showPassword.current = !showPassword.current"
                  >
                    <component :is="showPassword.current ? EyeOffIcon : EyeIcon" class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  New Password
                </label>
                <div class="relative">
                  <input
                    v-model="passwordForm.next"
                    :type="showPassword.next ? 'text' : 'password'"
                    class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-black dark:text-white"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                    @click="showPassword.next = !showPassword.next"
                  >
                    <component :is="showPassword.next ? EyeOffIcon : EyeIcon" class="h-4 w-4" />
                  </button>
                </div>

                <div v-if="passwordForm.next" class="mt-2">
                  <div class="flex gap-1">
                    <div
                      v-for="i in 4"
                      :key="i"
                      class="h-1 flex-1 rounded-full transition"
                      :class="i <= passwordStrength.level ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-800'"
                    ></div>
                  </div>
                  <p class="mt-1 text-[10px] font-bold" :class="passwordStrength.textColor">
                    {{ passwordStrength.label }}
                  </p>
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Confirm New Password
                </label>
                <input
                  v-model="passwordForm.confirm"
                  :type="showPassword.confirm ? 'text' : 'password'"
                  class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-black dark:text-white"
                />
              </div>

              <p v-if="passwordError" class="text-xs font-bold text-red-500">
                {{ passwordError }}
              </p>
            </div>

            <div class="mt-5 flex justify-end gap-3">
              <button
                class="rounded-full px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                @click="passwordModalOpen = false"
              >
                Cancel
              </button>
              <button
                class="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
                @click="submitPassword"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- =========================================================
         TOASTS (top-center)
    ========================================================== -->
    <Teleport to="body">
      <div class="pointer-events-none fixed inset-x-0 top-4 z-[300] flex flex-col items-center gap-2 px-4">
        <TransitionGroup
          enter-active-class="transition duration-200"
          enter-from-class="-translate-y-4 opacity-0"
          leave-active-class="transition duration-200"
          leave-to-class="-translate-y-4 opacity-0"
        >
          <div
            v-for="t in toasts"
            :key="t.id"
            class="pointer-events-auto flex w-full max-w-sm items-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-sm font-black shadow-lg"
            :class="{
              'bg-blue-500 text-white': t.type === 'success',
              'bg-red-500 text-white': t.type === 'error',
              'bg-slate-900 text-white dark:bg-white dark:text-black': t.type === 'info'
            }"
          >
            <CheckCircle2Icon v-if="t.type === 'success'" class="h-4 w-4 shrink-0" />
            <AlertCircleIcon v-else-if="t.type === 'error'" class="h-4 w-4 shrink-0" />
            <InfoIcon v-else class="h-4 w-4 shrink-0" />
            <span class="truncate">{{ t.message }}</span>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
/* =====================================================
   SCRIPT SECTION — UNCHANGED (100% logic preserved)
===================================================== */
import { computed, h, onMounted, reactive, ref } from 'vue'

import Header from '../Header.vue'

import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BellIcon,
  BookmarkIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  HeartIcon,
  ImageIcon,
  InfoIcon,
  KeyIcon,
  LockIcon,
  LogOutIcon,
  MailIcon,
  MapPinIcon,
  MonitorIcon,
  PencilIcon,
  PlayIcon,
  SaveIcon,
  SmartphoneIcon,
  SparklesIcon,
  TrashIcon,
  TrophyIcon,
  UploadCloudIcon,
  XIcon,
  ZapIcon,
  FilmIcon,
  StarIcon,
  AwardIcon,
  FlameIcon,
  CrownIcon
} from 'lucide-vue-next'

/* =====================================================
   ToggleRow
===================================================== */
const ToggleRow = (props, { emit }) => {
  const checked = props.modelValue
  return h('label', {
    class: 'flex cursor-pointer items-start gap-3 rounded-xl bg-blue-50/50 p-4 transition hover:bg-blue-50 dark:bg-blue-500/5 dark:hover:bg-blue-500/10'
  }, [
    h('input', {
      type: 'checkbox',
      checked,
      class: 'mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-500',
      onChange: (e) => emit('update:modelValue', e.target.checked)
    }),
    h('div', { class: 'min-w-0' }, [
      h('p', { class: 'text-sm font-black' }, props.label),
      h('p', { class: 'mt-0.5 text-[11px] text-slate-500 dark:text-white/60' }, props.hint)
    ])
  ])
}
ToggleRow.props = ['modelValue', 'label', 'hint']
ToggleRow.emits = ['update:modelValue']

/* =====================================================
   API HELPERS
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
  return res.json().catch(() => ({}))
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
   PROFILE STATE
===================================================== */
const loading = ref(true)
const error = ref(null)

const profile = reactive({
  role: 'User',
  joined: '',
  lastActive: ''
})

const form = reactive({
  name: '',
  email: '',
  username: '',
  country: '',
  bio: '',
  avatar: ''
})

const prefs = reactive({
  autoplay: true,
  notifications: true,
  publicProfile: false,
  reduceMotion: false
})

const security = reactive({
  passwordHint: ''
})

const errors = reactive({ name: '', email: '' })
const savingProfile = ref(false)
const avatarError = ref(false)

/* Cover */
const cover = ref('')
const coverStyle = computed(() => {
  if (!cover.value) return {}
  return {
    backgroundImage: `url("${cover.value}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
})

function triggerCoverPicker() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error')
      return
    }
    cover.value = URL.createObjectURL(file)
    toast('Cover updated', 'success')
  }
  input.click()
}

/* =====================================================
   HELPERS
===================================================== */
function initials(name) {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function inputClass(hasError) {
  return hasError
    ? 'border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-500/10'
    : 'border-slate-200 bg-white focus:border-blue-500 dark:border-slate-800 dark:bg-black dark:text-white'
}

function posterStyle(image) {
  if (!image) return {}
  return {
    backgroundImage: `url("${image}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
}

/* =====================================================
   FETCH PROFILE DATA
===================================================== */
const continueWatching = ref([])
const genrePreferences = ref([])
const weeklyActivity = ref([])
const achievements = ref([])
const activity = ref([])
const downloads = ref([])
const notifications = ref([])
const sessions = ref([])
const stats = ref({})

async function fetchProfile() {
  loading.value = true
  error.value = null

  try {
    const data = await apiFetch('/profile')
    const payload = data?.data ?? data

    if (payload.profile) Object.assign(profile, payload.profile)
    if (payload.user) {
      Object.assign(form, {
        name: payload.user.name ?? '',
        email: payload.user.email ?? '',
        username: payload.user.username ?? '',
        country: payload.user.country ?? '',
        bio: payload.user.bio ?? '',
        avatar: payload.user.avatar ?? ''
      })
    }
    if (payload.preferences) Object.assign(prefs, payload.preferences)
    if (payload.security) Object.assign(security, payload.security)

    continueWatching.value = Array.isArray(payload.continueWatching) ? payload.continueWatching : []
    genrePreferences.value = Array.isArray(payload.genrePreferences) ? payload.genrePreferences : []
    weeklyActivity.value = Array.isArray(payload.weeklyActivity) ? payload.weeklyActivity : []
    activity.value = Array.isArray(payload.activity) ? payload.activity : []
    downloads.value = Array.isArray(payload.downloads) ? payload.downloads : []
    notifications.value = Array.isArray(payload.notifications) ? payload.notifications : []
    sessions.value = Array.isArray(payload.sessions) ? payload.sessions : []
    stats.value = payload.stats ?? {}

    achievements.value = (payload.achievements ?? []).map((a) => ({
      ...a,
      icon: iconFor(a.icon)
    }))

    notifications.value = notifications.value.map((n) => ({
      ...n,
      icon: iconFor(n.icon) || BellIcon
    }))

    sessions.value = sessions.value.map((s) => ({
      ...s,
      icon: iconFor(s.icon) || MonitorIcon
    }))
  } catch (err) {
    error.value = err?.message || 'Failed to load profile.'
  } finally {
    loading.value = false
  }
}

function iconFor(name) {
  const map = {
    play: PlayIcon,
    download: DownloadIcon,
    star: StarIcon,
    heart: HeartIcon,
    bell: BellIcon,
    clock: ClockIcon,
    film: FilmIcon,
    trophy: TrophyIcon,
    award: AwardIcon,
    flame: FlameIcon,
    crown: CrownIcon,
    zap: ZapIcon,
    bookmark: BookmarkIcon,
    sparkles: SparklesIcon,
    monitor: MonitorIcon,
    smartphone: SmartphoneIcon,
    pencil: PencilIcon,
    trash: TrashIcon
  }
  if (!name) return undefined
  return map[name.toLowerCase()] || undefined
}

/* =====================================================
   QUICK STATS
===================================================== */
const quickStats = computed(() => {
  const s = stats.value || {}
  return [
    { label: 'Downloads', value: s.downloads ?? downloads.value.length, hint: s.downloadsHint ?? '', icon: DownloadIcon, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Hours Watched', value: s.hoursWatched ?? 0, hint: s.hoursWatchedHint ?? '', icon: ClockIcon, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Reviews', value: s.reviews ?? 0, hint: s.reviewsHint ?? '', icon: StarIcon, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Streak', value: s.streak ?? '0d', hint: s.streakHint ?? '', icon: FlameIcon, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Level', value: s.level ?? '1', hint: s.levelHint ?? '', icon: CrownIcon, color: 'text-blue-600 dark:text-blue-400' }
  ]
})

/* =====================================================
   WEEKLY ACTIVITY
===================================================== */
const maxWeeklyHours = computed(() => {
  const hours = weeklyActivity.value.map(d => d.hours ?? 0)
  return Math.max(...hours, 1)
})
const weeklyTotal = computed(() =>
  weeklyActivity.value.reduce((sum, d) => sum + (d.hours ?? 0), 0)
)

/* =====================================================
   ACHIEVEMENT PROGRESS
===================================================== */
const achievementProgress = computed(() => {
  const total = achievements.value.length
  if (!total) return 0
  const unlocked = achievements.value.filter(a => a.unlocked).length
  return Math.round((unlocked / total) * 100)
})

/* =====================================================
   ACTIVITY FILTER
===================================================== */
const activityFilter = ref('all')

const filteredActivity = computed(() => {
  if (activityFilter.value === 'all') return activity.value
  return activity.value.filter(a => a.type === activityFilter.value)
})

/* =====================================================
   TABS
===================================================== */
const tabs = computed(() => [
  { label: 'Overview', value: 'overview', icon: SparklesIcon },
  { label: 'Edit Profile', value: 'edit', icon: PencilIcon },
  { label: 'Activity', value: 'activity', icon: ClockIcon },
  { label: 'Downloads', value: 'downloads', icon: DownloadIcon, badge: downloads.value.length || null },
  { label: 'Notifications', value: 'notifications', icon: BellIcon, badge: notifications.value.filter(n => !n.read).length || null },
  { label: 'Security', value: 'security', icon: LockIcon }
])
const activeTab = ref('overview')

/* =====================================================
   SAVE PROFILE
===================================================== */
async function saveProfile() {
  errors.name = ''
  errors.email = ''

  if (!form.name.trim()) errors.name = 'Name is required.'
  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Invalid email format.'

  if (errors.name || errors.email) {
    toast('Please fix the errors.', 'error')
    return
  }

  savingProfile.value = true
  try {
    await apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: form.name,
        username: form.username,
        email: form.email,
        country: form.country,
        bio: form.bio,
        avatar: form.avatar,
        preferences: { ...prefs }
      })
    })
    toast('Profile updated successfully', 'success')
  } catch (err) {
    toast(err?.message || 'Failed to save profile.', 'error')
  } finally {
    savingProfile.value = false
  }
}

/* =====================================================
   AVATAR PICKER
===================================================== */
const avatarPickerOpen = ref(false)
const avatarDragging = ref(false)
const avatarInput = ref(null)

const avatarLibrary = Array.from({ length: 12 }, (_, i) => `https://i.pravatar.cc/150?img=${i + 1}`)

function openAvatarPicker() {
  avatarPickerOpen.value = true
  avatarDragging.value = false
}

function pickAvatar(url) {
  form.avatar = url
  avatarError.value = false
  avatarPickerOpen.value = false
  toast('Profile picture updated', 'success')
}

function onAvatarFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast('Please choose an image file.', 'error')
    return
  }
  pickAvatar(URL.createObjectURL(file))
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
  pickAvatar(URL.createObjectURL(file))
}

/* =====================================================
   SECURITY — password
===================================================== */
const passwordModalOpen = ref(false)
const passwordForm = reactive({ current: '', next: '', confirm: '' })
const passwordError = ref('')
const showPassword = reactive({ current: false, next: false, confirm: false })

function openPasswordModal() {
  passwordForm.current = ''
  passwordForm.next = ''
  passwordForm.confirm = ''
  passwordError.value = ''
  passwordModalOpen.value = true
}

const passwordStrength = computed(() => {
  const p = passwordForm.next
  let level = 0
  if (p.length >= 8) level++
  if (/[A-Z]/.test(p)) level++
  if (/[0-9]/.test(p)) level++
  if (/[^A-Za-z0-9]/.test(p)) level++

  const map = {
    0: { label: 'Too weak', color: 'bg-red-500', textColor: 'text-red-500' },
    1: { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' },
    2: { label: 'Fair', color: 'bg-blue-400', textColor: 'text-blue-500' },
    3: { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-500' },
    4: { label: 'Strong', color: 'bg-blue-600', textColor: 'text-blue-600' }
  }
  return { level, ...map[level] }
})

async function submitPassword() {
  passwordError.value = ''

  if (!passwordForm.current) {
    passwordError.value = 'Current password is required.'
    return
  }
  if (passwordForm.next.length < 8) {
    passwordError.value = 'New password must be at least 8 characters.'
    return
  }
  if (passwordForm.next !== passwordForm.confirm) {
    passwordError.value = 'Passwords do not match.'
    return
  }

  try {
    await apiFetch('/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        current: passwordForm.current,
        next: passwordForm.next
      })
    })
    passwordModalOpen.value = false
    toast('Password updated successfully', 'success')
  } catch (err) {
    passwordError.value = err?.message || 'Failed to update password.'
  }
}

/* =====================================================
   SESSIONS
===================================================== */
async function revokeSession(s) {
  try {
    await apiFetch(`/profile/sessions/${s.id}`, { method: 'DELETE' })
    sessions.value = sessions.value.filter(x => x.id !== s.id)
    toast(`Revoked session on ${s.device}`, 'info')
  } catch (err) {
    toast(err?.message || 'Failed to revoke session.', 'error')
  }
}

async function signOutAll() {
  if (!window.confirm('Sign out of all other devices?')) return
  try {
    await apiFetch('/profile/sessions', { method: 'DELETE' })
    sessions.value = sessions.value.filter(s => s.current)
    toast('Signed out of all other devices', 'success')
  } catch (err) {
    toast(err?.message || 'Failed to sign out.', 'error')
  }
}

/* =====================================================
   DELETE ACCOUNT
===================================================== */
async function confirmDeleteAccount() {
  const confirmed = window.confirm(
    'Delete your account? This action cannot be undone.'
  )
  if (!confirmed) return

  try {
    await apiFetch('/profile', { method: 'DELETE' })
    toast('Account deletion requested', 'error')
  } catch (err) {
    toast(err?.message || 'Failed to delete account.', 'error')
  }
}

/* =====================================================
   LIFECYCLE
===================================================== */
onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #bfdbfe; border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: #3b82f6; }

.dark ::-webkit-scrollbar-thumb { background: #1e3a8a; }
.dark ::-webkit-scrollbar-thumb:hover { background: #2563eb; }

/* Hide scrollbar on tab bar but keep scroll */
nav::-webkit-scrollbar { display: none; }
nav { -ms-overflow-style: none; scrollbar-width: none; }
</style>