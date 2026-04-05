'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import { useCircles } from '@/hooks/useCircle'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import Passbook from '@/components/emergency-pool/Passbook'

export default function PassbookPage() {
  const { circles, loading } = useCircles()
  const [selectedId, setSelectedId] = useState<string>('')

  if (loading) return <PageLoader label="Loading circles..." />

  const selected = circles.find(c => c.id === selectedId)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#CC0000] rounded-xl flex items-center justify-center shadow-sm">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#231F20]">Passbook</h1>
          <p className="text-sm text-slate-500">Full transaction history for your circles</p>
        </div>
      </div>

      {/* Circle selector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
          Select Circle
        </label>

        {circles.length === 0 ? (
          <p className="text-sm text-slate-400">You haven&apos;t joined any circles yet.</p>
        ) : (
          <div className="relative">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full appearance-none bg-[#F5F5F5] border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-[#231F20] focus:outline-none focus:border-[#CC0000] transition-colors cursor-pointer"
            >
              <option value="">— Choose a circle —</option>
              {circles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.members?.length ?? 0} members
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Passbook */}
      {selected ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Circle</p>
              <p className="text-lg font-black text-[#231F20]">{selected.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Pool Balance</p>
              <p className="text-lg font-black text-[#CC0000]">
                ${(selected.pool?.total_balance ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
          <Passbook circleId={selected.id} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Select a circle above to view its passbook</p>
        </div>
      )}
    </div>
  )
}
