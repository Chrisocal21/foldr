# Foldr

A trip-based information hub. One place to store and reference all travel info instead of digging through emails, screenshots, and notes.

**Status:** ✅ Live at [foldr-chrisoc.vercel.app](https://foldr-chrisoc.vercel.app)

---

## Current Features (Implemented)

### ✅ Authentication
- Login page with secure credentials (server-side env vars)
- Session persistence via localStorage
- Eye toggle to show/hide password

### ✅ Main Dashboard
- Real-time clock and date display
- GPS location with reverse geocoding (shows actual place name)
- "Foldr" branding
- Quick access to trips via + icon

### ✅ Trip Management
- Create, edit, delete trips
- Inline editing of trip name and dates (mobile-friendly)
- Trip status indicators: Upcoming / Active / Past (auto-detected)
- Duplicate trip functionality
- Today's trips display
- Upcoming trips display with clickable cards

### ✅ To-Do System
- Global to-do list on main page
- Tag todos to one or more trips
- View trip-specific todos on trip detail page
- Toggle complete/incomplete
- Delete todos

### ✅ Block Types
| Block Type | Status |
|------------|--------|
| Flight | ✅ Implemented |
| Hotel | ✅ Implemented |
| Layover | ✅ Implemented |
| Transport | ✅ Implemented |
| Work/Job | ✅ Implemented |
| Screenshot | ✅ Implemented |
| Note | ✅ Implemented |

### ✅ Export
- PDF export of full trip itinerary

### ✅ Search
- Global search across all trips and blocks

### ✅ Other Features
- Mobile-first responsive design
- Offline-capable (localStorage)
- PWA manifest
- Calendar view page
- Roadmap page

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Storage:** localStorage (offline-first)
- **Deployment:** Vercel
- **Repo:** GitHub

---

## Problem

Travel info is scattered across emails, screenshots, texts, notes apps, calendars, and confirmation PDFs. When you need something quick—hotel address, contact number, flight time—you're digging through clutter. Foldr solves this by giving you one place, organized by trip, where everything lives and you can glance or copy what you need.

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

- Domain: foldr.com not available, working title for now
- Authentication: Local-only for Phase 1, or simple login for future sync?
- Data portability: JSON export for backup?

---

## Future Ideas (Parking Lot)

- Terminal maps
- Weather at destination
- Time zone handling/display
- Packing lists
- Expense tracking
- Integration with airline/hotel apps