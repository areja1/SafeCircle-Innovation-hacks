'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Shield, Menu, X, Bell, ChevronDown, LogOut, User, LayoutDashboard, DollarSign, Vote, CheckCircle, XCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import LanguageToggle from './LanguageToggle'
import { signOut } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications, type Notification } from '@/hooks/useNotifications'

export default function Navbar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount } = useNotifications(!!user)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isPublic = ['/', '/login', '/signup'].includes(pathname)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Account'
  const initials = firstName[0].toUpperCase()

  return (
    <nav className="sticky top-0 z-50 h-16 bg-white border-b border-slate-200 shadow-sm">
      <div className="h-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

        {/* Left: Logo */}
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-8 h-8 bg-[#CC0000] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg text-[#1E293B] hidden sm:block">
            Safe<span className="text-[#CC0000]">Circle</span>
          </span>
        </Link>

        {/* Center: Page title for authenticated / nav links for public */}
        {user && !isPublic ? (
          <div className="hidden md:flex flex-1 items-center px-4">
            <div className="h-5 w-px bg-slate-200 mr-4" />
            <span className="text-sm text-slate-400 font-medium">
              {pathname === '/dashboard' && 'Dashboard'}
              {pathname.startsWith('/circle/') && !pathname.endsWith('/circle/') && 'Circle'}
              {pathname === '/profile' && 'Profile'}
            </span>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center gap-6">
            {[
              { label: 'Features', href: '/#features' },
              { label: 'For Gig Workers', href: '/#who' },
              { label: 'Crisis Mode', href: '/#crisis' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="text-sm font-medium text-slate-500 hover:text-[#2563EB] transition-colors">
                {label}
              </a>
            ))}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <LanguageToggle />

          {user ? (
            <>
              {/* Notification bell */}
              <div ref={bellRef} className="relative hidden md:block">
                <button
                  onClick={() => setBellOpen(!bellOpen)}
                  className="flex p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl animate-fade-in z-50">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1E293B]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto py-1">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">No notifications yet</p>
                      ) : (
                        notifications.map((n: Notification) => (
                          <Link
                            key={n.id}
                            href={`/circle/${n.circle_id}`}
                            onClick={() => setBellOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                          >
                            <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              n.type === 'contribution' ? 'bg-green-100' :
                              n.type === 'fund_request' ? 'bg-amber-100' :
                              n.type === 'request_approved' ? 'bg-blue-100' :
                              'bg-red-100'
                            }`}>
                              {n.type === 'contribution' && <DollarSign className="w-3.5 h-3.5 text-green-600" />}
                              {n.type === 'fund_request' && <Vote className="w-3.5 h-3.5 text-amber-600" />}
                              {n.type === 'request_approved' && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                              {n.type === 'request_denied' && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-[#1E293B] leading-snug">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(n.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#CC0000] to-[#A50000] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-[#1E293B]">{firstName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 animate-fade-in">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-semibold text-[#1E293B]">{firstName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#1E293B] transition-colors">
                      <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                    </Link>
                    <Link href="/profile" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#1E293B] transition-colors">
                      <User className="w-3.5 h-3.5" /> Profile
                    </Link>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button onClick={handleSignOut}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                        <LogOut className="w-3.5 h-3.5" /> {t('nav.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile toggle */}
              <button className="md:hidden p-2 rounded-xl hover:bg-slate-100" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">{t('nav.signIn')}</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="shadow-sm">{t('nav.signUp')}</Button>
                </Link>
              </div>
              <button className="md:hidden p-2 rounded-xl hover:bg-slate-100" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 animate-fade-in shadow-lg">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#CC0000] to-[#A50000] flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">{firstName}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-sm font-medium">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-sm font-medium">
                <User className="w-4 h-4" /> Profile
              </Link>
              <button onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 text-sm font-medium text-red-500 w-full">
                <LogOut className="w-4 h-4" /> {t('nav.signOut')}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-xl hover:bg-slate-100 text-sm font-medium">
                {t('nav.signIn')}
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-medium text-center">
                {t('nav.signUp')}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
