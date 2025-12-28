# TripFldr

A trip-based information hub. One place to store and reference all travel info instead of digging through emails, screenshots, and notes.

**Status:** ✅ Live at [tripfldr.com](https://tripfldr.com)

## Features

- 🗂️ **Trip Management** - Create, edit, duplicate trips with color coding
- ✈️ **Block Types** - Flights, Hotels, Transport, Work, Notes, Screenshots
- ✅ **Todo System** - Global & trip-specific todos with due dates and priority
- 🔍 **Search** - Global search across all trips and blocks
- 📅 **Calendar View** - Month view of all trips
- 📄 **PDF Export** - Export trip itineraries
- 🌙 **Dark/Light Theme** - Toggle via settings
- ⏱️ **Countdown Timer** - Days until/remaining for trips
- 📱 **Mobile-First** - PWA with offline support

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Deployment to Vercel

1. Push this repository to GitHub
2. Import the project in Vercel
3. Vercel will automatically detect Next.js and configure the build settings
4. Deploy!

## Project Structure

```
foldr/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout with ThemeProvider
│   ├── globals.css        # Global styles + theme variables
│   ├── trips/             # Trip management pages
│   ├── calendar/          # Calendar view
│   ├── search/            # Global search
│   └── backend/           # Image upload tool
├── components/            # Reusable components
├── lib/                   # Utilities & types
├── pages/api/             # API routes (auth, upload)
└── public/                # Static assets & uploads
```

## Documentation

- [build.md](build.md) - Full product specification
- [ROADMAP.md](ROADMAP.md) - Feature roadmap & progress

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + CSS Variables
- **Storage:** localStorage (offline-first)
- **Deployment:** Vercel

## License

Private project - all rights reserved.
