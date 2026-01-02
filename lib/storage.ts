import { Trip, Block, TripStatus, Todo, PackingItem, PackingCategory, PackingTemplate, Expense, ExpenseCategory } from './types'
import { syncToCloud, isLoggedIn, immediateDelete } from './cloud-sync'
import { queueMutation, isOnline, getOfflineQueue } from './offline-queue'

const TRIPS_KEY = 'foldr_trips'
const BLOCKS_KEY = 'foldr_blocks'
const TODOS_KEY = 'foldr_todos'
const DELETED_ITEMS_KEY = 'foldr_deleted_items'
const PACKING_KEY = 'foldr_packing_items'
const EXPENSES_KEY = 'foldr_expenses'

// Clear all local data - used when "continue without account" to start fresh
export function clearAllLocalData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TRIPS_KEY)
  localStorage.removeItem(BLOCKS_KEY)
  localStorage.removeItem(TODOS_KEY)
  localStorage.removeItem(DELETED_ITEMS_KEY)
  localStorage.removeItem(PACKING_KEY)
  localStorage.removeItem(EXPENSES_KEY)
  localStorage.removeItem('foldr_auth_token')
}

// Track deleted item IDs for sync
interface DeletedItems {
  trips: string[]
  blocks: string[]
  todos: string[]
  packingItems: string[]
  expenses: string[]
}

function getDeletedItems(): DeletedItems {
  if (typeof window === 'undefined') return { trips: [], blocks: [], todos: [], packingItems: [], expenses: [] }
  const data = localStorage.getItem(DELETED_ITEMS_KEY)
  return data ? JSON.parse(data) : { trips: [], blocks: [], todos: [], packingItems: [], expenses: [] }
}

function addDeletedItem(type: keyof DeletedItems, id: string): void {
  const deleted = getDeletedItems()
  if (!deleted[type].includes(id)) {
    deleted[type].push(id)
    localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(deleted))
  }
}

export function clearDeletedItems(): void {
  localStorage.removeItem(DELETED_ITEMS_KEY)
}

export function getDeletedItemsForSync(): DeletedItems {
  return getDeletedItems()
}

// Debounced sync to avoid too many API calls
let syncTimeout: ReturnType<typeof setTimeout> | null = null

// Cancel any pending sync - called when pulling from cloud
// This prevents stale local data from being pushed after a pull
export function cancelPendingSync() {
  if (syncTimeout) {
    console.log('[Sync] Cancelling pending sync')
    clearTimeout(syncTimeout)
    syncTimeout = null
  }
}

function triggerSync() {
  console.log('[Sync] triggerSync called')
  // Only run on client side
  if (typeof window === 'undefined') {
    console.log('[Sync] Not in browser, skipping')
    return
  }
  const loggedIn = isLoggedIn()
  console.log('[Sync] isLoggedIn:', loggedIn)
  if (!loggedIn) {
    console.log('[Sync] Not logged in, skipping sync')
    return
  }
  
  // Debounce: wait 2 seconds after last change before syncing
  if (syncTimeout) clearTimeout(syncTimeout)
  console.log('[Sync] Setting 2s timeout for sync...')
  syncTimeout = setTimeout(async () => {
    console.log('[Sync] Starting cloud sync...')
    const result = await syncToCloud()
    if (result.success) {
      console.log('[Sync] Cloud sync successful!')
    } else {
      console.log('[Sync] Cloud sync failed:', result.error)
    }
  }, 2000)
}

// Helper to parse date string as local date (avoids UTC timezone shift)
function parseLocalDate(dateStr: string): Date {
  const [datePart] = dateStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Format date as "Thu, Dec 25"
export function formatFriendlyDate(dateStr: string): string {
  const date = parseLocalDate(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Format date as "Dec 25, 2025"
export function formatFullDate(dateStr: string): string {
  const date = parseLocalDate(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

// Get relative date string like "in 3 days" or "2 days ago"
export function formatRelativeDate(dateStr: string): string {
  const date = parseLocalDate(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'
  if (diffDays > 1 && diffDays <= 7) return `in ${diffDays} days`
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`
  
  return formatFriendlyDate(dateStr)
}

// Get time at a specific timezone
export function getTimeAtTimezone(timezone: string): string {
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return ''
  }
}

// Get timezone abbreviation (e.g., "EST", "PST")
export function getTimezoneAbbr(timezone: string): string {
  try {
    const parts = new Date().toLocaleTimeString('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    }).split(' ')
    return parts[parts.length - 1] || ''
  } catch {
    return ''
  }
}

// Common timezones for dropdown
export const TIMEZONES = [
  { label: 'US Eastern (New York)', value: 'America/New_York' },
  { label: 'US Central (Chicago)', value: 'America/Chicago' },
  { label: 'US Mountain (Denver)', value: 'America/Denver' },
  { label: 'US Pacific (Los Angeles)', value: 'America/Los_Angeles' },
  { label: 'US Alaska', value: 'America/Anchorage' },
  { label: 'US Hawaii', value: 'Pacific/Honolulu' },
  { label: 'UK (London)', value: 'Europe/London' },
  { label: 'Central Europe (Paris)', value: 'Europe/Paris' },
  { label: 'Eastern Europe (Athens)', value: 'Europe/Athens' },
  { label: 'Dubai', value: 'Asia/Dubai' },
  { label: 'India (Mumbai)', value: 'Asia/Kolkata' },
  { label: 'Singapore', value: 'Asia/Singapore' },
  { label: 'Hong Kong', value: 'Asia/Hong_Kong' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Sydney', value: 'Australia/Sydney' },
  { label: 'Auckland', value: 'Pacific/Auckland' },
  { label: 'Mexico City', value: 'America/Mexico_City' },
  { label: 'São Paulo', value: 'America/Sao_Paulo' },
  { label: 'Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
]

// Place search result type
export interface PlaceResult {
  displayName: string
  city: string
  country: string
  latitude: number
  longitude: number
  timezone: string
}

// Timezone lookup by rough coordinates (approximate)
// Maps regions to timezones based on longitude/latitude
function getTimezoneFromCoords(lat: number, lon: number): string {
  // Americas (west of -50 longitude)
  if (lon < -50) {
    // Hawaii
    if (lat > 18 && lat < 23 && lon < -150) return 'Pacific/Honolulu'
    // Alaska
    if (lat > 50 && lon < -130) return 'America/Anchorage'
    
    // Continental US by longitude bands (works for all latitudes)
    if (lon <= -115) return 'America/Los_Angeles' // Pacific: CA, WA, OR, NV
    if (lon <= -100) return 'America/Denver' // Mountain: CO, AZ, NM, UT, MT
    if (lon <= -85) return 'America/Chicago' // Central: TX, IL, MN, etc.
    if (lon > -85) return 'America/New_York' // Eastern: NY, FL, GA, etc.
    
    // Mexico
    if (lat < 25 && lat > 15 && lon > -105) return 'America/Mexico_City'
    // Brazil
    if (lat < 0 && lon > -60) return 'America/Sao_Paulo'
    // Argentina
    if (lat < -30) return 'America/Argentina/Buenos_Aires'
    
    return 'America/New_York' // Default Americas
  }
  
  // Europe & Africa
  if (lon >= -10 && lon < 30) {
    if (lat > 50 && lon < 5) return 'Europe/London' // UK
    if (lat > 35 && lat < 60 && lon >= 0 && lon < 20) return 'Europe/Paris' // Western Europe
    if (lat > 35 && lon >= 20) return 'Europe/Athens' // Eastern Europe
    if (lat < 35 && lat > 0) return 'Africa/Cairo' // North Africa
    return 'Europe/Paris' // Default Europe
  }
  
  // Middle East & Central Asia
  if (lon >= 30 && lon < 70) {
    if (lat > 20 && lat < 35 && lon < 60) return 'Asia/Dubai' // Gulf
    if (lat > 5 && lat < 35 && lon >= 60) return 'Asia/Kolkata' // India
    return 'Asia/Dubai' // Default Middle East
  }
  
  // East Asia & Pacific
  if (lon >= 70) {
    if (lat > 30 && lon >= 100 && lon < 120) return 'Asia/Hong_Kong' // China
    if (lat > 0 && lat < 10 && lon > 100 && lon < 110) return 'Asia/Singapore' // Singapore
    if (lat > 30 && lon >= 120 && lon < 145) return 'Asia/Tokyo' // Japan/Korea
    if (lat < 0 && lon > 110) return 'Australia/Sydney' // Australia
    if (lon > 165) return 'Pacific/Auckland' // New Zealand
    return 'Asia/Tokyo' // Default East Asia
  }
  
  // Hawaii
  if (lat > 18 && lat < 23 && lon < -150) return 'Pacific/Honolulu'
  
  return 'UTC'
}

// Search for places using our proxy API (to avoid CORS issues with Nominatim)
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (!query || query.length < 2) return []
  
  try {
    // Use our proxy API to avoid CORS issues
    const response = await fetch(
      `/api/places/search?q=${encodeURIComponent(query)}`
    )
    
    if (!response.ok) return []
    
    const data = await response.json()
    
    return data.map((item: {
      display_name: string
      lat: string
      lon: string
      address?: {
        city?: string
        town?: string
        village?: string
        municipality?: string
        state?: string
        country?: string
      }
    }) => {
      const lat = parseFloat(item.lat)
      const lon = parseFloat(item.lon)
      const addr = item.address || {}
      const city = addr.city || addr.town || addr.village || addr.municipality || ''
      const country = addr.country || ''
      const tz = getTimezoneFromCoords(lat, lon)
      
      console.log('Place search result:', { city, lat, lon, timezone: tz })
      
      return {
        displayName: item.display_name,
        city: city || item.display_name.split(',')[0],
        country,
        latitude: lat,
        longitude: lon,
        timezone: tz
      }
    })
  } catch (error) {
    console.error('Place search error:', error)
    return []
  }
}

// Trips
export function getTrips(): Trip[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(TRIPS_KEY)
  const trips: Trip[] = data ? JSON.parse(data) : []
  
  // Sort by start date (earliest first)
  return trips.sort((a, b) => {
    return parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime()
  })
}

export function saveTrip(trip: Trip): void {
  console.log('[Storage] saveTrip called for:', trip.name)
  const trips = getTrips()
  const index = trips.findIndex(t => t.id === trip.id)
  const isNew = index < 0
  
  if (index >= 0) {
    trips[index] = { ...trip, updatedAt: new Date().toISOString() }
  } else {
    trips.push(trip)
  }
  
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))
  
  // If offline, queue the mutation for later sync
  if (!isOnline()) {
    console.log('[Storage] Offline - queuing trip mutation')
    queueMutation(isNew ? 'create' : 'update', 'trip', trip.id, trip)
    return
  }
  
  console.log('[Storage] Calling triggerSync...')
  triggerSync()
}

export async function deleteTrip(tripId: string): Promise<void> {
  console.log('[Storage] ========== DELETE TRIP START ==========')
  console.log('[Storage] Deleting trip:', tripId)
  
  // Get all blocks that belong to this trip (for immediate delete)
  const blocksToDelete = getBlocks().filter(b => b.tripId === tripId)
  const blockIds = blocksToDelete.map(b => b.id)
  console.log('[Storage] Associated blocks to delete:', blockIds.length)
  
  // Remove from localStorage immediately
  const trips = getTrips().filter(t => t.id !== tripId)
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))
  console.log('[Storage] Removed from localStorage, remaining trips:', trips.length)
  
  const blocks = getBlocks().filter(b => b.tripId !== tripId)
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks))
  
  // If offline, queue deletions for later sync
  if (!isOnline()) {
    console.log('[Storage] Offline - queuing trip deletion')
    queueMutation('delete', 'trip', tripId)
    blockIds.forEach(id => queueMutation('delete', 'block', id))
    console.log('[Storage] ========== DELETE TRIP END (queued) ==========')
    return
  }
  
  // IMMEDIATELY delete from cloud - no debouncing
  // This ensures the deletion reaches the server right away
  // AWAIT the result so we know it completed
  console.log('[Storage] Calling immediateDelete...')
  const result = await immediateDelete({
    trips: [tripId],
    blocks: blockIds
  })
  
  if (result.success) {
    console.log('[Storage] ✅ Trip deleted from cloud immediately')
  } else {
    // If cloud delete failed, track for later sync
    console.log('[Storage] ❌ Cloud delete failed:', result.error)
    addDeletedItem('trips', tripId)
    blockIds.forEach(id => addDeletedItem('blocks', id))
  }
  console.log('[Storage] ========== DELETE TRIP END ==========')
}

export function getTripById(tripId: string): Trip | undefined {
  return getTrips().find(t => t.id === tripId)
}

export function getTripStatus(startDate: string, endDate: string): TripStatus {
  const now = new Date()
  // Set time to start of day for accurate comparison
  now.setHours(0, 0, 0, 0)
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  
  if (now < start) return 'upcoming'
  if (now > end) return 'past'
  return 'active'
}

// Blocks
export function getBlocks(): Block[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(BLOCKS_KEY)
  return data ? JSON.parse(data) : []
}

export function getBlocksByTripId(tripId: string): Block[] {
  return getBlocks()
    .filter(b => b.tripId === tripId)
    .sort((a, b) => {
      // Sort by date if available
      const dateA = a.date || a.createdAt
      const dateB = b.date || b.createdAt
      return parseLocalDate(dateA).getTime() - parseLocalDate(dateB).getTime()
    })
}

export function saveBlock(block: Block): void {
  const blocks = getBlocks()
  const index = blocks.findIndex(b => b.id === block.id)
  const isNew = index < 0
  
  if (index >= 0) {
    blocks[index] = { ...block, updatedAt: new Date().toISOString() }
  } else {
    blocks.push(block)
  }
  
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks))
  
  // If offline, queue the mutation for later sync
  if (!isOnline()) {
    console.log('[Storage] Offline - queuing block mutation')
    queueMutation(isNew ? 'create' : 'update', 'block', block.id, block)
    return
  }
  
  triggerSync()
}

export function deleteBlock(blockId: string): void {
  addDeletedItem('blocks', blockId)
  const blocks = getBlocks().filter(b => b.id !== blockId)
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks))
  
  // If offline, queue the deletion for later sync
  if (!isOnline()) {
    console.log('[Storage] Offline - queuing block deletion')
    queueMutation('delete', 'block', blockId)
    return
  }
  
  triggerSync()
}

export function duplicateBlock(blockId: string, targetTripId?: string): Block | undefined {
  const block = getBlockById(blockId)
  if (!block) return undefined
  
  const newBlock: Block = {
    ...block,
    id: crypto.randomUUID(),
    tripId: targetTripId || block.tripId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  saveBlock(newBlock)
  return newBlock
}

export function getBlockById(blockId: string): Block | undefined {
  return getBlocks().find(b => b.id === blockId)
}

export function reorderBlocks(tripId: string, blockId: string, direction: 'up' | 'down'): void {
  const allBlocks = getBlocks()
  const tripBlocks = allBlocks.filter(b => b.tripId === tripId)
  const otherBlocks = allBlocks.filter(b => b.tripId !== tripId)
  
  // Sort trip blocks chronologically
  tripBlocks.sort((a, b) => {
    const dateA = a.date || a.createdAt
    const dateB = b.date || b.createdAt
    return parseLocalDate(dateA).getTime() - parseLocalDate(dateB).getTime()
  })
  
  const currentIndex = tripBlocks.findIndex(b => b.id === blockId)
  if (currentIndex === -1) return
  
  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (newIndex < 0 || newIndex >= tripBlocks.length) return
  
  // Swap blocks
  const [movedBlock] = tripBlocks.splice(currentIndex, 1)
  tripBlocks.splice(newIndex, 0, movedBlock)
  
  // Update createdAt to maintain new order (using milliseconds offset to preserve sort)
  tripBlocks.forEach((block, index) => {
    block.createdAt = new Date(Date.now() + index * 1000).toISOString()
  })
  
  // Save all blocks
  localStorage.setItem(BLOCKS_KEY, JSON.stringify([...otherBlocks, ...tripBlocks]))
  triggerSync()
}

// Todos
export function getTodos(): Todo[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(TODOS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveTodo(todo: Todo): void {
  const todos = getTodos()
  const index = todos.findIndex(t => t.id === todo.id)
  const isNew = index < 0
  
  if (index >= 0) {
    todos[index] = { ...todo, updatedAt: new Date().toISOString() }
  } else {
    todos.push(todo)
  }
  
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
  
  // If offline, queue the mutation for later sync
  if (!isOnline()) {
    console.log('[Storage] Offline - queuing todo mutation')
    queueMutation(isNew ? 'create' : 'update', 'todo', todo.id, todo)
    return
  }
  
  triggerSync()
}

export function deleteTodo(todoId: string): void {
  addDeletedItem('todos', todoId)
  const todos = getTodos().filter(t => t.id !== todoId)
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
  
  // If offline, queue the deletion for later sync
  if (!isOnline()) {
    console.log('[Storage] Offline - queuing todo deletion')
    queueMutation('delete', 'todo', todoId)
    return
  }
  
  triggerSync()
}

export function toggleTodo(todoId: string): void {
  const todos = getTodos()
  const index = todos.findIndex(t => t.id === todoId)
  if (index >= 0) {
    todos[index].completed = !todos[index].completed
    todos[index].updatedAt = new Date().toISOString()
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
    
    // If offline, queue the update for later sync
    if (!isOnline()) {
      console.log('[Storage] Offline - queuing todo toggle')
      queueMutation('update', 'todo', todoId, todos[index])
      return
    }
    
    triggerSync()
  }
}

// Search
export function searchAll(query: string): { trips: Trip[], blocks: Block[] } {
  const lowerQuery = query.toLowerCase()
  
  const trips = getTrips().filter(trip =>
    trip.name.toLowerCase().includes(lowerQuery)
  )
  
  const blocks = getBlocks().filter(block => {
    const searchableText = JSON.stringify(block).toLowerCase()
    return searchableText.includes(lowerQuery)
  })
  
  return { trips, blocks }
}

// Packing List

export function getPackingItems(tripId: string): PackingItem[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(PACKING_KEY)
  const items: PackingItem[] = data ? JSON.parse(data) : []
  return items.filter(item => item.tripId === tripId)
}

export function savePackingItem(item: PackingItem): void {
  const data = localStorage.getItem(PACKING_KEY)
  const items: PackingItem[] = data ? JSON.parse(data) : []
  const index = items.findIndex(i => i.id === item.id)
  const isNew = index < 0
  
  if (index >= 0) {
    items[index] = item
  } else {
    items.push(item)
  }
  
  localStorage.setItem(PACKING_KEY, JSON.stringify(items))
  
  // If offline, queue the mutation for later sync
  if (!isOnline()) {
    console.log('[Storage] Offline - queuing packing item mutation')
    queueMutation(isNew ? 'create' : 'update', 'packingItem', item.id, item)
    return
  }
  
  triggerSync()
}

export function deletePackingItem(itemId: string): void {
  addDeletedItem('packingItems', itemId)
  const data = localStorage.getItem(PACKING_KEY)
  const items: PackingItem[] = data ? JSON.parse(data) : []
  localStorage.setItem(PACKING_KEY, JSON.stringify(items.filter(i => i.id !== itemId)))
  
  // If offline, queue the deletion for later sync
  if (!isOnline()) {
    console.log('[Storage] Offline - queuing packing item deletion')
    queueMutation('delete', 'packingItem', itemId)
    return
  }
  
  triggerSync()
}

export function togglePackingItem(itemId: string): void {
  const data = localStorage.getItem(PACKING_KEY)
  const items: PackingItem[] = data ? JSON.parse(data) : []
  const index = items.findIndex(i => i.id === itemId)
  if (index >= 0) {
    items[index].packed = !items[index].packed
    localStorage.setItem(PACKING_KEY, JSON.stringify(items))
    
    // If offline, queue the update for later sync
    if (!isOnline()) {
      console.log('[Storage] Offline - queuing packing item toggle')
      queueMutation('update', 'packingItem', itemId, items[index])
      return
    }
    
    triggerSync()
  }
}

export function addPackingTemplate(tripId: string, templateItems: { name: string; category: PackingCategory; quantity?: number }[]): void {
  const existingItems = getPackingItems(tripId)
  const existingNames = new Set(existingItems.map(i => i.name.toLowerCase()))
  
  templateItems.forEach(item => {
    if (!existingNames.has(item.name.toLowerCase())) {
      savePackingItem({
        id: crypto.randomUUID(),
        tripId,
        name: item.name,
        category: item.category,
        packed: false,
        quantity: item.quantity,
        createdAt: new Date().toISOString()
      })
    }
  })
}

// Packing Templates
export const PACKING_TEMPLATES: PackingTemplate[] = [
  {
    name: 'Beach',
    icon: '🏖️',
    items: [
      { name: 'Swimsuit', category: 'clothing' },
      { name: 'Flip flops', category: 'clothing' },
      { name: 'Sunglasses', category: 'accessories' },
      { name: 'Sunscreen', category: 'toiletries' },
      { name: 'Beach towel', category: 'other' },
      { name: 'Hat/Cap', category: 'accessories' },
      { name: 'Shorts', category: 'clothing', quantity: 3 },
      { name: 'T-shirts', category: 'clothing', quantity: 4 },
      { name: 'Sandals', category: 'clothing' },
      { name: 'Aloe vera gel', category: 'toiletries' },
    ]
  },
  {
    name: 'Business',
    icon: '💼',
    items: [
      { name: 'Dress shirts', category: 'clothing', quantity: 3 },
      { name: 'Dress pants', category: 'clothing', quantity: 2 },
      { name: 'Blazer/Jacket', category: 'clothing' },
      { name: 'Dress shoes', category: 'clothing' },
      { name: 'Tie', category: 'accessories' },
      { name: 'Belt', category: 'accessories' },
      { name: 'Laptop', category: 'electronics' },
      { name: 'Laptop charger', category: 'electronics' },
      { name: 'Business cards', category: 'documents' },
      { name: 'Portfolio/Notebook', category: 'other' },
    ]
  },
  {
    name: 'Winter',
    icon: '❄️',
    items: [
      { name: 'Heavy coat', category: 'clothing' },
      { name: 'Sweaters', category: 'clothing', quantity: 3 },
      { name: 'Thermal underwear', category: 'clothing' },
      { name: 'Winter boots', category: 'clothing' },
      { name: 'Gloves', category: 'accessories' },
      { name: 'Scarf', category: 'accessories' },
      { name: 'Beanie/Winter hat', category: 'accessories' },
      { name: 'Warm socks', category: 'clothing', quantity: 5 },
      { name: 'Lip balm', category: 'toiletries' },
      { name: 'Hand warmers', category: 'other' },
    ]
  },
  {
    name: 'Essentials',
    icon: '✈️',
    items: [
      { name: 'Passport', category: 'documents' },
      { name: 'Phone charger', category: 'electronics' },
      { name: 'Toothbrush', category: 'toiletries' },
      { name: 'Toothpaste', category: 'toiletries' },
      { name: 'Deodorant', category: 'toiletries' },
      { name: 'Underwear', category: 'clothing', quantity: 5 },
      { name: 'Socks', category: 'clothing', quantity: 5 },
      { name: 'Medications', category: 'toiletries' },
      { name: 'Wallet', category: 'accessories' },
      { name: 'Headphones', category: 'electronics' },
    ]
  }
]

// Expenses

export function getExpenses(tripId?: string): Expense[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(EXPENSES_KEY)
  const expenses: Expense[] = data ? JSON.parse(data) : []
  
  if (tripId) {
    return expenses.filter(e => e.tripId === tripId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }
  
  return expenses.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function saveExpense(expense: Expense): void {
  const data = localStorage.getItem(EXPENSES_KEY)
  const expenses: Expense[] = data ? JSON.parse(data) : []
  const index = expenses.findIndex(e => e.id === expense.id)
  const isNew = index < 0
  
  if (index >= 0) {
    expenses[index] = expense
  } else {
    expenses.push(expense)
  }
  
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses))
  
  // If offline, queue the mutation for later sync
  if (!isOnline()) {
    console.log('[Storage] Offline - queuing expense mutation')
    queueMutation(isNew ? 'create' : 'update', 'expense', expense.id, expense)
    return
  }
  
  triggerSync()
}

export function deleteExpense(expenseId: string): void {
  addDeletedItem('expenses', expenseId)
  const data = localStorage.getItem(EXPENSES_KEY)
  const expenses: Expense[] = data ? JSON.parse(data) : []
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses.filter(e => e.id !== expenseId)))
  
  // If offline, queue the deletion for later sync
  if (!isOnline()) {
    console.log('[Storage] Offline - queuing expense deletion')
    queueMutation('delete', 'expense', expenseId)
    return
  }
  
  triggerSync()
}

export function getExpenseTotal(tripId: string, currency?: string): number {
  const expenses = getExpenses(tripId)
  if (currency) {
    return expenses.filter(e => e.currency === currency).reduce((sum, e) => sum + e.amount, 0)
  }
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
]

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'food', label: 'Food & Drink', icon: '🍽️' },
  { value: 'activities', label: 'Activities', icon: '🎯' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'other', label: 'Other', icon: '📦' },
]
