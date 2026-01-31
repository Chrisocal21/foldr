import { NextResponse } from "next/server";
import { getJob, getJobNotes, updateJobCompiledNotes } from "@/lib/database";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/jobs/[id]/compile - Compile all notes into a single document
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: jobId } = await params;

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const notes = await getJobNotes(jobId) as any[];
    if (notes.length === 0) {
      return NextResponse.json(
        { error: "No notes to compile" },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Combine all polished notes
    const allNotes = notes.map((note: any, index: number) => {
      const date = new Date(note.created_at).toLocaleString();
      return `[${date}]\n${note.polished_output}`;
    }).join("\n\n---\n\n");

    // Use AI to compile into a cohesive document
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are compiling job notes into a single cohesive document. 
Your task:
1. Organize the notes chronologically
2. Remove redundant information
3. Create a clear, professional summary
4. Keep all important details and facts
5. Use clear headings/sections if helpful
6. Maintain a documentation style - factual and organized
7. Do NOT add information that isn't in the notes
8. Preserve dates/timestamps for context
9. Return ONLY the compiled document, no explanations`,
        },
        {
          role: "user",
          content: `Job: ${(job as any).name}\nDescription: ${(job as any).description || "No description"}\n\nNotes to compile:\n\n${allNotes}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.5,
    });

    const compiledNotes = completion.choices[0]?.message?.content || allNotes;

    // Save compiled notes to job
    await updateJobCompiledNotes(jobId, compiledNotes.trim());

    return NextResponse.json({
      success: true,
      compiledNotes: compiledNotes.trim(),
      message: "Notes compiled successfully",
    });
  } catch (error) {
    console.error("Error compiling notes:", error);
    return NextResponse.json(
      { error: "Failed to compile notes" },
      { status: 500 }
    );
  }
}
