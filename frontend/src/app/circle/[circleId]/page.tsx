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
import { Copy, Check, Users, ArrowLeft, ShieldCheck, AlertTriangle, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

export default function CircleDetailPage() {
  const { circleId } = useParams<{ circleId: string }>()
  const { t } = useTranslation()
  const { circle, loading: circleLoading } = useCircle(circleId)
  const { groupReport } = useRiskData(circleId)
  const { data: poolData } = useEmergencyPool(circleId)
  const [copied, setCopied] = useState(false)
  const searchParams = useSearchParams()
  const [paymentBanner, setPaymentBanner] = useState<'success' | 'cancelled' | null>(null)

  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') setPaymentBanner('success')
    else if (payment === 'cancelled') setPaymentBanner('cancelled')
  }, [searchParams])

  if (circleLoading) return <PageLoader label="Loading circle..." />
  if (!circle) return <div className="text-center p-12 text-slate-500">Circle not found</div>

  const copyCode = async () => {
    await navigator.clipboard.writeText(circle.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const memberCount = circle.members?.length ?? 0
  const scannedCount = circle.members?.filter(m => m.survey_completed).length ?? 0
  const scanCompletion = memberCount > 0 ? Math.round((scannedCount / memberCount) * 100) : 0
  const poolBalance = poolData?.pool?.total_balance ?? 0
  const monthlyPoolNeed = (poolData?.pool?.target_monthly_per_member ?? 0) * memberCount
  const poolRunwayMonths = monthlyPoolNeed > 0 ? poolBalance / monthlyPoolNeed : 0
  const highRiskMembers = (groupReport?.member_reports ?? []).filter(m => m.risk_score >= 70).length

  return (
    <div className="p-6 lg:p-8">
      {/* Payment result banner */}
      {paymentBanner === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold text-green-800">Payment successful!</p>
              <p className="text-sm text-green-600">Your contribution has been added to the pool.</p>
            </div>
          </div>
          <button onClick={() => setPaymentBanner(null)} className="text-green-400 hover:text-green-600 text-xl font-bold">×</button>
        </div>
      )}
      {paymentBanner === 'cancelled' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between animate-fade-in">
          <p className="text-amber-800 font-medium">Payment cancelled — no charge was made.</p>
          <button onClick={() => setPaymentBanner(null)} className="text-amber-400 hover:text-amber-600 text-xl font-bold">×</button>
        </div>
      )}

      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#CC0000] mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#231F20] to-[#CC0000] rounded-2xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black">{circle.name}</h1>
            {circle.description && <p className="text-slate-300 text-sm mt-1">{circle.description}</p>}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-slate-300 bg-white/10 rounded-lg px-3 py-1.5">
                <Users className="w-4 h-4" />
                {circle.members?.length ?? 0} {t('circle.members')}
              </span>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 border border-white/20">
                <span className="text-xs text-slate-400">{t('circle.inviteCode')}:</span>
                <code className="text-sm font-mono font-bold text-blue-300 uppercase tracking-widest">
                  {circle.invite_code}
                </code>
                <button onClick={copyCode} className="text-slate-400 hover:text-blue-300 transition-colors ml-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
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
        <TabsList className="w-full sm:w-auto flex flex-wrap gap-1 overflow-x-auto">
          <TabsTrigger value="overview">{t('circle.overview')}</TabsTrigger>
          <TabsTrigger value="risk-xray">{t('circle.riskXray')}</TabsTrigger>
          <TabsTrigger value="pool">{t('circle.emergencyPool')}</TabsTrigger>
          <TabsTrigger value="crisis">{t('circle.crisisMode')}</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-lg bg-blue-50 p-2 text-[#2563EB]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">Scan completion</p>
                </div>
                <p className="text-2xl font-black text-slate-900">{scanCompletion}%</p>
                <p className="mt-1 text-xs text-slate-500">{scannedCount}/{memberCount} members scanned</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-lg bg-red-50 p-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">High-risk members</p>
                </div>
                <p className="text-2xl font-black text-slate-900">{highRiskMembers}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {groupReport?.group_risk_score ?? 'N/A'} group score
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">Pool readiness</p>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {monthlyPoolNeed > 0 ? `${poolRunwayMonths.toFixed(1)} months` : 'N/A'}
                </p>
                <p className="mt-1 text-xs text-slate-500">{formatCurrency(poolBalance)} available now</p>
              </div>
            </div>

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
          <PoolTab circleId={circleId} memberCount={memberCount} />
        </TabsContent>

        {/* CRISIS MODE */}
        <TabsContent value="crisis">
          <CrisisTab circleId={circleId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
