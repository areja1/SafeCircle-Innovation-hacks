'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Target, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface AccuracyMetrics {
  total_feedbacks: number
  accurate_count: number
  accuracy_percentage: number
  avg_suggested?: number
  avg_actual?: number
  got_nothing_percentage: number
  message?: string
}

interface CrisisAccuracyBadgeProps {
  crisisType?: string
  state?: string
  compact?: boolean
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

export default function CrisisAccuracyBadge({
  crisisType,
  state,
  compact = false,
}: CrisisAccuracyBadgeProps) {
  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [crisisType, state])

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('supabase_token')
      const params = new URLSearchParams()
      if (crisisType) params.append('crisis_type', crisisType)
      if (state) params.append('state', state)

      const endpoint = crisisType || state 
        ? `/crisis/metrics/accuracy?${params}`
        : '/crisis/metrics/overall'

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      const data = await response.json()
      const gotNothingPct = Math.min(100, Math.max(0, toFiniteNumber(data?.got_nothing_percentage, 0)))

      setMetrics({
        total_feedbacks: toFiniteNumber(data?.total_feedbacks, 0),
        accurate_count: toFiniteNumber(data?.accurate_count, 0),
        accuracy_percentage: Math.min(100, Math.max(0, toFiniteNumber(data?.accuracy_percentage, 0))),
        avg_suggested: data?.avg_suggested !== undefined ? toFiniteNumber(data.avg_suggested, 0) : undefined,
        avg_actual: data?.avg_actual !== undefined ? toFiniteNumber(data.avg_actual, 0) : undefined,
        got_nothing_percentage: gotNothingPct,
        message: data?.message,
      })
    } catch (error) {
      console.error('Error fetching accuracy metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-24 w-full" />
  }

  if (!metrics || metrics.total_feedbacks === 0) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Building trust through transparency</p>
              <p className="text-xs text-gray-600">
                Your feedback helps improve predictions for everyone
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const accuracyPct = Math.min(100, Math.max(0, toFiniteNumber(metrics.accuracy_percentage, 0)))
  const gotHelpPct = Math.min(100, Math.max(0, 100 - toFiniteNumber(metrics.got_nothing_percentage, 0)))

  const accuracyColor = 
    accuracyPct >= 80 ? 'text-green-600' :
    accuracyPct >= 60 ? 'text-yellow-600' :
    'text-orange-600'

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          <span className={accuracyColor}>{accuracyPct}%</span> accurate
        </Badge>
        <span className="text-xs text-gray-500">
          ({metrics.total_feedbacks} verified)
        </span>
      </div>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Community-Verified Accuracy
        </CardTitle>
        <CardDescription>
          Real outcomes from people in similar situations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${accuracyColor}`}>
              {accuracyPct}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Accurate</p>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {metrics.total_feedbacks}
            </div>
            <p className="text-xs text-gray-600 mt-1">Verified Cases</p>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {gotHelpPct}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Got Help</p>
          </div>
        </div>

        {metrics.avg_suggested && metrics.avg_actual && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-600">Avg. Suggested</p>
                <p className="font-semibold">${Math.round(metrics.avg_suggested).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">Avg. Actual</p>
                <p className="font-semibold">${Math.round(metrics.avg_actual).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
          <Users className="h-3 w-3" />
          <span>Powered by community feedback • Updated in real-time</span>
        </div>
      </CardContent>
    </Card>
  )
}
