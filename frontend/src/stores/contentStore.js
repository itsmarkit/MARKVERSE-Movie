// stores/contentStore.js
import { ref, computed } from 'vue'

/* =====================================================
   API
===================================================== */
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')

async function apiFetch(path, options = {}) {
  const config = { ...options }
  const headers = { ...(options.headers || {}) }

  // Only set JSON content type when a JSON body is actually being sent.
  if (config.body && !(config.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...config,
    headers,
    credentials: 'include'
  })

  if (!res.ok) {
    let message = ''
    try {
      const payload = await res.json()
      message = payload?.error || payload?.message || ''
      if (!message && Array.isArray(payload?.details)) message = payload.details.join(', ')
    } catch {
      message = await res.text().catch(() => '')
    }
    throw new Error(message || `Request failed (${res.status})`)
  }

  if (res.status === 204) return null
  const text = await res.text().catch(() => '')
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

/* =====================================================
   HELPERS
===================================================== */
function unwrap(data) {
  return data?.data ?? data?.items ?? data ?? null
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function asDateMs(value, fallback = Date.now()) {
  if (!value) return fallback
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : fallback
}

/* =====================================================
   REACTIVE STATE
===================================================== */
export const contents = ref([])
export const users = ref([])
export const comments = ref([])
export const notifications = ref([])

export const loading = ref(false)
export const loadError = ref(null)

export const adminProfile = ref({
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

/* =====================================================
   NORMALISERS
===================================================== */
function normaliseContent(item) {
  if (!item || typeof item !== 'object') return null
  const id = item.id ?? item._id
  if (!id) return null

  const parts = Array.isArray(item.parts)
    ? item.parts.map(p => ({ url: p?.url || '' }))
    : []

  const episodes = Array.isArray(item.episodes)
    ? item.episodes.map(e => ({
        title: e?.title || '',
        url: e?.url || e?.videoUrl || '',
        episodeNumber: e?.episodeNumber ?? null,
        seasonNumber: e?.seasonNumber ?? 1,
        thumbnail: e?.thumbnail || '',
        duration: e?.duration || ''
      }))
    : []

  return {
    id: String(id),
    title: item.title ?? 'Untitled',
    type: item.type ?? (episodes.length ? 'Series' : 'Movie'),
    genre: item.genre ?? '',
    year: item.year ?? '',
    rating: item.rating ?? '',
    runtime: item.runtime ?? item.duration ?? '',
    duration: item.duration ?? item.runtime ?? '',
    country: item.country ?? '',
    quality: item.quality ?? 'HD',
    language: item.language ?? '',
    description: item.description ?? '',
    tags: item.tags ?? '',
    thumbnail: item.thumbnail ?? item.image ?? '',
    image: item.image ?? item.thumbnail ?? '',
    trailer: item.trailer ?? '',
    uploadMode: item.uploadMode ?? (episodes.length ? 'episodes' : parts.length ? 'parts' : 'single'),
    videoUrl: item.videoUrl ?? '',
    parts,
    partA: item.partA ?? parts[0]?.url ?? '',
    partB: item.partB ?? parts[1]?.url ?? '',
    episodes,
    episodeCount: Number(item.episodeCount ?? episodes.length ?? 0),
    pinned: Boolean(item.pinned),
    views: Number(item.views ?? 0),
    isTrending: Boolean(item.isTrending),
    genres: Array.isArray(item.genres) ? item.genres : [],
    _createdAt: asDateMs(item.createdAt, item._createdAt ?? Date.now())
  }
}

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
    joined: u.joined
      ? typeof u.joined === 'string'
        ? u.joined
        : new Date(u.joined).toISOString().slice(0, 10)
      : u.createdAt
        ? new Date(u.createdAt).toISOString().slice(0, 10)
        : '—',
    downloads: Number(u.downloads ?? 0),
    uploads: Number(u.uploads ?? 0),
    storage: u.storage ?? '0 MB',
    country: u.country ?? '',
    has2FA: Boolean(u.has2FA ?? u.twoFactorEnabled),
    canUpload: Boolean(u.canUpload ?? u.uploadPermission),
    featured: Boolean(u.featured),
    notes: u.notes ?? '',
    lastActive: u.lastActive ?? u.lastSeen ?? Date.now(),
    _createdAt: asDateMs(u.createdAt, u._createdAt ?? 0)
  }
}

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
    titleImage: c.titleImage ?? c.title?.thumbnail ?? c.title?.image ?? '',
    text: c.text ?? '',
    rating: Number(c.rating ?? 0),
    likes: Number(c.likes ?? 0),
    status: c.status ?? 'pending',
    pinned: Boolean(c.pinned),
    replies: Array.isArray(c.replies)
      ? c.replies.map(r => ({
          id: String(r?.id ?? r?._id ?? Date.now()),
          user: r?.user ?? r?.userName ?? 'Unknown',
          text: r?.text ?? '',
          _createdAt: asDateMs(r?.createdAt, r?._createdAt ?? Date.now())
        }))
      : [],
    _createdAt: asDateMs(c.createdAt, c._createdAt ?? Date.now())
  }
}

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
    stats: {
      delivered: Number(n.stats?.delivered ?? 0),
      opened: Number(n.stats?.opened ?? 0),
      clicked: Number(n.stats?.clicked ?? 0)
    },
    _createdAt: asDateMs(n.createdAt, n._createdAt ?? Date.now())
  }
}

/* =====================================================
   FETCHERS
===================================================== */
export async function fetchContents() {
  loading.value = true
  loadError.value = null
  try {
    const data = await apiFetch('/admin/content')
    const list = unwrap(data)
    contents.value = Array.isArray(list) ? list.map(normaliseContent).filter(Boolean) : []
    return contents.value
  } catch (err) {
    loadError.value = err?.message || 'Failed to load content.'
    throw err
  } finally {
    loading.value = false
  }
}

export async function fetchUsers() {
  loading.value = true
  loadError.value = null
  try {
    const data = await apiFetch('/admin/users')
    const list = unwrap(data)
    users.value = Array.isArray(list) ? list.map(normaliseUser).filter(Boolean) : []
    return users.value
  } catch (err) {
    loadError.value = err?.message || 'Failed to load users.'
    throw err
  } finally {
    loading.value = false
  }
}

export async function fetchComments() {
  loading.value = true
  loadError.value = null
  try {
    const data = await apiFetch('/admin/comments')
    const list = unwrap(data)
    comments.value = Array.isArray(list) ? list.map(normaliseComment).filter(Boolean) : []
    return comments.value
  } catch (err) {
    loadError.value = err?.message || 'Failed to load comments.'
    throw err
  } finally {
    loading.value = false
  }
}

export async function fetchNotifications() {
  loading.value = true
  loadError.value = null
  try {
    const data = await apiFetch('/admin/notifications')
    const list = unwrap(data)
    notifications.value = Array.isArray(list) ? list.map(normaliseNotification).filter(Boolean) : []
    return notifications.value
  } catch (err) {
    loadError.value = err?.message || 'Failed to load notifications.'
    throw err
  } finally {
    loading.value = false
  }
}

export async function fetchAdminProfile() {
  try {
    const data = await apiFetch('/admin/profile')
    const payload = unwrap(data) || {}
    Object.assign(adminProfile.value, {
      name: payload.name ?? '',
      email: payload.email ?? '',
      role: payload.role ?? 'Admin',
      bio: payload.bio ?? '',
      avatar: payload.avatar ?? '',
      phone: payload.phone ?? '',
      country: payload.country ?? '',
      has2FA: Boolean(payload.has2FA),
      notifications: {
        ...adminProfile.value.notifications,
        ...(payload.notifications || {})
      },
      preferences: {
        ...adminProfile.value.preferences,
        ...(payload.preferences || {})
      }
    })
    return adminProfile.value
  } catch (err) {
    console.warn('Failed to fetch admin profile:', err)
    throw err
  }
}

/* =====================================================
   CONTENT — CRUD
===================================================== */
export function makeId(title, type = 'Movie') {
  const base = slugify(title) || 'title'
  const suffix = type === 'Series' ? '-series' : ''
  const candidate = base + suffix
  const exists = contents.value.some(c => c.id === candidate)
  return exists ? `${candidate}-${Date.now().toString(36)}` : candidate
}

export async function addContent(item) {
  const payload = { ...item }
  if (!payload.id) payload.id = makeId(payload.title, payload.type)

  const data = await apiFetch('/admin/content', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  const created = normaliseContent(unwrap(data)) ?? {
    ...payload,
    id: payload.id,
    _createdAt: Date.now()
  }

  contents.value.unshift(created)
  return created
}

export async function updateContent(id, patch) {
  const data = await apiFetch(`/admin/content/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch)
  })

  const idx = contents.value.findIndex(c => c.id === id)
  const updated = normaliseContent(unwrap(data)) ?? (idx !== -1 ? { ...contents.value[idx], ...patch } : null)
  if (idx !== -1 && updated) contents.value[idx] = updated
  return updated
}

export async function deleteContent(id) {
  await apiFetch(`/admin/content/${encodeURIComponent(id)}`, { method: 'DELETE' })
  contents.value = contents.value.filter(c => c.id !== id)
}

export function getContentById(id) {
  return contents.value.find(c => c.id === id) || null
}

/* =====================================================
   USERS — CRUD
===================================================== */
export async function addUser(user) {
  const payload = { ...user }
  const data = await apiFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  const created = normaliseUser(unwrap(data)) ?? {
    id: payload.id || 'u' + Date.now(),
    name: payload.name || '',
    email: payload.email || '',
    role: payload.role || 'User',
    status: payload.status || 'Pending',
    avatar: payload.avatar || '',
    downloads: 0,
    uploads: 0,
    storage: '0 MB',
    country: payload.country || '',
    has2FA: Boolean(payload.has2FA),
    canUpload: Boolean(payload.canUpload),
    featured: false,
    notes: payload.notes || '',
    joined: new Date().toISOString().slice(0, 10),
    lastActive: Date.now(),
    _createdAt: Date.now()
  }

  users.value.unshift(created)
  return created
}

export async function updateUser(id, patch) {
  const data = await apiFetch(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch)
  })

  const idx = users.value.findIndex(u => u.id === id)
  const updated = normaliseUser(unwrap(data)) ?? (idx !== -1 ? { ...users.value[idx], ...patch } : null)
  if (idx !== -1 && updated) users.value[idx] = updated
  return updated
}

export async function deleteUser(id) {
  await apiFetch(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
  users.value = users.value.filter(u => u.id !== id)
}

export function getUserById(id) {
  return users.value.find(u => u.id === id) || null
}

/* =====================================================
   COMMENTS — CRUD
===================================================== */
export async function addComment(comment) {
  const data = await apiFetch('/admin/comments', {
    method: 'POST',
    body: JSON.stringify(comment)
  })

  const created = normaliseComment(unwrap(data)) ?? {
    id: 'c' + Date.now(),
    userId: '',
    userName: '',
    titleId: '',
    titleName: '',
    titleType: 'Movie',
    titleImage: '',
    text: '',
    rating: 5,
    likes: 0,
    status: 'pending',
    pinned: false,
    replies: [],
    _createdAt: Date.now()
  }

  comments.value.unshift(created)
  return created
}

export async function updateComment(id, patch) {
  const data = await apiFetch(`/admin/comments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch)
  })

  const idx = comments.value.findIndex(c => c.id === id)
  const updated = normaliseComment(unwrap(data)) ?? (idx !== -1 ? { ...comments.value[idx], ...patch } : null)
  if (idx !== -1 && updated) comments.value[idx] = updated
  return updated
}

export async function deleteComment(id) {
  await apiFetch(`/admin/comments/${encodeURIComponent(id)}`, { method: 'DELETE' })
  comments.value = comments.value.filter(c => c.id !== id)
}

export function getCommentById(id) {
  return comments.value.find(c => c.id === id) || null
}

export function getCommentsByTitle(titleId) {
  return comments.value.filter(c => c.titleId === titleId)
}

export function getCommentsByUser(userId) {
  return comments.value.filter(c => c.userId === userId)
}

export async function addReply(commentId, text) {
  const data = await apiFetch(`/admin/comments/${encodeURIComponent(commentId)}/replies`, {
    method: 'POST',
    body: JSON.stringify({ text })
  })

  const reply = unwrap(data) || {
    id: Date.now(),
    user: 'Admin',
    text,
    createdAt: new Date().toISOString()
  }

  const target = comments.value.find(c => c.id === commentId)
  if (target) {
    if (!Array.isArray(target.replies)) target.replies = []
    target.replies.push({
      id: String(reply.id ?? reply._id ?? Date.now()),
      user: reply.user ?? reply.userName ?? 'Admin',
      text: reply.text ?? text,
      _createdAt: asDateMs(reply.createdAt)
    })
  }
  return target
}

/* =====================================================
   NOTIFICATIONS — CRUD
===================================================== */
export async function addNotification(notification) {
  const data = await apiFetch('/admin/notifications', {
    method: 'POST',
    body: JSON.stringify(notification)
  })

  const created = normaliseNotification(unwrap(data)) ?? {
    id: 'n' + Date.now(),
    title: '',
    message: '',
    type: 'system',
    priority: 'normal',
    audience: 'All users',
    specificUserId: '',
    link: '',
    icon: 'bell',
    scheduled: false,
    scheduledAt: '',
    status: 'sent',
    read: false,
    pinned: false,
    stats: { delivered: 0, opened: 0, clicked: 0 },
    _createdAt: Date.now()
  }

  notifications.value.unshift(created)
  return created
}

export async function updateNotification(id, patch) {
  const data = await apiFetch(`/admin/notifications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch)
  })

  const idx = notifications.value.findIndex(n => n.id === id)
  const updated = normaliseNotification(unwrap(data)) ?? (idx !== -1 ? { ...notifications.value[idx], ...patch } : null)
  if (idx !== -1 && updated) notifications.value[idx] = updated
  return updated
}

export async function deleteNotification(id) {
  await apiFetch(`/admin/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' })
  notifications.value = notifications.value.filter(n => n.id !== id)
}

export function getNotificationById(id) {
  return notifications.value.find(n => n.id === id) || null
}

export async function markAllRead() {
  const ids = notifications.value.map(n => n.id)
  if (!ids.length) return

  await apiFetch('/admin/notifications/bulk/read', {
    method: 'PUT',
    body: JSON.stringify({ ids, read: true })
  })

  notifications.value.forEach(n => { n.read = true })
}

export const unreadCount = computed(() =>
  notifications.value.filter(n => !n.read).length
)

/* =====================================================
   PROFILE
===================================================== */
export async function saveAdminProfile(patch = adminProfile.value) {
  const data = await apiFetch('/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(patch)
  })
  const payload = unwrap(data)
  if (payload) Object.assign(adminProfile.value, payload)
  return adminProfile.value
}

export async function changeAdminPassword(current, next) {
  await apiFetch('/admin/profile/password', {
    method: 'PUT',
    body: JSON.stringify({ current, next })
  })
}

export async function toggleAdmin2FA(enabled) {
  const data = await apiFetch('/admin/profile/2fa', {
    method: 'PUT',
    body: JSON.stringify({ enabled })
  })
  adminProfile.value.has2FA = Boolean(unwrap(data)?.has2FA ?? enabled)
}

export async function revokeAdminSession(id) {
  await apiFetch(`/admin/profile/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function signOutAllSessions() {
  await apiFetch('/admin/profile/sessions', { method: 'DELETE' })
}

export async function deleteAdminAccount() {
  await apiFetch('/admin/profile', { method: 'DELETE' })
}

export async function saveAdminPreferences(preferences) {
  const data = await apiFetch('/admin/profile/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences)
  })
  const payload = unwrap(data)
  if (payload) adminProfile.value.preferences = payload
  return adminProfile.value.preferences
}

/* =====================================================
   FILE UPLOAD — progress-aware
===================================================== */
export function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      reject(new Error('A valid File object is required.'))
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/admin/upload`)
    xhr.withCredentials = true

    xhr.upload.onprogress = e => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          const url = json?.url ?? json?.data?.url ?? json?.path ?? json?.data?.path ?? ''
          if (!url) {
            reject(new Error('Upload succeeded but no URL was returned.'))
            return
          }
          resolve(url)
        } catch {
          reject(new Error('Invalid response from upload endpoint.'))
        }
      } else {
        let message = `Upload failed (${xhr.status}).`
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          message = json?.error || json?.message || message
        } catch {}
        reject(new Error(message))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload.'))
    xhr.onabort = () => reject(new Error('Upload cancelled.'))
    xhr.send(formData)
  })
}

/* =====================================================
   OPTIONAL CONVENIENCE LOADERS
===================================================== */
export async function fetchAllAdminData() {
  await Promise.all([
    fetchContents(),
    fetchUsers(),
    fetchComments(),
    fetchNotifications(),
    fetchAdminProfile()
  ])
}

export { API_BASE }
