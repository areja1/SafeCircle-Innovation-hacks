'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import CrisisSelector from '@/components/crisis/CrisisSelector'
import TriageTimeline from '@/components/crisis/TriageTimeline'
import DontSignAlert from '@/components/crisis/DontSignAlert'
import CrisisFeedbackModal from '@/components/crisis/CrisisFeedbackModal'
import CrisisFeedbackHistory from '@/components/crisis/CrisisFeedbackHistory'
import { startCrisis, completeStep, getCrisisSession } from '@/lib/api'
import type { CrisisSession, CrisisType } from '@/types'
import { Button } from '@/components/ui/button'
import { Zap, RotateCcw, CheckCircle, Clock3, ListChecks, Target } from 'lucide-react'

// Per-circle localStorage key so different circles don't share a session
const sessionKey = (id: string) => `crisis_session_${id}`

export default function CrisisTab({ circleId }: { circleId: string }) {
  const { t } = useTranslation()
  const [session, setSession] = useState<CrisisSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<CrisisType | null>(null)
  const [restoring, setRestoring] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const completedCount = session?.steps.filter(s => s.completed).length ?? 0
  const remainingCount = session ? session.steps.length - completedCount : 0
  const urgentOpenCount = session
    ? session.steps.filter(s => !s.completed && (s.priority === 'red' || s.priority === 'orange')).length
    : 0

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

  // Crisis is over — show feedback modal if not already submitted
  const handleResolved = () => {
    if (session && !session.feedback_submitted) {
      setShowFeedback(true)
    } else {
      // Already submitted or no session, just clear
      finishCrisis()
    }
  }

  const finishCrisis = () => {
    localStorage.removeItem(sessionKey(circleId))
    setSession(null)
    setSelected(null)
    setShowFeedback(false)
  }

  // Start a different crisis without marking current one resolved
  const handleNewCrisis = () => {
    localStorage.removeItem(sessionKey(circleId))
    setSession(null)
    setSelected(null)
    setShowFeedback(false)
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-2 text-[#2563EB]">
                  <Target className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-slate-500">Prediction transparency</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">Category-level estimates</p>
              <p className="mt-1 text-xs text-slate-500">See where suggested money comes from before feedback.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <ListChecks className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-slate-500">Action quality</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">Time-priority checklist</p>
              <p className="mt-1 text-xs text-slate-500">Structured red/orange/yellow/green plan for faster outcomes.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                  <Clock3 className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-slate-500">Continuous improvement</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">Feedback improves future predictions</p>
              <p className="mt-1 text-xs text-slate-500">Your outcomes train better estimates for similar crises.</p>
            </div>
          </div>
          
          {/* Feedback History - Shows when no active crisis */}
          <div className="mt-6">
            <CrisisFeedbackHistory />
          </div>
        </>
      ) : (
        <>
          {/* Feedback Modal - Shows after "Issue Resolved" if not already submitted */}
          {showFeedback && (
            <div className="mb-6">
              <CrisisFeedbackModal
                sessionId={session.id}
                suggestedAmount={session.estimated_savings}
                savingsBreakdown={session.savings_breakdown ?? []}
                crisisType={session.crisis_type}
                onSubmitted={finishCrisis}
              />
            </div>
          )}

          {/* Active session header */}
          {!showFeedback && (
            <>
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
                </div>
              </div>

              {/* Don't sign alert */}
              <DontSignAlert />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="rounded-lg bg-blue-50 p-2 text-[#2563EB]">
                      <ListChecks className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-medium text-slate-500">Checklist progress</p>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{completedCount}/{session.steps.length}</p>
                  <p className="mt-1 text-xs text-slate-500">{remainingCount} steps remaining</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="rounded-lg bg-red-50 p-2 text-red-600">
                      <Clock3 className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-medium text-slate-500">Urgent open steps</p>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{urgentOpenCount}</p>
                  <p className="mt-1 text-xs text-slate-500">Red/orange actions still incomplete</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                      <Target className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-medium text-slate-500">Estimated impact</p>
                  </div>
                  <p className="text-2xl font-black text-slate-900">${session.estimated_savings.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">Potential savings if steps are completed</p>
                </div>
              </div>

              {/* Timeline */}
              <TriageTimeline session={session} onStepComplete={handleStepComplete} />

              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleResolved}
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Issue Resolved
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
