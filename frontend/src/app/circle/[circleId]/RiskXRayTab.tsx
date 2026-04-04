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
import { Scan, RefreshCw } from 'lucide-react'

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
