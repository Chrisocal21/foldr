import { getDatabase } from './database';

type Mode = "professional" | "casual";
type ContentType = "email" | "text" | "note";

interface UserProfile {
  name?: string;
  communicationStyle?: string;
  formalityLevel?: string;
  roleContext?: string;
  signatureStyle?: string;
}

interface LearnedPattern {
  pattern_category: string;
  pattern_key: string;
  pattern_value: string;
  confidence_score: number;
  occurrence_count: number;
}

const BASE_SYSTEM_PROMPT = `You are a digital writing twin that transforms rough notes and thoughts into polished, complete communications that sound EXACTLY like the user wrote them.

YOUR MISSION:
Take messy input and create a fully formatted, enhanced version that sounds authentically like THIS SPECIFIC USER, not generic AI writing.

WHAT YOU DO:
1. ADD STRUCTURE: Turn fragments into complete, well-formatted communications
2. ADD FORMATTING: Add greetings, closings, proper email structure when appropriate
3. EXPAND IDEAS: Flesh out brief notes into complete thoughts
4. IMPROVE CLARITY: Make ideas clearer and more organized
5. FIX EVERYTHING: Grammar, spelling, punctuation, flow
6. ENHANCE PROFESSIONALISM: Make it polished and ready to send

CRITICAL - VOICE MATCHING:
- Study the USER PROFILE below to understand their specific communication patterns
- Use THEIR typical vocabulary, phrases, and expressions
- Match THEIR level of formality and warmth
- Copy THEIR sentence structure and rhythm
- Include THEIR signature style elements
- Make it sound like THEM on their best writing day, not like generic AI

WHAT MAKES THIS USER'S WRITING UNIQUE:
- Pay attention to their typical word choices and phrases
- Notice their level of directness vs. softness
- Observe their use of humor, warmth, or formality
- Match their greeting and closing styles
- Use their natural sentence patterns

OUTPUT RULES:
- Return ONLY the enhanced version, no explanations
- Make it complete and ready to send
- Sound like the user, not like ChatGPT
- Be confident - add what's needed to make it professional
- No asterisks or markdown formatting (use plain text only)`;

// Content type contexts now define both tone AND formatting
// Email and Text have fixed tones, Note is for accumulating job notes
const CONTENT_TYPE_CONTEXTS = {
  email: `
CONTENT TYPE: Email (Professional Tone)
TONE: Professional but friendly - this is business communication.
- Always add a proper greeting (e.g., "Hi [Name]," or "Hello,")
- Structure the body clearly with proper paragraphs
- Be professional but personable - not stiff or robotic
- Include all necessary details in a logical order
- Add an appropriate closing signature using the user's signature style from their profile
- Make it complete and ready to send
- Check for proper email etiquette (clear subject context, action items, etc.)
- Sound polished and business-appropriate while keeping natural warmth`,
  
  text: `
CONTENT TYPE: Text Message (Clean & Direct)
TONE: Conversational but polished - get to the point without fluff.
- Be concise and direct - no unnecessary padding or roundabout language
- Fix grammar and spelling but keep it natural
- Remove any rambling or repetitive content
- Keep the message clear and easy to read
- NO formal greeting needed unless contextually appropriate
- NO signature needed
- Make it sound like a well-composed text, not an essay
- Convey the core message efficiently without being curt or rude`,
  
  note: `
CONTENT TYPE: Note (Clean Documentation)
TONE: Clear and organized - this is for documentation purposes.
- Focus on clarity and factual accuracy
- Organize information logically
- Use bullet points if multiple items need listing
- Add timestamps or context markers where helpful
- Keep it professional but not overly formal
- Make key information easy to find and reference
- This will potentially be compiled with other notes, so keep it modular
- Don't add greetings or signatures - this is internal documentation`,
};

async function fetchLearnedPatterns(
  userId: string,
  mode: Mode,
  contentType: ContentType
): Promise<LearnedPattern[]> {
  try {
    const db = getDatabase();
    
    // Fetch patterns with confidence > 0.3 (observed at least 3-4 times)
    const result = await db.prepare(`
      SELECT pattern_category, pattern_key, pattern_value, confidence_score, occurrence_count, last_observed_at
      FROM learning_patterns
      WHERE user_id = ?
        AND confidence_score >= 0.3
        AND (mode_context = ? OR mode_context = 'all')
        AND (content_type_context = ? OR content_type_context = 'all')
      ORDER BY confidence_score DESC, occurrence_count DESC
      LIMIT 50
    `).bind(userId, mode, contentType).all();
    
    const patterns = result.results as any[];
    
    // Apply temporal weighting: recent patterns (last 7 days) get 20% confidence boost
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return patterns.map(p => {
      const lastObserved = new Date(p.last_observed_at);
      const isRecent = lastObserved > sevenDaysAgo;
      
      return {
        pattern_category: p.pattern_category,
        pattern_key: p.pattern_key,
        pattern_value: p.pattern_value,
        confidence_score: isRecent ? Math.min(p.confidence_score * 1.2, 1.0) : p.confidence_score,
        occurrence_count: p.occurrence_count
      };
    }).sort((a, b) => b.confidence_score - a.confidence_score);
  } catch (error) {
    console.error('Error fetching learned patterns:', error);
    return [];
  }
}

function buildLearnedPatternsSection(patterns: LearnedPattern[]): string {
  if (patterns.length === 0) {
    return `\n\nLEARNED PATTERNS:
(As you use this tool more, it will learn from your edits to better match your style. Keep using it to build your personal writing profile!)`;
  }

  let section = `\n\nLEARNED PATTERNS FROM YOUR PREVIOUS EDITS:
The system has learned these preferences from observing your writing patterns. Apply them consistently:`;

  // Group patterns by category
  const vocabulary = patterns.filter(p => p.pattern_category === 'vocabulary');
  const tone = patterns.filter(p => p.pattern_category === 'tone');
  const length = patterns.filter(p => p.pattern_category === 'length');
  const structure = patterns.filter(p => p.pattern_category === 'structure');

  // Add vocabulary preferences
  if (vocabulary.length > 0) {
    section += `\n\nVOCABULARY PREFERENCES (Confidence-Weighted):`;
    const addPhrases = vocabulary.filter(p => p.pattern_key === 'adds_phrase').slice(0, 8);
    const removePhrases = vocabulary.filter(p => p.pattern_key === 'removes_phrase').slice(0, 8);
    
    if (addPhrases.length > 0) {
      section += `\n- PREFER using these phrases (user tends to add them): `;
      section += addPhrases.map(p => `"${p.pattern_value}" (${Math.round(p.confidence_score * 100)}% confidence)`).join(', ');
    }
    
    if (removePhrases.length > 0) {
      section += `\n- AVOID these phrases (user tends to remove them): `;
      section += removePhrases.map(p => `"${p.pattern_value}"`).join(', ');
    }
  }

  // Add tone preferences
  if (tone.length > 0) {
    section += `\n\nTONE PREFERENCES:`;
    const tonePrefs = tone.slice(0, 3);
    tonePrefs.forEach(p => {
      if (p.pattern_key === 'more_formal') {
        section += `\n- User prefers MORE FORMAL language (${Math.round(p.confidence_score * 100)}% confidence, observed ${p.occurrence_count}x)`;
      } else if (p.pattern_key === 'less_formal') {
        section += `\n- User prefers MORE CASUAL language (${Math.round(p.confidence_score * 100)}% confidence, observed ${p.occurrence_count}x)`;
      }
    });
  }

  // Add length preferences
  if (length.length > 0) {
    section += `\n\nLENGTH PREFERENCES:`;
    const lengthPrefs = length.slice(0, 3);
    lengthPrefs.forEach(p => {
      if (p.pattern_key === 'prefers_shorter') {
        section += `\n- User prefers CONCISE writing (${Math.round(p.confidence_score * 100)}% confidence) - be brief and direct`;
      } else if (p.pattern_key === 'prefers_longer') {
        section += `\n- User prefers DETAILED writing (${Math.round(p.confidence_score * 100)}% confidence) - expand and elaborate`;
      }
    });
  }

  // Add structure preferences
  if (structure.length > 0) {
    section += `\n\nSTRUCTURE PREFERENCES:`;
    const structPrefs = structure.slice(0, 5);
    structPrefs.forEach(p => {
      if (p.pattern_key === 'adds_greeting') {
        section += `\n- Always include a greeting`;
      } else if (p.pattern_key === 'removes_greeting') {
        section += `\n- Skip greetings (user prefers to get straight to the point)`;
      } else if (p.pattern_key === 'adds_paragraphs') {
        section += `\n- Break content into multiple paragraphs`;
      } else if (p.pattern_key === 'removes_paragraphs') {
        section += `\n- Keep content in a single paragraph when possible`;
      }
    });
  }

  section += `\n\n⚡ These patterns are based on ${patterns.length} learned preferences. The more you use and refine, the better this gets!`;

  return section;
}

export async function buildPrompt(
  input: string,
  mode: Mode,
  contentType: ContentType,
  userProfile?: UserProfile,
  userId?: string
): Promise<{ system: string; user: string }> {
  let systemPrompt = BASE_SYSTEM_PROMPT;

  // Add user profile if available
  if (userProfile) {
    systemPrompt += `\n\nUSER PROFILE:`;
    if (userProfile.name) systemPrompt += `\nName: ${userProfile.name}`;
    if (userProfile.communicationStyle) {
      systemPrompt += `\nCommunication Style: ${userProfile.communicationStyle}`;
    }
    if (userProfile.formalityLevel) {
      systemPrompt += `\nFormality Level: ${userProfile.formalityLevel}`;
    }
    if (userProfile.roleContext) {
      systemPrompt += `\nRole/Context: ${userProfile.roleContext}`;
    }
    if (userProfile.signatureStyle) {
      systemPrompt += `\nTypical Signature: ${userProfile.signatureStyle}`;
    }
  }

  // Add content type context (now includes tone guidance)
  systemPrompt += `\n${CONTENT_TYPE_CONTEXTS[contentType]}`;

  // Fetch and add learned patterns
  const patterns = await fetchLearnedPatterns(
    userId || 'user_chris',
    mode,
    contentType
  );
  systemPrompt += buildLearnedPatternsSection(patterns);

  systemPrompt += `\n\nIMPORTANT REMINDERS:
- Write as if YOU are ${userProfile?.name || 'the user'}, not as an AI assistant
- Match this specific person's vocabulary and expressions
- Sound natural and authentic, not generic or robotic
- Make it polished but still recognizably THEIR voice
- APPLY THE LEARNED PATTERNS ABOVE - they represent what this user actually wants`;

  const userPrompt = `Input to enhance:\n\n${input}`;

  return {
    system: systemPrompt,
    user: userPrompt,
  };
}
