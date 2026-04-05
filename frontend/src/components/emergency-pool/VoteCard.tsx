'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency, timeAgo } from '@/lib/utils'
import type { FundRequest } from '@/types'
import { voteFunds } from '@/lib/api'
import { ThumbsUp, ThumbsDown, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface VoteCardProps {
  request: FundRequest
  circleId: string
  currentUserId?: string
  onVoted?: () => void
}

const STATUS_CONFIG = {
  pending: { label: 'Pending Vote', variant: 'warning' as const, icon: Clock },
  approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle2 },
  denied: { label: 'Denied', variant: 'destructive' as const, icon: XCircle },
  released: { label: 'Funds Released', variant: 'success' as const, icon: CheckCircle2 },
}

const CRISIS_LABELS: Record<string, string> = {
  car_accident: '🚗 Car Accident',
  medical: '🏥 Medical Emergency',
  job_loss: '💼 Job Loss',
  home_damage: '🏠 Home Damage',
  other: '❓ Emergency',
}

export default function VoteCard({ request, circleId, currentUserId, onVoted }: VoteCardProps) {
  const { t } = useTranslation()
  const [voting, setVoting] = useState(false)
  const [voted, setVoted] = useState(false)
  const isRequester = currentUserId === request.requested_by

  const status = STATUS_CONFIG[request.status]
  const StatusIcon = status.icon

  const handleVote = async (vote: boolean) => {
    setVoting(true)
    try {
      await voteFunds(circleId, { request_id: request.id, vote })
      setVoted(true)
      onVoted?.()
    } catch {
      // ignore
    } finally {
      setVoting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-[#1E293B]">{request.requester_name}</p>
            <Badge variant={status.variant}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{timeAgo(request.created_at)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-black text-[#2563EB]">{formatCurrency(request.amount)}</p>
          <p className="text-xs text-slate-400">{CRISIS_LABELS[request.crisis_type] ?? request.crisis_type}</p>
        </div>
      </div>

      <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mb-4 leading-relaxed">{request.reason}</p>

      {/* Vote progress */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-[#2563EB] rounded-full transition-all"
            style={{ width: request.votes_needed > 0 ? `${(request.votes_received / request.votes_needed) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs text-slate-500 font-medium flex-shrink-0">
          {request.votes_received}/{request.votes_needed} {t('pool.votesNeeded')}
        </span>
      </div>

      {/* Vote buttons */}
      {isRequester && request.status === 'pending' && (
        <p className="text-center text-sm text-slate-400 font-medium">Your request is pending circle approval</p>
      )}
      {request.status === 'pending' && !voted && !isRequester && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleVote(true)}
            disabled={voting}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 hover:bg-green-100 border-2 border-green-200 text-green-700 font-bold text-sm transition-all disabled:opacity-60"
          >
            <ThumbsUp className="w-4 h-4" />
            {t('pool.approve')}
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={voting}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-700 font-bold text-sm transition-all disabled:opacity-60"
          >
            <ThumbsDown className="w-4 h-4" />
            {t('pool.deny')}
          </button>
        </div>
      )}

      {voted && (
        <p className="text-center text-sm text-green-600 font-medium">✓ Your vote was recorded</p>
      )}
    </div>
  )
}
