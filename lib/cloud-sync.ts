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

// Push ONLY deletions to cloud (without sending full local data)
// This is used during fullSync to ensure deletions are processed without
// re-adding stale data from other devices
async function pushDeletionsOnly(): Promise<SyncResult> {
  const token = getAuthToken()
  if (!token) return { success: false, error: 'Not logged in' }
  
  try {
    const deletedItemsStr = localStorage.getItem('foldr_deleted_items')
    const deletedItems = deletedItemsStr ? JSON.parse(deletedItemsStr) : null
    
    if (!deletedItems) {
      return { success: true } // Nothing to delete
    }
    
    const deletionCount = 
      (deletedItems.trips?.length || 0) + 
      (deletedItems.blocks?.length || 0) + 
      (deletedItems.todos?.length || 0) + 
      (deletedItems.packingItems?.length || 0) + 
      (deletedItems.expenses?.length || 0)
    
    if (deletionCount === 0) {
      return { success: true } // Nothing to delete
    }
    
    console.log('[Sync] Pushing deletions only:', deletedItems)
    
    // Send ONLY deletions - no trips/blocks data
    // This ensures we don't re-add items that were deleted elsewhere
    const response = await fetch(`${API_BASE}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        deletedItems: deletedItems
        // NOT sending trips, blocks, etc. - just deletions
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      localStorage.removeItem('foldr_deleted_items')
      addSyncLogEntry({
        timestamp: new Date().toISOString(),
        action: 'push',
        changes: { added: 0, updated: 0, deleted: deletionCount },
        success: true
      })
      return { success: true }
    }
    
    return { success: false, error: data.error || 'Sync failed' }
  } catch (error) {
    return { success: false, error: 'Network error' }
  }
}

// Sync all local data to cloud (full push)
// Only call this when user makes a LOCAL change that needs to sync
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

// Pull data from cloud - CLOUD IS THE SOURCE OF TRUTH
// This completely replaces local data with cloud data
export async function syncFromCloud(): Promise<SyncResult & { changes?: { added: number, removed: number } }> {
  const token = getAuthToken()
  if (!token) return { success: false, error: 'Not logged in' }
  
  try {
    console.log('[Sync] Pulling from cloud - CLOUD IS SOURCE OF TRUTH')
    const response = await fetch(`${API_BASE}/sync/pull`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (data.success) {
      // Get current local data for comparison (just for logging)
      const localTrips = JSON.parse(localStorage.getItem('foldr_trips') || '[]')
      const localBlocks = JSON.parse(localStorage.getItem('foldr_blocks') || '[]')
      
      // Get cloud data
      const cloudTrips = data.trips ? JSON.parse(data.trips) : []
      const cloudBlocks = data.blocks ? JSON.parse(data.blocks) : []
      const cloudTodos = data.todos ? JSON.parse(data.todos) : []
      const cloudPackingItems = data.packingItems ? JSON.parse(data.packingItems) : []
      const cloudExpenses = data.expenses ? JSON.parse(data.expenses) : []
      
      console.log('[Sync] Cloud data received:', {
        trips: cloudTrips.length,
        blocks: cloudBlocks.length,
        todos: cloudTodos.length
      })
      console.log('[Sync] Local data (will be replaced):', {
        trips: localTrips.length,
        blocks: localBlocks.length
      })
      
      // Calculate changes for logging
      const localTripIds = new Set(localTrips.map((t: any) => t.id))
      const cloudTripIds = new Set(cloudTrips.map((t: any) => t.id))
      const addedCount = cloudTrips.filter((t: any) => !localTripIds.has(t.id)).length
      const removedCount = localTrips.filter((t: any) => !cloudTripIds.has(t.id)).length
      
      // REPLACE local data with cloud data - NO MERGE
      // Cloud is the single source of truth
      localStorage.setItem('foldr_trips', JSON.stringify(cloudTrips))
      localStorage.setItem('foldr_blocks', JSON.stringify(cloudBlocks))
      localStorage.setItem('foldr_todos', JSON.stringify(cloudTodos))
      localStorage.setItem('foldr_packing_items', JSON.stringify(cloudPackingItems))
      localStorage.setItem('foldr_expenses', JSON.stringify(cloudExpenses))
      
      // Clear any pending deletions since cloud is now source of truth
      localStorage.removeItem('foldr_deleted_items')
      
      // Settings: cloud wins for settings
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
      
      console.log('[Sync] Local replaced with cloud:', {
        trips: cloudTrips.length,
        blocks: cloudBlocks.length,
        todos: cloudTodos.length,
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

// Full sync: PULL cloud first (source of truth), then push ONLY pending deletions
export async function fullSync(): Promise<SyncResult> {
  console.log('[Sync] Starting full sync...')
  
  // Check if we have pending deletions that need to be pushed
  const deletedItemsStr = localStorage.getItem('foldr_deleted_items')
  const deletedItems = deletedItemsStr ? JSON.parse(deletedItemsStr) : null
  const hasPendingDeletions = deletedItems && (
    (deletedItems.trips?.length || 0) +
    (deletedItems.blocks?.length || 0) +
    (deletedItems.todos?.length || 0) +
    (deletedItems.packingItems?.length || 0) +
    (deletedItems.expenses?.length || 0)
  ) > 0
  
  // If we have pending deletions, push them FIRST before pulling
  // Use deletions-only push to avoid re-adding stale data
  if (hasPendingDeletions) {
    console.log('[Sync] Pushing pending deletions first...')
    const pushResult = await pushDeletionsOnly()
    if (!pushResult.success) {
      console.log('[Sync] Push deletions failed:', pushResult.error)
    }
  }
  
  // PULL cloud data - this REPLACES local completely
  // Cloud is the single source of truth
  const pullResult = await syncFromCloud()
  
  console.log('[Sync] Full sync complete')
  return pullResult
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
  
  // Full sync periodically (every 1 minute) to keep devices in sync
  // Only pulls from cloud - pushes happen via triggerSync when user makes changes
  setInterval(() => {
    if (isLoggedIn() && navigator.onLine) {
      console.log('[Sync] Auto-sync triggered (1 min interval)')
      syncFromCloud() // Just pull, don't push stale data
    }
  }, 60 * 1000) // 1 minute
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
