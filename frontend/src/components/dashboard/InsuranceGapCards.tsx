'use client'

import { useTranslation } from 'react-i18next'
import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react'
import { formatCurrency, getPriorityColor } from '@/lib/utils'
import type { InsuranceGap } from '@/types'
import { Badge } from '@/components/ui/badge'

interface InsuranceGapCardsProps {
  gaps: InsuranceGap[]
}

const priorityIcon = {
  critical: AlertCircle,
  high: AlertTriangle,
  medium: Info,
}

export default function InsuranceGapCards({ gaps }: InsuranceGapCardsProps) {
  const { t } = useTranslation()

  if (!gaps?.length) {
    return (
      <div className="text-center py-8 text-slate-500">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-green-500" />
        </div>
        <p className="text-sm font-medium text-green-700">No gaps detected!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {gaps.map((gap, idx) => {
        const colors = getPriorityColor(gap.priority)
        const Icon = priorityIcon[gap.priority] || Info
        const priorityLabel = { critical: t('riskXray.critical'), high: t('riskXray.high'), medium: t('riskXray.medium') }[gap.priority]

        return (
          <div
            key={idx}
            className={`rounded-xl border-l-4 ${colors.border} bg-white shadow-sm p-4 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${colors.bg}`}>
                <Icon className={`w-4 h-4 ${colors.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-[#1E293B] text-sm">{gap.title}</h4>
                  <Badge variant={gap.priority === 'critical' ? 'destructive' : gap.priority === 'high' ? 'warning' : 'secondary'}>
                    {priorityLabel}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{gap.description}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="text-xs font-semibold text-red-600">
                    {formatCurrency(gap.risk_amount)} {t('riskXray.atRisk')}
                  </span>
                  {gap.fix_cost_monthly > 0 && (
                    <span className="text-xs font-medium text-green-600">
                      {t('riskXray.fixCost')} {formatCurrency(gap.fix_cost_monthly)}{t('riskXray.perMonth')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
