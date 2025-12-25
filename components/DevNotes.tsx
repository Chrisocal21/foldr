'use client';

import { useState, useEffect } from 'react';

export default function DevNotes() {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('foldr_dev_notes');
    if (saved) setNotes(saved);
  }, []);

  const handleSave = (value: string) => {
    setNotes(value);
    localStorage.setItem('foldr_dev_notes', value);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-400 text-black rounded-full shadow-lg flex items-center justify-center transition-all z-50"
        title="Dev Notes"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* Notes Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 max-h-96 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="text-amber-400">📝</span> Dev Notes
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => handleSave(e.target.value)}
            placeholder="Add notes for build & roadmap..."
            className="flex-1 p-4 bg-zinc-900 text-white text-sm resize-none focus:outline-none placeholder-zinc-600"
            style={{ minHeight: '200px' }}
          />
          <div className="px-4 py-2 bg-zinc-800 border-t border-zinc-700 text-xs text-zinc-500">
            Auto-saved · Shared between /build & /roadmap
          </div>
        </div>
      )}
    </>
  );
}
