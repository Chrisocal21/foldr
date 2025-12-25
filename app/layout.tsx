import type { Metadata, Viewport } from 'next'
import './globals.css'

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
    <html lang="en">
      <head>
        <link rel="icon" href="/logos/favicon.ico" sizes="any" />
        <link rel="icon" href="/logos/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logos/apple-touch-icon.png" />
      </head>
      <body className="bg-slate-900">{children}</body>
    </html>
  )
}
