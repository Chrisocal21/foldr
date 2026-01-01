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

// Sync log management
const SYNC_LOG_KEY = 'foldr_sync_log'
const MAX_SYNC_LOG_ENTRIES = 10

export interface SyncLogEntry {
  timestamp: string
  action: 'push' | 'pull' | 'full'
  changes: {
    added: number
    updated: number
    deleted: number
  }
  success: boolean
  error?: string
}

export function getSyncLog(): SyncLogEntry[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(SYNC_LOG_KEY)
  return data ? JSON.parse(data) : []
}

function addSyncLogEntry(entry: SyncLogEntry): void {
  const log = getSyncLog()
  log.unshift(entry) // Add to beginning
  // Keep only last N entries
  if (log.length > MAX_SYNC_LOG_ENTRIES) {
    log.length = MAX_SYNC_LOG_ENTRIES
  }
  localStorage.setItem(SYNC_LOG_KEY, JSON.stringify(log))
}

// Sync all local data to cloud
export async function syncToCloud(): Promise<SyncResult> {
  const token = getAuthToken()
  if (!token) return { success: false, error: 'Not logged in' }
  
  try {
    // Get deleted items from storage module
    const deletedItemsStr = localStorage.getItem('foldr_deleted_items')
    const deletedItems = deletedItemsStr ? JSON.parse(deletedItemsStr) : null
    
    // Count deletions for sync log
    const deletionCount = deletedItems ? 
      (deletedItems.trips?.length || 0) + 
      (deletedItems.blocks?.length || 0) + 
      (deletedItems.todos?.length || 0) + 
      (deletedItems.packingItems?.length || 0) + 
      (deletedItems.expenses?.length || 0) : 0
    
    const localData = {
      trips: localStorage.getItem('foldr_trips'),
      blocks: localStorage.getItem('foldr_blocks'),
      todos: localStorage.getItem('foldr_todos'),
      packingItems: localStorage.getItem('foldr_packing_items'),
      expenses: localStorage.getItem('foldr_expenses'),
      settings: localStorage.getItem('foldr_settings'),
      deletedItems: deletedItems, // Include deleted item IDs
    }
    
    console.log('[Sync] Pushing to cloud, deletedItems:', deletedItems)
    
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
      
      // Log the sync
      addSyncLogEntry({
        timestamp: new Date().toISOString(),
        action: 'push',
        changes: {
          added: 0, // We don't track adds separately yet
          updated: 0,
          deleted: deletionCount
        },
        success: true
      })
      
      return { success: true }
    }
    
    addSyncLogEntry({
      timestamp: new Date().toISOString(),
      action: 'push',
      changes: { added: 0, updated: 0, deleted: 0 },
      success: false,
      error: data.error
    })
    
    return { success: false, error: data.error || 'Sync failed' }
  } catch (error) {
    addSyncLogEntry({
      timestamp: new Date().toISOString(),
      action: 'push',
      changes: { added: 0, updated: 0, deleted: 0 },
      success: false,
      error: 'Network error'
    })
    return { success: false, error: 'Network error - will sync when online' }
  }
}

// Helper to merge arrays by ID
// Cloud is the source of truth for WHAT EXISTS
// Local items not in cloud are kept ONLY if created after last sync (not yet pushed)
// For items in both, use the one with newer updatedAt timestamp
function mergeArraysById<T extends { id: string; updatedAt?: string; createdAt?: string }>(
  local: T[],
  cloud: T[],
  deletedIds: Set<string> = new Set(),
  lastSyncTime: string | null = null
): T[] {
  const merged = new Map<string, T>()
  const cloudIds = new Set(cloud.map(item => item.id))
  const lastSync = lastSyncTime ? new Date(lastSyncTime).getTime() : 0
  
  // First, add all cloud items (this is the source of truth for what exists)
  for (const cloudItem of cloud) {
    if (!deletedIds.has(cloudItem.id)) {
      merged.set(cloudItem.id, cloudItem)
    }
  }
  
  // Then process local items
  for (const localItem of local) {
    if (deletedIds.has(localItem.id)) {
      // Item was deleted locally, skip it
      continue
    }
    
    if (cloudIds.has(localItem.id)) {
      // Item exists in both - use the one with newer updatedAt
      const cloudItem = merged.get(localItem.id)
      if (cloudItem) {
        const localUpdated = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0
        const cloudUpdated = cloudItem.updatedAt ? new Date(cloudItem.updatedAt).getTime() : 0
        
        if (localUpdated > cloudUpdated) {
          // Local is newer, use it
          merged.set(localItem.id, localItem)
        }
        // Otherwise keep cloud item (already in merged)
      }
    } else {
      // Item only exists locally - keep it ONLY if it was created after last sync
      // This means it's a new item that hasn't been pushed yet
      const createdTime = localItem.createdAt 
        ? new Date(localItem.createdAt).getTime() 
        : (localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0)
      
      if (createdTime > lastSync || lastSync === 0) {
        // Item was created locally after last sync, keep it
        merged.set(localItem.id, localItem)
      }
      // Otherwise, item was deleted on another device - don't add it back
    }
  }
  
  return Array.from(merged.values())
}

// Pull data from cloud and MERGE with local (not overwrite)
// Cloud is the source of truth for what items exist
export async function syncFromCloud(): Promise<SyncResult & { changes?: { added: number, removed: number } }> {
  const token = getAuthToken()
  if (!token) return { success: false, error: 'Not logged in' }
  
  try {
    console.log('[Sync] Pulling from cloud...')
    const response = await fetch(`${API_BASE}/sync/pull`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (data.success) {
      // Get last sync time to determine if local-only items are new or deleted elsewhere
      const lastSyncTime = localStorage.getItem('foldr_last_sync')
      
      // Get locally deleted items to exclude from merge
      const deletedItemsStr = localStorage.getItem('foldr_deleted_items')
      const deletedItems = deletedItemsStr ? JSON.parse(deletedItemsStr) : { trips: [], blocks: [], todos: [], packingItems: [], expenses: [] }
      
      // Get current local data for comparison
      const localTrips = JSON.parse(localStorage.getItem('foldr_trips') || '[]')
      const localBlocks = JSON.parse(localStorage.getItem('foldr_blocks') || '[]')
      const localTodos = JSON.parse(localStorage.getItem('foldr_todos') || '[]')
      const localPackingItems = JSON.parse(localStorage.getItem('foldr_packing_items') || '[]')
      const localExpenses = JSON.parse(localStorage.getItem('foldr_expenses') || '[]')
      
      const localTripIds = new Set(localTrips.map((t: any) => t.id))
      const localBlockIds = new Set(localBlocks.map((b: any) => b.id))
      
      // Get cloud data
      const cloudTrips = data.trips ? JSON.parse(data.trips) : []
      const cloudBlocks = data.blocks ? JSON.parse(data.blocks) : []
      const cloudTodos = data.todos ? JSON.parse(data.todos) : []
      const cloudPackingItems = data.packingItems ? JSON.parse(data.packingItems) : []
      const cloudExpenses = data.expenses ? JSON.parse(data.expenses) : []
      
      const cloudTripIds = new Set(cloudTrips.map((t: any) => t.id))
      const cloudBlockIds = new Set(cloudBlocks.map((b: any) => b.id))
      
      console.log('[Sync] Cloud data received:', {
        trips: cloudTrips.length,
        blocks: cloudBlocks.length,
        todos: cloudTodos.length
      })
      console.log('[Sync] Local data:', {
        trips: localTrips.length,
        blocks: localBlocks.length,
        todos: localTodos.length
      })
      
      // Merge with lastSyncTime to properly handle deletions from other devices
      const mergedTrips = mergeArraysById(localTrips, cloudTrips, new Set(deletedItems.trips), lastSyncTime)
      const mergedBlocks = mergeArraysById(localBlocks, cloudBlocks, new Set(deletedItems.blocks), lastSyncTime)
      const mergedTodos = mergeArraysById(localTodos, cloudTodos, new Set(deletedItems.todos), lastSyncTime)
      const mergedPackingItems = mergeArraysById(localPackingItems, cloudPackingItems, new Set(deletedItems.packingItems), lastSyncTime)
      const mergedExpenses = mergeArraysById(localExpenses, cloudExpenses, new Set(deletedItems.expenses), lastSyncTime)
      
      // Calculate changes
      const addedCount = 
        cloudTrips.filter((t: any) => !localTripIds.has(t.id)).length +
        cloudBlocks.filter((b: any) => !localBlockIds.has(b.id)).length
      
      const removedCount = 
        localTrips.filter((t: any) => !cloudTripIds.has(t.id) && !deletedItems.trips?.includes(t.id)).length +
        localBlocks.filter((b: any) => !cloudBlockIds.has(b.id) && !deletedItems.blocks?.includes(b.id)).length
      
      localStorage.setItem('foldr_trips', JSON.stringify(mergedTrips))
      localStorage.setItem('foldr_blocks', JSON.stringify(mergedBlocks))
      localStorage.setItem('foldr_todos', JSON.stringify(mergedTodos))
      localStorage.setItem('foldr_packing_items', JSON.stringify(mergedPackingItems))
      localStorage.setItem('foldr_expenses', JSON.stringify(mergedExpenses))
      
      // Settings: cloud wins for settings (single object, not array)
      if (data.settings) localStorage.setItem('foldr_settings', data.settings)
      
      localStorage.setItem('foldr_last_sync', new Date().toISOString())
      
      // Log the sync
      addSyncLogEntry({
        timestamp: new Date().toISOString(),
        action: 'pull',
        changes: {
          added: addedCount,
          updated: 0,
          deleted: removedCount
        },
        success: true
      })
      
      console.log('[Sync] Merged result:', {
        trips: mergedTrips.length,
        blocks: mergedBlocks.length,
        todos: mergedTodos.length,
        added: addedCount,
        removed: removedCount
      })
      
      return { success: true, changes: { added: addedCount, removed: removedCount } }
    }
    
    addSyncLogEntry({
      timestamp: new Date().toISOString(),
      action: 'pull',
      changes: { added: 0, updated: 0, deleted: 0 },
      success: false,
      error: data.error
    })
    
    return { success: false, error: data.error || 'Sync failed' }
  } catch (error) {
    addSyncLogEntry({
      timestamp: new Date().toISOString(),
      action: 'pull',
      changes: { added: 0, updated: 0, deleted: 0 },
      success: false,
      error: 'Network error'
    })
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
