# Foldr

A trip-based information hub. One place to store and reference all travel info.

## Phase 0: Landing Page ✅

This is the initial landing page deployment to establish the project structure and Vercel deployment.

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
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Landing page component
│   └── globals.css      # Global styles with Tailwind
├── public/              # Static assets (create as needed)
├── build.md             # Product specification
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind configuration
├── next.config.js       # Next.js configuration
└── README.md            # This file
```

## Next Steps (Phase 1)

See [build.md](build.md) for the full product roadmap including:
- Trip management
- Timeline view with various block types (flights, hotels, etc.)
- Offline-first PWA capabilities
- Search functionality

## License

Private project - all rights reserved.
