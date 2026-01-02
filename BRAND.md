# TripFldr

```
  _____ ___ ___ ___  ___ _    ___  ___ 
 |_   _| _ \_ _| _ \| __| |  |   \| _ \
   | | |   /| ||  _/| _|| |__| |) |   /
   |_| |_|_\___|_|  |_| |____|___/|_|_\
```

---

## Brand Identity

### Tagline
**"Your trips. Organized. Offline-first."**

### One-Liner
A modern travel itinerary app that keeps all your trip details in one place—flights, hotels, tasks, expenses—available offline and synced across devices.

---

## What TripFldr Does

### Core Purpose
TripFldr is a **personal travel organizer** designed for frequent travelers who need:
- 📋 All trip details in one place
- ✈️ Quick access to confirmation numbers, gates, addresses
- 📴 Full functionality without internet connection
- 🔄 Seamless sync across devices when online

### Key Features

| Feature | Description |
|---------|-------------|
| **Trip Timeline** | Visual itinerary with flights, hotels, transport, work blocks |
| **Offline-First** | Works without internet—localStorage + IndexedDB |
| **Cloud Sync** | D1 database sync when connected |
| **Smart Alerts** | Flight check-in reminders (24h before) |
| **Deep Links** | One-tap to Maps, Uber, airline apps |
| **Trip Categories** | Tag trips as Business, Vacation, Family, Solo, Adventure |
| **Weather & Sun** | Destination weather, sunrise/sunset times |
| **Task Board** | Kanban-style todo list per trip |
| **Expense Tracking** | Track spending by category |
| **Packing Lists** | Reusable templates for packing |
| **PDF Export** | Share itineraries offline |

---

## Visual Identity

### Colors

```
Primary:     #3B82F6  (Blue)
Background:  #0F172A  (Slate 950)
Surface:     #1E293B  (Slate 800)
Border:      #334155  (Slate 700)
Text:        #F8FAFC  (Slate 50)
Muted:       #94A3B8  (Slate 400)
Success:     #10B981  (Emerald)
Warning:     #F59E0B  (Amber)
Error:       #EF4444  (Red)
```

### Typography

```
Font Family:  System UI / -apple-system / Segoe UI
Headings:     font-semibold / font-bold
Body:         font-normal
Monospace:    font-mono (confirmation numbers, codes)
```

### Icon Style
- **Heroicons** style (outline, 24px, stroke-width: 2)
- Consistent SVG icons throughout
- No emojis in UI—clean iconography only

---

## Logo Concepts

### Text Mark (Current)
```
TripFldr
```
- Clean, modern sans-serif
- "Fldr" = Folder (travel documents organized)
- Lowercase "l" connects Trip to Fldr visually

### Icon Mark Ideas
```
┌─────────┐
│  ✈️ 📁  │   Plane + Folder
└─────────┘

┌─────────┐
│   📍    │   Location Pin
│  ═══    │   with timeline
│  ═══    │
└─────────┘

┌─────────┐
│ ▲       │   Abstract plane
│  ╲____  │   forming folder tab
└─────────┘
```

### App Icon (PWA)
- Blue (#3B82F6) background
- White plane icon or "T" lettermark
- Rounded corners (iOS style)

---

## Voice & Tone

### Personality
- **Helpful** — Anticipates traveler needs
- **Efficient** — No fluff, quick access to info
- **Reliable** — Works offline, never loses data
- **Modern** — Clean design, smart features

### Writing Style
- Short, scannable labels
- Action-oriented buttons ("Add Block", "Check In")
- Friendly but professional
- No jargon

---

## Target Users

1. **Business Travelers** — Multiple trips, need quick access to details
2. **Frequent Flyers** — Track flights, loyalty programs, check-in alerts
3. **Family Trip Planners** — Organize complex multi-destination trips
4. **Digital Nomads** — Offline-first is essential
5. **Solo Adventurers** — Self-reliant, need everything in one app

---

## Tech Stack

```
Frontend:    Next.js 15 (App Router)
Styling:     Tailwind CSS
Storage:     localStorage + IndexedDB
Cloud:       Cloudflare Workers + D1
Auth:        Custom (bcrypt + JWT)
Deploy:      Cloudflare (OpenNext)
PWA:         Manifest + Service Worker ready
```

---

## Deployment Flow

```bash
# Local development
npm run dev

# Deploy to production (Cloudflare)
npx @opennextjs/cloudflare build && npx wrangler deploy

# Commit changes
git add . && git commit -m "message" && git push
```

---

*TripFldr — Travel smarter, not harder.*
