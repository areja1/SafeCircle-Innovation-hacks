'use client'

import { formatCurrency } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Wallet, TrendingUp } from 'lucide-react'
import type { EmergencyPool, PoolContribution } from '@/types'
import { timeAgo } from '@/lib/utils'

interface PoolBalanceProps {
  pool: EmergencyPool
  contributions?: PoolContribution[]
  memberCount?: number
}

export default function PoolBalance({ pool, contributions = [], memberCount = 1 }: PoolBalanceProps) {
  const monthlyTarget = pool.target_monthly_per_member * memberCount
  const threeMonthGoal = monthlyTarget * 3
  const progressPct = Math.min(100, (pool.total_balance / threeMonthGoal) * 100)

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <div className="bg-gradient-to-br from-[#2563EB] to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4 opacity-80">
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-medium">Emergency Pool Balance</span>
        </div>
        <p className="text-5xl font-black mb-1">{formatCurrency(pool.total_balance)}</p>
        <p className="text-blue-200 text-sm">
          {formatCurrency(pool.target_monthly_per_member)} target/member/month
        </p>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-blue-200 mb-2">
            <span>Safety goal progress</span>
            <span>{Math.round(progressPct)}% of 3-month goal</span>
          </div>
          <Progress
            value={progressPct}
            className="bg-white/20 h-2"
            indicatorClassName="bg-white"
          />
          <p className="text-xs text-blue-200 mt-1.5">
            Goal: {formatCurrency(threeMonthGoal)} (3 months × {memberCount} members)
          </p>
        </div>
      </div>

      {/* Contribution history */}
      {contributions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="font-semibold text-sm text-[#1E293B] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Recent Contributions
          </h4>
          <div className="space-y-2">
            {contributions.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-700 font-bold text-xs">
                  {c.user_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1E293B]">{c.user_name}</p>
                  <p className="text-xs text-slate-400">{timeAgo(c.contributed_at)}</p>
                </div>
                <span className="font-bold text-green-600 text-sm">+{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
