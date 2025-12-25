'use client';

import { useState, useEffect } from 'react';
import { Todo } from '@/lib/types';
import { getTodos, toggleTodo, deleteTodo, saveTodo } from '@/lib/storage';

interface TripTodosProps {
  tripId: string;
  tripName: string;
}

export default function TripTodos({ tripId, tripName }: TripTodosProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    setTodos(getTodos().filter(t => t.tripIds.includes(tripId)));
  }, [tripId]);

  const loadTodos = () => {
    setTodos(getTodos().filter(t => t.tripIds.includes(tripId)));
  };

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
    const todo: Todo = {
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

  const incompleteTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);
  const todoCount = incompleteTodos.length;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-400 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50"
        title="Trip To-Dos"
      >
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          {todoCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {todoCount > 9 ? '9+' : todoCount}
            </span>
          )}
        </div>
      </button>

      {/* Todos Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 max-h-[70vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="text-blue-400">✓</span> To-Do
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
                onClick={handleAdd}
                disabled={!newTodo.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14m-7-7h14" />
                </svg>
              </button>
            </div>
          </div>

          {/* Todo List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {todos.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4" />
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                <p className="text-sm">No tasks yet</p>
              </div>
            ) : (
              <>
                {/* Incomplete */}
                {incompleteTodos.map(todo => (
                  <div key={todo.id} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                    <button onClick={() => handleToggle(todo.id)} className="text-slate-400 hover:text-green-400 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </button>
                    <span className="flex-1 text-white text-sm">{todo.text}</span>
                    <button onClick={() => handleDelete(todo.id)} className="text-slate-500 hover:text-red-400 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Completed */}
                {completedTodos.length > 0 && (
                  <>
                    <div className="text-xs text-slate-500 uppercase tracking-wide pt-2">Completed</div>
                    {completedTodos.map(todo => (
                      <div key={todo.id} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/50 opacity-60">
                        <button onClick={() => handleToggle(todo.id)} className="text-green-400 shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4" />
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        </button>
                        <span className="flex-1 text-slate-400 text-sm line-through">{todo.text}</span>
                        <button onClick={() => handleDelete(todo.id)} className="text-slate-500 hover:text-red-400 shrink-0">
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

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-500 truncate">
            {tripName}
          </div>
        </div>
      )}
    </>
  );
}
