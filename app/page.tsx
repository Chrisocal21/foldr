import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo/Name */}
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            Foldr
          </h1>
          
          {/* Tagline */}
          <p className="text-xl sm:text-2xl text-slate-300 mb-12">
            Your trip-based information hub
          </p>
          
          {/* Problem Statement */}
          <div className="bg-slate-800 rounded-2xl shadow-xl p-8 mb-12 border border-slate-700">
            <p className="text-lg text-slate-200 leading-relaxed">
              Stop digging through emails, screenshots, and notes. 
              Store all your travel info in one place—organized by trip, 
              always accessible, even offline.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            <FeatureCard 
              icon={<OfflineIcon />}
              title="Offline-First"
              description="Works on the plane, in the Uber, wherever you need it"
            />
            <FeatureCard 
              icon={<EyeIcon />}
              title="Glanceable"
              description="Key info visible immediately, no drilling down"
            />
            <FeatureCard 
              icon={<ClipboardIcon />}
              title="Tap to Copy"
              description="Copy addresses, phone numbers, and confirmation codes with one tap"
            />
            <FeatureCard 
              icon={<SparklesIcon />}
              title="Minimal UI"
              description="Clean, functional design focused on what matters"
            />
          </div>

          {/* What You Can Store */}
          <div className="bg-slate-800 rounded-2xl shadow-xl p-8 mb-12 border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Everything in One Timeline
            </h2>
            <div className="flex flex-wrap gap-3 justify-center text-sm text-slate-200">
              <span className="bg-slate-700 px-4 py-2 rounded-full border border-slate-600 flex items-center gap-2">
                <PlaneIcon /> Flights
              </span>
              <span className="bg-slate-700 px-4 py-2 rounded-full border border-slate-600 flex items-center gap-2">
                <HotelIcon /> Hotels
              </span>
              <span className="bg-slate-700 px-4 py-2 rounded-full border border-slate-600 flex items-center gap-2">
                <CarIcon /> Transportation
              </span>
              <span className="bg-slate-700 px-4 py-2 rounded-full border border-slate-600 flex items-center gap-2">
                <BriefcaseIcon /> Work Details
              </span>
              <span className="bg-slate-700 px-4 py-2 rounded-full border border-slate-600 flex items-center gap-2">
                <CameraIcon /> Screenshots
              </span>
              <span className="bg-slate-700 px-4 py-2 rounded-full border border-slate-600 flex items-center gap-2">
                <NoteIcon /> Notes
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/trips"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold mb-4 transition-colors"
            >
              Get Started
            </Link>
            <p className="text-slate-300">
              Built for travelers who want simplicity and reliability
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-400">
          <p>Foldr &copy; 2025</p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-slate-800 rounded-xl shadow-xl p-6 text-left border border-slate-700">
      <div className="mb-3 text-slate-300">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-300 text-sm">{description}</p>
    </div>
  )
}

// Icon components
function OfflineIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M12 11V7m0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14 l2 2 4-4" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364-2.121 2.121M8.757 15.243l-2.121 2.121m12.728 0-2.121-2.121M8.757 8.757 6.636 6.636" />
    </svg>
  )
}

function PlaneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
    </svg>
  )
}

function HotelIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 21h18M4 21V7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14M14 21V10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11" />
      <path d="M8 14h.01M8 10h.01M16 14h.01" />
    </svg>
  )
}

function CarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
      <path d="M5 17H3v-5l2-5h9l4 5v5h-2m-7-9 1.5 4.5H9L7.5 8Z" />
    </svg>
  )
}

function BriefcaseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )
}
