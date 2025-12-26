# Foldr - Roadmap

**Last Updated:** December 25, 2025

---

## ✅ Completed

| Feature | Description |
|---------|-------------|
| Dark/Light Theme | Settings modal with theme switcher |
| Trip Color Coding | 8 color options per trip |
| Countdown Timer | "X days away/left" on trip cards |
| Todo Due Dates | Optional dates with color indicators |
| Todo Priority | Low/Medium/High with visual dots |
| Todo Kanban Board | Drag-and-drop columns (To Do, Doing, Done) |
| Todo Color Tags | 8 color options per todo |
| Todo Editing | Click-to-edit modal |
| Copy Confirmation | Tap-to-copy with "Copied!" feedback |
| Date Timezone Fix | All dates parse correctly (local) |
| Trip Sorting | Sorted by start date |
| Logout Button | Clear session from settings |
| Notes Consistency | All 7 block types support notes |
| Block Types | Flight, Hotel, Layover, Transport, Work, Screenshot, Note |
| PDF Export | Export trip itinerary |
| Calendar View | Visual calendar of trips |
| Global Search | Search across all trips and blocks |
| Empty State Messages | Better UX with icons and helpful prompts |
| Delete Confirmations | Modal dialogs for trip/block deletes |
| Date Format Helpers | formatFriendlyDate(), formatRelativeDate() |
| Favorite Trips | Star to pin trips to top of list |
| Hide Past Trips | Toggle to hide completed trips |
| Block Duplicate | Copy blocks within trips |
| Time Zone Display | Local time at destination on trip cards |
| Auto-detect Destination | City search with timezone auto-fill |
| Packing List | Templates (Beach/Business/Winter/Essentials), progress bar |
| Expense Tracker | Multi-currency, categories, totals by currency |
| Maps Integration | Leaflet map showing destination pin |
| Trip Statistics | Total trips, days traveled, cities visited, expenses |
| Weather Widget | 5-day forecast using Open-Meteo (free, no API key) |
| Offline Mode | Proper offline detection, no mock data, graceful degradation |

---

## 🟡 Medium (3-6 hrs)

Solid features that add real value.

| Feature | Time | Why |
|---------|------|-----|
| **Export to Calendar** | 3-4 hrs | Generate .ics file for Google/Apple Calendar |
| **Weather Widget** | 4-6 hrs | 5-day forecast at destination (OpenWeatherMap free) |
| **Trip Statistics** | 3 hrs | Total trips, days traveled, cities visited this year |

---

## 🟠 Hard (1-3 days)

Major features requiring significant work.

| Feature | Time | Why | Cost |
|---------|------|-----|------|
| **Cloud Sync** | 2-3 days | Sync across devices, backup data | $0-25/mo (Supabase) |
| **Trip Sharing** | 1-2 days | Generate read-only link for companions | Free |
| **Push Notifications** | 6-8 hrs | "Flight in 2 hours" reminders | Free (PWA) |

---

## 🎯 Next Up

### Phase 2 - Polish ✅ COMPLETE
1. ~~Empty state messages~~ ✅
2. ~~Delete confirmations~~ ✅
3. ~~Better date formatting~~ ✅
4. ~~Favorite trips~~ ✅
5. ~~Hide past trips~~ ✅
6. ~~Block duplicate~~ ✅

### Phase 3 - Features ✅ COMPLETE
1. ~~Auto-detect destination~~ ✅
2. ~~Packing list~~ ✅
3. ~~Expense tracker~~ ✅
4. ~~Maps integration~~ ✅

### Phase 4 - Scale (Next)
1. ~~Trip statistics~~ ✅
2. ~~Weather widget~~ ✅
3. ~~Offline optimization~~ ✅
4. Cloud sync (Cloudflare)
5. Calendar export

---

## 🗃️ Clutter / Maybe Later

Review these - some may be useful, some are probably overkill.

| Feature | Time | Notes |
|---------|------|-------|
| Pull-to-Refresh | 1 hr | Standard mobile pattern, but page already loads fast |
| Haptic Feedback | 30 min | Vibration on actions - gimmicky? |
| Add to Home Screen Prompt | 1-2 hrs | PWA install banner - users know how to do this |
| Swipe Actions | 2-3 hrs | Swipe to delete/complete - maybe useful |
| Share Sheet Integration | 2-3 hrs | Share trips via OS share menu |
| Camera for Screenshots | 3-4 hrs | Take photo directly vs upload - redundant? |
| Currency Converter | 3-4 hrs | Google already does this instantly |
| Flight Status API | 6-8 hrs | Real-time tracking - costs $$ and you get this from airline apps |
| Document Storage | 6-8 hrs | Upload PDFs - storage costs add up, most people use email |
| Import from Email | 8+ hrs | Parse confirmation emails - unreliable, every airline different |
| AI Trip Planner | 2-3 days | Suggest itineraries - ChatGPT already does this |
| OCR for Screenshots | 1-2 days | Already have basic OCR, unclear if more is needed |
| Travel Rewards Tracking | 2-3 days | Track miles/points - most people use airline apps |
| Offline Map Caching | 2-3 days | Download maps - Google Maps does this better |
| Multi-User Support | 2-3 days | Separate accounts - requires cloud first |
| Shared Trips | 3-4 days | Collaborate with companions - complex, requires cloud |
| Native Mobile App | 1-2 weeks | React Native wrapper - PWA already works well |
| Full Offline Sync | 1-2 weeks | Conflict resolution - very complex |
| Booking Integration | 2-4 weeks | Book flights/hotels - way too complex |
| Group Expense Splitting | 1-2 weeks | Splitwise-style - just use Splitwise |
| Travel Insurance Integration | 2+ weeks | Partner integrations - not worth it |
| Loyalty Program Dashboard | 2-4 weeks | Connect to airline accounts - API access is restricted |
| Keyboard Shortcuts | 1-2 hrs | N=new trip, T=new todo - desktop only |
| Loading Skeletons | 1 hr | Shimmer placeholders - data loads instantly from localStorage |
| Recent Searches | 1 hr | Remember last 5 searches - search is already fast |
| Notes Search | 1-2 hrs | Include block notes in search - maybe useful |
| Quick Add Bar | 2-3 hrs | Floating "+" button - already have FloatingMenu |
| Trip Templates | 3-4 hrs | Save/load templates - how often do people repeat exact trips? |
| Trip Cover Photos | 1-2 hrs | Visual appeal - nice but not functional |
| Block Icons in Lists | 30 min | ✈️🏨🚗 - already have icons on cards |
| Todo Recurring | 2-3 hrs | "Every trip" todos - edge case |

---

## ✅ All Completed Features

### Core (Original)
- Login page with secure credentials
- Main dashboard with clock/date/location
- Today's trips and upcoming trips display
- Trip detail page with inline editing
- Mobile-responsive design
- PDF export
- Calendar view
- Global search

### Phase 1 (Dec 25, 2025)
- Dark/Light theme toggle
- Trip color coding (8 colors)
- Countdown timer
- Todo due dates with color indicators
- Todo priority levels
- Copy confirmation feedback
- Date timezone fix
- Trip sorting by start date

### Phase 1.5 (Dec 25, 2025)
- Kanban todo board (3 columns)
- Todo click-to-edit modal
- Todo color tags
- Logout button
- Notes on all block types

### Phase 2 - Polish (Dec 25, 2025)
- Empty state messages with icons
- Delete confirmation modals
- Date format helpers (formatFriendlyDate, formatRelativeDate)
- Favorite trips (star to pin)
- Hide past trips toggle
- Block duplicate functionality
- Notes on all block types
