'use client'

import Link from 'next/link'
import FloatingMenu from '@/components/FloatingMenu'

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-slate-400/5 rounded-full blur-3xl pointer-events-none" />
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-slate-300 hover:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5m7-7-7 7 7 7" />
              </svg>
              Home
            </Link>
            <h1 className="text-xl font-bold text-white">Roadmap</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Overview */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Overall Progress</h2>
              <span className="text-3xl font-bold text-green-400">85%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
              <div className="bg-green-500 h-3 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <p className="text-slate-400 text-sm">Core features complete • Cloud sync working • Polish phase</p>
          </div>
        </section>

        {/* Quick Wins */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-green-400">🟢</span> Quick Wins
            <span className="text-sm font-normal text-slate-400">(1-2 hours, Easy, Free)</span>
          </h2>
          <div className="grid gap-3">
            <FeatureCard title="Dark/Light Theme Toggle" desc="Add theme switcher in header" time="1-2 hrs" done />
            <FeatureCard title="Logout Button" desc="Clear session from main page" time="30 min" done />
            <FeatureCard title="Trip Color Coding" desc="Assign colors to trips for visual organization" time="1-2 hrs" done />
            <FeatureCard title="Countdown Timer" desc="Show 'X days until trip' on upcoming trips" time="1 hr" done />
            <FeatureCard title="Due Dates for Todos" desc="Add optional due dates to tasks" time="2 hrs" />
            <FeatureCard title="Copy Confirmation Numbers" desc="One-tap copy for all confirmation codes" time="1 hr" done />
            <FeatureCard title="Block Filtering" desc="Filter blocks by type, date range, or status" time="2-3 hrs" />
          </div>
        </section>

        {/* Medium Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-yellow-400">🟡</span> Medium Features
            <span className="text-sm font-normal text-slate-400">(4-8 hours, Moderate)</span>
          </h2>
          <div className="grid gap-3">
            <FeatureCard title="Weather Widget" desc="Show weather at destination" time="4-6 hrs" cost="Free" done />
            <FeatureCard title="Currency Converter" desc="Quick conversion tool for travel" time="3-4 hrs" cost="Free" />
            <FeatureCard title="Packing List" desc="Checklist per trip with templates" time="4-6 hrs" cost="Free" done />
            <FeatureCard title="Trip Sharing" desc="Generate shareable read-only URL" time="6-8 hrs" cost="Free" />
            <FeatureCard title="Expense Tracker" desc="Log expenses per trip with totals" time="6-8 hrs" cost="Free" done />
            <FeatureCard title="Document Storage" desc="Upload/attach PDFs (boarding passes)" time="6-8 hrs" cost="Storage $" />
            <FeatureCard title="Time Zone Display" desc="Show local time at destination" time="2-3 hrs" cost="Free" done />
            <FeatureCard title="Flight Status API" desc="Real-time flight tracking" time="6-8 hrs" cost="$0-50/mo" />
            <FeatureCard title="Push Notifications" desc="Reminders for upcoming events" time="6-8 hrs" cost="Free" />
          </div>
        </section>

        {/* Major Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-orange-400">🟠</span> Major Features
            <span className="text-sm font-normal text-slate-400">(1-3 days, Hard)</span>
          </h2>
          <div className="grid gap-3">
            <FeatureCard title="Cloud Sync" desc="Sync across devices with Cloudflare D1" time="2-3 days" cost="Free tier" done />
            <FeatureCard title="Multi-User Support" desc="Separate accounts with signup/login" time="2-3 days" cost="Free" done />
            <FeatureCard title="Shared Trips" desc="Collaborate with travel companions" time="3-4 days" cost="Requires cloud" />
            <FeatureCard title="Calendar Integration" desc="Export to Google/Apple Calendar" time="1-2 days" cost="Free" />
            <FeatureCard title="Maps Integration" desc="Show locations on map, directions" time="1-2 days" cost="Free" done />
            <FeatureCard title="AI Trip Planner" desc="Suggest itineraries based on destination" time="2-3 days" cost="$5-50/mo" />
            <FeatureCard title="OCR for Screenshots" desc="Extract text from uploaded images" time="1-2 days" cost="Free/$5" />
            <FeatureCard title="Native Mobile App" desc="React Native or Capacitor wrapper" time="1-2 weeks" cost="$99/yr" />
          </div>
        </section>

        {/* Advanced Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-red-400">🔴</span> Advanced/Long-Term
            <span className="text-sm font-normal text-slate-400">(1+ weeks, Expert)</span>
          </h2>
          <div className="grid gap-3">
            <FeatureCard title="Full Offline Sync" desc="IndexedDB + Service Worker + conflict resolution" time="1-2 weeks" cost="Free" />
            <FeatureCard title="Booking Integration" desc="Book flights/hotels directly" time="2-4 weeks" cost="Affiliate $" />
            <FeatureCard title="Group Expense Splitting" desc="Splitwise-style for group trips" time="1-2 weeks" cost="Free" />
            <FeatureCard title="Travel Insurance" desc="Partner with insurance providers" time="2+ weeks" cost="Revenue share" />
          </div>
        </section>

        {/* Completed */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-green-500">✅</span> Completed
          </h2>
          <div className="grid gap-2">
            <CompletedItem text="User signup/login with invite codes" />
            <CompletedItem text="Password reset functionality" />
            <CompletedItem text="Multi-device cloud sync (Cloudflare D1)" />
            <CompletedItem text="Immediate delete sync across devices" />
            <CompletedItem text="Main dashboard with clock/date/location" />
            <CompletedItem text="Today's trips display" />
            <CompletedItem text="Upcoming trips display" />
            <CompletedItem text="To-do list with trip tagging" />
            <CompletedItem text="Trip detail page with inline editing" />
            <CompletedItem text="Trip color coding" />
            <CompletedItem text="Destination search with timezone detection" />
            <CompletedItem text="Block types: Flight, Hotel, Layover, Transport, Work, Screenshot, Note, Activity, Restaurant, Cruise" />
            <CompletedItem text="Weather widget with 5-day forecast" />
            <CompletedItem text="Packing lists with templates" />
            <CompletedItem text="Expense tracking with categories" />
            <CompletedItem text="Maps integration" />
            <CompletedItem text="PDF export" />
            <CompletedItem text="Settings page (units, formats)" />
            <CompletedItem text="Offline indicator" />
            <CompletedItem text="Mobile-responsive design" />
            <CompletedItem text="Copy-to-clipboard for confirmations" />
          </div>
        </section>
      </main>

      {/* Floating Menu */}
      <FloatingMenu />
    </div>
  )
}

function FeatureCard({ title, desc, time, cost, done }: { title: string; desc: string; time: string; cost?: string; done?: boolean }) {
  return (
    <div className={`bg-slate-800 rounded-lg p-4 border ${done ? 'border-green-600 bg-green-900/20' : 'border-slate-700'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className={`font-semibold ${done ? 'text-green-400' : 'text-white'}`}>
            {done && <span className="mr-2">✓</span>}
            {title}
          </h3>
          <p className="text-slate-400 text-sm mt-1">{desc}</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-slate-500 text-sm">{time}</span>
          {cost && <div className="text-xs text-slate-600 mt-1">{cost}</div>}
        </div>
      </div>
    </div>
  )
}

function CompletedItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-green-400">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="10" />
      </svg>
      <span className="text-slate-300">{text}</span>
    </div>
  )
}

// Dev Notes component is rendered at end of RoadmapPage

