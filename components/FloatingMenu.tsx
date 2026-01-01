'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { getTodos, toggleTodo, deleteTodo, saveTodo, getTrips } from '@/lib/storage';
import { Todo, Trip, TodoPriority, TodoStatus } from '@/lib/types';

interface FloatingMenuProps {
  // For trip pages - shows trip-specific todos
  tripId?: string;
  tripName?: string;
}

export default function FloatingMenu({ tripId, tripName }: FloatingMenuProps) {
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

          {/* Add Trip Link */}
          <Link
            href="/trips/new"
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white pl-3 pr-4 py-2 rounded-full shadow-lg transition-all"
          >
            <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
              </svg>
            </span>
            <span className="text-sm font-medium">Add Trip</span>
          </Link>
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
  const [todos, setTodos] = useState<Todo[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TodoPriority | ''>('');
  const [selectedColor, setSelectedColor] = useState('');
  const [draggedTodo, setDraggedTodo] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Edit mode state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<TodoPriority | ''>('');
  const [editTripIds, setEditTripIds] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<TodoStatus>('todo');
  const [editColor, setEditColor] = useState('');

  const todoColors = [
    { name: 'None', value: '' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
  ];

  const toggleFullscreen = () => {
    const newValue = !isFullscreen;
    setIsFullscreen(newValue);
    onFullscreenChange(newValue);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(() => {
    setTodos(getTodos());
    setTrips(getTrips());
  }, []);

  const handleDelete = (todoId: string) => {
    deleteTodo(todoId);
    loadData();
  };

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    const now = new Date().toISOString();
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: newTodo.trim(),
      completed: false,
      status: 'todo',
      color: selectedColor || undefined,
      tripIds: selectedTripIds,
      dueDate: dueDate || undefined,
      priority: priority || undefined,
      createdAt: now,
      updatedAt: now,
    };
    saveTodo(todo);
    setNewTodo('');
    setSelectedTripIds([]);
    setShowTripPicker(false);
    setShowAdvanced(false);
    setDueDate('');
    setPriority('');
    setSelectedColor('');
    loadData();
  };

  const toggleTripTag = (tripId: string) => {
    setSelectedTripIds(prev =>
      prev.includes(tripId) ? prev.filter(id => id !== tripId) : [...prev, tripId]
    );
  };

  // Edit functions
  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setEditText(todo.text);
    setEditDueDate(todo.dueDate || '');
    setEditPriority(todo.priority || '');
    setEditTripIds(todo.tripIds || []);
    setEditStatus(todo.status || (todo.completed ? 'done' : 'todo'));
    setEditColor(todo.color || '');
  };

  const closeEditModal = () => {
    setEditingTodo(null);
    setEditText('');
    setEditDueDate('');
    setEditPriority('');
    setEditTripIds([]);
    setEditStatus('todo');
    setEditColor('');
  };

  const handleSaveEdit = () => {
    if (!editingTodo || !editText.trim()) return;
    
    const updatedTodo: Todo = {
      ...editingTodo,
      text: editText.trim(),
      color: editColor || undefined,
      dueDate: editDueDate || undefined,
      priority: editPriority || undefined,
      tripIds: editTripIds,
      status: editStatus,
      completed: editStatus === 'done',
      updatedAt: new Date().toISOString(),
    };
    saveTodo(updatedTodo);
    closeEditModal();
    loadData();
  };

  const toggleEditTripTag = (tripId: string) => {
    setEditTripIds(prev =>
      prev.includes(tripId) ? prev.filter(id => id !== tripId) : [...prev, tripId]
    );
  };

  const moveToColumn = (todoId: string, newStatus: TodoStatus) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    
    const updatedTodo: Todo = {
      ...todo,
      status: newStatus,
      completed: newStatus === 'done',
      updatedAt: new Date().toISOString(),
    };
    saveTodo(updatedTodo);
    loadData();
  };

  const handleDragStart = (todoId: string) => {
    setDraggedTodo(todoId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TodoStatus) => {
    e.preventDefault();
    if (draggedTodo) {
      moveToColumn(draggedTodo, status);
      setDraggedTodo(null);
    }
  };

  const formatDueDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tmrw';
    if (date < today) return 'Late';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDueDateColor = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return 'text-red-400 bg-red-500/20';
    if (date.getTime() === today.getTime()) return 'text-orange-400 bg-orange-500/20';
    return 'text-zinc-400 bg-zinc-700';
  };

  const getPriorityColor = (p: TodoPriority) => {
    switch (p) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
    }
  };

  const getPriorityDot = (p: TodoPriority) => {
    switch (p) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  // Group todos by status
  const todosByStatus: Record<TodoStatus, Todo[]> = {
    'todo': [],
    'in-progress': [],
    'done': [],
  };

  todos.forEach(todo => {
    const status: TodoStatus = todo.status || (todo.completed ? 'done' : 'todo');
    todosByStatus[status].push(todo);
  });

  // Sort each column by priority then due date
  const sortTodos = (arr: Todo[]) => [...arr].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = a.priority ? priorityOrder[a.priority] : 3;
    const bPriority = b.priority ? priorityOrder[b.priority] : 3;
    if (aPriority !== bPriority) return aPriority - bPriority;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const sortedTodosByStatus: Record<TodoStatus, Todo[]> = {
    'todo': sortTodos(todosByStatus['todo']),
    'in-progress': sortTodos(todosByStatus['in-progress']),
    'done': sortTodos(todosByStatus['done']),
  };

  const todoCount = sortedTodosByStatus['todo'].length + sortedTodosByStatus['in-progress'].length;

  const columns: { key: TodoStatus; label: string; icon: string; color: string }[] = [
    { key: 'todo', label: 'To Do', icon: '○', color: 'text-zinc-400' },
    { key: 'in-progress', label: 'Doing', icon: '◐', color: 'text-blue-400' },
    { key: 'done', label: 'Done', icon: '●', color: 'text-green-400' },
  ];

  const renderTodoCard = (todo: Todo) => (
    <div
      key={todo.id}
      draggable
      onDragStart={() => handleDragStart(todo.id)}
      onClick={() => openEditModal(todo)}
      className={`group rounded-lg p-3 cursor-pointer active:cursor-grabbing transition-all hover:bg-zinc-700 ${
        draggedTodo === todo.id ? 'opacity-50' : ''
      }`}
      style={{
        backgroundColor: todo.color ? `${todo.color}15` : '#27272a',
        border: todo.color ? `2px solid ${todo.color}` : '2px solid transparent',
        borderLeftWidth: '4px',
        borderLeftColor: todo.color || (todo.priority ? (
          todo.priority === 'high' ? '#ef4444' : 
          todo.priority === 'medium' ? '#eab308' : '#10b981'
        ) : '#52525b'),
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${todo.status === 'done' ? 'text-zinc-500 line-through' : 'text-white'}`}>
            {todo.text}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {todo.priority && !todo.color && (
              <span className={`w-2 h-2 rounded-full ${getPriorityDot(todo.priority)}`} />
            )}
            {todo.dueDate && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${getDueDateColor(todo.dueDate)}`}>
                {formatDueDate(todo.dueDate)}
              </span>
            )}
            {todo.tripIds.length > 0 && (
              <span className="text-xs text-blue-400">
                📍{todo.tripIds.length}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(todo.id); }}
          className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Edit Modal */}
      {editingTodo && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={closeEditModal}>
          <div 
            className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700 rounded-t-xl">
              <h3 className="font-semibold text-white">Edit Task</h3>
              <button onClick={closeEditModal} className="text-zinc-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Task Text */}
              <div>
                <label className="text-zinc-400 text-xs block mb-1">Task</label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                  autoFocus
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-zinc-400 text-xs block mb-1">Status</label>
                <div className="flex gap-2">
                  {(['todo', 'in-progress', 'done'] as TodoStatus[]).map(status => (
                    <button
                      key={status}
                      onClick={() => setEditStatus(status)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        editStatus === status
                          ? status === 'todo' ? 'bg-zinc-600 text-white' 
                            : status === 'in-progress' ? 'bg-blue-600 text-white'
                            : 'bg-green-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {status === 'todo' ? '○ To Do' : status === 'in-progress' ? '◐ Doing' : '● Done'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date & Priority */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-zinc-400 text-xs block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-zinc-400 text-xs block mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TodoPriority | '')}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Trip Tags */}
              {trips.length > 0 && (
                <div>
                  <label className="text-zinc-400 text-xs block mb-1">Trip Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {trips.map(trip => (
                      <button
                        key={trip.id}
                        onClick={() => toggleEditTripTag(trip.id)}
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          editTripIds.includes(trip.id) 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        }`}
                      >
                        {trip.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Tag */}
              <div>
                <label className="text-zinc-400 text-xs block mb-1">Color Tag</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditColor('')}
                    className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                      !editColor ? 'border-white scale-110' : 'border-zinc-600 hover:border-zinc-400'
                    }`}
                    style={{ backgroundColor: '#3f3f46' }}
                    title="No color"
                  >
                    {!editColor && <span className="text-white text-xs">✕</span>}
                  </button>
                  {todoColors.map(color => (
                    <button
                      key={color.value || 'none'}
                      onClick={() => setEditColor(color.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        editColor === color.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value || '#3f3f46' }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 px-4 py-3 bg-zinc-800 border-t border-zinc-700 rounded-b-xl">
              <button
                onClick={() => { handleDelete(editingTodo.id); closeEditModal(); }}
                className="px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors"
              >
                Delete
              </button>
              <div className="flex-1" />
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
        isFullscreen 
          ? 'fixed top-20 bottom-4 left-4 right-4 z-[60] rounded-2xl' 
        : 'w-[560px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-26rem)] rounded-xl'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="text-blue-400">☰</span> Task Board
          {todoCount > 0 && <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full">{todoCount} active</span>}
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

      {/* Add New Todo */}
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
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 rounded-lg border transition-colors ${(dueDate || priority || selectedColor) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-800 border-zinc-600 text-zinc-400 hover:text-white'}`}
            title="Due date, Priority & Color"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </button>
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
        
        {/* Advanced Options (Due Date & Priority) */}
        {showAdvanced && (
          <div className="flex flex-wrap gap-2 mt-2 p-2 bg-zinc-800 rounded-lg border border-zinc-700">
            <div className="w-full flex gap-2">
              <div className="flex-1">
                <label className="text-zinc-500 text-xs block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-zinc-500 text-xs block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TodoPriority | '')}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            {/* Color Picker */}
            <div className="w-full">
              <label className="text-zinc-500 text-xs block mb-1">Color Tag</label>
              <div className="flex gap-1.5 flex-wrap">
                {todoColors.map(c => (
                  <button
                    key={c.value || 'none'}
                    onClick={() => setSelectedColor(c.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedColor === c.value ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value || '#3f3f46' }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Trip Picker */}
        {showTripPicker && trips.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 p-2 bg-zinc-800 rounded-lg border border-zinc-700">
            <span className="text-zinc-500 text-xs w-full mb-1">Tag to trips:</span>
            {trips.map(trip => (
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

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto p-3">
        <div className="flex gap-3 min-h-[180px] h-full">
          {columns.map(col => (
            <div
              key={col.key}
              className="flex-1 min-w-[140px] flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-700">
                <span className={col.color}>{col.icon}</span>
                <span className="text-xs font-medium text-zinc-300">{col.label}</span>
                <span className="text-xs text-zinc-500">({sortedTodosByStatus[col.key].length})</span>
              </div>

              {/* Column Content */}
              <div className={`flex-1 space-y-2 overflow-y-auto min-h-[100px] p-1 rounded-lg transition-colors ${
                draggedTodo ? 'bg-zinc-800/50 border border-dashed border-zinc-600' : ''
              }`}>
                {sortedTodosByStatus[col.key].length === 0 ? (
                  <div className="text-center py-4 text-zinc-600 text-xs">
                    {col.key === 'todo' ? 'No tasks' : col.key === 'in-progress' ? 'Drag here' : 'Completed'}
                  </div>
                ) : (
                  sortedTodosByStatus[col.key].map(todo => renderTodoCard(todo))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-zinc-800 border-t border-zinc-700 text-xs text-zinc-500 flex justify-between">
        <span>Tap to edit · Drag to move</span>
        <span>{todos.length} total</span>
      </div>
    </div>
    </>
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
