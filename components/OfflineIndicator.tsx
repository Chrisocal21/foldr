'use client'

import { useEffect, useState } from 'react'
import { useOnline } from '@/lib/offline'
import { 
  registerServiceWorker, 
  setupSWMessageListener, 
  processOfflineQueue,
  getQueueStats 
} from '@/lib/offline-queue'
import { fullSync } from '@/lib/cloud-sync'

/**
 * Banner that appears at top of screen when offline
 * Also handles service worker registration and offline sync
 */
export function OfflineBanner() {
  const isOnline = useOnline()
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  
  // Register service worker and set up listeners on mount
  useEffect(() => {
    // Register service worker
    registerServiceWorker()
    
    // Listen for sync messages from service worker
    const unsubscribeSW = setupSWMessageListener(async () => {
      console.log('[OfflineBanner] Service worker requested sync')
      await handleSync()
    })
    
    // Listen for sync-needed events from storage
    const handleSyncNeeded = async () => {
      console.log('[OfflineBanner] Sync needed event received')
      await fullSync()
    }
    window.addEventListener('foldr-sync-needed', handleSyncNeeded)
    
    // Update pending count
    updatePendingCount()
    
    return () => {
      unsubscribeSW()
      window.removeEventListener('foldr-sync-needed', handleSyncNeeded)
    }
  }, [])
  
  // When coming back online, process the queue
  useEffect(() => {
    if (isOnline) {
      handleSync()
    }
  }, [isOnline])
  
  // Update pending count periodically and when online status changes
  useEffect(() => {
    updatePendingCount()
    const interval = setInterval(updatePendingCount, 5000)
    return () => clearInterval(interval)
  }, [isOnline])
  
  function updatePendingCount() {
    const stats = getQueueStats()
    setPendingCount(stats.pending)
  }
  
  async function handleSync() {
    if (syncing) return
    
    setSyncing(true)
    try {
      // Process offline queue
      const result = await processOfflineQueue()
      console.log('[OfflineBanner] Queue processed:', result)
      
      // Trigger full cloud sync
      if (result.processed > 0) {
        await fullSync()
      }
      
      updatePendingCount()
    } catch (error) {
      console.error('[OfflineBanner] Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }
  
  // Show syncing indicator
  if (syncing && pendingCount > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-white text-slate-900 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Syncing {pendingCount} changes...</span>
      </div>
    )
  }
  
  // Show offline banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728zM15 12H9" />
        </svg>
        <span>
          You&apos;re offline
          {pendingCount > 0 ? ` — ${pendingCount} changes pending sync` : ' — Changes will sync when back online'}
        </span>
      </div>
    )
  }
  
  return null
}

/**
 * Inline message for when a feature is unavailable offline
 */
interface OfflineMessageProps {
  message?: string
  className?: string
  compact?: boolean
}

export function OfflineMessage({ 
  message = 'This feature requires an internet connection', 
  className = '',
  compact = false
}: OfflineMessageProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-slate-400 ${className}`}>
        <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728zM15 12H9" />
        </svg>
        <span className="text-sm">{message}</span>
      </div>
    )
  }
  
  return (
    <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728z" />
          <path d="M15 12H9" />
        </svg>
      </div>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  )
}

/**
 * Wrapper that shows offline message when not connected
 */
interface OfflineGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  message?: string
}

export function OfflineGuard({ children, fallback, message }: OfflineGuardProps) {
  const isOnline = useOnline()
  
  if (!isOnline) {
    return fallback || <OfflineMessage message={message} />
  }
  
  return <>{children}</>
}
