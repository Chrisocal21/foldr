import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { currentOutput, refinementRequest, mode, contentType, sessionId } = await request.json();

    if (!currentOutput || !refinementRequest) {
      return NextResponse.json(
        { error: 'Current output and refinement request are required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Build refinement prompt
    const systemPrompt = `You are refining a piece of writing based on user feedback. 

CURRENT VERSION:
${currentOutput}

USER'S REFINEMENT REQUEST:
${refinementRequest}

YOUR TASK:
- Apply the requested changes to the current version
- Maintain the overall style and voice
- Only change what was requested
- Return the complete updated version
- No explanations, just the refined text

Remember: You're making targeted improvements based on specific feedback, not rewriting everything.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Apply this refinement: ${refinementRequest}` },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const refinedOutput = completion.choices[0]?.message?.content?.trim() || '';
    const processingTime = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      output: refinedOutput,
      processingTime,
      tokenUsage: {
        input: completion.usage?.prompt_tokens || 0,
        output: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0,
      },
    });
  } catch (error: any) {
    console.error('Error refining writing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refine writing' },
      { status: 500 }
    );
  }
}
