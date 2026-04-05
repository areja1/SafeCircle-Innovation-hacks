'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRiskData } from '@/hooks/useRiskData'
import QuestionnaireForm from '@/components/risk-xray/QuestionnaireForm'
import RiskResultsView from '@/components/risk-xray/RiskResultsView'
import GroupRiskMap from '@/components/risk-xray/GroupRiskMap'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { submitRiskSurvey } from '@/lib/api'
import type { SurveyAnswers } from '@/types'
import { Scan, RefreshCw, ShieldAlert, PiggyBank, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface RiskXRayTabProps {
  circleId: string
}

export default function RiskXRayTab({ circleId }: RiskXRayTabProps) {
  const { t } = useTranslation()
  const { report, groupReport, loading, refetch } = useRiskData(circleId)
  const [analyzing, setAnalyzing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)

  const handleSubmit = async (answers: SurveyAnswers) => {
    setAnalyzing(true)
    try {
      await submitRiskSurvey(circleId, answers)
      await refetch()
      setSubmitted(true)
      setShowQuestionnaire(false)
    } catch {
      // handle error
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) return <LoadingSpinner size="lg" label="Loading risk data..." className="py-12" />

  // Show questionnaire
  if (showQuestionnaire || (!report && !loading)) {
    if (analyzing) {
      return (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scan className="w-10 h-10 text-[#2563EB] animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-[#1E293B] mb-2">{t('riskXray.analyzing')}</h3>
          <p className="text-slate-500 text-sm mb-6">{t('riskXray.analysisDesc')}</p>
          <LoadingSpinner size="md" />
        </div>
      )
    }

    if (!report) {
      return (
        <div>
          {!showQuestionnaire ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan className="w-10 h-10 text-[#2563EB]" />
              </div>
              <h2 className="text-2xl font-black text-[#1E293B] mb-3">{t('riskXray.title')}</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">{t('riskXray.subtitle')}</p>
              <Button onClick={() => setShowQuestionnaire(true)} size="lg" className="gap-2">
                <Scan className="w-4 h-4" />
                {t('riskXray.startScan')}
              </Button>
            </div>
          ) : (
            <QuestionnaireForm onSubmit={handleSubmit} loading={analyzing} />
          )}
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Rescan button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowQuestionnaire(true)} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Rescan
        </Button>
      </div>

      {(groupReport || report) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-slate-500">Group risk score</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{groupReport?.group_risk_score ?? 'N/A'}</p>
            <p className="mt-1 text-xs text-slate-500">Higher score means higher vulnerability</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <PiggyBank className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-slate-500">Unclaimed benefits</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(groupReport?.total_unclaimed_benefits ?? 0)}</p>
            <p className="mt-1 text-xs text-slate-500">Estimated support not yet claimed</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-2 text-[#2563EB]">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-slate-500">Members analyzed</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{groupReport?.member_reports?.length ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">Profiles included in this group scan</p>
          </div>
        </div>
      )}

      {/* Individual results */}
      {report && <RiskResultsView report={report} />}

      {/* Group map */}
      {groupReport && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-[#1E293B] mb-4">Group Risk Overview</h3>
          <GroupRiskMap report={groupReport} />
        </div>
      )}

      {showQuestionnaire && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl text-[#1E293B]">Update Your Scan</h2>
                <button onClick={() => setShowQuestionnaire(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
              </div>
              <QuestionnaireForm onSubmit={handleSubmit} loading={analyzing} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
