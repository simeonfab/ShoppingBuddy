import type { AuthSession, AuthUser } from './types'

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const SESSION_KEY = 'smartshop-auth-session'

export const backendConfigured = Boolean(url && anonKey)

type AuthResponse = { access_token?: string; refresh_token?: string; expires_in?: number; user?: { id: string; email?: string }; error_description?: string; msg?: string; message?: string }

async function authRequest(path: string, body: object): Promise<AuthResponse> {
  if (!backendConfigured) throw new Error('Accounts need Supabase configuration before they can be used.')
  const response = await fetch(`${url}/auth/v1/${path}`, { method: 'POST', headers: { apikey: anonKey!, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({})) as AuthResponse
  if (!response.ok) throw new Error(data.error_description || data.msg || data.message || 'The account service could not complete that request.')
  return data
}

function toSession(data: AuthResponse): AuthSession | null {
  if (!data.access_token || !data.refresh_token || !data.user?.id) return null
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000, user: { id: data.user.id, email: data.user.email || '' } }
}

function remember(session: AuthSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

export async function signUp(email: string, password: string): Promise<AuthSession | null> {
  const session = toSession(await authRequest('signup', { email, password }))
  remember(session)
  return session
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const session = toSession(await authRequest('token?grant_type=password', { email, password }))
  if (!session) throw new Error('Sign-in succeeded but no valid session was returned.')
  remember(session)
  return session
}

export async function requestPasswordReset(email: string): Promise<void> { await authRequest('recover', { email }) }

export async function restoreSession(): Promise<AuthSession | null> {
  let stored: AuthSession | null = null
  try { stored = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { remember(null) }
  if (!stored) return null
  if (stored.expiresAt > Date.now() + 60_000) return stored
  try {
    const refreshed = toSession(await authRequest('token?grant_type=refresh_token', { refresh_token: stored.refreshToken }))
    remember(refreshed)
    return refreshed
  } catch { remember(null); return null }
}

export async function signOut(session: AuthSession): Promise<void> {
  if (backendConfigured) await fetch(`${url}/auth/v1/logout`, { method: 'POST', headers: { apikey: anonKey!, Authorization: `Bearer ${session.accessToken}` } }).catch(() => undefined)
  remember(null)
}

export const getBackend = () => ({ url, anonKey })
export type { AuthUser }
