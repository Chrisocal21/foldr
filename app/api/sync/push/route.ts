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
    
    // IMPORTANT: Handle deletions FIRST before upserting
    // This prevents deleted items from being re-added
    if (data.deletedItems) {
      const deleted = data.deletedItems
      console.log('[Push] Processing deletions:', deleted)
      
      // Delete trips
      if (deleted.trips?.length > 0) {
        for (const id of deleted.trips) {
          await db.prepare('DELETE FROM trips WHERE id = ? AND user_id = ?').bind(id, userId).run()
          // Also delete associated blocks
          await db.prepare('DELETE FROM blocks WHERE trip_id = ? AND user_id = ?').bind(id, userId).run()
          console.log('[Push] Deleted trip:', id)
        }
      }
      
      // Delete blocks
      if (deleted.blocks?.length > 0) {
        for (const id of deleted.blocks) {
          await db.prepare('DELETE FROM blocks WHERE id = ? AND user_id = ?').bind(id, userId).run()
        }
      }
      
      // Delete todos
      if (deleted.todos?.length > 0) {
        for (const id of deleted.todos) {
          await db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').bind(id, userId).run()
        }
      }
      
      // Delete packing items
      if (deleted.packingItems?.length > 0) {
        for (const id of deleted.packingItems) {
          await db.prepare('DELETE FROM packing_items WHERE id = ? AND user_id = ?').bind(id, userId).run()
        }
      }
      
      // Delete expenses
      if (deleted.expenses?.length > 0) {
        for (const id of deleted.expenses) {
          await db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').bind(id, userId).run()
        }
      }
    }
    
    // NOW upsert remaining data (after deletions are processed)
    // Sync trips
    if (data.trips !== undefined) {
      const trips = data.trips ? JSON.parse(data.trips) : []
      
      for (const trip of trips) {
        await db.prepare(`
          INSERT OR REPLACE INTO trips (id, user_id, data, updated_at)
          VALUES (?, ?, ?, ?)
        `).bind(trip.id, userId, JSON.stringify(trip), now).run()
      }
    }
    
    // Sync blocks
    if (data.blocks !== undefined) {
      const blocks = data.blocks ? JSON.parse(data.blocks) : []
      
      for (const block of blocks) {
        await db.prepare(`
          INSERT OR REPLACE INTO blocks (id, user_id, trip_id, data, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(block.id, userId, block.tripId, JSON.stringify(block), now).run()
      }
    }
    
    // Sync todos
    if (data.todos !== undefined) {
      const todos = data.todos ? JSON.parse(data.todos) : []
      
      for (const todo of todos) {
        await db.prepare(`
          INSERT OR REPLACE INTO todos (id, user_id, trip_id, data, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(todo.id, userId, todo.tripId || null, JSON.stringify(todo), now).run()
      }
    }
    
    // Sync packing items
    if (data.packingItems !== undefined) {
      const items = data.packingItems ? JSON.parse(data.packingItems) : []
      
      for (const item of items) {
        await db.prepare(`
          INSERT OR REPLACE INTO packing_items (id, user_id, trip_id, data, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(item.id, userId, item.tripId, JSON.stringify(item), now).run()
      }
    }
    
    // Sync expenses
    if (data.expenses !== undefined) {
      const expenses = data.expenses ? JSON.parse(data.expenses) : []
      
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
