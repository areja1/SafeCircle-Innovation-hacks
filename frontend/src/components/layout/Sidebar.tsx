'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Users, Shield, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { href: '/profile', icon: User, labelKey: 'nav.profile' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-white border-r border-slate-100 pt-4 pb-8 px-3">
      <nav className="space-y-1">
        {navItems.map(({ href, icon: Icon, labelKey }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              pathname === href
                ? "bg-blue-50 text-[#2563EB]"
                : "text-slate-600 hover:bg-slate-50 hover:text-[#1E293B]"
            )}
          >
            <Icon className={cn("w-4 h-4", pathname === href ? "text-[#2563EB]" : "text-slate-400")} />
            {t(labelKey)}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
