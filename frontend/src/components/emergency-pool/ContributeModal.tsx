'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, DollarSign, Heart } from 'lucide-react'
import { createCheckoutSession } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ContributeModalProps {
  circleId: string
  targetAmount?: number
  onSuccess?: () => void
  onClose: () => void
}

const QUICK_AMOUNTS = [10, 25, 50, 100]

export default function ContributeModal({ circleId, targetAmount = 25, onSuccess, onClose }: ContributeModalProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState(String(targetAmount))
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const num = parseInt(amount)
    if (!num || num <= 0) { setError('Please enter a valid amount'); return }
    setLoading(true)
    setError('')
    try {
      const res = await createCheckoutSession(circleId, num)
      window.location.href = res.data.checkout_url
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to start payment. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Heart className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="font-bold text-[#1E293B]">{t('pool.contribute')}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-bold text-green-700 text-lg">Contribution received!</p>
              <p className="text-sm text-slate-500 mt-1">Thank you for protecting your circle ❤️</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Every dollar you contribute protects your whole circle in an emergency.
              </p>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={cn(
                      "py-2 rounded-xl text-sm font-bold border-2 transition-all",
                      amount === String(a)
                        ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                        : "border-slate-100 text-slate-600 hover:border-slate-200"
                    )}
                  >
                    ${a}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="relative mb-4">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Custom amount"
                  className="pl-9"
                />
              </div>

              {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

              <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2" size="lg">
                {loading ? 'Redirecting to payment...' : `Pay $${amount || '...'} via Stripe`}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
