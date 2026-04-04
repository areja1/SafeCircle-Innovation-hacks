'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'
import { User, Mail, Shield, LogOut, Globe } from 'lucide-react'
import LanguageToggle from '@/components/layout/LanguageToggle'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()

  if (loading) return <PageLoader />

  if (!user) {
    router.push('/login')
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const fullName = user.user_metadata?.full_name || 'User'
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-[#1E293B] mb-6">{t('nav.profile')}</h1>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
        {/* Avatar header */}
        <div className="bg-gradient-to-br from-[#2563EB] to-blue-700 px-6 py-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-black">
            {initials}
          </div>
          <h2 className="text-xl font-bold">{fullName}</h2>
          <p className="text-blue-200 text-sm mt-0.5">{user.email}</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 py-3 border-b border-slate-50">
            <div className="p-2 bg-slate-50 rounded-lg">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Full Name</p>
              <p className="font-semibold text-[#1E293B]">{fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 border-b border-slate-50">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Mail className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Email</p>
              <p className="font-semibold text-[#1E293B]">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 border-b border-slate-50">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Globe className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Language</p>
              <LanguageToggle />
            </div>
          </div>

          <div className="flex items-center gap-3 py-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Account Status</p>
              <p className="font-semibold text-green-600">Protected ✓</p>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="destructive"
        className="w-full gap-2"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4" />
        {t('nav.signOut')}
      </Button>
    </div>
  )
}
