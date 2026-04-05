'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, User, Shield, LogOut, ChevronRight, Plus, Zap, BookOpen, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useCircles } from '@/hooks/useCircle'
import { signOut } from '@/lib/auth'
import { getRiskColor } from '@/lib/utils'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { circles } = useCircles()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'You'

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-full bg-[#231F20] text-white flex-shrink-0">
      {/* Branding */}
      <div className="px-5 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-[#CC0000] rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg">Safe<span className="text-[#CC0000]">Circle</span></span>
        </div>
        <p className="text-[11px] text-slate-500 ml-10">Financial safety net</p>
      </div>

      {/* Main nav */}
      <div className="px-3 pt-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Navigation</p>
        <nav className="space-y-0.5">
          {[
            { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
            { href: '/passbook', icon: BookOpen, label: 'Passbook' },
            { href: '/analytics', icon: BarChart2, label: 'Analytics' },
            { href: '/profile', icon: User, label: t('nav.profile') },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                pathname === href
                  ? "bg-[#CC0000] text-white shadow-lg shadow-red-900/40"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Circles quick access */}
      <div className="px-3 pt-5 flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Circles</p>
          <Link href="/dashboard" className="text-slate-500 hover:text-blue-400 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-0.5 overflow-y-auto max-h-48">
          {circles.length === 0 ? (
            <p className="text-xs text-slate-600 px-3 py-2">No circles yet</p>
          ) : (
            circles.map(circle => {
              const isActive = pathname.startsWith(`/circle/${circle.id}`)
              const score = circle.group_risk_score
              return (
                <Link
                  key={circle.id}
                  href={`/circle/${circle.id}`}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all group",
                    isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ backgroundColor: score ? getRiskColor(score) : '#CC0000' }}
                  >
                    {circle.name[0].toUpperCase()}
                  </div>
                  <span className="truncate flex-1 text-xs font-medium">{circle.name}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Crisis mode shortcut */}
      <div className="px-3 py-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-300">Crisis Mode</p>
            <p className="text-[10px] text-red-400/70">Open a circle to activate</p>
          </div>
        </div>
      </div>

      {/* User info + sign out */}
      <div className="px-3 pb-5 pt-2 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-[#CC0000] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg">
            {firstName[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{firstName}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
