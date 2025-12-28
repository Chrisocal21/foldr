import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

// Verify token and get user ID from database
async function getUserFromToken(request: NextRequest, db: any): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  
  const token = authHeader.substring(7)
  
  if (!db) {
    // Local development - return a mock user
    return 'local_user'
  }
  
  // Look up token in database
  const tokenRecord = await db.prepare('SELECT user_id FROM tokens WHERE token = ?').bind(token).first()
  return tokenRecord?.user_id || null
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDB()
    const userId = await getUserFromToken(request, db)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await request.json()
    
    if (!db) {
      // Local development mode - just acknowledge
      return NextResponse.json({ success: true, message: 'Sync acknowledged (local mode)' })
    }
    
    const now = new Date().toISOString()
    
    // Sync trips - DELETE items not in local data, then upsert
    if (data.trips !== undefined) {
      const trips = data.trips ? JSON.parse(data.trips) : []
      const tripIds = trips.map((t: any) => t.id)
      
      // Delete trips that are no longer in local storage
      if (tripIds.length === 0) {
        await db.prepare('DELETE FROM trips WHERE user_id = ?').bind(userId).run()
      } else {
        // Delete trips not in the current list
        const placeholders = tripIds.map(() => '?').join(',')
        await db.prepare(`DELETE FROM trips WHERE user_id = ? AND id NOT IN (${placeholders})`)
          .bind(userId, ...tripIds).run()
      }
      
      // Upsert remaining trips
      for (const trip of trips) {
        await db.prepare(`
          INSERT OR REPLACE INTO trips (id, user_id, data, updated_at)
          VALUES (?, ?, ?, ?)
        `).bind(trip.id, userId, JSON.stringify(trip), now).run()
      }
    }
    
    // Sync blocks - DELETE items not in local data, then upsert
    if (data.blocks !== undefined) {
      const blocks = data.blocks ? JSON.parse(data.blocks) : []
      const blockIds = blocks.map((b: any) => b.id)
      
      if (blockIds.length === 0) {
        await db.prepare('DELETE FROM blocks WHERE user_id = ?').bind(userId).run()
      } else {
        const placeholders = blockIds.map(() => '?').join(',')
        await db.prepare(`DELETE FROM blocks WHERE user_id = ? AND id NOT IN (${placeholders})`)
          .bind(blockIds.length, userId, ...blockIds).run()
      }
      
      for (const block of blocks) {
        await db.prepare(`
          INSERT OR REPLACE INTO blocks (id, user_id, trip_id, data, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(block.id, userId, block.tripId, JSON.stringify(block), now).run()
      }
    }
    
    // Sync todos - DELETE items not in local data, then upsert
    if (data.todos !== undefined) {
      const todos = data.todos ? JSON.parse(data.todos) : []
      const todoIds = todos.map((t: any) => t.id)
      
      if (todoIds.length === 0) {
        await db.prepare('DELETE FROM todos WHERE user_id = ?').bind(userId).run()
      } else {
        const placeholders = todoIds.map(() => '?').join(',')
        await db.prepare(`DELETE FROM todos WHERE user_id = ? AND id NOT IN (${placeholders})`)
          .bind(userId, ...todoIds).run()
      }
      
      for (const todo of todos) {
        await db.prepare(`
          INSERT OR REPLACE INTO todos (id, user_id, trip_id, data, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(todo.id, userId, todo.tripId || null, JSON.stringify(todo), now).run()
      }
    }
    
    // Sync packing items - DELETE items not in local data, then upsert
    if (data.packingItems !== undefined) {
      const items = data.packingItems ? JSON.parse(data.packingItems) : []
      const itemIds = items.map((i: any) => i.id)
      
      if (itemIds.length === 0) {
        await db.prepare('DELETE FROM packing_items WHERE user_id = ?').bind(userId).run()
      } else {
        const placeholders = itemIds.map(() => '?').join(',')
        await db.prepare(`DELETE FROM packing_items WHERE user_id = ? AND id NOT IN (${placeholders})`)
          .bind(userId, ...itemIds).run()
      }
      
      for (const item of items) {
        await db.prepare(`
          INSERT OR REPLACE INTO packing_items (id, user_id, trip_id, data, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(item.id, userId, item.tripId, JSON.stringify(item), now).run()
      }
    }
    
    // Sync expenses - DELETE items not in local data, then upsert
    if (data.expenses !== undefined) {
      const expenses = data.expenses ? JSON.parse(data.expenses) : []
      const expenseIds = expenses.map((e: any) => e.id)
      
      if (expenseIds.length === 0) {
        await db.prepare('DELETE FROM expenses WHERE user_id = ?').bind(userId).run()
      } else {
        const placeholders = expenseIds.map(() => '?').join(',')
        await db.prepare(`DELETE FROM expenses WHERE user_id = ? AND id NOT IN (${placeholders})`)
          .bind(userId, ...expenseIds).run()
      }
      
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
