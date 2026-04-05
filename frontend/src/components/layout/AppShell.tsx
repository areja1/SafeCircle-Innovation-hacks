'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

const PUBLIC_ROUTES = ['/', '/login', '/signup']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.includes(pathname)

  if (isPublic) return <>{children}</>

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-[#F1F5F9] dark:bg-slate-950 transition-colors">
        {children}
      </main>
    </div>
  )
}
