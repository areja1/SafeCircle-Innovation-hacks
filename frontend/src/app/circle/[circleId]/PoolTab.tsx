'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEmergencyPool } from '@/hooks/useEmergencyPool'
import { useAuth } from '@/hooks/useAuth'
import PoolBalance from '@/components/emergency-pool/PoolBalance'
import ContributeModal from '@/components/emergency-pool/ContributeModal'
import RequestFunds from '@/components/emergency-pool/RequestFunds'
import VoteCard from '@/components/emergency-pool/VoteCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import Passbook from '@/components/emergency-pool/Passbook'
import { Button } from '@/components/ui/button'
import { Plus, Heart, Wallet, Clock3, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function PoolTab({ circleId, memberCount = 1 }: { circleId: string; memberCount?: number }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data, loading, refetch } = useEmergencyPool(circleId)
  const [showContribute, setShowContribute] = useState(false)
  const [showRequest, setShowRequest] = useState(false)

  if (loading) return <LoadingSpinner size="lg" label="Loading pool..." className="py-12" />
  if (!data?.pool) return (
    <div className="text-center py-12 text-slate-500">
      <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p>Emergency pool not yet set up for this circle.</p>
    </div>
  )

  const { pool, requests = [] } = data
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const pastRequests = requests.filter(r => r.status !== 'pending')
  const approvedRequests = pastRequests.filter(r => r.status === 'approved' || r.status === 'released')
  const approvalRate = pastRequests.length > 0 ? Math.round((approvedRequests.length / pastRequests.length) * 100) : 0
  const pendingAmount = pendingRequests.reduce((sum, r) => sum + r.amount, 0)
  const monthlyTarget = pool.target_monthly_per_member * memberCount
  const runwayMonths = monthlyTarget > 0 ? pool.total_balance / monthlyTarget : 0

  return (
    <div className="space-y-6">
      {/* Balance */}
      <PoolBalance pool={pool} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-blue-50 p-2 text-[#2563EB]">
              <Clock3 className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-slate-500">Pool runway</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{monthlyTarget > 0 ? `${runwayMonths.toFixed(1)} months` : 'N/A'}</p>
          <p className="mt-1 text-xs text-slate-500">Based on {formatCurrency(monthlyTarget)}/month target</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Heart className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-slate-500">Pending support</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{pendingRequests.length}</p>
          <p className="mt-1 text-xs text-slate-500">{formatCurrency(pendingAmount)} requested</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-slate-500">Approval rate</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{pastRequests.length > 0 ? `${approvalRate}%` : 'N/A'}</p>
          <p className="mt-1 text-xs text-slate-500">{approvedRequests.length}/{pastRequests.length} resolved requests</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowContribute(true)} className="gap-2 min-w-[150px]" size="default">
          <Plus className="w-4 h-4" />
          {t('pool.contribute')}
        </Button>
        <Button variant="outline" onClick={() => setShowRequest(true)} className="gap-2 min-w-[150px]" size="default">
          <Heart className="w-4 h-4" />
          {t('pool.requestHelp')}
        </Button>
      </div>

      {/* Active vote requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="font-bold text-[#1E293B] mb-3">Needs Your Vote</h3>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <VoteCard key={req.id} request={req} circleId={circleId} currentUserId={user?.id} onVoted={refetch} />
            ))}
          </div>
        </div>
      )}

      {/* Past requests */}
      {pastRequests.length > 0 && (
        <div>
          <h3 className="font-bold text-[#1E293B] mb-3">Past Requests</h3>
          <div className="space-y-3">
            {pastRequests.map(req => (
              <VoteCard key={req.id} request={req} circleId={circleId} currentUserId={user?.id} />
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">{t('pool.noRequests')}</p>
        </div>
      )}

      {/* Passbook */}
      <Passbook circleId={circleId} />

      {/* Modals */}
      {showContribute && (
        <ContributeModal
          circleId={circleId}
          targetAmount={pool.target_monthly_per_member}
          onSuccess={refetch}
          onClose={() => setShowContribute(false)}
        />
      )}
      {showRequest && (
        <RequestFunds
          circleId={circleId}
          maxAmount={pool.total_balance}
          onSuccess={refetch}
          onClose={() => setShowRequest(false)}
        />
      )}
    </div>
  )
}
