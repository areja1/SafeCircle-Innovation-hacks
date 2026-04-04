'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { PovertyTaxBreakdown } from '@/types'
import { TrendingDown } from 'lucide-react'

interface PovertyTaxMeterProps {
  data: PovertyTaxBreakdown
}

const categoryColors = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-purple-500',
]

export default function PovertyTaxMeter({ data }: PovertyTaxMeterProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const maxItem = Math.max(...(data.items?.map(i => i.annual_cost) ?? [1]))

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-red-50 rounded-lg">
          <TrendingDown className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <h3 className="font-bold text-[#1E293B] text-sm">Hidden Poverty Tax</h3>
          <p className="text-xs text-slate-500">What being low-income actually costs you</p>
        </div>
      </div>

      {/* Big number */}
      <div className="mb-5 p-4 bg-red-50 rounded-xl text-center">
        <p className="text-3xl font-black text-red-600">{formatCurrency(data.total_annual)}</p>
        <p className="text-xs text-red-400 mt-1 font-medium">hidden costs per year</p>
      </div>

      {/* Category breakdown */}
      <div className="space-y-3">
        {data.items?.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-700 truncate pr-2">{item.category}</span>
              <span className="text-xs font-bold text-red-600 flex-shrink-0">{formatCurrency(item.annual_cost)}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${categoryColors[idx % categoryColors.length]}`}
                style={{ width: animated ? `${(item.annual_cost / maxItem) * 100}%` : '0%' }}
              />
            </div>
            {item.fixable && item.fix_action && (
              <p className="text-xs text-green-600 mt-0.5 truncate">✓ {item.fix_action}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
