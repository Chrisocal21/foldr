"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTrips, getTripStatus } from '../lib/storage';
import { Trip } from '../lib/types';
import dynamic from 'next/dynamic';
import FloatingMenu from '@/components/FloatingMenu';
import { useTheme } from '@/lib/theme-context';

// Dynamic import for LoginPage (no SSR)
const LoginPage = dynamic(() => import('./login'), { ssr: false });

export default function Home() {
  // All hooks must be called unconditionally, before any early return
  const [loggedIn, setLoggedIn] = useState(false);
  const [now, setNow] = useState(new Date());
  const [place, setPlace] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
        () => setPlace(null)
      );
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
    }
  }, [loggedIn]);

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
  // Format today's date as YYYY-MM-DD in local time (not UTC)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayTrips = trips.filter(trip => todayStr >= trip.startDate && todayStr <= trip.endDate);
  const upcomingTrips = trips.filter(trip => getTripStatus(trip.startDate, trip.endDate) === 'upcoming');
  const nextTrip = upcomingTrips.length > 0 ? upcomingTrips[0] : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 dark-theme:bg-gradient-to-b light-theme:from-slate-100 light-theme:to-white flex flex-col" style={{ background: theme === 'light' ? 'linear-gradient(to bottom, #f1f5f9, #ffffff)' : undefined }}>
      {/* Top Bar: Logo and Settings/Trips Icons */}
      <header className="border-b" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a', borderColor: theme === 'light' ? '#e2e8f0' : '#1e293b' }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img 
            src="/logos/logo.png" 
            alt="Foldr" 
            className="h-10 w-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.insertAdjacentHTML('afterend', '<span class="text-2xl font-bold" style="color: #6B9AE8">Foldr</span>');
            }}
          />
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg transition-colors hover:bg-slate-800/50"
              style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}
              title="Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <Link href="/trips" className="p-2 rounded-lg hover:bg-slate-800 transition-colors" title="Trips">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div 
            className="rounded-xl p-6 w-80 max-w-[90vw] shadow-xl"
            style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1e293b', borderColor: theme === 'light' ? '#e2e8f0' : '#334155' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded hover:bg-slate-700/50">
                <svg className="w-5 h-5" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: theme === 'light' ? '#e2e8f0' : '#334155' }}>
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                )}
                <span style={{ color: theme === 'light' ? '#334155' : '#cbd5e1' }}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div 
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${theme === 'dark' ? 'left-7' : 'left-1'}`}
                />
              </button>
            </div>

            {/* More Settings Link */}
            <Link
              href="/settings"
              onClick={() => setShowSettings(false)}
              className="flex items-center justify-between py-3 border-b transition-colors hover:bg-slate-700/30"
              style={{ borderColor: theme === 'light' ? '#e2e8f0' : '#334155' }}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" style={{ color: theme === 'light' ? '#3b82f6' : '#60a5fa' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span style={{ color: theme === 'light' ? '#334155' : '#cbd5e1' }}>
                  Units & Preferences
                </span>
              </div>
              <svg className="w-4 h-4" style={{ color: theme === 'light' ? '#94a3b8' : '#64748b' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>

            {/* Logout Button */}
            <div className="py-3 border-b" style={{ borderColor: theme === 'light' ? '#e2e8f0' : '#334155' }}>
              <button
                onClick={() => {
                  localStorage.removeItem('foldr_logged_in');
                  setLoggedIn(false);
                  setShowSettings(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Log Out</span>
              </button>
            </div>

            {/* Version Info */}
            <div className="mt-4 text-center">
              <p className="text-xs" style={{ color: theme === 'light' ? '#94a3b8' : '#64748b' }}>Foldr v1.0.0</p>
            </div>
          </div>
        </div>
      )}

      {/* Time/Date/Location Bar */}
      <div className="border-b" style={{ backgroundColor: theme === 'light' ? 'rgba(241, 245, 249, 0.5)' : 'rgba(15, 23, 42, 0.5)', borderColor: theme === 'light' ? 'rgba(226, 232, 240, 0.5)' : 'rgba(30, 41, 59, 0.5)' }}>
        <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-3 text-sm">
          <div className="font-mono" style={{ color: theme === 'light' ? '#0f172a' : '#ffffff' }}>{now.toLocaleTimeString()}</div>
          <span style={{ color: theme === 'light' ? '#cbd5e1' : '#475569' }}>·</span>
          <div style={{ color: theme === 'light' ? '#475569' : '#94a3b8' }}>
            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          {place && (
            <>
              <span style={{ color: theme === 'light' ? '#cbd5e1' : '#475569' }}>·</span>
              <div className="flex items-center gap-1" style={{ color: theme === 'light' ? '#64748b' : '#64748b' }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {place}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Middle: Today's Trips */}
      <section className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-xl mb-4" style={{ color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Today&apos;s Trips</h2>
        {todayTrips.length === 0 ? (
          <div className="text-center px-4">
            <svg className="w-12 h-12 mx-auto mb-3" style={{ color: theme === 'light' ? '#cbd5e1' : '#475569' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <p style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>No trips for today</p>
            <p className="text-sm mt-1" style={{ color: theme === 'light' ? '#94a3b8' : '#64748b' }}>Enjoy your day!</p>
          </div>
        ) : (
          <ul className="space-y-4 w-full max-w-md px-4">
            {todayTrips.map(trip => (
              <li 
                key={trip.id} 
                className="rounded-lg p-4 border flex flex-col"
                style={{ 
                  backgroundColor: theme === 'light' ? '#ffffff' : '#1e293b', 
                  borderColor: trip.color || (theme === 'light' ? '#e2e8f0' : '#334155'),
                  borderLeftWidth: '4px',
                  borderLeftColor: trip.color || '#3b82f6'
                }}
              >
                <span className="font-semibold text-lg" style={{ color: theme === 'light' ? '#0f172a' : '#ffffff' }}>{trip.name}</span>
                <span className="text-sm" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>{trip.startDate} - {trip.endDate}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bottom: Upcoming Trips */}
      <section className="px-6 py-6 border-t" style={{ backgroundColor: theme === 'light' ? 'rgba(241, 245, 249, 0.8)' : 'rgba(2, 6, 23, 0.8)', borderColor: theme === 'light' ? '#e2e8f0' : '#1e293b' }}>
        <h3 className="text-lg mb-2" style={{ color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Upcoming</h3>
        {upcomingTrips.length > 0 ? (
          <div className="flex flex-wrap gap-3 max-w-2xl mx-auto">
            {upcomingTrips.map(trip => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="rounded-lg px-4 py-3 border transition-colors hover:opacity-80"
                style={{ 
                  backgroundColor: theme === 'light' ? '#ffffff' : '#1e293b', 
                  borderColor: trip.color || (theme === 'light' ? '#e2e8f0' : '#334155'),
                  color: theme === 'light' ? '#0f172a' : '#ffffff'
                }}
              >
                <span className="font-semibold">{trip.name}</span>
                <span className="text-sm ml-2" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>{trip.startDate}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>No upcoming trips</p>
            <Link 
              href="/trips/new" 
              className="text-sm text-blue-500 hover:text-blue-400 mt-1 inline-block"
            >
              Plan your next adventure →
            </Link>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-sm" style={{ borderColor: theme === 'light' ? '#e2e8f0' : '#1e293b', color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
        Foldr &copy; 2025
      </footer>

      {/* Floating Menu */}
      <FloatingMenu />
    </main>
  );
}
