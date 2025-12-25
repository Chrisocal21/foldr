"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTrips, getTripStatus, getTodos, saveTodo, deleteTodo, toggleTodo } from '../lib/storage';
import { Trip, Todo } from '../lib/types';
import dynamic from 'next/dynamic';

// Dynamic import for LoginPage (no SSR)
const LoginPage = dynamic(() => import('./login'), { ssr: false });

export default function Home() {
  // All hooks must be called unconditionally, before any early return
  const [loggedIn, setLoggedIn] = useState(false);
  const [now, setNow] = useState(new Date());
  const [location, setLocation] = useState<string | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [showTripPicker, setShowTripPicker] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get GPS location and reverse geocode
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          // Reverse geocode using Nominatim
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            if (res.ok) {
              const data = await res.json();
              // Extract just city and state
              const addr = data.address || {};
              const city = addr.city || addr.town || addr.village || addr.municipality || '';
              const state = addr.state || '';
              if (city && state) {
                setPlace(`${city}, ${state}`);
              } else if (city || state) {
                setPlace(city || state);
              } else {
                setPlace(null);
              }
            } else {
              setPlace(null);
            }
          } catch {
            setPlace(null);
          }
        },
        () => setLocation('Location unavailable')
      );
    } else {
      setLocation('Not supported');
    }
  }, []);

  // On mount, check localStorage for login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoggedIn(localStorage.getItem('foldr_logged_in') === 'true');
    }
  }, []);

  // Load trips on mount or login
  useEffect(() => {
    if (typeof window !== 'undefined' && loggedIn) {
      const loaded = getTrips().map(trip => ({
        ...trip,
        status: getTripStatus(trip.startDate, trip.endDate)
      }));
      setTrips(loaded);
      setTodos(getTodos());
    }
  }, [loggedIn]);

  const loadTodos = () => setTodos(getTodos());

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    const todo: Todo = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
      tripIds: selectedTripIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveTodo(todo);
    setNewTodoText('');
    setSelectedTripIds([]);
    setShowTripPicker(false);
    loadTodos();
  };

  const handleToggleTodo = (id: string) => {
    toggleTodo(id);
    loadTodos();
  };

  const handleDeleteTodo = (id: string) => {
    deleteTodo(id);
    loadTodos();
  };

  const toggleTripTag = (tripId: string) => {
    setSelectedTripIds(prev =>
      prev.includes(tripId) ? prev.filter(id => id !== tripId) : [...prev, tripId]
    );
  };

  const handleLogin = () => {
    setLoggedIn(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('foldr_logged_in', 'true');
    }
  };

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Today's and upcoming trips
  const todayStr = now.toISOString().slice(0, 10);
  const todayTrips = trips.filter(trip => todayStr >= trip.startDate && todayStr <= trip.endDate);
  const upcomingTrips = trips.filter(trip => getTripStatus(trip.startDate, trip.endDate) === 'upcoming');
  const nextTrip = upcomingTrips.length > 0 ? upcomingTrips[0] : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col">
      {/* Top Bar: Logo, Clock, Date, Location, Trips Icon */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img 
            src="/logos/LOGO V2-1.png" 
            alt="Foldr" 
            className="h-12 w-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.insertAdjacentHTML('afterend', '<span class="text-2xl font-bold" style="color: #6B9AE8">Foldr</span>');
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xl font-mono text-white leading-tight">{now.toLocaleTimeString()}</div>
            <div className="text-xs text-slate-400">{now.toLocaleDateString()}</div>
            <div className="text-xs text-slate-500">{place ? place : location || '...'}</div>
          </div>
          <Link href="/trips" className="p-2 rounded-full hover:bg-slate-800 transition-colors" title="Trips">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" rx="4" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Middle: Today's Trips */}
      <section className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-xl text-white mb-4">Today&apos;s Trips</h2>
        {todayTrips.length === 0 ? (
          <div className="text-slate-400">No trips for today.</div>
        ) : (
          <ul className="space-y-4 w-full max-w-md">
            {todayTrips.map(trip => (
              <li key={trip.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-white flex flex-col">
                <span className="font-semibold text-lg">{trip.name}</span>
                <span className="text-slate-400 text-sm">{trip.startDate} - {trip.endDate}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bottom: Upcoming Trips */}
      <section className="px-6 py-6 bg-slate-950/80 border-t border-slate-800">
        <h3 className="text-lg text-white mb-2">Upcoming</h3>
        {upcomingTrips.length > 0 ? (
          <div className="flex flex-wrap gap-3 max-w-2xl mx-auto">
            {upcomingTrips.map(trip => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-700 text-white hover:bg-slate-700 transition-colors"
              >
                <span className="font-semibold">{trip.name}</span>
                <span className="text-slate-400 text-sm ml-2">{trip.startDate}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-slate-400">No upcoming trips.</div>
        )}
      </section>

      {/* To Do List Section */}
      <section className="px-6 py-6 bg-slate-900/80 border-t border-slate-800">
        <h3 className="text-lg text-white mb-4">To Do</h3>
        
        {/* Add New Todo */}
        <div className="flex flex-col gap-2 mb-4 max-w-2xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
              placeholder="Add a task..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => setShowTripPicker(!showTripPicker)}
              className={`px-3 py-2 rounded border transition-colors ${selectedTripIds.length > 0 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
              title="Tag to trips"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M7 7h.01M7 3h5a1.99 1.99 0 0 1 1.41.59l7 7a2 2 0 0 1 0 2.82l-5 5a2 2 0 0 1-2.82 0l-7-7A2 2 0 0 1 5 10V5a2 2 0 0 1 2-2Z" />
              </svg>
            </button>
            <button
              onClick={handleAddTodo}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Add
            </button>
          </div>
          
          {/* Trip Picker */}
          {showTripPicker && trips.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-800 rounded border border-slate-700">
              <span className="text-slate-400 text-sm w-full mb-1">Tag to trips (optional):</span>
              {trips.map(trip => (
                <button
                  key={trip.id}
                  onClick={() => toggleTripTag(trip.id)}
                  className={`text-sm px-3 py-1 rounded-full transition-colors ${selectedTripIds.includes(trip.id) ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  {trip.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Todo List */}
        <ul className="space-y-2 max-w-2xl mx-auto">
          {todos.filter(t => !t.completed).map(todo => (
            <li key={todo.id} className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
              <button onClick={() => handleToggleTodo(todo.id)} className="text-slate-400 hover:text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </button>
              <span className="flex-1 text-white">{todo.text}</span>
              {todo.tripIds.length > 0 && (
                <div className="flex gap-1">
                  {todo.tripIds.map(tid => {
                    const t = trips.find(tr => tr.id === tid);
                    return t ? (
                      <span key={tid} className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">{t.name}</span>
                    ) : null;
                  })}
                </div>
              )}
              <button onClick={() => handleDeleteTodo(todo.id)} className="text-slate-500 hover:text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
          {todos.filter(t => t.completed).map(todo => (
            <li key={todo.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700/50 opacity-60">
              <button onClick={() => handleToggleTodo(todo.id)} className="text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </button>
              <span className="flex-1 text-slate-400 line-through">{todo.text}</span>
              {todo.tripIds.length > 0 && (
                <div className="flex gap-1">
                  {todo.tripIds.map(tid => {
                    const t = trips.find(tr => tr.id === tid);
                    return t ? (
                      <span key={tid} className="text-xs bg-slate-600/30 text-slate-400 px-2 py-0.5 rounded-full">{t.name}</span>
                    ) : null;
                  })}
                </div>
              )}
              <button onClick={() => handleDeleteTodo(todo.id)} className="text-slate-500 hover:text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
          {todos.length === 0 && (
            <li className="text-slate-400 text-center py-4">No tasks yet.</li>
          )}
        </ul>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-sm text-slate-400">
        Foldr &copy; 2025
      </footer>
    </main>
  );
}
