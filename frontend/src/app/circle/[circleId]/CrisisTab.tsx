'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import CrisisSelector from '@/components/crisis/CrisisSelector'
import TriageTimeline from '@/components/crisis/TriageTimeline'
import DontSignAlert from '@/components/crisis/DontSignAlert'
import { startCrisis, completeStep, getCrisisSession } from '@/lib/api'
import type { CrisisSession, CrisisType } from '@/types'
import { Button } from '@/components/ui/button'
import { Zap, RotateCcw, CheckCircle } from 'lucide-react'

// Per-circle localStorage key so different circles don't share a session
const sessionKey = (id: string) => `crisis_session_${id}`

export default function CrisisTab({ circleId }: { circleId: string }) {
  const { t } = useTranslation()
  const [session, setSession] = useState<CrisisSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<CrisisType | null>(null)
  const [restoring, setRestoring] = useState(true)

  // On mount: check localStorage for an active session and restore it from the backend
  useEffect(() => {
    const savedId = localStorage.getItem(sessionKey(circleId))
    if (!savedId) {
      setRestoring(false)
      return
    }
    getCrisisSession(savedId)
      .then(res => setSession(res.data))
      .catch(() => {
        // Session gone or invalid — clear stale key
        localStorage.removeItem(sessionKey(circleId))
      })
      .finally(() => setRestoring(false))
  }, [circleId])

  const handleSelectCrisis = async (type: CrisisType) => {
    setSelected(type)
    setLoading(true)
    try {
      const res = await startCrisis({ crisis_type: type, state: 'AZ' })
      setSession(res.data)
      // Persist so session survives tab switches and page refreshes
      localStorage.setItem(sessionKey(circleId), res.data.id)
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
      setSession(prev => prev ? {
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? { ...s, completed: true } : s)
      } : null)
    } catch {
      // ignore
    }
  }

  // Crisis is over — clear persistence and return to selector
  const handleResolved = () => {
    localStorage.removeItem(sessionKey(circleId))
    setSession(null)
    setSelected(null)
  }

  // Start a different crisis without marking current one resolved
  const handleNewCrisis = () => {
    localStorage.removeItem(sessionKey(circleId))
    setSession(null)
    setSelected(null)
  }

  if (restoring) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm">
        Checking for active crisis...
      </div>
    )
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-sm text-[#1E293B]">{t('crisis.activeCrisis')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewCrisis}
                className="gap-1.5 text-slate-500"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Crisis
              </Button>
              <Button
                size="sm"
                onClick={handleResolved}
                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Issue Resolved
              </Button>
            </div>
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
