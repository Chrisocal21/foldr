import { NextResponse } from "next/server";
import { getJob, addJobNote, deleteJobNote, getJobNotes, updateJobCompiledNotes } from "@/lib/database";
import { buildPrompt } from "@/lib/promptBuilder";
import OpenAI from "openai";
import crypto from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/jobs/[id]/notes - Add a new note to a job (with polishing)
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: jobId } = await params;
    const { rawInput, userId = "user_chris" } = await request.json();

    if (!rawInput || typeof rawInput !== "string") {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Build prompt for note polishing
    const { system, user } = await buildPrompt(
      rawInput,
      "casual", // Notes use casual mode
      "note",
      undefined,
      userId
    );

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const polishedOutput = completion.choices[0]?.message?.content || rawInput;

    // Save the note
    const noteId = `note_${crypto.randomUUID()}`;
    await addJobNote({
      id: noteId,
      jobId,
      rawInput: rawInput.trim(),
      polishedOutput: polishedOutput.trim(),
    });

    return NextResponse.json({
      success: true,
      noteId,
      polishedOutput: polishedOutput.trim(),
      message: "Note added successfully",
    });
  } catch (error) {
    console.error("Error adding note:", error);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id]/notes - Delete a note
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id: jobId } = await params;
    const { noteId } = await request.json();

    if (!noteId) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    await deleteJobNote(noteId);

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
