'use client'

import { formatCurrency } from '@/lib/utils'
import type { GroupRiskReport } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users } from 'lucide-react'

interface GroupRiskMapProps {
  report: GroupRiskReport
}

export default function GroupRiskMap({ report }: GroupRiskMapProps) {
  const gapData = report.gap_summary?.map(g => ({
    name: g.gap_type.replace('_', ' '),
    affected: g.members_affected,
    total: g.total_members,
    risk: g.total_risk,
    pct: Math.round((g.members_affected / g.total_members) * 100),
  })) ?? []

  const barColor = (pct: number) => {
    if (pct >= 70) return '#EF4444'
    if (pct >= 40) return '#F59E0B'
    return '#10B981'
  }

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-red-600">{formatCurrency(report.total_unprotected_risk)}</p>
          <p className="text-xs text-red-400 mt-1">Total at Risk</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{formatCurrency(report.total_poverty_tax)}</p>
          <p className="text-xs text-amber-400 mt-1">Poverty Tax/Year</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-black text-green-600">{formatCurrency(report.total_unclaimed_benefits)}</p>
          <p className="text-xs text-green-400 mt-1">Unclaimed Benefits</p>
        </div>
      </div>

      {/* Gap bar chart */}
      {gapData.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members affected by each gap
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gapData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Members affected']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                  {gapData.map((entry, idx) => (
                    <Cell key={idx} fill={barColor(entry.pct)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gap messages */}
      <div className="space-y-2">
        {report.gap_summary?.map((g, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-red-600">{g.members_affected}</span>
            </div>
            <p className="text-sm text-slate-700">{g.message}</p>
            <span className="ml-auto text-xs font-semibold text-red-500 flex-shrink-0">
              {formatCurrency(g.total_risk)} at risk
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
