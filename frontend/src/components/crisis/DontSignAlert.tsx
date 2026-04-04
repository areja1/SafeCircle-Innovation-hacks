'use client'

import { useTranslation } from 'react-i18next'
import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

interface DontSignAlertProps {
  message?: string
}

export default function DontSignAlert({ message }: DontSignAlertProps) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="urgent-pulse bg-red-600 text-white rounded-2xl p-4 flex items-start gap-3 relative">
      <div className="p-1.5 bg-white/20 rounded-lg flex-shrink-0 mt-0.5">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm uppercase tracking-wide">{t('crisis.dontSign')}</p>
        {message && (
          <p className="text-red-100 text-xs mt-1 leading-relaxed">{message}</p>
        )}
        {!message && (
          <p className="text-red-100 text-xs mt-1">
            The first settlement offer is typically 40% below fair value. Get all your facts first.
          </p>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
