'use client'

import { getRiskColor, getRiskLevel } from '@/lib/utils'
import { CheckCircle2, Clock } from 'lucide-react'
import type { CircleMember } from '@/types'

interface MemberRiskCardsProps {
  members: CircleMember[]
}

export default function MemberRiskCards({ members }: MemberRiskCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {members.map((member) => {
        const score = member.risk_score
        const color = score !== undefined ? getRiskColor(score) : '#94a3b8'
        const { label } = score !== undefined ? getRiskLevel(score) : { label: 'Not scanned' }
        const initials = member.full_name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)

        return (
          <div key={member.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow text-center">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3"
              style={{ backgroundColor: color }}
            >
              {initials}
            </div>

            <p className="text-sm font-semibold text-[#1E293B] truncate">{member.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">{member.role}</p>

            {member.survey_completed && score !== undefined ? (
              <div className="mt-2">
                <span
                  className="inline-block text-xl font-black"
                  style={{ color }}
                >
                  {score}
                </span>
                <span className="text-xs text-slate-400">/100</span>
                <p className="text-xs font-medium mt-0.5" style={{ color }}>{label}</p>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Not scanned</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
