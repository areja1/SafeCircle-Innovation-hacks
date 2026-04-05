'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart2, ChevronDown, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
} from 'recharts'
import { useCircles } from '@/hooks/useCircle'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { getAnalytics } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────

interface AnalyticsSummary {
  total_contributed: number
  total_withdrawn: number
  current_balance: number
  total_members: number
  avg_risk_score: number
  approved_requests: number
  pending_requests: number
}

interface PoolGrowthPoint {
  date: string
  balance: number
}

interface ContribByMember {
  name: string
  amount: number
}

interface MonthlyActivity {
  month: string
  contributed: number
  withdrawn: number
}

interface RiskScore {
  name: string
  score: number
}

interface AnalyticsData {
  summary: AnalyticsSummary
  pool_growth: PoolGrowthPoint[]
  contributions_by_member: ContribByMember[]
  monthly_activity: MonthlyActivity[]
  risk_scores: RiskScore[]
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#CC0000', '#231F20', '#6B6B6B', '#A50000', '#F5A0A0']

// ── Small reusable components ──────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  accent: string
  icon: React.ElementType
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xs font-bold text-[#6B6B6B] uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-[#231F20]">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function PanelShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-sm font-bold text-[#231F20] mb-4">{title}</p>
      {children}
    </div>
  )
}

function SkeletonBlock({ h = 'h-40' }: { h?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${h}`} />
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { circles, loading: circlesLoading } = useCircles()
  const [selectedId, setSelectedId] = useState<string>('')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (id: string) => {
    setFetching(true)
    setError(null)
    setData(null)
    try {
      const res = await getAnalytics(id)
      setData(res.data as AnalyticsData)
    } catch {
      setError('Failed to load analytics. Please try again.')
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) fetchAnalytics(selectedId)
    else setData(null)
  }, [selectedId, fetchAnalytics])

  if (circlesLoading) return <PageLoader label="Loading circles..." />

  const selected = circles.find(c => c.id === selectedId)

  return (
    <div className="p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#CC0000] rounded-xl flex items-center justify-center shadow-sm">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#231F20]">Analytics</h1>
          <p className="text-sm text-slate-500">Pool insights and member activity for your circles</p>
        </div>
      </div>

      {/* ── Circle selector ── */}
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

      {/* ── Empty state ── */}
      {!selectedId && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Select a circle above to view analytics</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-5 py-4">
          {error}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {fetching && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => <SkeletonBlock key={i} h="h-28" />)}
          </div>
          <SkeletonBlock h="h-56" />
          <div className="grid grid-cols-2 gap-6">
            <SkeletonBlock h="h-64" />
            <SkeletonBlock h="h-64" />
          </div>
          <SkeletonBlock h="h-56" />
        </div>
      )}

      {/* ── Dashboard ── */}
      {data && selected && !fetching && (
        <div className="space-y-6">

          {/* Panel 1 — Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Contributed"
              value={`$${data.summary.total_contributed.toLocaleString()}`}
              sub={`${data.summary.total_members} members`}
              accent="#10B981"
              icon={TrendingUp}
            />
            <StatCard
              label="Total Withdrawn"
              value={`$${data.summary.total_withdrawn.toLocaleString()}`}
              sub={`${data.summary.approved_requests} approved`}
              accent="#EF4444"
              icon={TrendingDown}
            />
            <StatCard
              label="Current Balance"
              value={`$${data.summary.current_balance.toLocaleString()}`}
              sub={`${data.summary.pending_requests} pending requests`}
              accent="#CC0000"
              icon={DollarSign}
            />
            <StatCard
              label="Avg Risk Score"
              value={String(data.summary.avg_risk_score)}
              sub="out of 100"
              accent="#F59E0B"
              icon={AlertTriangle}
            />
          </div>

          {/* Panel 2 — Pool Growth */}
          <PanelShell title="Pool Growth">
            {data.pool_growth.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No contribution data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={[{ date: 'Start', balance: 0 }, ...data.pool_growth]}
                  margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CC0000" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#CC0000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6B6B6B' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={v => `$${v}`}
                    tick={{ fontSize: 11, fill: '#6B6B6B' }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <Tooltip
                    formatter={(val: number) => [`$${val.toLocaleString()}`, 'Balance']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#CC0000"
                    strokeWidth={2}
                    fill="url(#balanceGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </PanelShell>

          {/* Panel 3 — Two column: Pie + Horizontal Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Contributions by Member */}
            <PanelShell title="Contributions by Member">
              {data.contributions_by_member.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No contributions yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data.contributions_by_member}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      labelLine={false}
                    >
                      {data.contributions_by_member.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`$${val.toLocaleString()}`, 'Amount']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, color: '#6B6B6B' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </PanelShell>

            {/* Risk Scores */}
            <PanelShell title="Risk Scores by Member">
              {data.risk_scores.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No risk surveys completed yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={data.risk_scores}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6B6B6B' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#6B6B6B' }}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                    />
                    <Tooltip
                      formatter={(val: number) => [val, 'Risk Score']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Bar dataKey="score" fill="#CC0000" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </PanelShell>
          </div>

          {/* Panel 4 — Monthly Activity */}
          <PanelShell title="Monthly Activity">
            {data.monthly_activity.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No activity data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={data.monthly_activity}
                  margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#6B6B6B' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={v => `$${v}`}
                    tick={{ fontSize: 11, fill: '#6B6B6B' }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      `$${val.toLocaleString()}`,
                      name === 'contributed' ? 'Contributed' : 'Withdrawn',
                    ]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Legend
                    iconType="square"
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11, color: '#6B6B6B' }}
                    formatter={(val: string) => val === 'contributed' ? 'Contributed' : 'Withdrawn'}
                  />
                  <Bar dataKey="contributed" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdrawn" fill="#CC0000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </PanelShell>

        </div>
      )}
    </div>
  )
}
