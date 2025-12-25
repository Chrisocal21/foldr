export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo/Name */}
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6">
            Foldr
          </h1>
          
          {/* Tagline */}
          <p className="text-xl sm:text-2xl text-slate-600 mb-12">
            Your trip-based information hub
          </p>
          
          {/* Problem Statement */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
            <p className="text-lg text-slate-700 leading-relaxed">
              Stop digging through emails, screenshots, and notes. 
              Store all your travel info in one place—organized by trip, 
              always accessible, even offline.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            <FeatureCard 
              icon="📱"
              title="Offline-First"
              description="Works on the plane, in the Uber, wherever you need it"
            />
            <FeatureCard 
              icon="👀"
              title="Glanceable"
              description="Key info visible immediately, no drilling down"
            />
            <FeatureCard 
              icon="📋"
              title="Tap to Copy"
              description="Copy addresses, phone numbers, and confirmation codes with one tap"
            />
            <FeatureCard 
              icon="✨"
              title="Minimal UI"
              description="Clean, functional design focused on what matters"
            />
          </div>

          {/* What You Can Store */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              Everything in One Timeline
            </h2>
            <div className="flex flex-wrap gap-3 justify-center text-sm text-slate-600">
              <span className="bg-slate-100 px-4 py-2 rounded-full">✈️ Flights</span>
              <span className="bg-slate-100 px-4 py-2 rounded-full">🏨 Hotels</span>
              <span className="bg-slate-100 px-4 py-2 rounded-full">🚗 Transportation</span>
              <span className="bg-slate-100 px-4 py-2 rounded-full">💼 Work Details</span>
              <span className="bg-slate-100 px-4 py-2 rounded-full">📸 Screenshots</span>
              <span className="bg-slate-100 px-4 py-2 rounded-full">📝 Notes</span>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-2xl font-semibold text-slate-900 mb-4">
              Coming Soon
            </p>
            <p className="text-slate-600">
              Built for travelers who want simplicity and reliability
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>Foldr &copy; 2025</p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 text-left">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </div>
  )
}
