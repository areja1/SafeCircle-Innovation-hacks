'use client'

import { useTranslation } from 'react-i18next'
import ActionCard from './ActionCard'
import { formatCurrency } from '@/lib/utils'
import type { CrisisSession, TriageStep } from '@/types'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TriageTimelineProps {
  session: CrisisSession
  onStepComplete: (stepId: string) => void
}

const PRIORITY_ORDER: TriageStep['priority'][] = ['red', 'orange', 'yellow', 'green']

const SECTION_CONFIG = {
  red: {
    label: '🔴 Do Now (0–4 hours)',
    bg: 'bg-red-600',
    text: 'text-white',
    desc: 'Critical — every hour matters',
  },
  orange: {
    label: '🟠 Do Today (4–24 hours)',
    bg: 'bg-orange-500',
    text: 'text-white',
    desc: 'Important — protect your income & coverage',
  },
  yellow: {
    label: '🟡 Do This Week (24–72 hours)',
    bg: 'bg-amber-400',
    text: 'text-white',
    desc: 'File paperwork & start the process',
  },
  green: {
    label: '🟢 Recovery Phase (1–4 weeks)',
    bg: 'bg-green-600',
    text: 'text-white',
    desc: 'Long-term planning & settlement',
  },
}

export default function TriageTimeline({ session, onStepComplete }: TriageTimelineProps) {
  const { t } = useTranslation()
  const completedCount = session.steps.filter(s => s.completed).length

  const stepsByPriority = PRIORITY_ORDER.reduce((acc, p) => {
    acc[p] = session.steps.filter(s => s.priority === p)
    return acc
  }, {} as Record<TriageStep['priority'], TriageStep[]>)

  return (
    <div className="space-y-6">
      {/* Savings banner */}
      {session.estimated_savings > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white flex items-center gap-3">
          <TrendingUp className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-black text-lg">{formatCurrency(session.estimated_savings)} saved</p>
            <p className="text-green-100 text-xs">{t('crisis.estimatedSavings')}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-black">{completedCount}/{session.steps.length}</p>
            <p className="text-green-100 text-xs">steps done</p>
          </div>
        </div>
      )}

      {/* Timeline sections */}
      {PRIORITY_ORDER.map(priority => {
        const steps = stepsByPriority[priority]
        if (!steps?.length) return null
        const config = SECTION_CONFIG[priority]

        return (
          <div key={priority}>
            {/* Section header */}
            <div className={cn("px-4 py-3 rounded-t-xl flex items-center justify-between", config.bg)}>
              <div>
                <p className={cn("font-bold text-sm", config.text)}>{config.label}</p>
                <p className={cn("text-xs opacity-80", config.text)}>{config.desc}</p>
              </div>
              <span className={cn("text-xs font-bold px-2.5 py-1 bg-white/20 rounded-full", config.text)}>
                {steps.filter(s => s.completed).length}/{steps.length} done
              </span>
            </div>

            {/* Steps */}
            <div className="space-y-2 bg-slate-50 rounded-b-xl p-3">
              {steps.map((step, idx) => (
                <ActionCard
                  key={step.id}
                  step={step}
                  crisisStartedAt={session.started_at}
                  onComplete={onStepComplete}
                  index={idx}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
