"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTrips, getTripStatus } from '../lib/storage';
import { Trip } from '../lib/types';
import dynamic from 'next/dynamic';
import FloatingMenu from '@/components/FloatingMenu';

// Dynamic import for LoginPage (no SSR)
const LoginPage = dynamic(() => import('./login'), { ssr: false });

export default function Home() {
  // All hooks must be called unconditionally, before any early return
  const [loggedIn, setLoggedIn] = useState(false);
  const [now, setNow] = useState(new Date());
  const [place, setPlace] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);

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
  const todayStr = now.toISOString().slice(0, 10);
  const todayTrips = trips.filter(trip => todayStr >= trip.startDate && todayStr <= trip.endDate);
  const upcomingTrips = trips.filter(trip => getTripStatus(trip.startDate, trip.endDate) === 'upcoming');
  const nextTrip = upcomingTrips.length > 0 ? upcomingTrips[0] : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col">
      {/* Top Bar: Logo and Trips Icon */}
      <header className="bg-slate-900 border-b border-slate-800">
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
          <Link href="/trips" className="p-2 rounded-lg hover:bg-slate-800 transition-colors" title="Trips">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Time/Date/Location Bar */}
      <div className="bg-slate-900/50 border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-3 text-sm">
          <div className="font-mono text-white">{now.toLocaleTimeString()}</div>
          <span className="text-slate-600">·</span>
          <div className="text-slate-400">
            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          {place && (
            <>
              <span className="text-slate-600">·</span>
              <div className="text-slate-500 flex items-center gap-1">
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

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-sm text-slate-400">
        Foldr &copy; 2025
      </footer>

      {/* Floating Menu */}
      <FloatingMenu />
    </main>
  );
}
