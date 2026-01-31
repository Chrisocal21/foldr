import { NextResponse } from "next/server";
import { getJob } from "@/lib/database";
import { buildPrompt } from "@/lib/promptBuilder";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/jobs/[id]/convert - Convert compiled notes to email or text
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: jobId } = await params;
    const { outputType, recipient, context, userId = "user_chris" } = await request.json();

    if (!outputType || !["email", "text"].includes(outputType)) {
      return NextResponse.json(
        { error: "Output type must be 'email' or 'text'" },
        { status: 400 }
      );
    }

    const job = await getJob(jobId) as any;
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (!job.compiled_notes) {
      return NextResponse.json(
        { error: "No compiled notes to convert. Please compile notes first." },
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

    // Build specific prompt for conversion
    const conversionPrompt = outputType === "email"
      ? `Convert these job notes into a professional email.
${recipient ? `Recipient: ${recipient}` : ""}
${context ? `Additional context: ${context}` : ""}

The email should:
- Have a proper greeting
- Summarize the key information clearly
- Be professional but friendly
- Include relevant details from the notes
- Have an appropriate closing

Job: ${job.name}
Notes:
${job.compiled_notes}`
      : `Convert these job notes into a concise text message.
${recipient ? `Sending to: ${recipient}` : ""}
${context ? `Additional context: ${context}` : ""}

The text should:
- Be concise and to the point
- Include only the most important information
- Sound natural for a text message
- No formal greeting/closing unless necessary

Job: ${job.name}
Notes:
${job.compiled_notes}`;

    // Get the base prompt for the output type
    const { system } = await buildPrompt(
      conversionPrompt,
      outputType === "email" ? "professional" : "casual",
      outputType,
      undefined,
      userId
    );

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: conversionPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const convertedOutput = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      output: convertedOutput.trim(),
      outputType,
      message: `Converted to ${outputType} successfully`,
    });
  } catch (error) {
    console.error("Error converting notes:", error);
    return NextResponse.json(
      { error: "Failed to convert notes" },
      { status: 500 }
    );
  }
}
