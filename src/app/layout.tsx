import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from './components/SessionProvider'

export const metadata: Metadata = {
  title: 'Alti Team',
  description: 'Team management application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}