import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

// Verify token and get user ID from database
async function getUserFromToken(request: NextRequest, db: any): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  
  const token = authHeader.substring(7)
  
  if (!db) {
    return 'local_user'
  }
  
  const tokenRecord = await db.prepare('SELECT user_id FROM tokens WHERE token = ?').bind(token).first()
  return tokenRecord?.user_id || null
}

// Immediate deletion endpoint - processes deletions right away
export async function POST(request: NextRequest) {
  console.log('[Delete API] Request received')
  
  let db: any = null
  let userId: string | null = null
  
  try {
    db = await getDB()
    console.log('[Delete API] DB obtained:', !!db)
  } catch (dbError) {
    console.error('[Delete API] DB error:', dbError)
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
  }
  
  try {
    userId = await getUserFromToken(request, db)
    console.log('[Delete API] User ID:', userId)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
  } catch (authError) {
    console.error('[Delete API] Auth error:', authError)
    return NextResponse.json({ success: false, error: 'Auth error' }, { status: 500 })
  }
  
  let data: any = null
  try {
    data = await request.json()
    console.log('[Delete API] Data:', JSON.stringify(data))
  } catch (parseError) {
    console.error('[Delete API] Parse error:', parseError)
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    if (!db) {
      return NextResponse.json({ success: true, message: 'Delete acknowledged (local mode)' })
    }

    console.log('[Delete API] Processing deletions...')
    if (data.trips?.length > 0) {
      for (const id of data.trips) {
        // Delete the trip
        await db.prepare('DELETE FROM trips WHERE id = ? AND user_id = ?').bind(id, userId).run()
        // Also delete all blocks for this trip
        await db.prepare('DELETE FROM blocks WHERE trip_id = ? AND user_id = ?').bind(id, userId).run()
        console.log('[Delete API] Deleted trip and blocks:', id)
      }
    }
    
    // Delete blocks
    if (data.blocks?.length > 0) {
      for (const id of data.blocks) {
        await db.prepare('DELETE FROM blocks WHERE id = ? AND user_id = ?').bind(id, userId).run()
      }
    }
    
    // Delete todos
    if (data.todos?.length > 0) {
      for (const id of data.todos) {
        await db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').bind(id, userId).run()
      }
    }
    
    // Delete packing items
    if (data.packingItems?.length > 0) {
      for (const id of data.packingItems) {
        await db.prepare('DELETE FROM packing_items WHERE id = ? AND user_id = ?').bind(id, userId).run()
      }
    }
    
    // Delete expenses
    if (data.expenses?.length > 0) {
      for (const id of data.expenses) {
        await db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').bind(id, userId).run()
      }
    }
    
    console.log('[Delete API] Success!')
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('[Delete API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
