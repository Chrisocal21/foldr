import { Trip, Block, TripStatus, Todo } from './types'

const TRIPS_KEY = 'foldr_trips'
const BLOCKS_KEY = 'foldr_blocks'
const TODOS_KEY = 'foldr_todos'

// Trips
export function getTrips(): Trip[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(TRIPS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveTrip(trip: Trip): void {
  const trips = getTrips()
  const index = trips.findIndex(t => t.id === trip.id)
  
  if (index >= 0) {
    trips[index] = { ...trip, updatedAt: new Date().toISOString() }
  } else {
    trips.push(trip)
  }
  
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))
}

export function deleteTrip(tripId: string): void {
  const trips = getTrips().filter(t => t.id !== tripId)
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))
  
  // Also delete all blocks for this trip
  const blocks = getBlocks().filter(b => b.tripId !== tripId)
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks))
}

export function getTripById(tripId: string): Trip | undefined {
  return getTrips().find(t => t.id === tripId)
}

export function getTripStatus(startDate: string, endDate: string): TripStatus {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
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
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })
}

export function saveBlock(block: Block): void {
  const blocks = getBlocks()
  const index = blocks.findIndex(b => b.id === block.id)
  
  if (index >= 0) {
    blocks[index] = { ...block, updatedAt: new Date().toISOString() }
  } else {
    blocks.push(block)
  }
  
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks))
}

export function deleteBlock(blockId: string): void {
  const blocks = getBlocks().filter(b => b.id !== blockId)
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks))
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
    return new Date(dateA).getTime() - new Date(dateB).getTime()
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
  
  if (index >= 0) {
    todos[index] = { ...todo, updatedAt: new Date().toISOString() }
  } else {
    todos.push(todo)
  }
  
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
}

export function deleteTodo(todoId: string): void {
  const todos = getTodos().filter(t => t.id !== todoId)
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
}

export function toggleTodo(todoId: string): void {
  const todos = getTodos()
  const index = todos.findIndex(t => t.id === todoId)
  if (index >= 0) {
    todos[index].completed = !todos[index].completed
    todos[index].updatedAt = new Date().toISOString()
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
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
