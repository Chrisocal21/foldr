import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildPrompt } from "@/lib/promptBuilder";
import { getUserProfile, saveSession } from "@/lib/database";
import crypto from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory cache
interface CacheEntry {
  output: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Generate cache key from request parameters
function getCacheKey(input: string, mode: string, contentType: string, userId: string): string {
  const data = `${input}|${mode}|${contentType}|${userId}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

// Clean expired cache entries
function cleanCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// Clean cache every 10 minutes
setInterval(cleanCache, 10 * 60 * 1000);

interface ProfileResult {
  id: string;
  user_id: string;
  name?: string;
  communication_style: string;
  formality_level: string;
  explanation_preference: string;
  role_context: string;
  signature_style: string;
  preferred_phrases: string;
  avoided_phrases: string;
  created_at: string;
  updated_at: string;
}

export async function POST(request: Request) {
  try {
    const { input, mode, contentType, userId } = await request.json();

    // Validate input
    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Input text is required" },
        { status: 400 }
      );
    }

    if (!mode || !["professional", "casual"].includes(mode)) {
      return NextResponse.json(
        { error: "Valid mode (professional or casual) is required" },
        { status: 400 }
      );
    }

    if (!contentType || !["email", "text", "note"].includes(contentType)) {
      return NextResponse.json(
        { error: "Valid content type (email, text, or note) is required" },
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

    const startTime = Date.now();

    // Fetch user profile from database
    const actualUserId = userId || "user_chris"; // Default to Chris for now
    const dbProfile = await getUserProfile(actualUserId) as ProfileResult | null;

    const userProfile = dbProfile
      ? {
          name: dbProfile.name,
          communicationStyle: dbProfile.communication_style,
          formalityLevel: dbProfile.formality_level,
          roleContext: dbProfile.role_context,
          signatureStyle: dbProfile.signature_style,
        }
      : {
          name: "Chris O'Connell",
          communicationStyle: "Direct & Concise",
          formalityLevel: "Professional but Friendly",
          roleContext: "Product Manager",
          signatureStyle: "Cheers,\nChris O'Connell\n(potential job title)",
        };

    // Check cache first
    const cacheKey = getCacheKey(input, mode, contentType, actualUserId);
    const cachedEntry = cache.get(cacheKey);
    
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
      const processingTime = Date.now() - startTime;
      
      // Generate session ID even for cached responses
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save session to database
      try {
        await saveSession({
          id: sessionId,
          userId: actualUserId,
          mode,
          contentType,
          originalInput: input,
          aiOutput: cachedEntry.output,
          processingTime,
          tokenUsage: cachedEntry.tokenUsage,
        });
      } catch (dbError) {
        console.error("Failed to save cached session to database:", dbError);
      }
      
      return NextResponse.json({
        sessionId,
        output: cachedEntry.output,
        processingTime,
        tokenUsage: cachedEntry.tokenUsage,
        cached: true,
      });
    }

    // Build the prompt with learned patterns
    const { system, user } = await buildPrompt(input, mode, contentType, userProfile, actualUserId);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for cost efficiency during development
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: user,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const output = completion.choices[0]?.message?.content;

    if (!output) {
      return NextResponse.json(
        { error: "No output generated from AI" },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;

    // Cache the response
    cache.set(cacheKey, {
      output,
      tokenUsage: {
        input: completion.usage?.prompt_tokens || 0,
        output: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0,
      },
      timestamp: Date.now(),
    });

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save session to database
    try {
      await saveSession({
        id: sessionId,
        userId: actualUserId,
        mode,
        contentType,
        originalInput: input,
        aiOutput: output,
        processingTime,
        tokenUsage: {
          input: completion.usage?.prompt_tokens || 0,
          output: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0,
        },
      });
    } catch (dbError) {
      console.error("Failed to save session to database:", dbError);
      // Continue anyway - don't fail the request if DB write fails
    }

    return NextResponse.json({
      sessionId,
      output,
      processingTime,
      tokenUsage: {
        input: completion.usage?.prompt_tokens || 0,
        output: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    console.error("Error processing writing:", error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process writing" },
      { status: 500 }
    );
  }
}
