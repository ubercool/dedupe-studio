import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dedupe Studio by Toolhacker',
  description: 'Free Alternative to $200/mo Dedupe Tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{fontFamily: 'Open Sans, sans-serif'}}>{children}</body>
    </html>
  )
}
