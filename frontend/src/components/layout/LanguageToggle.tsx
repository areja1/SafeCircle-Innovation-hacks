'use client'

import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LanguageToggle({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  const isES = i18n.language === 'es'

  const toggle = () => {
    const newLang = isES ? 'en' : 'es'
    i18n.changeLanguage(newLang)
    localStorage.setItem('lang', newLang)
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors",
        className
      )}
      title="Toggle language"
    >
      <Globe className="w-4 h-4" />
      <span className="font-bold">{isES ? 'ES' : 'EN'}</span>
      <span className="text-slate-400">|</span>
      <span className="text-slate-400">{isES ? 'EN' : 'ES'}</span>
    </button>
  )
}
