'use client'

import { useTranslation } from 'react-i18next'
import GroupRiskScore from '@/components/dashboard/GroupRiskScore'
import InsuranceGapCards from '@/components/dashboard/InsuranceGapCards'
import UnclaimedBenefits from '@/components/dashboard/UnclaimedBenefits'
import { formatCurrency } from '@/lib/utils'
import type { RiskReport } from '@/types'
import { Brain, TrendingDown, ShieldAlert } from 'lucide-react'
import StatCard from '@/components/shared/StatCard'

interface RiskResultsViewProps {
  report: RiskReport
}

export default function RiskResultsView({ report }: RiskResultsViewProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Score + stats row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex-shrink-0">
          <GroupRiskScore
            score={report.risk_score}
            label={t('riskXray.yourScore')}
            size="md"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1 w-full">
          <StatCard
            title={t('riskXray.gapsFound')}
            value={report.gaps?.length ?? 0}
            icon={ShieldAlert}
            iconColor="text-red-500"
            iconBg="bg-red-50"
          />
          <StatCard
            title={t('riskXray.hiddenCosts')}
            value={formatCurrency(report.poverty_tax_annual)}
            subtitle="per year"
            icon={TrendingDown}
            iconColor="text-orange-500"
            iconBg="bg-orange-50"
          />
          <StatCard
            title={t('riskXray.unclaimed')}
            value={formatCurrency(report.benefits_eligible?.reduce((s, b) => s + b.estimated_value, 0) ?? 0)}
            subtitle="available yearly"
            icon={Brain}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
        </div>
      </div>

      {/* AI Narrative */}
      {report.ai_analysis && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-[#2563EB] rounded-lg">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-[#1E293B]">AI Analysis</h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Powered by Claude</span>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed space-y-2">
            {report.ai_analysis.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* Gaps */}
      {report.gaps?.length > 0 && (
        <div>
          <h3 className="font-bold text-[#1E293B] mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            Your Financial Blind Spots
          </h3>
          <InsuranceGapCards gaps={report.gaps} />
        </div>
      )}

      {/* Benefits */}
      {report.benefits_eligible?.length > 0 && (
        <UnclaimedBenefits benefits={report.benefits_eligible} />
      )}
    </div>
  )
}
