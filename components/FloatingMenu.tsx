'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { getTodos, toggleTodo, deleteTodo, saveTodo, getTrips } from '@/lib/storage';

interface FloatingMenuProps {
  // For trip pages - shows trip-specific todos
  tripId?: string;
  tripName?: string;
  // Hide navigation to certain pages (e.g., don't show Build link on /build page)
  hideLinks?: ('build' | 'roadmap')[];
}

export default function FloatingMenu({ tripId, tripName, hideLinks = [] }: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'todos' | 'notes' | null>(null);
  const [isPanelFullscreen, setIsPanelFullscreen] = useState(false);

  const toggleMenu = () => {
    if (isOpen) {
      setActivePanel(null);
      setIsPanelFullscreen(false);
    }
    setIsOpen(!isOpen);
  };

  const openTodos = () => {
    setActivePanel(activePanel === 'todos' ? null : 'todos');
    if (activePanel === 'todos') setIsPanelFullscreen(false);
  };

  const openNotes = () => {
    setActivePanel(activePanel === 'notes' ? null : 'notes');
    if (activePanel === 'notes') setIsPanelFullscreen(false);
  };

  const handleFullscreenChange = (isFullscreen: boolean) => {
    setIsPanelFullscreen(isFullscreen);
  };

  const handlePanelClose = () => {
    setActivePanel(null);
    setIsPanelFullscreen(false);
  };

  return (
    <>
      {/* Backdrop when menu is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => { setIsOpen(false); setActivePanel(null); setIsPanelFullscreen(false); }}
        />
      )}

      {/* Active Panel - positioned above the speed dial buttons */}
      {isOpen && activePanel === 'todos' && (
        <div className={isPanelFullscreen ? '' : 'fixed bottom-96 right-6 z-50'}>
          {tripId && tripName ? (
            <TripTodosPanel tripId={tripId} tripName={tripName} onClose={handlePanelClose} onFullscreenChange={handleFullscreenChange} />
          ) : (
            <GlobalTodosPanel onClose={handlePanelClose} onFullscreenChange={handleFullscreenChange} />
          )}
        </div>
      )}

      {isOpen && activePanel === 'notes' && (
        <div className={isPanelFullscreen ? '' : 'fixed bottom-96 right-6 z-50'}>
          <DevNotesPanel onClose={handlePanelClose} onFullscreenChange={handleFullscreenChange} />
        </div>
      )}

      {/* Speed Dial Buttons - hidden when panel is fullscreen */}
      {isOpen && !isPanelFullscreen && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3 items-end">
          {/* To-Do Button */}
          <button
            onClick={openTodos}
            className={`flex items-center gap-2 ${activePanel === 'todos' ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'} text-white pl-3 pr-4 py-2 rounded-full shadow-lg transition-all`}
          >
            <span className={`w-8 h-8 ${activePanel === 'todos' ? 'bg-blue-400' : 'bg-blue-500'} rounded-full flex items-center justify-center`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4" />
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </span>
            <span className="text-sm font-medium">To-Do</span>
          </button>

          {/* Notes Button */}
          <button
            onClick={openNotes}
            className={`flex items-center gap-2 ${activePanel === 'notes' ? 'bg-amber-600' : 'bg-zinc-800 hover:bg-zinc-700'} text-white pl-3 pr-4 py-2 rounded-full shadow-lg transition-all`}
          >
            <span className={`w-8 h-8 ${activePanel === 'notes' ? 'bg-amber-400' : 'bg-amber-500'} rounded-full flex items-center justify-center`}>
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </span>
            <span className="text-sm font-medium">Notes</span>
          </button>

          {/* Build Link - hidden on /build page */}
          {!hideLinks.includes('build') && (
            <Link
              href="/build"
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white pl-3 pr-4 py-2 rounded-full shadow-lg transition-all"
            >
              <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </span>
              <span className="text-sm font-medium">Build</span>
            </Link>
          )}

          {/* Roadmap Link - hidden on /roadmap page */}
          {!hideLinks.includes('roadmap') && (
            <Link
              href="/roadmap"
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white pl-3 pr-4 py-2 rounded-full shadow-lg transition-all"
            >
              <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </span>
              <span className="text-sm font-medium">Roadmap</span>
            </Link>
          )}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={toggleMenu}
        className={`fixed bottom-6 right-6 w-14 h-14 ${isOpen ? 'bg-zinc-600 rotate-45' : 'bg-blue-500 hover:bg-blue-400'} text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50`}
        title="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 5v14m-7-7h14" />
        </svg>
      </button>
    </>
  );
}

// Inline panel components (extracted from GlobalTodos and TripTodos)
function GlobalTodosPanel({ onClose, onFullscreenChange }: { onClose: () => void; onFullscreenChange: (isFullscreen: boolean) => void }) {
  const [todos, setTodos] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const newValue = !isFullscreen;
    setIsFullscreen(newValue);
    onFullscreenChange(newValue);
  };

  useEffect(() => {
    setTodos(getTodos());
    setTrips(getTrips());
  }, []);

  const loadData = useCallback(() => {
    setTodos(getTodos());
    setTrips(getTrips());
  }, []);

  const handleToggle = (todoId: string) => {
    toggleTodo(todoId);
    loadData();
  };

  const handleDelete = (todoId: string) => {
    deleteTodo(todoId);
    loadData();
  };

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    const now = new Date().toISOString();
    const todo = {
      id: crypto.randomUUID(),
      text: newTodo.trim(),
      completed: false,
      tripIds: selectedTripIds,
      createdAt: now,
      updatedAt: now,
    };
    saveTodo(todo);
    setNewTodo('');
    setSelectedTripIds([]);
    setShowTripPicker(false);
    loadData();
  };

  const toggleTripTag = (tripId: string) => {
    setSelectedTripIds(prev =>
      prev.includes(tripId) ? prev.filter(id => id !== tripId) : [...prev, tripId]
    );
  };

  const incompleteTodos = todos.filter((t: any) => !t.completed);
  const completedTodos = todos.filter((t: any) => t.completed);

  return (
    <div className={`bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
      isFullscreen 
        ? 'fixed top-20 bottom-4 left-4 right-4 z-[60] rounded-2xl' 
        : 'w-96 max-h-[calc(100vh-26rem)] rounded-xl'
    }`}>
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="text-blue-400">✓</span> To-Do
          {incompleteTodos.length > 0 && <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full">{incompleteTodos.length}</span>}
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen} 
            className="text-zinc-400 hover:text-white"
            title={isFullscreen ? 'Exit fullscreen' : 'Expand fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-zinc-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add a task..."
            className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => setShowTripPicker(!showTripPicker)}
            className={`px-3 py-2 rounded-lg border transition-colors ${selectedTripIds.length > 0 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800 border-zinc-600 text-zinc-400 hover:text-white'}`}
            title="Tag to trips"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M7 7h.01M7 3h5a1.99 1.99 0 0 1 1.41.59l7 7a2 2 0 0 1 0 2.82l-5 5a2 2 0 0 1-2.82 0l-7-7A2 2 0 0 1 5 10V5a2 2 0 0 1 2-2Z" />
            </svg>
          </button>
          <button
            onClick={handleAdd}
            disabled={!newTodo.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14m-7-7h14" />
            </svg>
          </button>
        </div>
        
        {showTripPicker && trips.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 p-2 bg-zinc-800 rounded-lg border border-zinc-700">
            <span className="text-zinc-500 text-xs w-full mb-1">Tag to trips:</span>
            {trips.map((trip: any) => (
              <button
                key={trip.id}
                onClick={() => toggleTripTag(trip.id)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${selectedTripIds.includes(trip.id) ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
              >
                {trip.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <p className="text-sm">No tasks yet</p>
          </div>
        ) : (
          <>
            {incompleteTodos.map((todo: any) => (
              <div key={todo.id} className="flex items-start gap-2 bg-zinc-800 rounded-lg px-3 py-2 border border-zinc-700">
                <button onClick={() => handleToggle(todo.id)} className="text-zinc-400 hover:text-green-400 shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <span className="text-white text-sm">{todo.text}</span>
                  {todo.tripIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {todo.tripIds.map((tid: string) => {
                        const t = trips.find((tr: any) => tr.id === tid);
                        return t ? (
                          <span key={tid} className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">{t.name}</span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <button onClick={() => handleDelete(todo.id)} className="text-zinc-500 hover:text-red-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {completedTodos.length > 0 && (
              <>
                <div className="text-xs text-zinc-500 uppercase tracking-wide pt-2">Completed</div>
                {completedTodos.map((todo: any) => (
                  <div key={todo.id} className="flex items-start gap-2 bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700/50 opacity-60">
                    <button onClick={() => handleToggle(todo.id)} className="text-green-400 shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </button>
                    <span className="flex-1 text-zinc-400 text-sm line-through">{todo.text}</span>
                    <button onClick={() => handleDelete(todo.id)} className="text-zinc-500 hover:text-red-400 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-2 bg-zinc-800 border-t border-zinc-700 text-xs text-zinc-500">
        All Trips · {todos.length} task{todos.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

function TripTodosPanel({ tripId, tripName, onClose, onFullscreenChange }: { tripId: string; tripName: string; onClose: () => void; onFullscreenChange: (isFullscreen: boolean) => void }) {
  const [todos, setTodos] = useState<any[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const newValue = !isFullscreen;
    setIsFullscreen(newValue);
    onFullscreenChange(newValue);
  };

  useEffect(() => {
    setTodos(getTodos().filter((t: any) => t.tripIds.includes(tripId)));
  }, [tripId]);

  const loadTodos = useCallback(() => {
    setTodos(getTodos().filter((t: any) => t.tripIds.includes(tripId)));
  }, [tripId]);

  const handleToggle = (todoId: string) => {
    toggleTodo(todoId);
    loadTodos();
  };

  const handleDelete = (todoId: string) => {
    deleteTodo(todoId);
    loadTodos();
  };

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    const now = new Date().toISOString();
    const todo = {
      id: crypto.randomUUID(),
      text: newTodo.trim(),
      completed: false,
      tripIds: [tripId],
      createdAt: now,
      updatedAt: now,
    };
    saveTodo(todo);
    setNewTodo('');
    loadTodos();
  };

  const incompleteTodos = todos.filter((t: any) => !t.completed);
  const completedTodos = todos.filter((t: any) => t.completed);

  return (
    <div className={`bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
      isFullscreen 
        ? 'fixed top-20 bottom-4 left-4 right-4 z-[60] rounded-2xl' 
        : 'w-80 max-h-[calc(100vh-26rem)] rounded-xl'
    }`}>
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="text-blue-400">✓</span> To-Do
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen} 
            className="text-zinc-400 hover:text-white"
            title={isFullscreen ? 'Exit fullscreen' : 'Expand fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-zinc-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add a task..."
            className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newTodo.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14m-7-7h14" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <p className="text-sm">No tasks yet</p>
          </div>
        ) : (
          <>
            {incompleteTodos.map((todo: any) => (
              <div key={todo.id} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2 border border-zinc-700">
                <button onClick={() => handleToggle(todo.id)} className="text-zinc-400 hover:text-green-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </button>
                <span className="flex-1 text-white text-sm">{todo.text}</span>
                <button onClick={() => handleDelete(todo.id)} className="text-zinc-500 hover:text-red-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {completedTodos.length > 0 && (
              <>
                <div className="text-xs text-zinc-500 uppercase tracking-wide pt-2">Completed</div>
                {completedTodos.map((todo: any) => (
                  <div key={todo.id} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700/50 opacity-60">
                    <button onClick={() => handleToggle(todo.id)} className="text-green-400 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </button>
                    <span className="flex-1 text-zinc-400 text-sm line-through">{todo.text}</span>
                    <button onClick={() => handleDelete(todo.id)} className="text-zinc-500 hover:text-red-400 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-2 bg-zinc-800 border-t border-zinc-700 text-xs text-zinc-500 truncate">
        {tripName}
      </div>
    </div>
  );
}

function DevNotesPanel({ onClose, onFullscreenChange }: { onClose: () => void; onFullscreenChange: (isFullscreen: boolean) => void }) {
  const [notes, setNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const newValue = !isFullscreen;
    setIsFullscreen(newValue);
    onFullscreenChange(newValue);
  };

  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('foldr_dev_notes');
      if (saved) setNotes(saved);
    }
  });

  const handleSave = (value: string) => {
    setNotes(value);
    localStorage.setItem('foldr_dev_notes', value);
  };

  return (
    <div className={`bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
      isFullscreen 
        ? 'fixed top-20 bottom-4 left-4 right-4 z-[60] rounded-2xl' 
        : 'w-80 max-h-[calc(100vh-26rem)] rounded-xl'
    }`}>
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="text-amber-400">📝</span> Dev Notes
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen} 
            className="text-zinc-400 hover:text-white"
            title={isFullscreen ? 'Exit fullscreen' : 'Expand fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => handleSave(e.target.value)}
        placeholder="Add notes for build & roadmap..."
        className="flex-1 p-4 bg-zinc-900 text-white text-sm resize-none focus:outline-none placeholder-zinc-600 overflow-y-auto"
        style={{ minHeight: isFullscreen ? '100%' : '200px' }}
      />
      <div className="px-4 py-2 bg-zinc-800 border-t border-zinc-700 text-xs text-zinc-500">
        Auto-saved · Shared across app
      </div>
    </div>
  );
}
