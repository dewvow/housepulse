import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HousePulse - Real Estate Market Research',
  description: 'Find investment properties in Australia by state, suburb, price and rental yield',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
