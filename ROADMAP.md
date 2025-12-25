# Foldr - Future Feature Ideas

Based on your current app (trip management, blocks, to-do lists, login, GPS, offline-first), here are enhancement ideas:

---

## 🟢 Quick Wins (1-2 hours each, Easy, Free)

| Feature | Description | Time | Difficulty |
|---------|-------------|------|------------|
| **Dark/Light Theme Toggle** | Add theme switcher in header | 1-2 hrs | Easy |
| **Logout Button** | Clear session from main page | 30 min | Easy |
| **Trip Color Coding** | Assign colors to trips for visual organization | 1-2 hrs | Easy |
| **Countdown Timer** | Show "X days until trip" on upcoming trips | 1 hr | Easy |
| **Due Dates for Todos** | Add optional due dates to tasks | 2 hrs | Easy |
| **Copy Confirmation Numbers** | One-tap copy for all confirmation codes | 1 hr | Easy |
| **Block Reordering** | Drag-and-drop or up/down arrows | 2-3 hrs | Easy |
| **Notes Field on All Blocks** | Already partially there, ensure consistency | 1 hr | Easy |

---

## 🟡 Medium Features (4-8 hours each, Moderate, Free-Low Cost)

| Feature | Description | Time | Difficulty | Cost |
|---------|-------------|------|------------|------|
| **Weather Widget** | Show weather at destination using free API | 4-6 hrs | Medium | Free (OpenWeatherMap) |
| **Currency Converter** | Quick conversion tool for travel | 3-4 hrs | Medium | Free |
| **Packing List** | Checklist per trip with templates | 4-6 hrs | Medium | Free |
| **Trip Sharing (Read-only Link)** | Generate shareable URL for trip details | 6-8 hrs | Medium | Free |
| **Expense Tracker** | Log expenses per trip with totals | 6-8 hrs | Medium | Free |
| **Document Storage** | Upload/attach PDFs (boarding passes, etc.) | 6-8 hrs | Medium | Storage costs |
| **Time Zone Display** | Show local time at destination | 2-3 hrs | Easy | Free |
| **Flight Status API** | Real-time flight tracking | 6-8 hrs | Medium | $0-50/mo (FlightAware) |
| **Push Notifications** | Reminders for upcoming events | 6-8 hrs | Medium | Free (PWA) |
| **Import from Email** | Parse confirmation emails for auto-fill | 8+ hrs | Hard | Free |

---

## 🟠 Major Features (1-3 days each, Hard, Variable Cost)

| Feature | Description | Time | Difficulty | Cost |
|---------|-------------|------|------------|------|
| **Cloud Sync (Supabase/Firebase)** | Sync across devices, backup data | 2-3 days | Hard | $0-25/mo |
| **Multi-User Support** | Separate accounts, proper auth | 2-3 days | Hard | Auth service ($0-10/mo) |
| **Shared Trips** | Collaborate with travel companions | 3-4 days | Hard | Requires cloud |
| **Calendar Integration** | Export to Google/Apple Calendar | 1-2 days | Medium | Free |
| **Maps Integration** | Show locations on map, directions | 1-2 days | Medium | Free (Leaflet) or paid (Google) |
| **AI Trip Planner** | Suggest itineraries based on destination | 2-3 days | Hard | $5-50/mo (OpenAI API) |
| **OCR for Screenshots** | Extract text from uploaded images | 1-2 days | Medium | Free (Tesseract) or $5/mo |
| **Offline Map Caching** | Download maps for offline use | 2-3 days | Hard | Free |
| **Travel Rewards Tracking** | Track airline miles, hotel points | 2-3 days | Medium | Free |
| **Native Mobile App** | React Native or Capacitor wrapper | 1-2 weeks | Hard | $99/yr (Apple Dev) |

---

## 🔴 Advanced/Long-Term (1+ weeks, Expert, Higher Cost)

| Feature | Description | Time | Difficulty | Cost |
|---------|-------------|------|------------|------|
| **Full Offline Sync** | IndexedDB + Service Worker + conflict resolution | 1-2 weeks | Expert | Free |
| **Booking Integration** | Book flights/hotels directly | 2-4 weeks | Expert | Affiliate revenue |
| **Group Expense Splitting** | Splitwise-style for group trips | 1-2 weeks | Hard | Free |
| **Travel Insurance Integration** | Partner with insurance providers | 2+ weeks | Hard | Revenue share |
| **Loyalty Program Dashboard** | Connect to airline/hotel accounts | 2-4 weeks | Expert | API fees vary |

---

## 📱 Mobile-Specific Enhancements

| Feature | Time | Difficulty |
|---------|------|------------|
| **Pull-to-Refresh** | 1 hr | Easy |
| **Swipe Actions** (delete, complete) | 2-3 hrs | Medium |
| **Haptic Feedback** | 1 hr | Easy |
| **Add to Home Screen Prompt** | 1-2 hrs | Easy |
| **Share Sheet Integration** | 2-3 hrs | Medium |
| **Camera for Screenshots** | 3-4 hrs | Medium |

---

## 💡 Recommended Priority Order

### Phase 1 (This Week)
1. Logout button
2. Trip countdown
3. Copy confirmation numbers
4. Due dates for todos

### Phase 2 (Next 2 Weeks)
1. Weather widget
2. Packing list
3. Expense tracker
4. Time zone display

### Phase 3 (Next Month)
1. Cloud sync (Supabase)
2. Calendar export
3. Maps integration
4. Push notifications

---

## ✅ Completed Features
- [x] Login page with secure credentials
- [x] Main dashboard with clock/date/location
- [x] Today's trips display
- [x] Upcoming trips display
- [x] To-do list with trip tagging
- [x] Trip detail page with inline editing
- [x] Mobile-responsive design
- [x] PDF export
- [x] Block types: Flight, Hotel, Layover, Transport, Work, Screenshot, Note
