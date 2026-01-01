// Cloud sync utilities for Cloudflare D1
// Works alongside localStorage for offline support

const API_BASE = '/api'

interface SyncResult {
  success: boolean
  error?: string
}

interface AuthResult {
  success: boolean
  userId?: string
  token?: string
  error?: string
}

// Get auth token from localStorage
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('foldr_auth_token')
}

// Get user ID from localStorage
export function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('foldr_user_id')
}

// Check if user is logged in
export function isLoggedIn(): boolean {
  return !!getAuthToken() && !!getUserId()
}

// Login
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    // Don't log 401s to console - they're expected for invalid credentials
    const data = await response.json()
    
    if (data.success && data.token && data.userId) {
      localStorage.setItem('foldr_auth_token', data.token)
      localStorage.setItem('foldr_user_id', data.userId)
      localStorage.setItem('foldr_user_email', email)
      return { success: true, userId: data.userId, token: data.token }
    }
    
    return { success: false, error: data.error || 'Login failed' }
  } catch (error) {
    return { success: false, error: 'Network error - working offline' }
  }
}

// Sign up
export async function signup(email: string, password: string, inviteCode: string): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, inviteCode })
    })
    
    const data = await response.json()
    
    if (data.success && data.token && data.userId) {
      localStorage.setItem('foldr_auth_token', data.token)
      localStorage.setItem('foldr_user_id', data.userId)
      localStorage.setItem('foldr_user_email', email)
      return { success: true, userId: data.userId, token: data.token }
    }
    
    return { success: false, error: data.error || 'Signup failed' }
  } catch (error) {
    return { success: false, error: 'Network error' }
  }
}

// Logout
export function logout() {
  localStorage.removeItem('foldr_auth_token')
  localStorage.removeItem('foldr_user_id')
  localStorage.removeItem('foldr_user_email')
}

// Sync all local data to cloud
export async function syncToCloud(): Promise<SyncResult> {
  const token = getAuthToken()
  if (!token) return { success: false, error: 'Not logged in' }
  
  try {
    // Get deleted items from storage module
    const deletedItemsStr = localStorage.getItem('foldr_deleted_items')
    const deletedItems = deletedItemsStr ? JSON.parse(deletedItemsStr) : null
    
    const localData = {
      trips: localStorage.getItem('foldr_trips'),
      blocks: localStorage.getItem('foldr_blocks'),
      todos: localStorage.getItem('foldr_todos'),
      packingItems: localStorage.getItem('foldr_packing_items'),
      expenses: localStorage.getItem('foldr_expenses'),
      settings: localStorage.getItem('foldr_settings'),
      deletedItems: deletedItems, // Include deleted item IDs
    }
    
    const response = await fetch(`${API_BASE}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(localData)
    })
    
    const data = await response.json()
    
    if (data.success) {
      localStorage.setItem('foldr_last_sync', new Date().toISOString())
      // Clear deleted items after successful sync
      localStorage.removeItem('foldr_deleted_items')
      return { success: true }
    }
    
    return { success: false, error: data.error || 'Sync failed' }
  } catch (error) {
    return { success: false, error: 'Network error - will sync when online' }
  }
}

// Helper to merge arrays by ID, using updatedAt timestamp to resolve conflicts
// Also excludes any IDs that are in the deletedIds set
function mergeArraysById<T extends { id: string; updatedAt?: string }>(
  local: T[],
  cloud: T[],
  deletedIds: Set<string> = new Set()
): T[] {
  const merged = new Map<string, T>()
  
  // Add all local items first (excluding deleted ones)
  for (const item of local) {
    if (!deletedIds.has(item.id)) {
      merged.set(item.id, item)
    }
  }
  
  // Merge cloud items - cloud wins if it has a newer updatedAt, or if local doesn't have the item
  // But skip items that were explicitly deleted locally
  for (const cloudItem of cloud) {
    if (deletedIds.has(cloudItem.id)) {
      // Item was deleted locally, don't add it back
      continue
    }
    
    const localItem = merged.get(cloudItem.id)
    
    if (!localItem) {
      // Item only exists in cloud - add it
      merged.set(cloudItem.id, cloudItem)
    } else {
      // Item exists in both - use the one with newer updatedAt
      const localUpdated = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0
      const cloudUpdated = cloudItem.updatedAt ? new Date(cloudItem.updatedAt).getTime() : 0
      
      if (cloudUpdated > localUpdated) {
        merged.set(cloudItem.id, cloudItem)
      }
      // Otherwise keep the local item (already in merged)
    }
  }
  
  return Array.from(merged.values())
}

// Pull data from cloud and MERGE with local (not overwrite)
export async function syncFromCloud(): Promise<SyncResult> {
  const token = getAuthToken()
  if (!token) return { success: false, error: 'Not logged in' }
  
  try {
    const response = await fetch(`${API_BASE}/sync/pull`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (data.success) {
      // Get locally deleted items to exclude from merge
      const deletedItemsStr = localStorage.getItem('foldr_deleted_items')
      const deletedItems = deletedItemsStr ? JSON.parse(deletedItemsStr) : { trips: [], blocks: [], todos: [], packingItems: [], expenses: [] }
      
      // MERGE cloud data with local (not overwrite!)
      // Get local data
      const localTrips = JSON.parse(localStorage.getItem('foldr_trips') || '[]')
      const localBlocks = JSON.parse(localStorage.getItem('foldr_blocks') || '[]')
      const localTodos = JSON.parse(localStorage.getItem('foldr_todos') || '[]')
      const localPackingItems = JSON.parse(localStorage.getItem('foldr_packing_items') || '[]')
      const localExpenses = JSON.parse(localStorage.getItem('foldr_expenses') || '[]')
      
      // Get cloud data
      const cloudTrips = data.trips ? JSON.parse(data.trips) : []
      const cloudBlocks = data.blocks ? JSON.parse(data.blocks) : []
      const cloudTodos = data.todos ? JSON.parse(data.todos) : []
      const cloudPackingItems = data.packingItems ? JSON.parse(data.packingItems) : []
      const cloudExpenses = data.expenses ? JSON.parse(data.expenses) : []
      
      // Merge and save (excluding locally deleted items)
      const mergedTrips = mergeArraysById(localTrips, cloudTrips, new Set(deletedItems.trips))
      const mergedBlocks = mergeArraysById(localBlocks, cloudBlocks, new Set(deletedItems.blocks))
      const mergedTodos = mergeArraysById(localTodos, cloudTodos, new Set(deletedItems.todos))
      const mergedPackingItems = mergeArraysById(localPackingItems, cloudPackingItems, new Set(deletedItems.packingItems))
      const mergedExpenses = mergeArraysById(localExpenses, cloudExpenses, new Set(deletedItems.expenses))
      
      localStorage.setItem('foldr_trips', JSON.stringify(mergedTrips))
      localStorage.setItem('foldr_blocks', JSON.stringify(mergedBlocks))
      localStorage.setItem('foldr_todos', JSON.stringify(mergedTodos))
      localStorage.setItem('foldr_packing_items', JSON.stringify(mergedPackingItems))
      localStorage.setItem('foldr_expenses', JSON.stringify(mergedExpenses))
      
      // Settings: cloud wins for settings (single object, not array)
      if (data.settings) localStorage.setItem('foldr_settings', data.settings)
      
      localStorage.setItem('foldr_last_sync', new Date().toISOString())
      console.log('[Sync] Merged cloud data with local:', {
        trips: mergedTrips.length,
        blocks: mergedBlocks.length,
        todos: mergedTodos.length
      })
      return { success: true }
    }
    
    return { success: false, error: data.error || 'Sync failed' }
  } catch (error) {
    return { success: false, error: 'Network error - working offline' }
  }
}

// Full sync: pull from cloud, then push any local changes
export async function fullSync(): Promise<SyncResult> {
  // First pull to get latest cloud data
  const pullResult = await syncFromCloud()
  if (!pullResult.success && pullResult.error !== 'Network error - working offline') {
    return pullResult
  }
  
  // Then push local data
  const pushResult = await syncToCloud()
  return pushResult
}

// Auto-sync when online
export function setupAutoSync() {
  if (typeof window === 'undefined') return
  
  // Sync when coming back online
  window.addEventListener('online', () => {
    if (isLoggedIn()) {
      fullSync()
    }
  })
  
  // Sync periodically (every 5 minutes)
  setInterval(() => {
    if (isLoggedIn() && navigator.onLine) {
      syncToCloud()
    }
  }, 5 * 60 * 1000)
}

// Get last sync time
export function getLastSyncTime(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('foldr_last_sync')
}

// Get user email
export function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('foldr_user_email')
}
