import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import I18nProvider from '@/components/providers/I18nProvider'
import Navbar from '@/components/layout/Navbar'
import AppShell from '@/components/layout/AppShell'
import ChatWidget from '@/components/chat/ChatWidget'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SafeCircle - Protect Your People',
  description: 'Community-powered financial safety net for families, immigrants, and gig workers',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <I18nProvider>
          <Navbar />
          <AppShell>
            {children}
          </AppShell>
          <ChatWidget />
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  )
}
