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
import { Plus, Heart, Wallet } from 'lucide-react'

export default function PoolTab({ circleId }: { circleId: string }) {
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

  const { pool, contributions = [], requests = [] } = data
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const pastRequests = requests.filter(r => r.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Balance */}
      <PoolBalance pool={pool} contributions={contributions} />

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
