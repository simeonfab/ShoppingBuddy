import type { AppState, Grocery, ShoppingList } from './types'
import version from '../version.json'

const DB_NAME = 'smartshop'
const DB_VERSION = version.storageSchemaVersion
const STORE = 'state'
const KEY = 'app'
const SYNC_KEY = 'sync-pending'

const uuid = () => crypto.randomUUID()
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

function validItem(value: unknown): value is Grocery {
  const item = value as Grocery
  return !!item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.quantity === 'number' && typeof item.done === 'boolean'
}

function validList(value: unknown): value is ShoppingList {
  const list = value as ShoppingList
  return !!list && typeof list.id === 'string' && typeof list.name === 'string' && typeof list.storeId === 'string' && Array.isArray(list.items) && list.items.every(validItem)
}

export function validateState(value: unknown): AppState | null {
  const state = value as AppState
  if (!state || !Array.isArray(state.lists) || !state.lists.every(validList) || typeof state.activeListId !== 'string') return null
  const now = new Date().toISOString()
  return {
    ...state,
    lists: state.lists.map(list => ({
      ...list,
      syncId: list.syncId || (isUuid(list.id) ? list.id : uuid()),
      revision: list.revision || 0,
      createdAt: list.createdAt || new Date(list.updatedAt || Date.now()).toISOString(),
      items: list.items.map(item => ({ ...item, syncId: item.syncId || (isUuid(item.id) ? item.id : uuid()), revision: item.revision || 0, createdAt: item.createdAt || now, updatedAt: item.updatedAt || now, deletedAt: item.deletedAt || null })),
      deletedAt: list.deletedAt || null,
    })),
    corrections: state.corrections || {},
    favouriteStores: state.favouriteStores || [],
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadDurableState(fallback: AppState): Promise<AppState> {
  const db = await openDb()
  const stored = await new Promise<unknown>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(KEY)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  const valid = validateState(stored)
  if (valid) return valid
  const legacy = validateState(JSON.parse(localStorage.getItem('smartshop-state-v1') || 'null'))
  const migrated = legacy || validateState(fallback) || fallback
  await saveDurableState(migrated)
  return migrated
}

export async function saveDurableState(state: AppState): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(state, KEY)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export async function loadPendingMutations<T>(): Promise<T[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(SYNC_KEY)
    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : [])
    request.onerror = () => reject(request.error)
  })
}

export async function savePendingMutations<T>(mutations: T[]): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(mutations, SYNC_KEY)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}
