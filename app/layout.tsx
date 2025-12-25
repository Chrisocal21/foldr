import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Foldr - Your Trip Information Hub',
  description: 'One place to store and reference all your travel info',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
