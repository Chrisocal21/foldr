import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(request: NextRequest) {
  try {
    const db = (process.env as any).DB
    const userId = await getUserFromToken(request, db)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!db) {
      // Local development mode - return empty
      return NextResponse.json({ 
        success: true, 
        message: 'Pull acknowledged (local mode)',
        trips: null,
        blocks: null,
        todos: null,
        packingItems: null,
        expenses: null,
        settings: null
      })
    }
    
    // Get all user data
    const tripsResult = await db.prepare('SELECT data FROM trips WHERE user_id = ?').bind(userId).all()
    const blocksResult = await db.prepare('SELECT data FROM blocks WHERE user_id = ?').bind(userId).all()
    const todosResult = await db.prepare('SELECT data FROM todos WHERE user_id = ?').bind(userId).all()
    const packingResult = await db.prepare('SELECT data FROM packing_items WHERE user_id = ?').bind(userId).all()
    const expensesResult = await db.prepare('SELECT data FROM expenses WHERE user_id = ?').bind(userId).all()
    const settingsResult = await db.prepare('SELECT data FROM settings WHERE user_id = ?').bind(userId).first()
    
    // Convert results to arrays
    const trips = tripsResult.results?.map((r: any) => JSON.parse(r.data)) || []
    const blocks = blocksResult.results?.map((r: any) => JSON.parse(r.data)) || []
    const todos = todosResult.results?.map((r: any) => JSON.parse(r.data)) || []
    const packingItems = packingResult.results?.map((r: any) => JSON.parse(r.data)) || []
    const expenses = expensesResult.results?.map((r: any) => JSON.parse(r.data)) || []
    
    return NextResponse.json({
      success: true,
      trips: JSON.stringify(trips),
      blocks: JSON.stringify(blocks),
      todos: JSON.stringify(todos),
      packingItems: JSON.stringify(packingItems),
      expenses: JSON.stringify(expenses),
      settings: settingsResult?.data || null
    })
    
  } catch (error) {
    console.error('Sync pull error:', error)
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 })
  }
}
