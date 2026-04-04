'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCircles, getCircle } from '@/lib/api'
import type { Circle } from '@/types'

export function useCircles() {
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCircles = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getCircles()
      setCircles(res.data)
    } catch {
      setError('Failed to load circles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCircles() }, [fetchCircles])

  return { circles, loading, error, refetch: fetchCircles }
}

export function useCircle(circleId: string) {
  const [circle, setCircle] = useState<Circle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCircle = useCallback(async () => {
    if (!circleId) return
    try {
      setLoading(true)
      const res = await getCircle(circleId)
      setCircle(res.data)
    } catch {
      setError('Failed to load circle')
    } finally {
      setLoading(false)
    }
  }, [circleId])

  useEffect(() => { fetchCircle() }, [fetchCircle])

  return { circle, loading, error, refetch: fetchCircle }
}
