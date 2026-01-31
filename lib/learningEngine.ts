import { getDatabase } from './database';

interface PatternAnalysis {
  vocabulary: { word: string; frequency: number }[];
  lengthPreference: 'shorter' | 'longer' | 'similar';
  formalityChange: 'more_formal' | 'less_formal' | 'similar';
  structuralChanges: string[];
  addedPhrases: string[];
  removedPhrases: string[];
}

/**
 * Analyzes differences between AI output and user's final edited version
 * to extract learning patterns about user preferences
 */
export async function extractLearningPatterns(
  userId: string,
  originalInput: string,
  aiOutput: string,
  finalOutput: string,
  mode: string,
  contentType: string
): Promise<void> {
  const analysis = analyzeDifferences(aiOutput, finalOutput);
  
  // Store learned patterns in database
  const db = getDatabase();
  
  // 1. Vocabulary preferences
  for (const word of analysis.addedPhrases) {
    await savePattern(
      userId,
      'vocabulary',
      `prefers_phrase: ${word}`,
      word,
      mode,
      contentType
    );
  }
  
  for (const word of analysis.removedPhrases) {
    await savePattern(
      userId,
      'vocabulary',
      `avoids_phrase: ${word}`,
      word,
      mode,
      contentType
    );
  }
  
  // 2. Length preferences
  if (analysis.lengthPreference !== 'similar') {
    await savePattern(
      userId,
      'length',
      `prefers_${analysis.lengthPreference}`,
      analysis.lengthPreference,
      mode,
      contentType
    );
  }
  
  // 3. Formality adjustments
  if (analysis.formalityChange !== 'similar') {
    await savePattern(
      userId,
      'tone',
      `adjusts_to_${analysis.formalityChange}`,
      analysis.formalityChange,
      mode,
      contentType
    );
  }
  
  // 4. Structural changes
  for (const change of analysis.structuralChanges) {
    await savePattern(
      userId,
      'structure',
      change,
      change,
      mode,
      contentType
    );
  }
}

/**
 * Analyzes differences between two text versions
 */
function analyzeDifferences(aiOutput: string, finalOutput: string): PatternAnalysis {
  const aiWords = tokenize(aiOutput);
  const finalWords = tokenize(finalOutput);
  
  // Calculate length preference
  const lengthDiff = finalWords.length - aiWords.length;
  const lengthPreference = 
    lengthDiff < -10 ? 'shorter' : 
    lengthDiff > 10 ? 'longer' : 
    'similar';
  
  // Find added and removed phrases (2-4 word sequences)
  const addedPhrases = findAddedPhrases(aiWords, finalWords);
  const removedPhrases = findRemovedPhrases(aiWords, finalWords);
  
  // Analyze formality change
  const formalityChange = analyzeFormalityChange(aiOutput, finalOutput);
  
  // Detect structural changes
  const structuralChanges = detectStructuralChanges(aiOutput, finalOutput);
  
  return {
    vocabulary: [],
    lengthPreference,
    formalityChange,
    structuralChanges,
    addedPhrases,
    removedPhrases,
  };
}

/**
 * Tokenizes text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Finds phrases that were added by the user
 */
function findAddedPhrases(aiWords: string[], finalWords: string[]): string[] {
  const phrases: string[] = [];
  const aiSet = new Set(aiWords);
  
  // Look for 2-4 word sequences in final that aren't in AI output
  for (let i = 0; i < finalWords.length - 1; i++) {
    const twoWord = `${finalWords[i]} ${finalWords[i + 1]}`;
    const aiHasBoth = aiSet.has(finalWords[i]) && aiSet.has(finalWords[i + 1]);
    
    if (!aiHasBoth && twoWord.length > 5) {
      phrases.push(twoWord);
    }
  }
  
  return phrases.slice(0, 5); // Limit to top 5
}

/**
 * Finds phrases that were removed by the user
 */
function findRemovedPhrases(aiWords: string[], finalWords: string[]): string[] {
  const phrases: string[] = [];
  const finalSet = new Set(finalWords);
  
  for (let i = 0; i < aiWords.length - 1; i++) {
    const twoWord = `${aiWords[i]} ${aiWords[i + 1]}`;
    const finalHasBoth = finalSet.has(aiWords[i]) && finalSet.has(aiWords[i + 1]);
    
    if (!finalHasBoth && twoWord.length > 5) {
      phrases.push(twoWord);
    }
  }
  
  return phrases.slice(0, 5);
}

/**
 * Analyzes formality level changes
 */
function analyzeFormalityChange(aiOutput: string, finalOutput: string): 'more_formal' | 'less_formal' | 'similar' {
  const formalWords = ['therefore', 'furthermore', 'additionally', 'consequently', 'regarding', 'kindly', 'sincerely'];
  const casualWords = ['hey', 'yeah', 'gonna', 'wanna', 'thanks', 'cool', 'awesome'];
  
  const aiFormalCount = countOccurrences(aiOutput.toLowerCase(), formalWords);
  const finalFormalCount = countOccurrences(finalOutput.toLowerCase(), formalWords);
  const aiCasualCount = countOccurrences(aiOutput.toLowerCase(), casualWords);
  const finalCasualCount = countOccurrences(finalOutput.toLowerCase(), casualWords);
  
  const formalityScore = (finalFormalCount - aiFormalCount) - (finalCasualCount - aiCasualCount);
  
  if (formalityScore > 2) return 'more_formal';
  if (formalityScore < -2) return 'less_formal';
  return 'similar';
}

/**
 * Counts occurrences of words from a list
 */
function countOccurrences(text: string, words: string[]): number {
  return words.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return count + (text.match(regex) || []).length;
  }, 0);
}

/**
 * Detects structural changes like added/removed greetings, paragraphs, etc.
 */
function detectStructuralChanges(aiOutput: string, finalOutput: string): string[] {
  const changes: string[] = [];
  
  const aiLines = aiOutput.split('\n').filter(l => l.trim());
  const finalLines = finalOutput.split('\n').filter(l => l.trim());
  
  // Check for added/removed paragraphs
  if (finalLines.length > aiLines.length + 1) {
    changes.push('adds_paragraphs');
  } else if (finalLines.length < aiLines.length - 1) {
    changes.push('removes_paragraphs');
  }
  
  // Check for greeting changes
  const greetings = ['hi', 'hello', 'hey', 'dear'];
  const aiHasGreeting = greetings.some(g => aiOutput.toLowerCase().startsWith(g));
  const finalHasGreeting = greetings.some(g => finalOutput.toLowerCase().startsWith(g));
  
  if (!aiHasGreeting && finalHasGreeting) {
    changes.push('adds_greeting');
  } else if (aiHasGreeting && !finalHasGreeting) {
    changes.push('removes_greeting');
  }
  
  return changes;
}

/**
 * Saves a learned pattern to the database
 */
async function savePattern(
  userId: string,
  category: string,
  patternKey: string,
  patternValue: string,
  mode: string,
  contentType: string
): Promise<void> {
  const db = getDatabase();
  
  // Check if pattern already exists
  const existing = await db.prepare(
    'SELECT * FROM learning_patterns WHERE user_id = ? AND pattern_category = ? AND pattern_key = ? AND mode_context = ? AND content_type_context = ?'
  ).bind(userId, category, patternKey, mode, contentType).first<any>();
  
  if (existing) {
    // Update existing pattern - increase confidence
    const newConfidence = Math.min((existing.confidence_score || 0.1) + 0.1, 1.0);
    const newOccurrences = (existing.occurrence_count || 1) + 1;
    
    await db.prepare(
      'UPDATE learning_patterns SET confidence_score = ?, occurrence_count = ?, last_observed_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(newConfidence, newOccurrences, existing.id).run();
  } else {
    // Create new pattern
    const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.prepare(
      `INSERT INTO learning_patterns (
        id, user_id, pattern_category, pattern_key, pattern_value,
        confidence_score, occurrence_count, mode_context, content_type_context,
        created_at, last_observed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    ).bind(
      patternId,
      userId,
      category,
      patternKey,
      patternValue,
      0.1, // Initial confidence
      1,   // First occurrence
      mode,
      contentType
    ).run();
  }
}
