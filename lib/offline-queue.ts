'use client'

/**
 * Offline Queue System
 * 
 * Queues mutations (create/update/delete) when offline
 * and processes them when back online.
 */

export type MutationType = 'create' | 'update' | 'delete'
export type EntityType = 'trip' | 'block' | 'todo' | 'packingItem' | 'expense'

export interface QueuedMutation {
  id: string
  type: MutationType
  entity: EntityType
  entityId: string
  data?: any // The entity data for create/update
  timestamp: number
  retries: number
}

const QUEUE_KEY = 'foldr_offline_queue'
const MAX_RETRIES = 3

// Get all queued mutations
export function getOfflineQueue(): QueuedMutation[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(QUEUE_KEY)
  return data ? JSON.parse(data) : []
}

// Save queue to localStorage
function saveQueue(queue: QueuedMutation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

// Add a mutation to the queue
export function queueMutation(
  type: MutationType,
  entity: EntityType,
  entityId: string,
  data?: any
): void {
  const queue = getOfflineQueue()
  
  // Check if there's already a pending mutation for this entity
  const existingIndex = queue.findIndex(
    m => m.entity === entity && m.entityId === entityId
  )
  
  if (existingIndex >= 0) {
    const existing = queue[existingIndex]
    
    // If deleting, remove any pending create/update
    if (type === 'delete') {
      if (existing.type === 'create') {
        // Item was created offline and now deleted - remove from queue entirely
        queue.splice(existingIndex, 1)
        saveQueue(queue)
        return
      }
      // Replace update with delete
      queue[existingIndex] = {
        ...existing,
        type: 'delete',
        data: undefined,
        timestamp: Date.now(),
      }
      saveQueue(queue)
      return
    }
    
    // If updating, merge with existing
    if (type === 'update') {
      queue[existingIndex] = {
        ...existing,
        type: existing.type === 'create' ? 'create' : 'update',
        data: data,
        timestamp: Date.now(),
      }
      saveQueue(queue)
      return
    }
  }
  
  // Add new mutation to queue
  const mutation: QueuedMutation = {
    id: crypto.randomUUID(),
    type,
    entity,
    entityId,
    data,
    timestamp: Date.now(),
    retries: 0,
  }
  
  queue.push(mutation)
  saveQueue(queue)
  console.log(`[OfflineQueue] Queued ${type} for ${entity}:${entityId}`)
}

// Remove a mutation from the queue
export function removeMutation(mutationId: string): void {
  const queue = getOfflineQueue()
  const filtered = queue.filter(m => m.id !== mutationId)
  saveQueue(filtered)
}

// Mark mutation as failed (increment retry count)
export function markMutationFailed(mutationId: string): boolean {
  const queue = getOfflineQueue()
  const mutation = queue.find(m => m.id === mutationId)
  
  if (!mutation) return false
  
  mutation.retries++
  
  if (mutation.retries >= MAX_RETRIES) {
    // Remove from queue after max retries
    console.log(`[OfflineQueue] Mutation ${mutationId} failed after ${MAX_RETRIES} retries`)
    removeMutation(mutationId)
    return false
  }
  
  saveQueue(queue)
  return true
}

// Clear the entire queue
export function clearOfflineQueue(): void {
  localStorage.removeItem(QUEUE_KEY)
}

// Get queue statistics
export function getQueueStats(): { pending: number; byType: Record<MutationType, number> } {
  const queue = getOfflineQueue()
  return {
    pending: queue.length,
    byType: {
      create: queue.filter(m => m.type === 'create').length,
      update: queue.filter(m => m.type === 'update').length,
      delete: queue.filter(m => m.type === 'delete').length,
    }
  }
}

// Check if we're online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported')
    return null
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
    
    console.log('[SW] Service worker registered:', registration.scope)
    
    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] New version available')
            // Could show a "Update available" toast here
          }
        })
      }
    })
    
    // Register for background sync if supported
    if ('sync' in registration) {
      try {
        await (registration as any).sync.register('sync-mutations')
        console.log('[SW] Background sync registered')
      } catch (err) {
        console.log('[SW] Background sync not available')
      }
    }
    
    // Register for periodic sync if supported (requires permission)
    if ('periodicSync' in registration) {
      try {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync' as PermissionName,
        })
        if (status.state === 'granted') {
          await (registration as any).periodicSync.register('sync-data', {
            minInterval: 60 * 60 * 1000, // 1 hour
          })
          console.log('[SW] Periodic sync registered')
        }
      } catch (err) {
        console.log('[SW] Periodic sync not available')
      }
    }
    
    return registration
  } catch (error) {
    console.error('[SW] Registration failed:', error)
    return null
  }
}

// Listen for messages from service worker
export function setupSWMessageListener(onSyncNow: () => void): () => void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {}
  }
  
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'SYNC_NOW') {
      console.log('[SW] Received SYNC_NOW message')
      onSyncNow()
    }
  }
  
  navigator.serviceWorker.addEventListener('message', handler)
  
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler)
  }
}

// Request background sync (if supported)
export async function requestBackgroundSync(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }
  
  try {
    const registration = await navigator.serviceWorker.ready
    if ('sync' in registration) {
      await (registration as any).sync.register('sync-mutations')
      console.log('[SW] Background sync requested')
      return true
    }
  } catch (err) {
    console.log('[SW] Could not request background sync')
  }
  
  return false
}

// Process the offline queue when back online
export async function processOfflineQueue(): Promise<{
  processed: number
  failed: number
  errors: string[]
}> {
  if (!isOnline()) {
    console.log('[OfflineQueue] Still offline, skipping queue processing')
    return { processed: 0, failed: 0, errors: ['Still offline'] }
  }
  
  const queue = getOfflineQueue()
  if (queue.length === 0) {
    console.log('[OfflineQueue] No mutations to process')
    return { processed: 0, failed: 0, errors: [] }
  }
  
  console.log(`[OfflineQueue] Processing ${queue.length} queued mutations...`)
  
  let processed = 0
  let failed = 0
  const errors: string[] = []
  
  // Process mutations in order (oldest first)
  const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp)
  
  for (const mutation of sortedQueue) {
    try {
      console.log(`[OfflineQueue] Processing ${mutation.type} for ${mutation.entity}:${mutation.entityId}`)
      
      // For now, we just trigger a full sync which will push all local data
      // The cloud-sync module will handle merging
      // In a more sophisticated system, we'd send individual mutations
      
      // Mark as processed (remove from queue)
      removeMutation(mutation.id)
      processed++
      
    } catch (error) {
      console.error(`[OfflineQueue] Failed to process mutation:`, error)
      const shouldRetry = markMutationFailed(mutation.id)
      if (!shouldRetry) {
        errors.push(`Failed to ${mutation.type} ${mutation.entity}:${mutation.entityId}`)
        failed++
      }
    }
  }
  
  console.log(`[OfflineQueue] Completed: ${processed} processed, ${failed} failed`)
  
  // Trigger a full sync to push all local data to cloud
  if (processed > 0) {
    // Dispatch event so cloud-sync can pick it up
    window.dispatchEvent(new CustomEvent('foldr-sync-needed'))
  }
  
  return { processed, failed, errors }
}

// Setup online/offline listeners
export function setupOnlineListener(onOnline: () => void, onOffline: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handleOnline = () => {
    console.log('[OfflineQueue] Back online!')
    onOnline()
  }
  
  const handleOffline = () => {
    console.log('[OfflineQueue] Gone offline')
    onOffline()
  }
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
