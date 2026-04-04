'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRiskReport, getGroupRiskSummary } from '@/lib/api'
import type { RiskReport, GroupRiskReport } from '@/types'

export function useRiskData(circleId: string) {
  const [report, setReport] = useState<RiskReport | null>(null)
  const [groupReport, setGroupReport] = useState<GroupRiskReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!circleId) return
    try {
      setLoading(true)
      const [reportRes, groupRes] = await Promise.all([
        getRiskReport(circleId),
        getGroupRiskSummary(circleId),
      ])
      setReport(reportRes.data)
      setGroupReport(groupRes.data)
    } catch {
      setError('Failed to load risk data')
    } finally {
      setLoading(false)
    }
  }, [circleId])

  useEffect(() => { fetchData() }, [fetchData])

  return { report, groupReport, loading, error, refetch: fetchData }
}
