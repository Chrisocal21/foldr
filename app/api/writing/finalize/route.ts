import { NextResponse } from "next/server";
import { updateSessionFinalOutput, getDatabase } from "@/lib/database";
import { extractLearningPatterns } from "@/lib/learningEngine";

export async function POST(request: Request) {
  try {
    const { sessionId, finalOutput } = await request.json();

    // Validate input
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!finalOutput || typeof finalOutput !== "string") {
      return NextResponse.json(
        { error: "Final output is required" },
        { status: 400 }
      );
    }

    // Update session with final output
    await updateSessionFinalOutput(sessionId, finalOutput);

    // Get session details for learning
    const db = getDatabase();
    const session = await db.prepare(
      'SELECT * FROM writing_sessions WHERE id = ?'
    ).bind(sessionId).first<any>();

    if (session) {
      // Extract learning patterns from the edits
      try {
        await extractLearningPatterns(
          session.user_id,
          session.original_input,
          session.ai_output,
          finalOutput,
          session.mode,
          session.content_type
        );
        
        return NextResponse.json({
          success: true,
          learningUpdated: true,
          message: "Session finalized and learning patterns extracted",
        });
      } catch (learningError) {
        console.error("Error extracting learning patterns:", learningError);
        // Still return success for the finalization, just note learning failed
        return NextResponse.json({
          success: true,
          learningUpdated: false,
          message: "Session finalized but learning extraction failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      learningUpdated: false,
      message: "Session finalized successfully",
    });
  } catch (error) {
    console.error("Error finalizing session:", error);

    return NextResponse.json(
      { error: "Failed to finalize session" },
      { status: 500 }
    );
  }
}
