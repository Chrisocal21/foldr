'use client';

import Link from 'next/link';
import FloatingMenu from '@/components/FloatingMenu';

export default function BuildPage() {
  const currentFeatures = [
    {
      category: 'Authentication & Accounts',
      items: [
        'User signup with invite codes',
        'Login with email/password',
        'Password reset functionality',
        'Session persistence via tokens',
        'Eye toggle to show/hide password',
        'Continue without account option',
      ],
    },
    {
      category: 'Cloud Sync',
      items: [
        'Multi-device sync via Cloudflare D1',
        'Real-time push/pull synchronization',
        'Immediate delete propagation across devices',
        'Offline-first with cloud backup',
        'User data isolation',
      ],
    },
    {
      category: 'Trip Management',
      items: [
        'Create, edit, delete trips',
        'Inline editing of trip name and dates',
        'Trip status indicators: Upcoming / Active / Past',
        'Duplicate trip functionality',
        'Trip color coding',
        'Destination search with auto-complete',
        'Auto timezone detection',
        'Today&apos;s trips display',
        'Upcoming trips with clickable cards',
      ],
    },
    {
      category: 'To-Do System',
      items: [
        'Global to-do list on main page',
        'Tag todos to one or more trips',
        'View trip-specific todos on trip detail page',
        'Toggle complete/incomplete',
        'Delete todos',
      ],
    },
    {
      category: 'Block Types',
      items: [
        'Flight blocks with full details',
        'Hotel blocks',
        'Layover blocks',
        'Transport blocks (Rental, Uber, Train, etc)',
        'Work/Job blocks',
        'Screenshot blocks with image upload',
        'Note blocks',
        'Activity blocks',
        'Restaurant blocks',
        'Cruise blocks',
      ],
    },
    {
      category: 'Packing Lists',
      items: [
        'Per-trip packing lists',
        'Category organization',
        'Check/uncheck items',
        'Pre-built templates (Beach, Business, etc)',
        'Custom items',
      ],
    },
    {
      category: 'Expense Tracking',
      items: [
        'Log expenses per trip',
        'Category breakdown',
        'Running totals',
        'Multi-currency support',
      ],
    },
    {
      category: 'Weather & Location',
      items: [
        'Weather widget on trip page',
        '5-day forecast at destination',
        'Current temperature display',
        'Maps integration with pins',
        'Timezone display with local time',
      ],
    },
    {
      category: 'Settings & UI',
      items: [
        'Dark mode (default)',
        'Temperature unit toggle (°C/°F)',
        'Distance unit toggle (km/mi)',
        'Date format options',
        'Time format (12h/24h)',
        'Offline indicator',
        'Manual sync button',
        'Logout functionality',
      ],
    },
    {
      category: 'Other',
      items: [
        'PDF export of full trip itinerary',
        'Global search across all trips',
        'Calendar view page',
        'Mobile-first responsive design',
        'Offline-capable (localStorage)',
        'PWA manifest',
        'Copy-to-clipboard for confirmation codes',
      ],
    },
  ];

  const phases = [
    {
      phase: 'Phase 0',
      status: 'complete',
      title: 'Landing Page & Setup',
      items: [
        'GitHub repo setup',
        'Cloudflare deployment',
        'React/Next.js project structure',
        'Mobile-responsive base',
      ],
    },
    {
      phase: 'Phase 1',
      status: 'complete',
      title: 'Core Trip Features',
      items: [
        'Trip list & management',
        'Calendar view',
        'Trip status indicators',
        'Duplicate trip',
        'Block types (10 total)',
        'Tap-to-copy fields',
        'Global search',
        'Today view',
      ],
    },
    {
      phase: 'Phase 2',
      status: 'complete',
      title: 'Advanced Features',
      items: [
        'Weather widget',
        'Packing lists with templates',
        'Expense tracking',
        'PDF export',
        'Maps integration',
      ],
    },
    {
      phase: 'Phase 3',
      status: 'complete',
      title: 'Sync & Accounts',
      items: [
        'User signup/login',
        'Multi-device sync',
        'Cloud backup (Cloudflare D1)',
        'Immediate delete sync',
        'Offline-first architecture',
      ],
    },
    {
      phase: 'Phase 4',
      status: 'planned',
      title: 'Future Enhancements',
      items: [
        'Push notifications',
        'Trip sharing',
        'AI trip planner',
        'Flight status API',
        'Native mobile app',
      ],
    },
  ];

  const techStack = [
    { name: 'Next.js 15', desc: 'App Router' },
    { name: 'TypeScript', desc: 'Type safety' },
    { name: 'Tailwind CSS', desc: 'Styling' },
    { name: 'Cloudflare D1', desc: 'Cloud database' },
    { name: 'Cloudflare Workers', desc: 'Edge deployment' },
    { name: 'localStorage', desc: 'Offline storage' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'planned':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-slate-400 hover:text-white text-2xl">
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Build Spec</h1>
          <p className="text-slate-500 text-sm">Technical documentation</p>
        </div>
      </div>

      {/* Live Status */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 font-medium">Live</span>
        </div>
        <p className="text-slate-300 mt-1">Deployed at tripfldr.com</p>
      </div>

      {/* Tech Stack */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-300 mb-3">Tech Stack</h2>
        <div className="grid grid-cols-2 gap-2">
          {techStack.map((tech) => (
            <div key={tech.name} className="bg-slate-900 rounded-lg p-3 border border-slate-800">
              <p className="font-medium text-white">{tech.name}</p>
              <p className="text-xs text-slate-500">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Current Features */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-300 mb-3">✅ Implemented Features</h2>
        <div className="space-y-4">
          {currentFeatures.map((section) => (
            <div key={section.category} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <h3 className="font-semibold text-green-400 mb-2">{section.category}</h3>
              <ul className="space-y-1">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Development Phases */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-300 mb-3">Development Phases</h2>
        <div className="space-y-4">
          {phases.map((phase) => (
            <div key={phase.phase} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadge(phase.status)}`}>
                  {phase.status === 'complete' ? '✅ Complete' : phase.status === 'in-progress' ? '🔨 In Progress' : '📋 Planned'}
                </span>
                <span className="font-semibold text-white">{phase.phase}</span>
              </div>
              <h3 className="text-slate-300 font-medium mb-2">{phase.title}</h3>
              <ul className="space-y-1">
                {phase.items.map((item, i) => (
                  <li key={i} className="text-sm text-slate-500 flex items-start gap-2">
                    <span className="text-slate-600">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Core Principles */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-300 mb-3">Core Principles</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-xl mb-1">📴</p>
            <p className="font-semibold text-white text-sm">Offline-first</p>
            <p className="text-xs text-slate-500">Works on plane, in Uber</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-xl mb-1">👀</p>
            <p className="font-semibold text-white text-sm">Glanceable</p>
            <p className="text-xs text-slate-500">Key info visible immediately</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-xl mb-1">📋</p>
            <p className="font-semibold text-white text-sm">Copy-friendly</p>
            <p className="text-xs text-slate-500">Tap any field to copy</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-xl mb-1">✨</p>
            <p className="font-semibold text-white text-sm">Minimal UI</p>
            <p className="text-xs text-slate-500">Clean, functional, no fluff</p>
          </div>
        </div>
      </div>

      {/* Block Types Reference */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-300 mb-3">Block Types</h2>
        <div className="space-y-3">
          {[
            { icon: '✈️', name: 'Flight', fields: 'Airline, Flight #, Date, Times, Airports, Confirmation, Seat, Gate' },
            { icon: '🏨', name: 'Hotel', fields: 'Name, Address, Phone, Check-in/out, Confirmation' },
            { icon: '⏱️', name: 'Layover', fields: 'Location, Duration, Terminal, Notes' },
            { icon: '🚗', name: 'Transport', fields: 'Type, Company, Confirmation, Pickup/Dropoff' },
            { icon: '💼', name: 'Work/Job', fields: 'Site, Address, Contact, Phone, Email' },
            { icon: '📸', name: 'Screenshot', fields: 'Image, Caption, Date' },
            { icon: '📝', name: 'Note', fields: 'Title, Text, Date/Time' },
          ].map((block) => (
            <div key={block.name} className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex items-start gap-3">
              <span className="text-xl">{block.icon}</span>
              <div>
                <p className="font-medium text-white">{block.name}</p>
                <p className="text-xs text-slate-500">{block.fields}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Future Ideas */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-300 mb-3">🅿️ Parking Lot</h2>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex flex-wrap gap-2">
            {[
              'Terminal maps',
              'Weather at destination',
              'Time zone handling',
              'Packing lists',
              'Expense tracking',
              'Airline/hotel integrations',
            ].map((idea) => (
              <span key={idea} className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
                {idea}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-3">
        <Link 
          href="/roadmap" 
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 text-center hover:bg-slate-800 transition-colors"
        >
          <p className="text-lg mb-1">🗺️</p>
          <p className="text-sm font-medium">Roadmap</p>
        </Link>
        <Link 
          href="/" 
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 text-center hover:bg-slate-800 transition-colors"
        >
          <p className="text-lg mb-1">🏠</p>
          <p className="text-sm font-medium">Home</p>
        </Link>
      </div>

      {/* Floating Menu */}
      <FloatingMenu />
    </div>
  );
}

