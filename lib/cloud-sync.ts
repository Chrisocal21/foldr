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
export async function signup(email: string, password: string): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
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
    const localData = {
      trips: localStorage.getItem('foldr_trips'),
      blocks: localStorage.getItem('foldr_blocks'),
      todos: localStorage.getItem('foldr_todos'),
      packingItems: localStorage.getItem('foldr_packing_items'),
      expenses: localStorage.getItem('foldr_expenses'),
      settings: localStorage.getItem('foldr_settings'),
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
      return { success: true }
    }
    
    return { success: false, error: data.error || 'Sync failed' }
  } catch (error) {
    return { success: false, error: 'Network error - will sync when online' }
  }
}

// Pull data from cloud to local
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
      // Merge cloud data with local (cloud wins for conflicts)
      if (data.trips) localStorage.setItem('foldr_trips', data.trips)
      if (data.blocks) localStorage.setItem('foldr_blocks', data.blocks)
      if (data.todos) localStorage.setItem('foldr_todos', data.todos)
      if (data.packingItems) localStorage.setItem('foldr_packing_items', data.packingItems)
      if (data.expenses) localStorage.setItem('foldr_expenses', data.expenses)
      if (data.settings) localStorage.setItem('foldr_settings', data.settings)
      
      localStorage.setItem('foldr_last_sync', new Date().toISOString())
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
