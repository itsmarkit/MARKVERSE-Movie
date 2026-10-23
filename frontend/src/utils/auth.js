// src/utils/auth.js
// Per-tab authentication via sessionStorage (isolated per browser tab)

const TOKEN_KEY = 'markverse_token'
const USER_KEY  = 'markverse_user'

export function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

export function getStoredUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setAuth(token, user) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    if (user)  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {}
}

export function clearAuth() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  } catch {}
}

export function isLoggedIn() {
  return !!getToken()
}

export function isAdmin() {
  const u = getStoredUser()
  return u?.role === 'Admin'
}

/**
 * Fetch wrapper that attaches this tab's Bearer token.
 * Falls back to cookie credentials.
 */
export async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = { ...(options.headers || {}) }

  if (!headers['Content-Type'] && options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include'
  })

  if (res.status === 401) clearAuth()
  return res
}

export async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.error || json.message || `Request failed (${res.status})`)
  }
  return json.data || json
}

/** Tab-scoped logout — only this tab is signed out. */
export async function logoutTab() {
  try { await apiJson('/api/logout', { method: 'POST' }) } catch {}
  clearAuth()
}

/** Global logout — destroys shared session cookie too. */
export async function logoutAll() {
  try { await apiJson('/api/logout-all', { method: 'POST' }) } catch {}
  clearAuth()
}