'use client'

import { useEffect, useState } from 'react'
import { getPassbook } from '@/lib/api'
import { ArrowDownLeft, ArrowUpRight, BookOpen } from 'lucide-react'

interface PassbookEntry {
  id: string
  type: 'credit' | 'debit'
  description: string
  amount: number
  timestamp: string
  running_balance: number
}

export default function Passbook({ circleId }: { circleId: string }) {
  const [entries, setEntries] = useState<PassbookEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPassbook(circleId)
      .then(res => setEntries(res.data || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [circleId])

  if (loading) return (
    <div className="animate-pulse space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-xl" />
      ))}
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-[#CC0000]" />
        <h3 className="font-bold text-[#231F20]">Passbook</h3>
        <span className="text-xs text-slate-400 ml-auto">{entries.length} transactions</span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 bg-[#F5F5F5] border-b border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Amount</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Balance</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100 bg-white">
            {entries.map((entry) => {
              const date = new Date(entry.timestamp)
              const isCredit = entry.type === 'credit'
              return (
                <div key={entry.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                  {/* Left: icon + description + date */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCredit ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {isCredit
                        ? <ArrowDownLeft className="w-3.5 h-3.5 text-green-600" />
                        : <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#231F20] truncate">{entry.description}</p>
                      <p className="text-[10px] text-slate-400">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}
                        {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <span className={`text-sm font-black tabular-nums ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                    {isCredit ? '+' : '-'}${entry.amount.toLocaleString()}
                  </span>

                  {/* Running balance */}
                  <span className="text-sm font-semibold text-[#231F20] tabular-nums text-right">
                    ${entry.running_balance.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
