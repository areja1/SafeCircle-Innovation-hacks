'use client'

import { formatCurrency } from '@/lib/utils'
import type { Benefit } from '@/types'
import { Gift, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UnclaimedBenefitsProps {
  benefits: Benefit[]
  totalValue?: number
}

export default function UnclaimedBenefits({ benefits, totalValue }: UnclaimedBenefitsProps) {
  const total = totalValue ?? benefits?.reduce((sum, b) => sum + b.estimated_value, 0) ?? 0

  if (!benefits?.length) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-green-50 rounded-lg">
          <Gift className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <h3 className="font-bold text-[#1E293B] text-sm">Unclaimed Benefits</h3>
          <p className="text-xs text-slate-500">Money left on the table</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-lg font-black text-green-600">{formatCurrency(total)}</p>
          <p className="text-xs text-slate-400">per year available</p>
        </div>
      </div>

      <div className="space-y-3">
        {benefits.map((benefit, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-700 font-bold text-xs">${Math.floor(benefit.estimated_value / 100)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1E293B]">{benefit.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{benefit.description}</p>
              <p className="text-xs text-green-700 mt-1 font-medium">
                Worth {formatCurrency(benefit.estimated_value)}/year
              </p>
              {benefit.apply_url && (
                <a
                  href={benefit.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1 font-medium"
                >
                  Apply now <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-sm font-black text-green-600">{formatCurrency(benefit.estimated_value)}</span>
              <p className="text-xs text-slate-400">/year</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
