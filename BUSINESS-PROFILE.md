# Foldr — Business Profile

**Last Updated:** December 26, 2025

---

## 1. Company Overview

**What Foldr is:**
A trip-based information hub — one place to store and reference all travel info instead of digging through emails, screenshots, and notes.

**Who it's for:**
Frequent travelers, business travelers, and anyone who wants organized, accessible trip information without the chaos of scattered confirmations.

**Core Value Proposition:**
Replace the mess of emails, screenshots, and notes with a single, offline-first app that works on any device.

**Market Position:**
Lightweight personal travel organizer. Not a booking platform, not an AI planner — just clean, fast information management.

**Stage:**
Early-stage product. Live and functional with cloud sync.

---

## 2. Mission Statement

> Make travel information effortlessly accessible — before, during, and after the trip.

---

## 3. Vision Statement

> Become the default "travel folder" people reach for when planning or mid-trip.

---

## 4. Value Proposition

| Problem | Solution | Benefit |
|---------|----------|---------|
| Confirmation emails buried in inbox | Centralized trip blocks | Find anything in seconds |
| Screenshots scattered across devices | Screenshot blocks with captions | Visual info, organized |
| No internet at the airport | Offline-first PWA | Access everything, anywhere |
| Switching between 5 apps during travel | One hub for all trip data | Less app juggling |
| Forgetting what to pack | Packing list templates | Never forget essentials |
| Losing track of expenses | Multi-currency expense tracker | Know exactly what you spent |

**Why Foldr wins vs alternatives:**
- TripIt: Over-engineered, requires email forwarding
- Google Trips: Discontinued
- Notes app: Unstructured chaos
- Spreadsheets: Too much effort
- **Foldr:** Fast, structured, offline, no account required

---

## 5. Business Scope

**What's included:**
- Trip and itinerary management
- Block-based information storage (flights, hotels, transport, notes, screenshots)
- Todo lists (global and per-trip)
- Packing lists with templates
- Expense tracking with multi-currency support
- Weather forecasts at destination
- Maps integration
- PDF export
- Cloud sync (optional)

**What's intentionally excluded:**
- Booking flights/hotels (use existing platforms)
- Real-time flight tracking (airline apps do this better)
- AI-generated itineraries (ChatGPT already exists)
- Social features / trip sharing (maybe later)
- Loyalty program tracking (too complex, restricted APIs)

**Target Markets:**
- English-speaking travelers
- Mobile-first users
- Privacy-conscious users (offline-first, no mandatory account)

**Geographic Reach:**
- Global (works anywhere with a browser)

---

## 6. Operational Scope

**In-house:**
- Product development
- Design
- Deployment

**Outsourced / Third-party:**
- Hosting: Cloudflare Workers + D1 Database
- Weather data: Open-Meteo (free, no API key)
- Maps: Leaflet + OpenStreetMap
- Geocoding: Nominatim

**Technology:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- PWA with offline support
- Cloudflare D1 (SQLite)

---

## 7. Product / Service Scope

### Core Features (Implemented)
| Feature | Description |
|---------|-------------|
| Trip Management | Create, edit, duplicate, color-code, favorite trips |
| Block Types | Flight, Hotel, Layover, Transport, Work, Screenshot, Note |
| Todo System | Global + trip-specific, priorities, due dates, Kanban board |
| Packing List | Templates (Beach/Business/Winter/Essentials), progress tracking |
| Expense Tracker | Multi-currency, categories, totals |
| Weather Widget | 5-day forecast at destination |
| Maps | Destination pin on interactive map |
| Search | Global search across all trips and blocks |
| Calendar | Month view of all trips |
| PDF Export | Export itinerary for offline/print |
| Offline Mode | Full functionality without internet |
| Cloud Sync | Optional cross-device sync with account |

### Optional Add-ons
- Dark/Light theme
- Trip statistics dashboard

### Future Roadmap
- Calendar export (.ics)
- Trip sharing (read-only links)
- Push notifications ("Flight in 2 hours")

---

## 8. Target Market

**Demographics:**
- Age: 25-55
- Income: Middle to upper-middle (travels 2+ times/year)
- Tech comfort: Moderate to high (uses smartphone apps daily)

**Psychographics:**
- Values organization and efficiency
- Prefers self-service over complex tools
- Privacy-aware (skeptical of data-hungry apps)
- Dislikes clutter and bloated software

**Use Cases:**
- Business traveler managing multiple upcoming trips
- Vacation planner consolidating family trip details
- Digital nomad tracking accommodations and transport
- Anyone tired of searching email for confirmation numbers

---

## 9. Customer Segments

| Segment | Description | Priority |
|---------|-------------|----------|
| Solo Travelers | Personal trip management | Primary |
| Business Travelers | Quick access to work trip details | Primary |
| Families | Shared packing lists, expense tracking | Secondary |
| Travel Agents (future) | Manage client itineraries | Future |

---

## 10. Use Cases

**Before the trip:**
- Add flight/hotel confirmations as blocks
- Build packing list from template
- Set todo reminders ("Print boarding pass")

**During the trip:**
- Quick access to confirmation numbers (offline)
- Check weather at destination
- Log expenses as they happen
- Add notes or screenshots

**After the trip:**
- Review total expenses by currency
- Export PDF for reimbursement
- Archive trip for future reference

---

## 11. Market Positioning

**Position:** Lightweight, privacy-first travel organizer

| Axis | Foldr Position |
|------|----------------|
| Complexity | Simple (not feature-bloated) |
| Price | Free (no premium tier yet) |
| Privacy | High (offline-first, optional account) |
| Platform | Web-first PWA (works everywhere) |

---

## 12. Competitive Landscape

| Competitor | Type | Foldr Advantage |
|------------|------|-----------------|
| TripIt | Auto-import from email | Simpler, no email forwarding required |
| Google Trips | Was great, discontinued | Foldr exists |
| Wanderlog | AI-powered planning | Foldr is faster, no AI bloat |
| Notion | General-purpose | Foldr is purpose-built for travel |
| Notes app | Unstructured | Foldr has structure without overhead |
| Spreadsheets | Manual | Foldr is mobile-friendly, faster |

**Key Differentiators:**
1. Offline-first (works without internet)
2. No mandatory account
3. Fast and focused (not trying to do everything)
4. Block-based structure (not freeform chaos)

---

## 13. Go-to-Market Strategy

**Current:**
- Direct link sharing
- Word of mouth
- Personal use / dogfooding

**Future:**
- Product Hunt launch
- r/travel, r/digitalnomad, r/solotravel
- Travel blogger outreach
- SEO: "trip organizer app", "offline travel planner"

**Pricing Strategy:**
- Free tier: Full functionality, local storage only
- Future paid tier: Cloud sync, sharing, priority support

---

## 14. Business Model

**Current:**
- Free (no revenue)

**Future Options:**
| Model | Description |
|-------|-------------|
| Freemium | Free local, paid cloud sync ($3-5/mo) |
| One-time purchase | $9.99 lifetime access |
| Tip jar | Optional donation |

**Cost Structure:**
- Cloudflare Workers: Free tier (100k requests/day)
- Cloudflare D1: Free tier (5GB storage)
- Domain: ~$12/year (if custom domain)
- Development: Time investment

---

## 15. Operating Model

**Team:** Solo developer (for now)

**Processes:**
- Feature development in sprints
- Deploy via Wrangler CLI
- User feedback via direct communication

**Tooling:**
- VS Code + Copilot
- Git + GitHub
- Cloudflare Dashboard
- Local testing with Next.js dev server

---

## 16. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS |
| State | localStorage (offline), React state |
| Backend | Cloudflare Workers (serverless) |
| Database | Cloudflare D1 (SQLite) |
| Auth | Token-based, stored in D1 |
| Maps | Leaflet + OpenStreetMap |
| Weather | Open-Meteo API |
| Geocoding | Nominatim |
| Deployment | Cloudflare Workers |
| PWA | Service worker, manifest.json |

---

## 17. Legal Structure

**Current:** Personal project / side project

**Future (if monetized):**
- LLC formation
- Terms of Service
- Privacy Policy

---

## 18. Compliance & Risk

**Data Privacy:**
- Offline-first = user data stays on device by default
- Cloud sync is opt-in
- No third-party analytics (yet)
- No data selling

**Risks:**
| Risk | Mitigation |
|------|------------|
| Cloudflare outage | Offline mode ensures continuity |
| Data loss | Cloud sync provides backup |
| Competition | Stay focused, don't bloat |

---

## 19. Roadmap

### Completed (v0.11)
- ✅ All core features
- ✅ Offline mode
- ✅ Cloud sync with Cloudflare D1
- ✅ PWA support

### Short-term (v0.12)
- Calendar export (.ics files)
- Push notifications

### Mid-term (v1.0)
- Trip sharing (read-only links)
- Public launch (Product Hunt)

### Long-term
- Mobile app wrapper (if needed)
- Team/family accounts
- Monetization

---

## 20. Key Metrics (KPIs)

| Metric | Current | Target |
|--------|---------|--------|
| Active users | 1 (me) | 100+ |
| Trips created | Testing | — |
| Cloud sync users | — | Track adoption |
| PWA installs | — | Track |
| Retention (30-day) | — | 50%+ |

**Success Indicators:**
- Users return before/during trips
- Users recommend to fellow travelers
- Low churn after first trip

---

## TL;DR — The Foldr Stack

> **Company Overview:** Travel info hub — one place for all trip details
> **Mission:** Make travel info effortlessly accessible
> **Vision:** The default "travel folder" for everyone
> **Value Prop:** Offline-first, fast, structured, no bloat
> **Target Market:** Travelers who hate scattered confirmations
> **Business Model:** Free now, freemium later
> **Tech Stack:** Next.js + Cloudflare Workers + D1
> **Stage:** Live, functional, growing

---

## Live URL

**Production:** https://tripfldr.com/

---

*This document is a living profile. Update as Foldr evolves.*
