'use client'

import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useCircle } from '@/hooks/useCircle'
import { useRiskData } from '@/hooks/useRiskData'
import { useEmergencyPool } from '@/hooks/useEmergencyPool'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import GroupRiskScore from '@/components/dashboard/GroupRiskScore'
import MemberRiskCards from '@/components/dashboard/MemberRiskCards'
import InsuranceGapCards from '@/components/dashboard/InsuranceGapCards'
import UnclaimedBenefits from '@/components/dashboard/UnclaimedBenefits'
import PovertyTaxMeter from '@/components/dashboard/PovertyTaxMeter'
import EmergencyPoolWidget from '@/components/dashboard/EmergencyPoolWidget'
import RiskXRayTab from './RiskXRayTab'
import PoolTab from './PoolTab'
import CrisisTab from './CrisisTab'
import { Copy, Check, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function CircleDetailPage() {
  const { circleId } = useParams<{ circleId: string }>()
  const { t } = useTranslation()
  const { circle, loading: circleLoading } = useCircle(circleId)
  const { groupReport } = useRiskData(circleId)
  const { data: poolData } = useEmergencyPool(circleId)
  const [copied, setCopied] = useState(false)

  if (circleLoading) return <PageLoader label="Loading circle..." />
  if (!circle) return <div className="text-center p-12 text-slate-500">Circle not found</div>

  const copyCode = async () => {
    await navigator.clipboard.writeText(circle.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2563EB] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-[#1E293B]">{circle.name}</h1>
            {circle.description && <p className="text-slate-500 text-sm mt-1">{circle.description}</p>}
            <div className="flex items-center gap-3 mt-3">
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <Users className="w-4 h-4" />
                {circle.members?.length ?? 0} {t('circle.members')}
              </span>
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1">
                <span className="text-xs text-slate-400">{t('circle.inviteCode')}:</span>
                <code className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-widest">
                  {circle.invite_code}
                </code>
                <button onClick={copyCode} className="text-slate-400 hover:text-[#2563EB] transition-colors ml-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {groupReport && (
            <GroupRiskScore
              score={groupReport.group_risk_score}
              label={t('riskXray.groupScore')}
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto flex overflow-x-auto">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">{t('circle.overview')}</TabsTrigger>
          <TabsTrigger value="risk-xray" className="flex-1 sm:flex-none">{t('circle.riskXray')}</TabsTrigger>
          <TabsTrigger value="pool" className="flex-1 sm:flex-none">{t('circle.emergencyPool')}</TabsTrigger>
          <TabsTrigger value="crisis" className="flex-1 sm:flex-none">{t('circle.crisisMode')}</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Members */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-[#1E293B] mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2563EB]" />
                {t('circle.members')} ({circle.members?.length})
              </h3>
              <MemberRiskCards members={circle.members ?? []} />
            </div>

            {/* Risk gaps */}
            {(groupReport?.member_reports?.[0]?.gaps?.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-bold text-[#1E293B] mb-4">Top Insurance Gaps</h3>
                <InsuranceGapCards gaps={(groupReport?.member_reports?.[0]?.gaps ?? []).slice(0, 3)} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Poverty tax */}
              {groupReport?.member_reports?.[0]?.poverty_tax_annual && (
                <PovertyTaxMeter data={{
                  total_annual: groupReport.total_poverty_tax,
                  items: [],
                }} />
              )}

              {/* Pool widget */}
              {poolData?.pool && (
                <EmergencyPoolWidget
                  pool={poolData.pool}
                  circleId={circleId}
                  memberCount={circle.members?.length}
                />
              )}
            </div>

            {/* Benefits */}
            {(groupReport?.member_reports?.[0]?.benefits_eligible?.length ?? 0) > 0 && (
              <UnclaimedBenefits
                benefits={groupReport?.member_reports?.[0]?.benefits_eligible ?? []}
                totalValue={groupReport?.total_unclaimed_benefits}
              />
            )}
          </div>
        </TabsContent>

        {/* RISK X-RAY */}
        <TabsContent value="risk-xray">
          <RiskXRayTab circleId={circleId} />
        </TabsContent>

        {/* EMERGENCY POOL */}
        <TabsContent value="pool">
          <PoolTab circleId={circleId} />
        </TabsContent>

        {/* CRISIS MODE */}
        <TabsContent value="crisis">
          <CrisisTab circleId={circleId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
