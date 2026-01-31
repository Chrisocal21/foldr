'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Job {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  compiled_notes?: string;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  job_id: string;
  raw_input: string;
  polished_output: string;
  created_at: string;
}

export default function NotesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showNewJobForm, setShowNewJobForm] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobDescription, setNewJobDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertType, setConvertType] = useState<'email' | 'text'>('email');
  const [convertRecipient, setConvertRecipient] = useState('');
  const [convertContext, setConvertContext] = useState('');
  const [convertedOutput, setConvertedOutput] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Fetch notes when job changes
  useEffect(() => {
    if (selectedJob) {
      fetchJobDetails(selectedJob.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob?.id]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs?userId=user_chris');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchJobDetails = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();
      if (data.job) {
        setSelectedJob(data.job);
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobName.trim()) return;

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newJobName.trim(),
          description: newJobDescription.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewJobName('');
        setNewJobDescription('');
        setShowNewJobForm(false);
        await fetchJobs();
        // Select the new job
        const jobsRes = await fetch('/api/jobs?userId=user_chris');
        const jobsData = await jobsRes.json();
        const newJob = jobsData.jobs?.find((j: Job) => j.id === data.jobId);
        if (newJob) setSelectedJob(newJob);
      }
    } catch (err) {
      console.error('Error creating job:', err);
      setError('Failed to create job');
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim() || !selectedJob) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput: noteInput.trim() }),
      });

      if (response.ok) {
        setNoteInput('');
        await fetchJobDetails(selectedJob.id);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add note');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompileNotes = async () => {
    if (!selectedJob || notes.length === 0) return;

    setIsCompiling(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/compile`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchJobDetails(selectedJob.id);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to compile notes');
      }
    } catch (err) {
      console.error('Error compiling notes:', err);
      setError('Failed to compile notes');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleConvert = async () => {
    if (!selectedJob?.compiled_notes) return;

    setIsConverting(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outputType: convertType,
          recipient: convertRecipient.trim(),
          context: convertContext.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConvertedOutput(data.output);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to convert');
      }
    } catch (err) {
      console.error('Error converting:', err);
      setError('Failed to convert');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedJob) return;

    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });

      if (response.ok) {
        await fetchJobDetails(selectedJob.id);
      }
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job and all its notes?')) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSelectedJob(null);
        setNotes([]);
        await fetchJobs();
      }
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/trips" className="text-slate-300 hover:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5m7-7-7 7 7 7" />
              </svg>
              Back
            </Link>
            <h1 className="text-xl font-bold text-white">📝 Job Notes</h1>
            <Link href="/write" className="text-slate-300 hover:text-white text-sm">
              ✉️ Write
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-slate-400 mt-1">
          Accumulate notes throughout a job, then convert to email or text when ready.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="text-sm underline mt-1">Dismiss</button>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Jobs List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">Jobs</h2>
              <button
                onClick={() => setShowNewJobForm(!showNewJobForm)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                + New
              </button>
            </div>

            {/* New Job Form */}
            {showNewJobForm && (
              <form onSubmit={handleCreateJob} className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <input
                  type="text"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  placeholder="Job name..."
                  className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 mb-2"
                  autoFocus
                />
                <input
                  type="text"
                  value={newJobDescription}
                  onChange={(e) => setNewJobDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 mb-2"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewJobForm(false)}
                    className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Jobs List */}
            <div className="space-y-2">
              {jobs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No jobs yet. Create one to get started!
                </p>
              ) : (
                jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedJob?.id === job.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                    }`}
                  >
                    <div className="font-medium text-slate-900 dark:text-slate-50 text-sm truncate">
                      {job.name}
                    </div>
                    {job.description && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {job.description}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {job.status === 'active' ? '🟢' : job.status === 'completed' ? '✅' : '📦'}{' '}
                      {new Date(job.updated_at).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {!selectedJob ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                Select a job or create a new one to start adding notes.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Job Header */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                      {selectedJob.name}
                    </h2>
                    {selectedJob.description && (
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {selectedJob.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteJob(selectedJob.id)}
                    className="text-red-500 hover:text-red-600 text-sm"
                  >
                    Delete Job
                  </button>
                </div>
              </div>

              {/* Note Input */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">
                  Add Note
                </h3>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Type your rough notes here... They'll be polished automatically."
                  className="w-full h-32 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder-slate-400 resize-none"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleAddNote}
                    disabled={!noteInput.trim() || isProcessing}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? 'Processing...' : '✨ Polish & Add Note'}
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                    Notes ({notes.length})
                  </h3>
                  {notes.length > 0 && (
                    <button
                      onClick={handleCompileNotes}
                      disabled={isCompiling}
                      className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCompiling ? 'Compiling...' : '📋 Compile All Notes'}
                    </button>
                  )}
                </div>

                {notes.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                    No notes yet. Add your first note above!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-slate-900 dark:text-slate-50 text-sm whitespace-pre-wrap">
                              {note.polished_output}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                              {new Date(note.created_at).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="ml-2 text-slate-400 hover:text-red-500 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compiled Notes */}
              {selectedJob.compiled_notes && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                      📄 Compiled Notes
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(selectedJob.compiled_notes!)}
                        className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        {isCopied ? '✓ Copied' : '📋 Copy'}
                      </button>
                      <button
                        onClick={() => {
                          setShowConvertModal(true);
                          setConvertedOutput('');
                        }}
                        className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        ✉️ Convert to Email/Text
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-slate-900 dark:text-slate-50 whitespace-pre-wrap text-sm">
                      {selectedJob.compiled_notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Convert Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  Convert Notes
                </h3>
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {!convertedOutput ? (
                <>
                  {/* Convert Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Convert to:
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConvertType('email')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                          convertType === 'email'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        ✉️ Email
                      </button>
                      <button
                        onClick={() => setConvertType('text')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                          convertType === 'text'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        💬 Text
                      </button>
                    </div>
                  </div>

                  {/* Recipient */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Recipient (optional):
                    </label>
                    <input
                      type="text"
                      value={convertRecipient}
                      onChange={(e) => setConvertRecipient(e.target.value)}
                      placeholder="e.g., John Smith, the client"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
                    />
                  </div>

                  {/* Context */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Additional context (optional):
                    </label>
                    <textarea
                      value={convertContext}
                      onChange={(e) => setConvertContext(e.target.value)}
                      placeholder="e.g., asking for approval, providing update, etc."
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 h-20 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="w-full py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isConverting ? 'Converting...' : `Convert to ${convertType === 'email' ? 'Email' : 'Text'}`}
                  </button>
                </>
              ) : (
                <>
                  {/* Converted Output */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Your {convertType === 'email' ? 'Email' : 'Text'}:
                    </label>
                    <textarea
                      value={convertedOutput}
                      onChange={(e) => setConvertedOutput(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 h-64 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(convertedOutput)}
                      className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                    >
                      {isCopied ? '✓ Copied!' : '📋 Copy to Clipboard'}
                    </button>
                    <button
                      onClick={() => setConvertedOutput('')}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
