'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Shield, LayoutDashboard, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import LanguageToggle from './LanguageToggle'
import { signOut } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-[#1E293B]">Safe<span className="text-[#2563EB]">Circle</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {user && (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    {t('nav.dashboard')}
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {t('nav.profile')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-bold">
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title={t('nav.signOut')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">{t('nav.signIn')}</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">{t('nav.signUp')}</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 animate-fade-in">
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-sm font-medium">
                <LayoutDashboard className="w-4 h-4" />{t('nav.dashboard')}
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-sm font-medium">
                <User className="w-4 h-4" />{t('nav.profile')}
              </Link>
              <button onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-sm font-medium text-red-600 w-full">
                <LogOut className="w-4 h-4" />{t('nav.signOut')}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className={cn("block px-3 py-2 rounded-lg hover:bg-slate-100 text-sm font-medium")}>
                {t('nav.signIn')}
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium text-center">
                {t('nav.signUp')}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
