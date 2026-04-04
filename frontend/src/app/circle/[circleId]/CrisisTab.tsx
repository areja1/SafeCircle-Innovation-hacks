'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CrisisSelector from '@/components/crisis/CrisisSelector'
import TriageTimeline from '@/components/crisis/TriageTimeline'
import DontSignAlert from '@/components/crisis/DontSignAlert'
import { startCrisis, completeStep } from '@/lib/api'
import type { CrisisSession, CrisisType } from '@/types'
import { Button } from '@/components/ui/button'
import { Zap, RotateCcw } from 'lucide-react'

export default function CrisisTab({ circleId }: { circleId: string }) {
  const { t } = useTranslation()
  const [session, setSession] = useState<CrisisSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<CrisisType | null>(null)

  const handleSelectCrisis = async (type: CrisisType) => {
    setSelected(type)
    setLoading(true)
    try {
      const res = await startCrisis({ crisis_type: type, state: 'AZ' })
      setSession(res.data)
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  const handleStepComplete = async (stepId: string) => {
    if (!session) return
    try {
      await completeStep(session.id, stepId)
      // Optimistically update
      setSession(prev => prev ? {
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? { ...s, completed: true } : s)
      } : null)
    } catch {
      // ignore
    }
  }

  const resetCrisis = () => {
    setSession(null)
    setSelected(null)
  }

  return (
    <div className="space-y-4">
      {!session ? (
        <>
          {/* Intro */}
          <div className="bg-gradient-to-br from-[#1E293B] to-slate-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-black text-xl">{t('crisis.title')}</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {t('crisis.subtitle')} Every step we give you could save thousands of dollars.
            </p>
          </div>

          <CrisisSelector onSelect={handleSelectCrisis} loading={loading} selected={selected} />
        </>
      ) : (
        <>
          {/* Active session header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-sm text-[#1E293B]">{t('crisis.activeCrisis')}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={resetCrisis} className="gap-1.5 text-slate-500">
              <RotateCcw className="w-3.5 h-3.5" />
              New Crisis
            </Button>
          </div>

          {/* Don't sign alert */}
          <DontSignAlert />

          {/* Timeline */}
          <TriageTimeline session={session} onStepComplete={handleStepComplete} />
        </>
      )}
    </div>
  )
}
