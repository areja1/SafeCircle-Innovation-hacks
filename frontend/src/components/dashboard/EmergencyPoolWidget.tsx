'use client'

import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/lib/utils'
import { Wallet, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { EmergencyPool } from '@/types'
import Link from 'next/link'

interface EmergencyPoolWidgetProps {
  pool: EmergencyPool
  circleId: string
  memberCount?: number
}

export default function EmergencyPoolWidget({ pool, circleId, memberCount = 1 }: EmergencyPoolWidgetProps) {
  const { t } = useTranslation()
  const monthlyTarget = pool.target_monthly_per_member * memberCount
  const progressPct = Math.min(100, (pool.total_balance / (monthlyTarget * 3)) * 100)

  return (
    <div className="bg-gradient-to-br from-[#2563EB] to-blue-700 rounded-2xl shadow-lg p-5 text-white">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-white/20 rounded-lg">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-sm">{t('pool.title')}</h3>
      </div>

      <div className="mb-4">
        <p className="text-4xl font-black">{formatCurrency(pool.total_balance)}</p>
        <p className="text-blue-200 text-xs mt-1">
          Target: {formatCurrency(pool.target_monthly_per_member)}/member/month
        </p>
      </div>

      <Progress
        value={progressPct}
        className="bg-white/20 mb-3"
        indicatorClassName="bg-white"
      />
      <p className="text-xs text-blue-200 mb-4">{Math.round(progressPct)}% of 3-month safety goal</p>

      <Link href={`/circle/${circleId}/emergency-pool`} className="inline-flex">
        <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/20 gap-2 bg-transparent">
          <Plus className="w-4 h-4" />
          {t('pool.contribute')}
        </Button>
      </Link>
    </div>
  )
}
