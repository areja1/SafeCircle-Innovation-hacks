'use client'

import { formatCurrency } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Wallet } from 'lucide-react'
import type { EmergencyPool } from '@/types'

interface PoolBalanceProps {
  pool: EmergencyPool
  memberCount?: number
}

export default function PoolBalance({ pool, memberCount = 1 }: PoolBalanceProps) {
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
    </div>
  )
}
