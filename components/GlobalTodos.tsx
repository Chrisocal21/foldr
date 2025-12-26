'use client';

import { useState, useEffect } from 'react';
import { Todo, Trip, TodoPriority, TodoStatus } from '@/lib/types';
import { getTodos, toggleTodo, deleteTodo, saveTodo, getTrips } from '@/lib/storage';

export default function GlobalTodos() {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TodoPriority | ''>('');
  const [draggedTodo, setDraggedTodo] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTodos(getTodos());
    setTrips(getTrips());
  };

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
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: newTodo.trim(),
      completed: false,
      status: 'todo',
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
    loadData();
  };

  const toggleTripTag = (tripId: string) => {
    setSelectedTripIds(prev =>
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

  // Drag and drop handlers
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
    return 'text-slate-400 bg-slate-700';
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
  const sortTodos = (arr: Todo[]) => arr.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = a.priority ? priorityOrder[a.priority] : 3;
    const bPriority = b.priority ? priorityOrder[b.priority] : 3;
    if (aPriority !== bPriority) return aPriority - bPriority;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  Object.keys(todosByStatus).forEach(key => {
    todosByStatus[key as TodoStatus] = sortTodos(todosByStatus[key as TodoStatus]);
  });

  const todoCount = todosByStatus['todo'].length + todosByStatus['in-progress'].length;

  const columns: { key: TodoStatus; label: string; icon: string; color: string }[] = [
    { key: 'todo', label: 'To Do', icon: '○', color: 'text-slate-400' },
    { key: 'in-progress', label: 'Doing', icon: '◐', color: 'text-blue-400' },
    { key: 'done', label: 'Done', icon: '●', color: 'text-green-400' },
  ];

  const renderTodoCard = (todo: Todo) => (
    <div
      key={todo.id}
      draggable
      onDragStart={() => handleDragStart(todo.id)}
      className={`group bg-slate-800 rounded-lg p-2 border-l-2 cursor-grab active:cursor-grabbing transition-all hover:bg-slate-750 ${
        todo.priority ? getPriorityColor(todo.priority) : 'border-l-slate-600'
      } ${draggedTodo === todo.id ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-xs leading-tight ${todo.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>
            {todo.text}
          </p>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {todo.priority && (
              <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(todo.priority)}`} />
            )}
            {todo.dueDate && (
              <span className={`text-[10px] px-1 rounded ${getDueDateColor(todo.dueDate)}`}>
                {formatDueDate(todo.dueDate)}
              </span>
            )}
            {todo.tripIds.length > 0 && (
              <span className="text-[10px] text-blue-400">
                📍{todo.tripIds.length}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => handleDelete(todo.id)}
          className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-400 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50"
        title="To-Do Board"
      >
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <rect x="14" y="3" width="7" height="12" rx="1" />
          </svg>
          {todoCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {todoCount > 9 ? '9+' : todoCount}
            </span>
          )}
        </div>
      </button>

      {/* Kanban Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[calc(100vw-3rem)] max-w-2xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="text-blue-400">☰</span> Task Board
              {todoCount > 0 && <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full">{todoCount} active</span>}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Add New Todo */}
          <div className="p-3 border-b border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Add a task..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`px-3 py-2 rounded-lg border transition-colors ${(dueDate || priority) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'}`}
                title="Due date & Priority"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </button>
              <button
                onClick={() => setShowTripPicker(!showTripPicker)}
                className={`px-3 py-2 rounded-lg border transition-colors ${selectedTripIds.length > 0 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'}`}
                title="Tag to trips"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M7 7h.01M7 3h5a1.99 1.99 0 0 1 1.41.59l7 7a2 2 0 0 1 0 2.82l-5 5a2 2 0 0 1-2.82 0l-7-7A2 2 0 0 1 5 10V5a2 2 0 0 1 2-2Z" />
                </svg>
              </button>
              <button
                onClick={handleAdd}
                disabled={!newTodo.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14m-7-7h14" />
                </svg>
              </button>
            </div>
            
            {/* Advanced Options (Due Date & Priority) */}
            {showAdvanced && (
              <div className="flex flex-wrap gap-2 mt-2 p-2 bg-slate-800 rounded-lg border border-slate-700">
                <div className="w-full flex gap-2">
                  <div className="flex-1">
                    <label className="text-slate-500 text-xs block mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-slate-500 text-xs block mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TodoPriority | '')}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Trip Picker */}
            {showTripPicker && trips.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-2 bg-slate-800 rounded-lg border border-slate-700">
                <span className="text-slate-500 text-xs w-full mb-1">Tag to trips:</span>
                {trips.map(trip => (
                  <button
                    key={trip.id}
                    onClick={() => toggleTripTag(trip.id)}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${selectedTripIds.includes(trip.id) ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                  >
                    {trip.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Kanban Columns */}
          <div className="flex-1 overflow-x-auto p-3">
            <div className="flex gap-3 min-h-[200px] h-full">
              {columns.map(col => (
                <div
                  key={col.key}
                  className="flex-1 min-w-[140px] flex flex-col"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  {/* Column Header */}
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                    <span className={col.color}>{col.icon}</span>
                    <span className="text-xs font-medium text-slate-300">{col.label}</span>
                    <span className="text-xs text-slate-500">({todosByStatus[col.key].length})</span>
                  </div>

                  {/* Column Content */}
                  <div className={`flex-1 space-y-2 overflow-y-auto min-h-[120px] p-1 rounded-lg transition-colors ${
                    draggedTodo ? 'bg-slate-800/50 border border-dashed border-slate-600' : ''
                  }`}>
                    {todosByStatus[col.key].length === 0 ? (
                      <div className="text-center py-4 text-slate-600 text-xs">
                        {col.key === 'todo' ? 'No tasks' : col.key === 'in-progress' ? 'Drag here' : 'Completed'}
                      </div>
                    ) : (
                      todosByStatus[col.key].map(todo => renderTodoCard(todo))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-500 flex justify-between">
            <span>Drag tasks between columns</span>
            <span>{todos.length} total</span>
          </div>
        </div>
      )}
    </>
  );
}
