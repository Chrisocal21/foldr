import { NextRequest, NextResponse } from 'next/server'

// Verify token and get user ID (simplified - in production use JWT)
function getUserFromToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  // In a real app, verify the token and extract user ID
  // For now, we'll trust the token exists
  return 'verified_user'
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserFromToken(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await request.json()
    const db = (process.env as any).DB
    
    if (!db) {
      // Local development mode - just acknowledge
      return NextResponse.json({ success: true, message: 'Sync acknowledged (local mode)' })
    }
    
    const now = new Date().toISOString()
    
    // Sync trips
    if (data.trips) {
      const trips = JSON.parse(data.trips)
      for (const trip of trips) {
        await db.prepare(`
          INSERT OR REPLACE INTO trips (id, user_id, data, updated_at)
          VALUES (?, ?, ?, ?)
        `).bind(trip.id, userId, JSON.stringify(trip), now).run()
      }
    }
    
    // Sync blocks
    if (data.blocks) {
      const blocks = JSON.parse(data.blocks)
      for (const block of blocks) {
        await db.prepare(`
          INSERT OR REPLACE INTO blocks (id, user_id, trip_id, data, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(block.id, userId, block.tripId, JSON.stringify(block), now).run()
      }
    }
    
    // Sync todos
    if (data.todos) {
      const todos = JSON.parse(data.todos)
      for (const todo of todos) {
        await db.prepare(`
          INSERT OR REPLACE INTO todos (id, user_id, trip_id, data, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(todo.id, userId, todo.tripId || null, JSON.stringify(todo), now).run()
      }
    }
    
    // Sync packing items
    if (data.packingItems) {
      const items = JSON.parse(data.packingItems)
      for (const item of items) {
        await db.prepare(`
          INSERT OR REPLACE INTO packing_items (id, user_id, trip_id, data, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(item.id, userId, item.tripId, JSON.stringify(item), now).run()
      }
    }
    
    // Sync expenses
    if (data.expenses) {
      const expenses = JSON.parse(data.expenses)
      for (const expense of expenses) {
        await db.prepare(`
          INSERT OR REPLACE INTO expenses (id, user_id, trip_id, data, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(expense.id, userId, expense.tripId, JSON.stringify(expense), now).run()
      }
    }
    
    // Sync settings
    if (data.settings) {
      await db.prepare(`
        INSERT OR REPLACE INTO settings (user_id, data, updated_at)
        VALUES (?, ?, ?)
      `).bind(userId, data.settings, now).run()
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Sync push error:', error)
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 })
  }
}
