'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Heart, DollarSign } from 'lucide-react'
import { requestFunds } from '@/lib/api'

interface RequestFundsProps {
  circleId: string
  maxAmount: number
  onSuccess?: () => void
  onClose: () => void
}

const CRISIS_TYPES = [
  { value: 'car_accident', label: '🚗 Car Accident' },
  { value: 'medical', label: '🏥 Medical Emergency' },
  { value: 'job_loss', label: '💼 Job Loss' },
  { value: 'home_damage', label: '🏠 Home Damage' },
  { value: 'other', label: '❓ Other Emergency' },
]

export default function RequestFunds({ circleId, maxAmount, onSuccess, onClose }: RequestFundsProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [crisisType, setCrisisType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!amount || !reason || !crisisType) { setError('Please fill in all fields'); return }
    const num = parseInt(amount)
    if (num > maxAmount) { setError(`Maximum request is $${maxAmount}`); return }
    setLoading(true)
    setError('')
    try {
      await requestFunds(circleId, { amount: num, reason, crisis_type: crisisType })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Heart className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="font-bold text-[#1E293B]">{t('pool.requestHelp')}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500">
            Your circle will vote to approve your request. Be honest — this is your safety net.
          </p>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Amount needed</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" className="pl-9" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Pool balance: ${maxAmount.toLocaleString()}</p>
          </div>

          {/* Crisis type */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">What happened?</label>
            <div className="grid grid-cols-1 gap-1.5">
              {CRISIS_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => setCrisisType(ct.value)}
                  className={`text-left px-3 py-2 rounded-lg text-sm border-2 transition-all ${
                    crisisType === ct.value
                      ? 'border-orange-400 bg-orange-50 font-semibold text-orange-700'
                      : 'border-slate-100 hover:border-slate-200 text-slate-700'
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Describe your situation</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Tell your circle what happened and why you need help..."
              rows={3}
              className="w-full rounded-xl border-2 border-slate-200 focus:border-[#2563EB] focus:outline-none text-sm p-3 text-[#1E293B] resize-none transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button onClick={handleSubmit} disabled={loading} className="mx-auto w-full sm:w-auto sm:min-w-[200px]" size="lg">
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </div>
    </div>
  )
}
