'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

// Subscribe to online/offline events
function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true // Assume online during SSR
}

/**
 * Hook to detect online/offline status
 * Returns true if online, false if offline
 */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Offline-aware fetch wrapper
 * Returns null and sets offline flag if not connected
 */
export async function offlineFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; offline: boolean; error: string | null }> {
  if (!navigator.onLine) {
    return { data: null, offline: true, error: null }
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000), // 10s timeout
    })
    
    if (!response.ok) {
      return { data: null, offline: false, error: `Request failed: ${response.status}` }
    }
    
    const data = await response.json()
    return { data, offline: false, error: null }
  } catch (err) {
    // Check if we went offline during the request
    if (!navigator.onLine) {
      return { data: null, offline: true, error: null }
    }
    return { data: null, offline: false, error: 'Request failed' }
  }
}
