import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme-context'
import { SettingsProvider } from '@/lib/settings-context'
import { OfflineBanner } from '@/components/OfflineIndicator'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Foldr - Your Trip Information Hub',
  description: 'One place to store and reference all your travel info',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Foldr'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} dark-theme`}>
      <head>
        <link rel="icon" href="/logos/favicon.ico" sizes="any" />
        <link rel="icon" href="/logos/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logos/apple-touch-icon.png" />
        <link rel="preconnect" href="https://nominatim.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://nominatim.openstreetmap.org" />
        <link rel="preconnect" href="https://api.open-meteo.com" />
      </head>
      <body className={`${inter.className} theme-bg-primary`}>
        <ThemeProvider>
          <SettingsProvider>
            <OfflineBanner />
            {children}
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
