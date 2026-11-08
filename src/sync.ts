import { getBackend } from './auth'
import { loadPendingMutations, savePendingMutations, validateState } from './storage'
import type { AppState, AuthSession, PendingMutation } from './types'

const makeId = () => crypto.randomUUID()

export async function queueSnapshot(ownerId: string, state: AppState): Promise<number> {
  const queue = await loadPendingMutations<PendingMutation>()
  queue.push({ id: makeId(), ownerId, payload: validateState(state) || state, createdAt: new Date().toISOString(), attempts: 0 })
  await savePendingMutations(queue.slice(-50))
  return queue.length
}

export async function pendingCount(ownerId?: string): Promise<number> {
  const queue = await loadPendingMutations<PendingMutation>()
  return ownerId ? queue.filter(item => item.ownerId === ownerId).length : queue.length
}

async function request(session: AuthSession, path: string, init: RequestInit = {}) {
  const backend = getBackend()
  const response = await fetch(`${backend.url}/rest/v1/${path}`, { ...init, headers: { apikey: backend.anonKey!, Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers || {}) } })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.message || `Synchronisation failed (${response.status}).`)
  return result
}

export async function flushQueue(session: AuthSession): Promise<{ pending: number; conflict: boolean }> {
  const queue = await loadPendingMutations<PendingMutation>()
  const retained: PendingMutation[] = []
  let conflict = false
  for (const mutation of queue) {
    if (mutation.ownerId !== session.user.id) { retained.push(mutation); continue }
    try {
      const result = await request(session, 'rpc/apply_smartshop_snapshot', { method: 'POST', body: JSON.stringify({ p_mutation_id: mutation.id, p_payload: mutation.payload }) })
      if (result?.conflict) { conflict = true; retained.push({ ...mutation, attempts: mutation.attempts + 1, lastError: 'A newer change exists on another device.' }) }
    } catch (error) { retained.push({ ...mutation, attempts: mutation.attempts + 1, lastError: error instanceof Error ? error.message : 'Unknown synchronisation error' }); break }
  }
  await savePendingMutations(retained)
  return { pending: retained.filter(item => item.ownerId === session.user.id).length, conflict }
}

export async function pullRemote(session: AuthSession, local: AppState): Promise<AppState> {
  const [lists, items, corrections] = await Promise.all([
    request(session, 'shopping_lists?select=*&deleted_at=is.null'),
    request(session, 'grocery_items?select=*&deleted_at=is.null'),
    request(session, 'product_corrections?select=*'),
  ])
  if (!Array.isArray(lists) || lists.length === 0) return local
  const remote: AppState = {
    ...local,
    lists: lists.map(row => ({ id: row.local_id || row.id, syncId: row.id, name: row.name, storeId: row.store_id, archived: row.archived, updatedAt: new Date(row.updated_at).getTime(), revision: row.revision, createdAt: row.created_at, deletedAt: row.deleted_at, items: items.filter((item: Record<string, unknown>) => item.list_id === row.id).map((item: any) => ({ id: item.local_id || item.id, syncId: item.id, name: item.name, section: item.section, quantity: Number(item.quantity), unit: item.unit || '', note: item.note || undefined, done: item.done, favourite: item.favourite, revision: item.revision, createdAt: item.created_at, updatedAt: item.updated_at, deletedAt: item.deleted_at })) })),
    activeListId: local.activeListId,
    corrections: { ...local.corrections },
  }
  for (const correction of corrections as any[]) remote.corrections[correction.store_id] = { ...(remote.corrections[correction.store_id] || {}), [correction.product_name]: correction.section }
  if (!remote.lists.some(list => list.id === remote.activeListId)) remote.activeListId = remote.lists[0]?.id || ''
  return validateState(remote) || local
}
