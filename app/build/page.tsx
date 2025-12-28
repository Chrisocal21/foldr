'use client';

import Link from 'next/link';
import FloatingMenu from '@/components/FloatingMenu';

export default function BuildPage() {
  const currentFeatures = [
    {
      category: 'Authentication',
      items: [
        'Login page with secure credentials (server-side env vars)',
        'Session persistence via localStorage',
        'Eye toggle to show/hide password',
      ],
    },
    {
      category: 'Main Dashboard',
      items: [
        'Real-time clock and date display',
        'GPS location with reverse geocoding',
        '"Foldr" branding',
        'Quick access to trips via + icon',
      ],
    },
    {
      category: 'Trip Management',
      items: [
        'Create, edit, delete trips',
        'Inline editing of trip name and dates',
        'Trip status indicators: Upcoming / Active / Past',
        'Duplicate trip functionality',
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
        'Flight blocks',
        'Hotel blocks',
        'Layover blocks',
        'Transport blocks',
        'Work/Job blocks',
        'Screenshot blocks',
        'Note blocks',
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
        'Vercel deployment',
        'React/Next.js project structure',
        'Mobile-responsive base',
      ],
    },
    {
      phase: 'Phase 1',
      status: 'in-progress',
      title: 'Core Trip Features',
      items: [
        'Trip list & management',
        'Calendar view',
        'Trip status indicators',
        'Duplicate trip',
        'Block types (all 7)',
        'Tap-to-copy fields',
        'Global search',
        'Today view',
      ],
    },
    {
      phase: 'Phase 2',
      status: 'planned',
      title: 'Advanced Features',
      items: [
        'OCR for screenshots',
        'One-sheet PDF export',
        'Email forwarding/parsing',
      ],
    },
    {
      phase: 'Phase 3',
      status: 'planned',
      title: 'Sync & Notifications',
      items: [
        'Notifications/reminders',
        'Multi-device sync',
        'Cloud backup',
      ],
    },
  ];

  const techStack = [
    { name: 'Next.js 15', desc: 'App Router' },
    { name: 'TypeScript', desc: 'Type safety' },
    { name: 'Tailwind CSS', desc: 'Styling' },
    { name: 'localStorage', desc: 'Offline storage' },
    { name: 'Vercel', desc: 'Deployment' },
    { name: 'GitHub', desc: 'Version control' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
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
      <FloatingMenu hideLinks={['build']} />
    </div>
  );
}
