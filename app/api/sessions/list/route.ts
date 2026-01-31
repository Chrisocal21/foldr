import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user_chris';

    const db = getDatabase();
    
    // Get all sessions ordered by created_at descending
    const sessions = await db.prepare(
      `SELECT 
        id,
        mode,
        content_type,
        original_input,
        ai_output,
        final_output,
        created_at,
        updated_at
      FROM writing_sessions 
      WHERE user_id = ? 
      ORDER BY created_at DESC
      LIMIT 100`
    ).bind(userId).all();

    // Group sessions by time periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    const grouped = {
      today: [] as any[],
      yesterday: [] as any[],
      lastWeek: [] as any[],
      lastMonth: [] as any[],
      older: [] as any[],
    };

    sessions.results.forEach((session: any) => {
      const sessionDate = new Date(session.created_at);
      
      if (sessionDate >= today) {
        grouped.today.push(session);
      } else if (sessionDate >= yesterday) {
        grouped.yesterday.push(session);
      } else if (sessionDate >= lastWeek) {
        grouped.lastWeek.push(session);
      } else if (sessionDate >= lastMonth) {
        grouped.lastMonth.push(session);
      } else {
        grouped.older.push(session);
      }
    });

    return NextResponse.json({
      sessions: sessions.results,
      grouped,
      total: sessions.results.length,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
