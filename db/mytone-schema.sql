-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  learning_progress_score INTEGER DEFAULT 0
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  communication_style TEXT,
  formality_level TEXT,
  explanation_preference TEXT,
  role_context TEXT,
  signature_style TEXT,
  preferred_phrases TEXT, -- JSON array
  avoided_phrases TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Writing sessions table
CREATE TABLE IF NOT EXISTS writing_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  mode TEXT NOT NULL, -- professional, casual
  content_type TEXT NOT NULL, -- email, text, note
  original_input TEXT NOT NULL,
  ai_output TEXT NOT NULL,
  final_output TEXT, -- after user edits
  processing_time INTEGER, -- milliseconds
  token_usage_input INTEGER,
  token_usage_output INTEGER,
  token_usage_total INTEGER,
  session_metadata TEXT, -- JSON for additional context
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Learning patterns table
CREATE TABLE IF NOT EXISTS learning_patterns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- vocabulary, structure, tone, length
  pattern_data TEXT NOT NULL, -- JSON flexible pattern storage
  confidence_score REAL DEFAULT 0.5,
  usage_count INTEGER DEFAULT 1,
  consistency_score REAL DEFAULT 0.0,
  last_reinforced DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Edit analytics table
CREATE TABLE IF NOT EXISTS edit_analytics (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  edit_type TEXT NOT NULL, -- addition, deletion, modification, structural
  original_text TEXT,
  modified_text TEXT,
  position_start INTEGER,
  position_end INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES writing_sessions(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON writing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON writing_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON learning_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON learning_patterns(confidence_score);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON edit_analytics(session_id);
