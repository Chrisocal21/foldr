import { D1Database } from "@cloudflare/workers-types";

// For Next.js development, we'll use a SQLite-compatible approach
// In production with Cloudflare Pages, this will connect to D1

export interface Database {
  prepare(query: string): PreparedStatement;
  exec(query: string): Promise<void>;
}

export interface PreparedStatement {
  bind(...values: any[]): PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
}

// Temporary in-memory storage for development
// This will be replaced with actual D1 connection in production
class InMemoryDatabase implements Database {
  private sessions: Map<string, any> = new Map();
  private users: Map<string, any> = new Map();
  private profiles: Map<string, any> = new Map();
  private patterns: Map<string, any> = new Map();
  private jobs: Map<string, any> = new Map();
  private jobNotes: Map<string, any> = new Map();

  constructor() {
    // Initialize with default user
    const userId = "user_chris";
    this.users.set(userId, {
      id: userId,
      email: "chris@example.com",
      name: "Chris O'Connell",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      onboarding_completed: true,
      learning_progress_score: 0,
    });

    this.profiles.set("profile_chris", {
      id: "profile_chris",
      user_id: userId,
      communication_style: "Direct & Concise",
      formality_level: "Professional but Friendly",
      explanation_preference: "Brief & To-the-point",
      role_context: "Product Manager",
      signature_style: "Cheers,\nChris O'Connell",
      preferred_phrases: "[]",
      avoided_phrases: "[]",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  prepare(query: string): PreparedStatement {
    return new InMemoryPreparedStatement(query, this);
  }

  async exec(query: string): Promise<void> {
    // Basic exec support for schema initialization
    console.log("Executing query:", query);
  }

  _getSessions() {
    return this.sessions;
  }

  _getUsers() {
    return this.users;
  }

  _getProfiles() {
    return this.profiles;
  }

  _getPatterns() {
    return this.patterns;
  }

  _getJobs() {
    return this.jobs;
  }

  _getJobNotes() {
    return this.jobNotes;
  }
}

class InMemoryPreparedStatement implements PreparedStatement {
  private boundValues: any[] = [];

  constructor(
    private query: string,
    private db: InMemoryDatabase
  ) {}

  bind(...values: any[]): PreparedStatement {
    this.boundValues = values;
    return this;
  }

  async first<T = unknown>(): Promise<T | null> {
    const result = await this.all<T>();
    return result.results[0] || null;
  }

  async all<T = unknown>(): Promise<{ results: T[] }> {
    // Simple query parsing for development
    const query = this.query.toLowerCase();

    if (query.includes("select") && query.includes("user_profiles")) {
      const profiles = Array.from(this.db._getProfiles().values());
      // Filter by user_id if bound
      if (this.boundValues.length > 0) {
        const userId = this.boundValues[0];
        return { results: profiles.filter((p: any) => p.user_id === userId) as T[] };
      }
      return { results: profiles as T[] };
    }

    if (query.includes("select") && query.includes("users")) {
      const users = Array.from(this.db._getUsers().values());
      // Filter by id if bound
      if (this.boundValues.length > 0) {
        const userId = this.boundValues[0];
        return { results: users.filter((u: any) => u.id === userId) as T[] };
      }
      return { results: users as T[] };
    }

    if (query.includes("select") && query.includes("writing_sessions")) {
      const sessions = Array.from(this.db._getSessions().values());
      // Filter by user_id if bound
      if (this.boundValues.length > 0) {
        const userId = this.boundValues[0];
        return { results: sessions.filter((s: any) => s.user_id === userId) as T[] };
      }
      return { results: sessions as T[] };
    }

    if (query.includes("select") && query.includes("learning_patterns")) {
      const patterns = Array.from(this.db._getPatterns().values());
      // Filter by user_id if bound
      if (this.boundValues.length > 0) {
        const userId = this.boundValues[0];
        return { results: patterns.filter((p: any) => p.user_id === userId) as T[] };
      }
      return { results: patterns as T[] };
    }

    // Jobs queries
    if (query.includes("select") && query.includes("jobs")) {
      const jobs = Array.from(this.db._getJobs().values());
      if (this.boundValues.length > 0) {
        const userId = this.boundValues[0];
        const filtered = jobs.filter((j: any) => j.user_id === userId);
        // Sort by updated_at desc
        filtered.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        return { results: filtered as T[] };
      }
      return { results: jobs as T[] };
    }

    // Job notes queries
    if (query.includes("select") && query.includes("job_notes")) {
      const notes = Array.from(this.db._getJobNotes().values());
      if (this.boundValues.length > 0) {
        const jobId = this.boundValues[0];
        const filtered = notes.filter((n: any) => n.job_id === jobId);
        // Sort by created_at asc (chronological order)
        filtered.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return { results: filtered as T[] };
      }
      return { results: notes as T[] };
    }

    return { results: [] };
  }

  async run(): Promise<{ success: boolean }> {
    const query = this.query.toLowerCase();

    if (query.includes("insert into writing_sessions")) {
      const sessionId = this.boundValues[0];
      const session = {
        id: sessionId,
        user_id: this.boundValues[1],
        mode: this.boundValues[2],
        content_type: this.boundValues[3],
        original_input: this.boundValues[4],
        ai_output: this.boundValues[5],
        final_output: this.boundValues[6],
        processing_time: this.boundValues[7],
        token_usage_input: this.boundValues[8],
        token_usage_output: this.boundValues[9],
        token_usage_total: this.boundValues[10],
        session_metadata: this.boundValues[11],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.db._getSessions().set(sessionId, session);
      return { success: true };
    }

    if (query.includes("update writing_sessions")) {
      const sessionId = this.boundValues[1]; // Last parameter is typically the ID
      const existing = this.db._getSessions().get(sessionId);
      if (existing) {
        existing.final_output = this.boundValues[0];
        existing.updated_at = new Date().toISOString();
      }
      return { success: true };
    }

    if (query.includes("insert into learning_patterns")) {
      const patternId = this.boundValues[0];
      const pattern = {
        id: patternId,
        user_id: this.boundValues[1],
        pattern_category: this.boundValues[2],
        pattern_key: this.boundValues[3],
        pattern_value: this.boundValues[4],
        confidence_score: this.boundValues[5],
        occurrence_count: this.boundValues[6],
        mode_context: this.boundValues[7],
        content_type_context: this.boundValues[8],
        created_at: new Date().toISOString(),
        last_observed_at: new Date().toISOString(),
      };
      this.db._getPatterns().set(patternId, pattern);
      return { success: true };
    }

    if (query.includes("update learning_patterns")) {
      const patternId = this.boundValues[2]; // Last parameter is the ID
      const existing = this.db._getPatterns().get(patternId);
      if (existing) {
        existing.confidence_score = this.boundValues[0];
        existing.occurrence_count = this.boundValues[1];
        existing.last_observed_at = new Date().toISOString();
      }
      return { success: true };
    }

    // Jobs operations
    if (query.includes("insert into jobs")) {
      const jobId = this.boundValues[0];
      const job = {
        id: jobId,
        user_id: this.boundValues[1],
        name: this.boundValues[2],
        description: this.boundValues[3],
        status: this.boundValues[4] || 'active',
        compiled_notes: this.boundValues[5] || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.db._getJobs().set(jobId, job);
      return { success: true };
    }

    if (query.includes("update jobs") && query.includes("compiled_notes")) {
      const jobId = this.boundValues[1];
      const existing = this.db._getJobs().get(jobId);
      if (existing) {
        existing.compiled_notes = this.boundValues[0];
        existing.updated_at = new Date().toISOString();
      }
      return { success: true };
    }

    if (query.includes("update jobs") && query.includes("status")) {
      const jobId = this.boundValues[1];
      const existing = this.db._getJobs().get(jobId);
      if (existing) {
        existing.status = this.boundValues[0];
        existing.updated_at = new Date().toISOString();
      }
      return { success: true };
    }

    if (query.includes("update jobs") && query.includes("name")) {
      const jobId = this.boundValues[2];
      const existing = this.db._getJobs().get(jobId);
      if (existing) {
        existing.name = this.boundValues[0];
        existing.description = this.boundValues[1];
        existing.updated_at = new Date().toISOString();
      }
      return { success: true };
    }

    if (query.includes("delete from jobs")) {
      const jobId = this.boundValues[0];
      this.db._getJobs().delete(jobId);
      // Also delete related notes
      for (const [noteId, note] of this.db._getJobNotes().entries()) {
        if (note.job_id === jobId) {
          this.db._getJobNotes().delete(noteId);
        }
      }
      return { success: true };
    }

    // Job notes operations
    if (query.includes("insert into job_notes")) {
      const noteId = this.boundValues[0];
      const note = {
        id: noteId,
        job_id: this.boundValues[1],
        raw_input: this.boundValues[2],
        polished_output: this.boundValues[3],
        created_at: new Date().toISOString(),
      };
      this.db._getJobNotes().set(noteId, note);
      return { success: true };
    }

    if (query.includes("delete from job_notes")) {
      const noteId = this.boundValues[0];
      this.db._getJobNotes().delete(noteId);
      return { success: true };
    }

    return { success: true };
  }
}

// Global database instance
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    // In development, use in-memory database
    // In production with Cloudflare, this would connect to D1
    dbInstance = new InMemoryDatabase();
  }
  return dbInstance;
}

// Helper to get user profile
export async function getUserProfile(userId: string) {
  const db = getDatabase();
  const profile = await db
    .prepare("SELECT * FROM user_profiles WHERE user_id = ?")
    .bind(userId)
    .first();

  return profile;
}

// Helper to save session
export async function saveSession(session: {
  id: string;
  userId: string;
  mode: string;
  contentType: string;
  originalInput: string;
  aiOutput: string;
  finalOutput?: string;
  processingTime: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}) {
  const db = getDatabase();
  
  await db
    .prepare(
      `INSERT INTO writing_sessions (
        id, user_id, mode, content_type, original_input, ai_output, 
        final_output, processing_time, token_usage_input, 
        token_usage_output, token_usage_total, session_metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      session.id,
      session.userId,
      session.mode,
      session.contentType,
      session.originalInput,
      session.aiOutput,
      session.finalOutput || null,
      session.processingTime,
      session.tokenUsage.input,
      session.tokenUsage.output,
      session.tokenUsage.total,
      "{}"
    )
    .run();

  return session.id;
}

// Helper to update session with final output
export async function updateSessionFinalOutput(
  sessionId: string,
  finalOutput: string
) {
  const db = getDatabase();
  
  await db
    .prepare("UPDATE writing_sessions SET final_output = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(finalOutput, sessionId)
    .run();
}

// ==================== JOB/NOTES HELPERS ====================

// Get all jobs for a user
export async function getJobs(userId: string) {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT * FROM jobs WHERE user_id = ? ORDER BY updated_at DESC")
    .bind(userId)
    .all();
  return result.results;
}

// Get a specific job by ID
export async function getJob(jobId: string) {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT * FROM jobs WHERE id = ?")
    .bind(jobId)
    .first();
  return result;
}

// Create a new job
export async function createJob(job: {
  id: string;
  userId: string;
  name: string;
  description?: string;
}) {
  const db = getDatabase();
  await db
    .prepare("INSERT INTO jobs (id, user_id, name, description, status, compiled_notes) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(job.id, job.userId, job.name, job.description || '', 'active', '')
    .run();
  return job.id;
}

// Update job compiled notes
export async function updateJobCompiledNotes(jobId: string, compiledNotes: string) {
  const db = getDatabase();
  await db
    .prepare("UPDATE jobs SET compiled_notes = ? WHERE id = ?")
    .bind(compiledNotes, jobId)
    .run();
}

// Update job status
export async function updateJobStatus(jobId: string, status: 'active' | 'completed' | 'archived') {
  const db = getDatabase();
  await db
    .prepare("UPDATE jobs SET status = ? WHERE id = ?")
    .bind(status, jobId)
    .run();
}

// Update job name/description
export async function updateJob(jobId: string, name: string, description?: string) {
  const db = getDatabase();
  await db
    .prepare("UPDATE jobs SET name = ?, description = ? WHERE id = ?")
    .bind(name, description || '', jobId)
    .run();
}

// Delete a job and its notes
export async function deleteJob(jobId: string) {
  const db = getDatabase();
  await db
    .prepare("DELETE FROM jobs WHERE id = ?")
    .bind(jobId)
    .run();
}

// Get all notes for a job
export async function getJobNotes(jobId: string) {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT * FROM job_notes WHERE job_id = ? ORDER BY created_at ASC")
    .bind(jobId)
    .all();
  return result.results;
}

// Add a note to a job
export async function addJobNote(note: {
  id: string;
  jobId: string;
  rawInput: string;
  polishedOutput: string;
}) {
  const db = getDatabase();
  await db
    .prepare("INSERT INTO job_notes (id, job_id, raw_input, polished_output) VALUES (?, ?, ?, ?)")
    .bind(note.id, note.jobId, note.rawInput, note.polishedOutput)
    .run();
  return note.id;
}

// Delete a note
export async function deleteJobNote(noteId: string) {
  const db = getDatabase();
  await db
    .prepare("DELETE FROM job_notes WHERE id = ?")
    .bind(noteId)
    .run();
}
