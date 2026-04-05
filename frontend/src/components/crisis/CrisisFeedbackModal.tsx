'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, DollarSign, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { SavingsBreakdownItem } from '@/types'

interface CrisisFeedbackModalProps {
  sessionId: string
  suggestedAmount: number
  savingsBreakdown: SavingsBreakdownItem[]
  crisisType: string
  onSubmitted: () => void
}

interface CategoryFormState {
  outcome: 'full' | 'partial' | 'none' | null
  actualAmount: string
  notes: string
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

export default function CrisisFeedbackModal({
  sessionId,
  suggestedAmount,
  savingsBreakdown,
  onSubmitted,
}: CrisisFeedbackModalProps) {
  const [step, setStep] = useState<'verify' | 'breakdown'>('verify')
  const [wasAccurate, setWasAccurate] = useState<boolean | null>(null)
  const [feedbackNotes, setFeedbackNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fallbackGotNothing, setFallbackGotNothing] = useState(false)
  const [fallbackActualAmount, setFallbackActualAmount] = useState('')
  const { toast } = useToast()

  const [categoryStates, setCategoryStates] = useState<Record<string, CategoryFormState>>(() =>
    Object.fromEntries(
      savingsBreakdown.map((item) => [
        item.category,
        {
          outcome: null,
          actualAmount: '',
          notes: '',
        },
      ])
    )
  )

  const hasBreakdown = savingsBreakdown.length > 0

  const totals = useMemo(() => {
    if (!hasBreakdown) return { actualTotal: 0, gotNothing: fallbackGotNothing }

    const actualTotal = savingsBreakdown.reduce((sum, item) => {
      const state = categoryStates[item.category]
      if (!state?.outcome) return sum
      if (state.outcome === 'none') return sum
      if (state.outcome === 'full') return sum + item.estimated_amount
      return sum + (Number.parseFloat(state.actualAmount) || 0)
    }, 0)

    const gotNothing = savingsBreakdown.every((item) => categoryStates[item.category]?.outcome === 'none')
    return { actualTotal, gotNothing }
  }, [categoryStates, hasBreakdown, savingsBreakdown, fallbackGotNothing])

  const updateCategoryState = (category: string, updates: Partial<CategoryFormState>) => {
    setCategoryStates((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...updates,
      },
    }))
  }

  const handleVerifyAccuracy = (accurate: boolean) => {
    setWasAccurate(accurate)
    setStep('breakdown')
  }

  const setCategoryOutcome = (
    item: SavingsBreakdownItem,
    outcome: 'full' | 'partial' | 'none'
  ) => {
    if (outcome === 'full') {
      updateCategoryState(item.category, { outcome, actualAmount: String(item.estimated_amount) })
      return
    }
    if (outcome === 'none') {
      updateCategoryState(item.category, { outcome, actualAmount: '' })
      return
    }
    updateCategoryState(item.category, { outcome })
  }

  const canSubmit = useMemo(() => {
    if (isSubmitting || wasAccurate === null) return false

    if (!hasBreakdown) {
      return fallbackGotNothing || Boolean(fallbackActualAmount)
    }

    const allDecided = savingsBreakdown.every((item) => categoryStates[item.category]?.outcome !== null)
    if (!allDecided) return false

    const allPartialHaveAmount = savingsBreakdown.every((item) => {
      const state = categoryStates[item.category]
      if (state?.outcome !== 'partial') return true
      return Boolean(state.actualAmount)
    })

    return allPartialHaveAmount
  }, [
    isSubmitting,
    wasAccurate,
    hasBreakdown,
    fallbackGotNothing,
    fallbackActualAmount,
    savingsBreakdown,
    categoryStates,
  ])

  const submitFeedback = async () => {
    if (wasAccurate === null) return

    let categoryFeedback: Array<{
      category: string
      category_label: string
      suggested_amount: number
      received: boolean
      actual_amount: number | null
      notes: string
    }> = []

    let actualAmount: number | null
    let gotNothing: boolean

    if (hasBreakdown) {
      categoryFeedback = savingsBreakdown.map((item) => {
        const state = categoryStates[item.category]
        const outcome = state?.outcome
        const received = outcome === 'full' || outcome === 'partial'
        let actualAmountForCategory: number | null = null
        if (outcome === 'full') actualAmountForCategory = item.estimated_amount
        if (outcome === 'partial') actualAmountForCategory = Number.parseFloat(state.actualAmount) || 0

        return {
          category: item.category,
          category_label: item.category_label,
          suggested_amount: item.estimated_amount,
          received,
          actual_amount: actualAmountForCategory,
          notes: state?.notes ?? '',
        }
      })

      actualAmount = totals.gotNothing ? null : totals.actualTotal
      gotNothing = totals.gotNothing
    } else {
      actualAmount = fallbackGotNothing ? null : Number.parseFloat(fallbackActualAmount) || null
      gotNothing = fallbackGotNothing
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('supabase_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/crisis/${sessionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          suggested_amount: suggestedAmount,
          was_accurate: wasAccurate,
          actual_amount: actualAmount,
          got_nothing: gotNothing,
          feedback_notes: feedbackNotes,
          category_feedback: categoryFeedback,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit feedback')
      const data = await response.json()

      toast({
        title: 'Thank you!',
        description: data.message || 'Your feedback helps us improve our suggestions.',
      })

      onSubmitted()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'verify') {
    return (
      <Card className="border-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Help Us Improve
          </CardTitle>
          <CardDescription>
            We suggested approximately <strong className="text-green-600">{formatCurrency(suggestedAmount)}</strong>.
            Was this total estimate accurate?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 border-green-500 hover:bg-green-50"
              onClick={() => handleVerifyAccuracy(true)}
              disabled={isSubmitting}
            >
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span>Yes, close enough</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-20 border-orange-500 hover:bg-orange-50"
              onClick={() => handleVerifyAccuracy(false)}
              disabled={isSubmitting}
            >
              <div className="flex flex-col items-center gap-2">
                <XCircle className="h-6 w-6 text-orange-600" />
                <span>No, not accurate</span>
              </div>
            </Button>
          </div>
          <p className="text-xs text-gray-600 text-center">
            Next, confirm each category so we can improve future predictions.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-blue-500/50">
      <CardHeader>
        <CardTitle>Category-by-category feedback</CardTitle>
        <CardDescription>
          Tell us what you actually received for each suggested category.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {hasBreakdown ? (
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Suggested total</span>
                <span className="font-semibold">{formatCurrency(suggestedAmount)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-muted-foreground">Actual total (from categories)</span>
                <span className="font-semibold">{totals.gotNothing ? '$0' : formatCurrency(totals.actualTotal)}</span>
              </div>
            </div>

            {savingsBreakdown.map((item) => {
              const state = categoryStates[item.category]
              return (
                <div key={item.category} className="rounded-xl border bg-white/90 p-4 shadow-sm space-y-3">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="font-semibold">{item.category_label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      {item.timeframe ? (
                        <p className="text-xs text-muted-foreground mt-1">Timeline: {item.timeframe}</p>
                      ) : null}
                      <div className="mt-3 inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700">
                        Suggested: {formatCurrency(item.estimated_amount)}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                      <Button
                        type="button"
                        variant={state?.outcome === 'full' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setCategoryOutcome(item, 'full')}
                      >
                        Received full amount
                      </Button>
                      <Button
                        type="button"
                        variant={state?.outcome === 'partial' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setCategoryOutcome(item, 'partial')}
                      >
                        Partial amount
                      </Button>
                      <Button
                        type="button"
                        variant={state?.outcome === 'none' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setCategoryOutcome(item, 'none')}
                      >
                        Didn&apos;t receive
                      </Button>

                      {state?.outcome === 'partial' ? (
                        <div className="space-y-1 rounded-md border bg-background p-2.5">
                          <Label htmlFor={`amount-${item.category}`} className="text-xs">
                            Enter partial amount
                          </Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id={`amount-${item.category}`}
                              type="number"
                              min="0"
                              placeholder="0"
                              value={state.actualAmount}
                              onChange={(e) => updateCategoryState(item.category, { actualAmount: e.target.value })}
                              className="pl-9"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`note-${item.category}`}>Notes (optional)</Label>
                    <Input
                      id={`note-${item.category}`}
                      placeholder="Reason for approval/denial or any details"
                      value={state?.notes || ''}
                      onChange={(e) => updateCategoryState(item.category, { notes: e.target.value })}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <Label>What actually happened?</Label>
            <div className="flex items-center gap-3">
              <Button
                variant={fallbackGotNothing ? 'default' : 'outline'}
                onClick={() => {
                  setFallbackGotNothing(true)
                  setFallbackActualAmount('')
                }}
                className="min-w-[160px]"
              >
                Got nothing / Denied
              </Button>

              <Button
                variant={!fallbackGotNothing && fallbackActualAmount ? 'default' : 'outline'}
                onClick={() => setFallbackGotNothing(false)}
                className="min-w-[160px]"
              >
                Got a different amount
              </Button>
            </div>

            {!fallbackGotNothing ? (
              <div className="space-y-2">
                <Label htmlFor="actual-amount">Actual amount received/saved</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="actual-amount"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={fallbackActualAmount}
                    onChange={(e) => setFallbackActualAmount(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="feedback-notes">Additional context (optional)</Label>
          <Textarea
            id="feedback-notes"
            placeholder="Anything that would help us improve these estimates."
            value={feedbackNotes}
            onChange={(e) => setFeedbackNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="mx-auto flex w-full max-w-md justify-center gap-3 pt-1">
          <Button variant="outline" onClick={() => setStep('verify')} disabled={isSubmitting} className="w-40">
            Back
          </Button>
          <Button onClick={submitFeedback} disabled={!canSubmit} className="w-40">
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
