export type Section = 'Produce' | 'Bakery' | 'Meat & fish' | 'Dairy & eggs' | 'Cupboard' | 'Drinks' | 'Household' | 'Frozen' | 'Unknown'

export type Grocery = {
  id: string
  syncId?: string
  name: string
  section: Section
  quantity: number
  unit: string
  note?: string
  done: boolean
  favourite?: boolean
  revision?: number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type Store = {
  id: string
  chain: string
  branch: string
  postcode: string
  status: 'Example'
  confirmed: string
  accuracy: number
  route: Section[]
}

export type ShoppingList = {
  id: string
  syncId?: string
  name: string
  storeId: string
  items: Grocery[]
  archived?: boolean
  updatedAt: number
  revision?: number
  createdAt?: string
  deletedAt?: string | null
}

export type AuthUser = { id: string; email: string }
export type AuthSession = { accessToken: string; refreshToken: string; expiresAt: number; user: AuthUser }
export type SyncState = 'local' | 'offline' | 'pending' | 'syncing' | 'synced' | 'attention' | 'conflict'
export type PendingMutation = { id: string; ownerId: string; payload: AppState; createdAt: string; attempts: number; lastError?: string }

export type AppState = {
  lists: ShoppingList[]
  activeListId: string
  corrections: Record<string, Record<string, Section>>
  favouriteStores: string[]
}
