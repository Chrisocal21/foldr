# TripFldr

A trip-based information hub. One place to store and reference all travel info instead of digging through emails, screenshots, and notes.

**Status:** ✅ Live at [tripfldr.com](https://tripfldr.com)

**Last Updated:** December 28, 2025

---

## Current Features (Implemented)

### ✅ Authentication & Cloud Sync
- User accounts with email/password authentication
- Invite code system for controlled signups
- Token-based session management (stored in Cloudflare D1)
- Cross-device sync via Cloudflare D1 database
- Auto-sync on data changes (2-second debounce)
- Sync includes: trips, blocks, todos, packing items, expenses, settings
- Proper deletion sync (deleted items removed from cloud)
- Login/signup/logout/password reset flows
- Offline-first with cloud backup

### ✅ Legacy Authentication (deprecated)
- Login page with secure credentials (server-side env vars: `APP_USER`, `APP_PASS`)
- Session persistence via localStorage
- Eye toggle to show/hide password

### ✅ Main Dashboard
- Custom TripFldr logo (with fallback text)
- Real-time clock and date display (formatted: "Wed, Dec 25")
- GPS location with reverse geocoding (shows "City, State" format)
- Quick access to trips via + icon
- Consistent header styling across all pages

### ✅ Trip Management
- Create, edit, delete trips
- Inline editing of trip name and dates (mobile-friendly)
- Trip status indicators: Upcoming / Active / Past (auto-detected)
- Duplicate trip functionality
- Today's trips display on main page
- Upcoming trips display with clickable cards

### ✅ To-Do System
- Global to-do list on main page
- Tag todos to one or more trips
- View trip-specific todos on trip detail page
- Toggle complete/incomplete
- Delete todos

### ✅ Block Types
| Block Type | Status | Fields |
|------------|--------|--------|
| Flight | ✅ | Airline, Flight #, Date, Times, Airports, Confirmation, Seat, Gate |
| Hotel | ✅ | Name, Address, Phone, Check-in/out, Confirmation |
| Layover | ✅ | Location, Duration, Terminal, Notes |
| Transport | ✅ | Type, Company, Confirmation, Pickup/Dropoff |
| Work/Job | ✅ | Site, Address, Contact, Phone, Email |
| Screenshot | ✅ | Image, Caption, Date |
| Note | ✅ | Title, Text, Date/Time |

### ✅ Export
- PDF export of full trip itinerary

### ✅ Search
- Global search across all trips and blocks

### ✅ Pages
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Login/signup page (redirects to /trips if logged in) |
| Trips | `/trips` | Trip list with filters (All/Upcoming/Active/Past) |
| Trip Detail | `/trips/[id]` | View trip blocks, inline editing, todos |
| New Trip | `/trips/new` | Create new trip |
| Add Block | `/trips/[id]/add-block` | Add block to trip |
| Edit Block | `/trips/[id]/edit-block/[blockId]` | Edit existing block |
| Duplicate Trip | `/trips/[id]/duplicate` | Duplicate a trip |
| Calendar | `/calendar` | Month view of trips |
| Search | `/search` | Global search |
| Stats | `/stats` | Trip statistics dashboard |
| Settings | `/settings` | Account, sync, theme, data management |
| Build Spec | `/build` | This documentation (viewable) |
| Roadmap | `/roadmap` | Future features roadmap |
| Backend | `/backend` | Image upload tool |

### ✅ Branding & Assets
- Custom logo (`/logos/logo.png`)
- Favicon (`/logos/favicon.ico`)
- PWA icons (192x192, 512x512)
- Apple touch icon (180x180)
- Consistent blue theme color (`#6B9AE8`)

### ✅ Theme & Settings
- Dark/Light theme toggle via Settings modal (cog icon in header)
- Theme persists via localStorage
- CSS variables for consistent theming
- Settings accessible from main dashboard

### ✅ Trip Enhancements
- Trip color coding (8 colors: blue, green, purple, orange, pink, teal, red, yellow)
- Countdown timer showing "X days away" or "X days left"
- Trips sorted by start date
- Dates display correctly regardless of timezone

### ✅ Todo Enhancements
- Optional due dates with date picker
- Priority levels: Low, Medium, High
- Visual indicators: colored dots for priority, colored text for due dates
- Sorting: by priority first, then by due date
- Overdue items highlighted in red

### ✅ UX Improvements
- Copy confirmation with "Copied!" text feedback
- Date parsing fixed to prevent timezone shift issues

### ✅ Other Features
- Mobile-first responsive design (iPhone 13+ optimized)
- Offline-capable (localStorage)
- PWA manifest for "Add to Home Screen"
- Consistent header styling across all pages

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.4.10 | React framework (App Router) |
| React | 19 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Cloudflare Pages | - | Hosting & deployment |
| Cloudflare D1 | - | SQLite database for cloud sync |
| @opennextjs/cloudflare | - | Next.js adapter for Cloudflare |
| localStorage | - | Offline data storage |
| Nominatim API | - | Free reverse geocoding |
| Open-Meteo API | - | Weather forecasts (free, no key) |
| Leaflet | - | Maps integration |
| GitHub | - | Version control |

---

## Project Structure

```
foldr/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main dashboard (login/signup)
│   ├── layout.tsx         # Root layout with meta
│   ├── login.tsx          # Login component
│   ├── globals.css        # Global styles
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   │   ├── login/     # POST /api/auth/login
│   │   │   ├── signup/    # POST /api/auth/signup
│   │   │   ├── change-password/
│   │   │   └── reset-password/
│   │   └── sync/          # Cloud sync endpoints
│   │       ├── push/      # POST /api/sync/push
│   │       └── pull/      # GET /api/sync/pull
│   ├── trips/             # Trip pages
│   ├── calendar/          # Calendar view
│   ├── search/            # Search page
│   ├── stats/             # Statistics page
│   ├── settings/          # Settings page
│   ├── build/             # Build spec page
│   ├── roadmap/           # Roadmap page
│   └── backend/           # Image upload
├── components/            # Reusable components
│   ├── BlockCard.tsx      # Block display card
│   ├── ComboBox.tsx       # Autocomplete input
│   ├── CopyField.tsx      # Tap-to-copy field
│   ├── DevNotes.tsx       # Development notes panel
│   ├── ExpenseTracker.tsx # Expense tracking component
│   ├── FloatingMenu.tsx   # Bottom floating action menu
│   ├── GlobalTodos.tsx    # Global todo list panel
│   ├── OfflineIndicator.tsx # Offline status banner
│   ├── PackingList.tsx    # Packing list component
│   ├── PlaceSearch.tsx    # Location search component
│   ├── TripMap.tsx        # Leaflet map component
│   ├── TripTodos.tsx      # Trip-specific todos
│   └── WeatherWidget.tsx  # Weather forecast widget
├── lib/                   # Utilities
│   ├── types.ts          # TypeScript interfaces
│   ├── storage.ts        # localStorage CRUD + auto-sync
│   ├── cloud-sync.ts     # Cloud sync functions
│   ├── db.ts             # Cloudflare D1 database helper
│   ├── travel-data.ts    # Travel data helpers
│   ├── pdf-export.ts     # PDF generation
│   ├── theme-context.tsx # Theme provider & hook
│   ├── settings-context.tsx # Settings provider
│   ├── offline.ts        # Offline detection
│   └── ocr.ts            # OCR (placeholder)
├── pages/api/            # Legacy API routes
│   ├── login.ts          # Legacy auth endpoint
│   └── upload.ts         # Image upload endpoint
├── public/
│   ├── logos/            # Logo & icon assets
│   ├── uploads/          # User uploads
│   └── manifest.json     # PWA manifest
├── wrangler.toml         # Cloudflare Workers config
├── open-next.config.ts   # OpenNext config for Cloudflare
└── shared/               # Shared files for AI context
    ├── logos/
    ├── screenshots/
    └── reference/
```

---

## Environment Variables

**Local (`.env.local`):**
```
APP_USER=your_username      # Legacy auth (optional)
APP_PASS=your_password      # Legacy auth (optional)
```

**Cloudflare (wrangler.toml):**
```toml
[[d1_databases]]
binding = "DB"
database_name = "foldr-db"
database_id = "your-database-id"

[vars]
INVITE_CODE = "your-invite-code"
```

**Database Schema (Cloudflare D1):**
```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Auth tokens
CREATE TABLE tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Data tables (trips, blocks, todos, packing_items, expenses, settings)
-- Each has: id, user_id, data (JSON), updated_at
```

---

## Deployment

**Platform:** Cloudflare Pages with D1 database

**Build Command:** `npm run build`

**Deploy Command:** `npx wrangler pages deploy .open-next --project-name=tripfldr`

**Database Management:**
```bash
# Create database
npx wrangler d1 create foldr-db

# Run migrations
npx wrangler d1 execute foldr-db --remote --file=schema.sql

# Query database
npx wrangler d1 execute foldr-db --remote --command "SELECT * FROM users"
```

---

## Problem

Travel info is scattered across emails, screenshots, texts, notes apps, calendars, and confirmation PDFs. When you need something quick—hotel address, contact number, flight time—you're digging through clutter. TripFldr solves this by giving you one place, organized by trip, where everything lives and you can glance or copy what you need.

---

## Core Principles

- **Offline-first:** Works on the plane, in the Uber, wherever
- **Glanceable:** Key info visible immediately, no drilling down
- **Copy-friendly:** Tap any field to copy—addresses, phone numbers, confirmation codes
- **Minimal UI:** Clean, functional, no fluff

---

## Tech Approach

- Web app (mobile-first, responsive)
- PWA for offline capability
- Local storage for screenshots and data
- Optional sync later

### Tech Stack Requirements

- **No plain HTML pages** - All pages must be React (JSX/TSX)
- Framework: Next.js or similar React-based framework
- Styling: TBD (Tailwind, CSS modules, etc.)
- Deployment: Vercel
- Repo: GitHub

---

## Phase 0: Landing Page

**Build first before any backend work.** Gets the repo set up on GitHub and deployed to Vercel.

- Simple landing page (React/JSX/TSX, no HTML)
- App name and tagline
- Brief feature overview
- "Coming soon" or waitlist signup (optional)
- Mobile-responsive
- Sets up project structure for Phase 1

---

## Phase 1 Features

### Trip Management

- **Trip list:** All trips in one view
- **Calendar view:** Month view showing trips, tap to open
- **Trip status indicators:** Upcoming / Active / Past (auto-detected based on dates)
- **Duplicate trip:** Copy a past trip as a template for repeat destinations
- **Color or icon per trip:** Visual scanning in calendar view

### Per-Trip Timeline

Structured blocks sorted chronologically:

| Block Type | Fields |
|------------|--------|
| **Flight** | Airline, flight #, date, depart/arrive times, airports, confirmation #, seat, terminal/gate |
| **Hotel** | Name, address, phone, check-in/out dates, confirmation # |
| **Layover** | Location, duration, terminal, notes |
| **Job/Work** | Site name, address, contact name, phone, notes |
| **Car/Transport** | Type, confirmation #, pickup/dropoff locations, times |
| **Screenshot** | Image (stored locally), caption |
| **Note** | Freeform text, optional date/time |

### Quick Actions

- **Tap-to-copy on any field:** Visual feedback (checkmark/flash) on copy
- **Quick-add from homepage:** Add flight/hotel without opening a trip first, assign to trip after
- **"Today" view:** When mid-trip, surface today's blocks at the top

### Search

- **Global search:** One search bar across all trips
- Find confirmation codes, hotel names, contact info, anything

---

## Phase 2 Features

- **OCR for screenshots:** Extract text from images for search and copy
- **One-sheet export:** Generate shareable PDF/image of full itinerary
- **Email forwarding/parsing:** Forward confirmation emails, auto-extract details

---

## Phase 3 Features

- **Notifications/reminders:** Check-in alerts, flight reminders, etc.
- **Multi-device sync:** Cloud backup and sync across devices

---

## Block Detail: Fields Reference

### Flight
```
- Airline
- Flight number
- Date
- Departure time
- Departure airport
- Arrival time
- Arrival airport
- Confirmation number
- Seat
- Terminal
- Gate
- Notes
```

### Hotel
```
- Name
- Address
- Phone
- Check-in date
- Check-in time
- Check-out date
- Check-out time
- Confirmation number
- Notes
```

### Layover
```
- Airport/Location
- Arrival time
- Departure time
- Duration (auto-calculated)
- Terminal
- Notes
```

### Job/Work
```
- Site/Company name
- Address
- Contact name
- Contact phone
- Contact email
- Notes
```

### Car/Transport
```
- Type (rental, rideshare, shuttle, etc.)
- Company
- Confirmation number
- Pickup location
- Pickup date/time
- Dropoff location
- Dropoff date/time
- Notes
```

### Screenshot
```
- Image (local storage)
- Caption
- Date added
- [Future: Extracted text via OCR]
```

### Note
```
- Title (optional)
- Text (freeform)
- Date/time (optional)
```

---

## UI Notes

- Mobile-first, responsive for desktop
- Minimal, clean aesthetic—no gamification, no social features
- Trustworthy/professional look, not startup-flashy
- Timeline view as primary trip interface
- Calendar as primary navigation for finding trips

---

## Open Questions

- Domain: ✅ tripfldr.com secured!
- Authentication: Local-only for Phase 1, or simple login for future sync?
- Data portability: JSON export for backup?

---

## Future Ideas (Parking Lot)

- Terminal maps
- ~~Weather at destination~~ ✅ Implemented
- ~~Time zone handling/display~~ ✅ Implemented
- ~~Packing lists~~ ✅ Implemented
- ~~Expense tracking~~ ✅ Implemented
- ~~Integration with airline/hotel apps~~ (Decided against - too complex)
- Calendar export (.ics files)
- Trip sharing (read-only links)
- Push notifications (PWA)