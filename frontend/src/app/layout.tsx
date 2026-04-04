import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import I18nProvider from '@/components/providers/I18nProvider'
import Navbar from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SafeCircle — Protect Your People',
  description: 'Community-powered financial safety net for families, immigrants, and gig workers',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#F8FAFC]`}>
        <I18nProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </I18nProvider>
      </body>
    </html>
  )
}
