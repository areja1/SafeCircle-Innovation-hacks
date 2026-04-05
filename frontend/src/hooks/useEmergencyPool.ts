'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPool } from '@/lib/api'
import type { EmergencyPool, PoolContribution, FundRequest } from '@/types'

interface PoolData {
  pool: EmergencyPool
  contributions: PoolContribution[]
  requests: FundRequest[]
}

export function useEmergencyPool(circleId: string) {
  const [data, setData] = useState<PoolData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPool = useCallback(async () => {
    if (!circleId) return
    try {
      setLoading(true)
      const res = await getPool(circleId)
      setData(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load pool data')
    } finally {
      setLoading(false)
    }
  }, [circleId])

  useEffect(() => { fetchPool() }, [fetchPool])

  return { data, loading, error, refetch: fetchPool }
}
