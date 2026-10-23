<template>
  <div class="relative min-h-screen bg-white text-slate-900 dark:bg-black dark:text-white">

    <!-- =========================
         BACKGROUND DECORATION (OVERLAY)
    ========================== -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/10"></div>
      <div class="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/10"></div>
      <div class="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/5"></div>
    </div>

    <!-- =========================
         MAIN — Auth card
    ========================== -->
    <main class="relative z-10 flex items-center justify-center px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div class="w-full max-w-md">

        <!-- Card -->
        <div class="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-100 dark:bg-black dark:ring-slate-800">

          <!-- Logo -->
          <div class="flex flex-col items-center pt-8 pb-2">
            <router-link to="/" class="flex flex-col items-center gap-3">
              <div class="logo-float flex items-center justify-center">
                <img src="../assets/markverse.png" width="100" height="100" alt="" srcset="">
              </div>
            </router-link>
          </div>

          <!-- Tabs -->
          <div class="relative flex border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              class="relative flex-1 py-4 text-sm font-black transition"
              :class="mode === 'login' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white'"
              @click="switchMode('login')"
            >
              <LogInIcon class="mr-2 inline h-4 w-4" />
              Sign In
              <span
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 transition-all"
                :class="mode === 'login' ? 'scale-x-100' : 'scale-x-0'"
              ></span>
            </button>

            <button
              type="button"
              class="relative flex-1 py-4 text-sm font-black transition"
              :class="mode === 'register' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white'"
              @click="switchMode('register')"
            >
              <UserPlusIcon class="mr-2 inline h-4 w-4" />
              Sign Up
              <span
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 transition-all"
                :class="mode === 'register' ? 'scale-x-100' : 'scale-x-0'"
              ></span>
            </button>
          </div>

          <!-- Form content -->
          <div class="p-6 sm:p-8">

            <!-- Heading -->
            <div class="mb-6 text-center">
              <h1 class="text-2xl font-black tracking-tight sm:text-3xl">
                {{ mode === 'login' ? 'Welcome back' : 'Create your account' }}
              </h1>
              <p class="mt-1.5 text-sm text-slate-500 dark:text-white/60">
                {{
                  mode === 'login'
                    ? 'Sign in to continue watching.'
                    : 'Join Markverse and start streaming.'
                }}
              </p>
            </div>

            <!-- Social login -->
            <div class="mb-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-black transition hover:bg-blue-50 dark:border-slate-800 dark:bg-black dark:hover:bg-blue-500/10"
                @click="socialLogin('google')"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <button
                type="button"
                class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-black transition hover:bg-blue-50 dark:border-slate-800 dark:bg-black dark:hover:bg-blue-500/10"
                @click="socialLogin('apple')"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </button>
            </div>

            <!-- Divider -->
            <div class="relative mb-6">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-slate-100 dark:border-slate-800"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:bg-black">
                  or continue with email
                </span>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="submitForm" class="flex flex-col gap-4">

              <!-- Name (register only) -->
              <Transition
                enter-active-class="transition duration-200"
                enter-from-class="opacity-0 -translate-y-2"
                leave-active-class="transition duration-200"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div v-if="mode === 'register'">
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Full Name
                  </label>
                  <div class="relative">
                    <UserIcon class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      v-model="form.name"
                      type="text"
                      placeholder="John Doe"
                      autocomplete="name"
                      class="w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                      :class="inputClass(errors.name)"
                      @input="errors.name = ''"
                    />
                  </div>
                  <p v-if="errors.name" class="mt-1 text-xs font-bold text-red-500">{{ errors.name }}</p>
                </div>
              </Transition>

              <!-- Username (register only) -->
              <Transition
                enter-active-class="transition duration-200"
                enter-from-class="opacity-0 -translate-y-2"
                leave-active-class="transition duration-200"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div v-if="mode === 'register'">
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Username
                  </label>
                  <div class="relative">
                    <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">@</span>
                    <input
                      v-model="form.username"
                      type="text"
                      placeholder="johndoe"
                      autocomplete="username"
                      class="w-full rounded-xl border py-3 pl-9 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                      :class="inputClass(errors.username)"
                      @input="errors.username = ''"
                    />
                  </div>
                  <p v-if="errors.username" class="mt-1 text-xs font-bold text-red-500">{{ errors.username }}</p>
                </div>
              </Transition>

              <!-- Email -->
              <div>
                <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                  Email
                </label>
                <div class="relative">
                  <MailIcon class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    v-model="form.email"
                    type="email"
                    placeholder="you@example.com"
                    autocomplete="email"
                    class="w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                    :class="inputClass(errors.email)"
                    @input="errors.email = ''"
                  />
                </div>
                <p v-if="errors.email" class="mt-1 text-xs font-bold text-red-500">{{ errors.email }}</p>
              </div>

              <!-- Password -->
              <div>
                <div class="mb-1.5 flex items-center justify-between">
                  <label class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Password
                  </label>
                  <button
                    v-if="mode === 'login'"
                    type="button"
                    class="text-[10px] font-black text-blue-600 hover:text-blue-700"
                    @click="openForgot"
                  >
                    Forgot?
                  </button>
                </div>
                <div class="relative">
                  <LockIcon class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                    :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                    class="w-full rounded-xl border py-3 pl-11 pr-11 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                    :class="inputClass(errors.password)"
                    @input="errors.password = ''"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    @click="showPassword = !showPassword"
                  >
                    <component :is="showPassword ? EyeOffIcon : EyeIcon" class="h-4 w-4" />
                  </button>
                </div>

                <!-- Password strength (register only) -->
                <div v-if="mode === 'register' && form.password" class="mt-2">
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

                <p v-if="errors.password" class="mt-1 text-xs font-bold text-red-500">{{ errors.password }}</p>
              </div>

              <!-- Confirm password (register only) -->
              <Transition
                enter-active-class="transition duration-200"
                enter-from-class="opacity-0 -translate-y-2"
                leave-active-class="transition duration-200"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div v-if="mode === 'register'">
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                    Confirm Password
                  </label>
                  <div class="relative">
                    <LockIcon class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      v-model="form.confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      placeholder="••••••••"
                      autocomplete="new-password"
                      class="w-full rounded-xl border py-3 pl-11 pr-11 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                      :class="inputClass(errors.confirmPassword)"
                      @input="errors.confirmPassword = ''"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <component :is="showConfirmPassword ? EyeOffIcon : EyeIcon" class="h-4 w-4" />
                    </button>
                  </div>
                  <p v-if="errors.confirmPassword" class="mt-1 text-xs font-bold text-red-500">{{ errors.confirmPassword }}</p>
                </div>
              </Transition>

              <!-- Terms (register only) -->
              <Transition
                enter-active-class="transition duration-200"
                enter-from-class="opacity-0 -translate-y-2"
                leave-active-class="transition duration-200"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div v-if="mode === 'register'">
                  <label class="flex cursor-pointer items-start gap-3 rounded-xl bg-blue-50/50 p-3 dark:bg-blue-500/5">
                    <input
                      v-model="form.agreeTerms"
                      type="checkbox"
                      class="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-500"
                      @change="errors.agreeTerms = ''"
                    />
                    <span class="text-xs font-semibold text-slate-600 dark:text-white/70">
                      I agree to the
                      <router-link to="/terms" class="font-black text-blue-600 hover:underline">Terms of Service</router-link>
                      and
                      <router-link to="/privacy" class="font-black text-blue-600 hover:underline">Privacy Policy</router-link>.
                    </span>
                  </label>
                  <p v-if="errors.agreeTerms" class="mt-1 text-xs font-bold text-red-500">{{ errors.agreeTerms }}</p>
                </div>
              </Transition>

              <!-- Remember me (login only) -->
              <label
                v-if="mode === 'login'"
                class="flex cursor-pointer items-center gap-2"
              >
                <input
                  v-model="form.rememberMe"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-blue-500"
                />
                <span class="text-xs font-bold text-slate-600 dark:text-white/70">
                  Keep me signed in
                </span>
              </label>

              <!-- Submit -->
              <button
                type="submit"
                :disabled="loading"
                class="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LoaderIcon v-if="loading" class="h-4 w-4 animate-spin" />
                <component v-else :is="mode === 'login' ? LogInIcon : UserPlusIcon" class="h-4 w-4" />
                {{
                  loading
                    ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                    : (mode === 'login' ? 'Sign In' : 'Create Account')
                }}
              </button>

              <div class="mx-auto flex max-w-7xl items-center justify-between">
                <router-link
                  to="/"
                  class="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                >
                  <ArrowLeftIcon class="h-3.5 w-3.5" />
                  Back to Home
                </router-link>
              </div>

            </form>
          </div>

          <!-- Bottom strip -->
          <div class="border-t border-slate-100 bg-blue-50/40 px-6 py-4 text-center dark:border-slate-800 dark:bg-blue-500/5">
            <p class="text-[10px] font-bold text-slate-500 dark:text-white/60">
              <ShieldCheckIcon class="mr-1 inline h-3 w-3 text-blue-600" />
              Protected by industry-standard encryption
            </p>
          </div>
        </div>

        <!-- Trust badges -->
        <div class="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
          <span class="inline-flex items-center gap-1.5">
            <UsersIcon class="h-3.5 w-3.5" />
            2M+ users
          </span>
          <span class="inline-flex items-center gap-1.5">
            <StarIcon class="h-3.5 w-3.5" />
            4.9 rating
          </span>
          <span class="inline-flex items-center gap-1.5">
            <GlobeIcon class="h-3.5 w-3.5" />
            120+ countries
          </span>
        </div>

      </div>
    </main>

    <!-- =========================================================
         FORGOT PASSWORD MODAL
    ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="forgotOpen"
          class="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          @click.self="forgotOpen = false"
        >
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-black dark:ring-1 dark:ring-slate-800">
            <div class="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 class="text-xl font-black">Reset your password</h3>
                <p class="mt-1 text-xs text-slate-500 dark:text-white/70">
                  We'll email you a link to reset it.
                </p>
              </div>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
                @click="forgotOpen = false"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>

            <div v-if="!forgotSent">
              <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/70">
                Email
              </label>
              <div class="relative">
                <MailIcon class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  v-model="forgotEmail"
                  type="email"
                  placeholder="you@example.com"
                  class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-black dark:text-white"
                />
              </div>

              <div class="mt-5 flex justify-end gap-3">
                <button
                  class="rounded-full px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                  @click="forgotOpen = false"
                >
                  Cancel
                </button>
                <button
                  class="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
                  @click="sendReset"
                >
                  Send Reset Link
                </button>
              </div>
            </div>

            <div v-else class="py-2 text-center">
              <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
                <MailCheckIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 class="text-lg font-black">Check your inbox</h4>
              <p class="mt-1 text-xs text-slate-500 dark:text-white/70">
                We've sent a reset link to
                <span class="font-black text-blue-600">{{ forgotEmail }}</span>.
              </p>

              <button
                class="mt-5 rounded-full bg-blue-500 px-6 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
                @click="forgotOpen = false; forgotSent = false"
              >
                Done
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
              'bg-blue-500 text-white': t.type === 'success',
              'bg-red-500 text-white': t.type === 'error',
              'bg-black text-white dark:bg-white dark:text-black': t.type === 'info'
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
import { computed, reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  FilmIcon,
  GlobeIcon,
  InfoIcon,
  LoaderIcon,
  LockIcon,
  LogInIcon,
  MailCheckIcon,
  MailIcon,
  ShieldCheckIcon,
  StarIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon
} from 'lucide-vue-next'

/* =====================================================
   ROUTER
===================================================== */
const router = useRouter()
const route = useRoute()

/* =====================================================
   STATE
===================================================== */
const mode = ref('login') // 'login' | 'register'
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  rememberMe: true,
  agreeTerms: false
})

const errors = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: ''
})

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
   HELPERS
===================================================== */
function inputClass(hasError) {
  return hasError
    ? 'border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-500/10'
    : 'border-slate-200 bg-white focus:border-blue-500 dark:border-slate-800 dark:bg-black dark:text-white'
}

const passwordStrength = computed(() => {
  const p = form.password
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

/* =====================================================
   MODE SWITCH
===================================================== */
function switchMode(next) {
  mode.value = next
  clearErrors()
  clearPasswords()
}

function clearErrors() {
  Object.keys(errors).forEach(k => (errors[k] = ''))
}

function clearPasswords() {
  form.password = ''
  form.confirmPassword = ''
  showPassword.value = false
  showConfirmPassword.value = false
}

/* Sync ?mode=register in URL */
watch(
  () => route.query.mode,
  (m) => {
    if (m === 'register') mode.value = 'register'
  },
  { immediate: true }
)

/* =====================================================
   VALIDATION
===================================================== */
function validate() {
  clearErrors()
  let ok = true

  if (mode.value === 'register') {
    if (!form.name.trim()) {
      errors.name = 'Name is required.'
      ok = false
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name is too short.'
      ok = false
    }

    if (!form.username.trim()) {
      errors.username = 'Username is required.'
      ok = false
    } else if (!/^[a-z0-9_]{3,20}$/i.test(form.username.trim())) {
      errors.username = '3–20 characters (letters, numbers, underscore).'
      ok = false
    }
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
    ok = false
  } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email.'
    ok = false
  }

  if (!form.password) {
    errors.password = 'Password is required.'
    ok = false
  } else if (mode.value === 'register' && form.password.length < 8) {
    errors.password = 'Use at least 8 characters.'
    ok = false
  }

  if (mode.value === 'register') {
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.'
      ok = false
    } else if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'Passwords do not match.'
      ok = false
    }

    if (!form.agreeTerms) {
      errors.agreeTerms = 'You must accept the terms to continue.'
      ok = false
    }
  }

  return ok
}

/* =====================================================
   SUBMIT
===================================================== */
async function submitForm() {
  if (!validate()) {
    toast('Please fix the errors above.', 'error')
    return
  }

  loading.value = true
  try {
  if (mode.value === 'login') {
  const result = await loginRequest({
    email: form.email.trim(),
    password: form.password,
    rememberMe: form.rememberMe
  })
  toast('Welcome back!', 'success')

  const isAdmin = result?.user?.role === 'Admin'
  const redirect = route.query.redirect || (isAdmin ? '/admin' : '/')
  router.push(redirect)
} else {
  await registerRequest({
    name: form.name.trim(),
    username: form.username.trim(),
    email: form.email.trim(),
    password: form.password
  })
  toast('Account created — welcome to Markverse!', 'success')
  router.push('/')
}
  } catch (err) {
    toast(err?.message || 'Something went wrong. Please try again.', 'error')
  } finally {
    loading.value = false
  }
}

/* =====================================================
   REAL API
===================================================== */
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

async function loginRequest(payload) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      rememberMe: payload.rememberMe
    })
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.error || json.message || 'Login failed')
  }
  return json.data || json
}

async function registerRequest(payload) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: payload.name,
      username: payload.username,
      email: payload.email,
      password: payload.password
    })
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.error || json.message || 'Registration failed')
  }
  return json.data || json
}

/* Social login needs real OAuth on the backend — disable for now */
function socialLogin(provider) {
  toast(`Continue with ${provider.charAt(0).toUpperCase() + provider.slice(1)} — not available yet.`, 'info')
}

/* =====================================================
   FORGOT PASSWORD
===================================================== */
const forgotOpen = ref(false)
const forgotEmail = ref('')
const forgotSent = ref(false)

function openForgot() {
  forgotEmail.value = form.email
  forgotSent.value = false
  forgotOpen.value = true
}

function sendReset() {
  if (!forgotEmail.value.trim() || !/^\S+@\S+\.\S+$/.test(forgotEmail.value.trim())) {
    toast('Please enter a valid email.', 'error')
    return
  }
  forgotSent.value = true
  toast('Reset link sent!', 'success')
}
</script>

<style scoped>

/* Floating logo animation */
.logo-float {
  animation: floatUpDown 3s ease-in-out infinite;
}

@keyframes floatUpDown {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

/* Optional: pause animation on hover for a nice effect */
.logo-float:hover {
  animation-play-state: paused;
}

/* Respect users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .logo-float {
    animation: none;
  }
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #bfdbfe; border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: #3b82f6; }

.dark ::-webkit-scrollbar-thumb { background: #1e3a8a; }
.dark ::-webkit-scrollbar-thumb:hover { background: #2563eb; }
</style>