'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, CheckCircle2, Circle, ExternalLink } from 'lucide-react'
import { formatCurrency, getPriorityColor } from '@/lib/utils'
import type { TriageStep } from '@/types'
import DeadlineTracker from './DeadlineTracker'
import { cn } from '@/lib/utils'

interface ActionCardProps {
  step: TriageStep
  crisisStartedAt: string
  onComplete: (stepId: string) => void
  index: number
}

export default function ActionCard({ step, crisisStartedAt, onComplete, index }: ActionCardProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const colors = getPriorityColor(step.priority)

  return (
    <div
      className={cn(
        "rounded-xl border-l-4 bg-white shadow-sm overflow-hidden transition-all",
        colors.border,
        step.priority === 'red' && !step.completed && "urgent-pulse"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Step number / check */}
        <button
          onClick={(e) => { e.stopPropagation(); if (!step.completed) onComplete(step.id) }}
          className="flex-shrink-0"
        >
          {step.completed ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : (
            <Circle className="w-6 h-6 text-slate-300 hover:text-green-400 transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", colors.badge)}>
              {step.time_window}
            </span>
            {step.deadline_hours && !step.completed && (
              <DeadlineTracker crisisStartedAt={crisisStartedAt} deadlineHours={step.deadline_hours} />
            )}
          </div>
          <h4 className={cn(
            "font-bold text-[#1E293B] mt-1 text-sm leading-snug",
            step.completed && "line-through text-slate-400"
          )}>
            {index + 1}. {step.title}
          </h4>
        </div>

        <div className="flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className={cn("px-4 pb-4 border-t border-slate-100 pt-3", colors.bg)}>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">{step.description}</p>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide w-24 flex-shrink-0">Why matters:</span>
              <p className="text-xs text-slate-600">{step.why_it_matters}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide w-24 flex-shrink-0">If skipped:</span>
              <span className="text-xs font-bold text-red-600">{formatCurrency(step.cost_of_not_doing)} lost</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {step.action_url && (
              <a
                href={step.action_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
              >
                Take action <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {!step.completed && (
              <button
                onClick={() => onComplete(step.id)}
                className="ml-auto inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('crisis.markDone')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
