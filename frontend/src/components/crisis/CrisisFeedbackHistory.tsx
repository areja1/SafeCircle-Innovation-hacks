'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, DollarSign, Calendar, MessageSquare } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface FeedbackHistoryItem {
  id: string
  crisis_type: string
  state: string
  suggested_amount: number
  was_accurate: boolean
  actual_amount?: number
  got_nothing: boolean
  feedback_notes?: string
  category_feedback?: Array<{
    category: string
    category_label: string
    suggested_amount: number
    received: boolean
    actual_amount?: number | null
    notes?: string
  }>
  created_at: string
}

const CRISIS_TYPE_LABELS: Record<string, string> = {
  'job_loss': 'Job Loss',
  'medical_emergency': 'Medical Emergency',
  'home_damage': 'Home Damage',
  'car_accident': 'Car Accident',
  'death_in_family': 'Death in Family',
}

export default function CrisisFeedbackHistory() {
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeedbackHistory()
  }, [])

  const loadFeedbackHistory = async () => {
    try {
      const token = localStorage.getItem('supabase_token')
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/crisis/feedback/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFeedbackHistory(data)
      }
    } catch (error) {
      console.error('Failed to load feedback history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Feedback History</CardTitle>
          <CardDescription>Track what we suggested vs. what you actually received</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (feedbackHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Feedback History</CardTitle>
          <CardDescription>Track what we suggested vs. what you actually received</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No feedback yet. Complete a crisis and provide feedback to see your history here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Feedback History</CardTitle>
        <CardDescription>
          Track what we suggested vs. what you actually received ({feedbackHistory.length} {feedbackHistory.length === 1 ? 'crisis' : 'crises'})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedbackHistory.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-accent/5 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">
                    {CRISIS_TYPE_LABELS[item.crisis_type] || item.crisis_type}
                  </h3>
                  <Badge variant={item.was_accurate ? 'default' : 'secondary'}>
                    {item.state}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(item.created_at)}
                </div>
              </div>
              
              {item.was_accurate ? (
                <Badge className="bg-green-500 hover:bg-green-600">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Accurate
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Not Accurate
                </Badge>
              )}
            </div>

            {/* Amounts Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 rounded-md p-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  We Suggested
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(item.suggested_amount)}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  You Actually Got
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className={`h-4 w-4 ${item.got_nothing ? 'text-red-500' : 'text-green-500'}`} />
                  <span className={`text-2xl font-bold ${item.got_nothing ? 'text-red-600' : 'text-green-600'}`}>
                    {item.got_nothing ? '$0' : formatCurrency(item.actual_amount || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Difference indicator */}
            {!item.was_accurate && !item.got_nothing && item.actual_amount && (
              <div className="text-sm text-muted-foreground">
                Difference: {' '}
                <span className={item.actual_amount > item.suggested_amount ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {item.actual_amount > item.suggested_amount ? '+' : ''}
                  {formatCurrency(item.actual_amount - item.suggested_amount)}
                  {' '}
                  ({Math.abs(((item.actual_amount - item.suggested_amount) / item.suggested_amount) * 100).toFixed(1)}%)
                </span>
              </div>
            )}

            {/* Feedback Notes */}
            {item.category_feedback && item.category_feedback.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground mb-2">Category Breakdown</div>
                <div className="space-y-1.5">
                  {item.category_feedback.map((entry) => (
                    <div key={entry.category} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{entry.category_label}</span>
                      <span className={entry.received ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {entry.received ? formatCurrency(entry.actual_amount || 0) : '$0'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.feedback_notes && (
              <div className="pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground mb-1">Your Notes</div>
                <p className="text-sm text-foreground italic">"{item.feedback_notes}"</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
