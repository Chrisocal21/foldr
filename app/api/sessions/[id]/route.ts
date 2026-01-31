import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

interface SessionResult {
  session_id: string;
  user_id: string;
  mode: string;
  content_type: string;
  original_input: string;
  initial_output: string;
  final_output: string | null;
  user_edited: number;
  feedback_provided: number;
  created_at: string;
  user_name?: string;
  user_email?: string;
  communication_style?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const db = getDatabase();

    // Fetch the session with all details
    const session = await db.prepare(`
      SELECT 
        ws.*,
        up.name as user_name,
        up.email as user_email,
        up.communication_style
      FROM writing_sessions ws
      LEFT JOIN user_profiles up ON ws.user_id = up.user_id
      WHERE ws.session_id = ?
    `).bind(sessionId).first() as SessionResult | null;

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Fetch all refinements for this session
    const refinements = await db.prepare(`
      SELECT 
        refinement_text,
        refined_output,
        timestamp
      FROM session_refinements
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `).bind(sessionId).all();

    // Fetch learning patterns associated with this session
    const patterns = await db.prepare(`
      SELECT 
        pattern_category,
        pattern_type,
        pattern_value,
        confidence_score,
        occurrences
      FROM learning_patterns
      WHERE session_id = ?
      ORDER BY confidence_score DESC
    `).bind(sessionId).all();

    return NextResponse.json({
      session: {
        id: session.session_id,
        userId: session.user_id,
        mode: session.mode,
        contentType: session.content_type,
        originalInput: session.original_input,
        initialOutput: session.initial_output,
        finalOutput: session.final_output,
        userEdited: session.user_edited === 1,
        feedbackProvided: session.feedback_provided === 1,
        timestamp: session.created_at,
        userName: session.user_name,
        userEmail: session.user_email,
        communicationStyle: session.communication_style
      },
      refinements: refinements.results || [],
      patterns: patterns.results || []
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
