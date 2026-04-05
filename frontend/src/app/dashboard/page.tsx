'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarClock,
  Check,
  ChevronRight,
  Copy,
  Filter,
  Gauge,
  Grid3X3,
  List,
  LogIn,
  Plus,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useCircles } from '@/hooks/useCircle'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { createCircle, getGroupRiskSummary, joinCircleByCode } from '@/lib/api'
import { formatCurrency, getRiskColor } from '@/lib/utils'
import type { Circle } from '@/types'

type ViewMode = 'grid' | 'list'
type SortMode = 'risk' | 'pool' | 'members' | 'name'
type RiskFilter = 'all' | 'high' | 'moderate' | 'stable'
type CircleScanStats = {
  completed: number
  pending: number
  hasReliableData: boolean
}

const HARDCODED_AVATARS = [
  'https://i.pravatar.cc/80?img=12',
  'https://i.pravatar.cc/80?img=32',
  'https://i.pravatar.cc/80?img=47',
  'https://i.pravatar.cc/80?img=54',
  'https://i.pravatar.cc/80?img=62',
]

function getCircleScanStats(circle: Circle): CircleScanStats {
  const members = circle.members ?? []

  const hasBooleanFlags = members.some(m => typeof m.survey_completed === 'boolean')
  if (hasBooleanFlags) {
    const completed = members.filter(m => m.survey_completed === true).length
    const pending = members.filter(m => m.survey_completed === false).length
    return { completed, pending, hasReliableData: true }
  }

  const hasRiskScores = members.some(m => typeof m.risk_score === 'number')
  if (hasRiskScores) {
    const completed = members.filter(m => typeof m.risk_score === 'number').length
    const pending = Math.max(members.length - completed, 0)
    return { completed, pending, hasReliableData: true }
  }

  return { completed: 0, pending: 0, hasReliableData: false }
}

function resolveCircleScanStats(circle: Circle, surveyedCount?: number): CircleScanStats {
  const memberCount = circle.members?.length ?? 0

  if (typeof surveyedCount === 'number' && surveyedCount >= 0) {
    const completed = Math.min(surveyedCount, memberCount)
    return {
      completed,
      pending: Math.max(memberCount - completed, 0),
      hasReliableData: true,
    }
  }

  return getCircleScanStats(circle)
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const { circles, loading, refetch } = useCircles()
  const router = useRouter()

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [circleName, setCircleName] = useState('')
  const [circleDesc, setCircleDesc] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortMode>('risk')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [surveyedByCircle, setSurveyedByCircle] = useState<Record<string, number>>({})
  const [scanSummaryLoaded, setScanSummaryLoaded] = useState(false)

  useEffect(() => {
    let active = true

    const loadSurveyedCounts = async () => {
      if (circles.length === 0) {
        if (!active) return
        setSurveyedByCircle({})
        setScanSummaryLoaded(true)
        return
      }

      setScanSummaryLoaded(false)

      const entries = await Promise.all(
        circles.map(async circle => {
          try {
            const response = await getGroupRiskSummary(circle.id)
            const membersSurveyed = Number(response.data?.members_surveyed ?? 0)
            return [circle.id, Number.isFinite(membersSurveyed) ? membersSurveyed : -1] as const
          } catch {
            return [circle.id, -1] as const
          }
        })
      )

      if (!active) return

      const next: Record<string, number> = {}
      entries.forEach(([circleId, surveyedCount]) => {
        next[circleId] = surveyedCount
      })
      setSurveyedByCircle(next)
      setScanSummaryLoaded(true)
    }

    loadSurveyedCounts()
    return () => {
      active = false
    }
  }, [circles])

  const filteredCircles = useMemo(() => {
    const search = searchQuery.trim().toLowerCase()

    return [...circles]
      .filter(circle => {
        if (!search) return true
        return (
          circle.name.toLowerCase().includes(search) ||
          (circle.description ?? '').toLowerCase().includes(search) ||
          (circle.invite_code ?? '').toLowerCase().includes(search)
        )
      })
      .filter(circle => {
        if (riskFilter === 'all') return true
        if (typeof circle.group_risk_score !== 'number') return false

        const score = circle.group_risk_score
        if (riskFilter === 'high') return score >= 70
        if (riskFilter === 'moderate') return score >= 40 && score < 70
        return score < 40
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'members') return (b.members?.length ?? 0) - (a.members?.length ?? 0)
        if (sortBy === 'pool') return (b.pool?.total_balance ?? 0) - (a.pool?.total_balance ?? 0)
        return (b.group_risk_score ?? -1) - (a.group_risk_score ?? -1)
      })
  }, [circles, riskFilter, searchQuery, sortBy])

  if (authLoading || loading) return <PageLoader label="Loading your circles..." />

  if (!user) {
    router.push('/login')
    return null
  }

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there'
  const hasCircles = circles.length > 0
  const totalMembers = circles.reduce((sum, c) => sum + (c.members?.length ?? 0), 0)
  const totalPool = circles.reduce((sum, c) => sum + (c.pool?.total_balance ?? 0), 0)
  const scanStats = circles.map(circle => resolveCircleScanStats(circle, surveyedByCircle[circle.id]))
  const hasReliableScanData = scanSummaryLoaded && hasCircles && scanStats.every(stat => stat.hasReliableData)
  const membersWithoutSurvey = hasReliableScanData ? scanStats.reduce((sum, s) => sum + s.pending, 0) : null
  const circlesWithRisk = circles.filter(c => typeof c.group_risk_score === 'number')
  const highRiskCircles = circlesWithRisk.filter(c => (c.group_risk_score ?? 0) >= 70).length
  const avgRiskScore = circlesWithRisk.length
    ? Math.round(circlesWithRisk.reduce((sum, c) => sum + (c.group_risk_score ?? 0), 0) / circlesWithRisk.length)
    : null

  const totalMonthlyNeed = circles.reduce(
    (sum, c) => sum + ((c.pool?.target_monthly_per_member ?? 0) * (c.members?.length ?? 0)),
    0
  )
  const runwayMonths = totalMonthlyNeed > 0 ? totalPool / totalMonthlyNeed : 0
  const runwayLabel = totalMonthlyNeed > 0 ? `${runwayMonths.toFixed(1)} months` : null
  const scansCompleted = hasReliableScanData ? scanStats.reduce((sum, s) => sum + s.completed, 0) : null
  const protectionEfficiency = scansCompleted !== null && totalMembers > 0
    ? Math.round((scansCompleted / totalMembers) * 100)
    : null

  const circlesAtGoal = circles.reduce((sum, c) => {
    const monthly = (c.pool?.target_monthly_per_member ?? 0) * (c.members?.length ?? 0)
    const goal = monthly * 3
    const balance = c.pool?.total_balance ?? 0
    return sum + (goal > 0 && balance >= goal ? 1 : 0)
  }, 0)

  const averageGoalProgress = hasCircles
    ? Math.round(circles.reduce((sum, c) => {
      const monthly = (c.pool?.target_monthly_per_member ?? 0) * (c.members?.length ?? 0)
      const goal = monthly * 3
      const balance = c.pool?.total_balance ?? 0
      if (goal <= 0) return sum
      return sum + Math.min(100, Math.round((balance / goal) * 100))
    }, 0) / circles.length)
    : null

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyGoalTrend = averageGoalProgress === null
    ? []
    : monthLabels.map((label, idx) => {
      const value = Math.round((averageGoalProgress * (idx + 1)) / 12)
      return { label, value }
    })

  const activityFeed = circles.slice(0, 4).map(circle => {
    const members = circle.members?.length ?? 0
    const { pending: scansPending, hasReliableData } = resolveCircleScanStats(circle, surveyedByCircle[circle.id])
    const pool = circle.pool?.total_balance ?? 0
    const score = circle.group_risk_score

    if (typeof score === 'number' && score >= 70) {
      return { title: `${circle.name} needs attention`, detail: `Risk score at ${score}/100`, tone: 'alert' as const }
    }
    if (hasReliableData && scansPending > 0) {
      return { title: `${circle.name} has pending scans`, detail: `${scansPending} members still need Risk X-Ray`, tone: 'neutral' as const }
    }
    if (pool > 0) {
      return { title: `${circle.name} pool updated`, detail: `${formatCurrency(pool)} protected in emergency pool`, tone: 'positive' as const }
    }
    return { title: `${circle.name} is active`, detail: `${members} members engaged`, tone: 'neutral' as const }
  })

  const placeholderCount = viewMode === 'grid' && circles.length > 0 ? Math.max(0, 4 - filteredCircles.length) : 0

  const handleCreate = async () => {
    if (!circleName.trim()) return
    setCreating(true)
    setError('')
    try {
      await createCircle({ name: circleName, description: circleDesc })
      await refetch()
      setShowCreate(false)
      setCircleName('')
      setCircleDesc('')
    } catch {
      setError('Failed to create circle')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) return
    setJoining(true)
    setError('')
    try {
      await joinCircleByCode(inviteCode.toUpperCase())
      await refetch()
      setShowJoin(false)
      setInviteCode('')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid invite code or circle not found')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8 space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#CC6B49]/20 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                <Shield className="h-3.5 w-3.5" />
                Unified circle command center
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">Welcome back, {firstName} 👋</h1>
              <p className="mt-1 text-sm text-slate-300">
                One live snapshot of circle health, readiness, and priority actions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { setShowCreate(true); setShowJoin(false); setError('') }} className="gap-2 bg-[#CC6B49] text-white hover:bg-[#b75d3f]">
                <Plus className="w-4 h-4" />
                {t('dashboard.createCircle')}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowJoin(true); setShowCreate(false); setError('') }}
                className="gap-2 border-white/30 bg-white/5 text-white hover:bg-white/15"
              >
                <LogIn className="w-4 h-4" />
                {t('dashboard.joinCircle')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <MetricChip label="Active circles" value={hasCircles ? circles.length.toString() : '—'} />
            <MetricChip label="Protected members" value={hasCircles ? totalMembers.toString() : '—'} />
            <MetricChip label="Emergency pool" value={hasCircles ? formatCurrency(totalPool) : '—'} />
            <MetricChip label="Avg risk score" value={hasCircles && avgRiskScore !== null ? `${avgRiskScore}/100` : '—'} />
            <MetricChip label="Goal progress" value={hasCircles && averageGoalProgress !== null ? `${averageGoalProgress}%` : '—'} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Gauge className="h-4 w-4 text-emerald-500" />
              Protection Efficiency
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {!hasCircles ? '' : scansCompleted !== null ? `${scansCompleted}/${totalMembers} complete` : 'Live data loading'}
            </span>
          </div>
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full p-3"
            style={{
              background: `conic-gradient(#10B981 ${Math.max(0, Math.min(100, protectionEfficiency ?? 0)) * 3.6}deg, rgba(148,163,184,0.2) 0deg)`
            }}>
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {protectionEfficiency !== null ? `${protectionEfficiency}%` : '—'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Coverage</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
            {!hasCircles
              ? 'Join or create a circle to view efficiency.'
              : scansCompleted !== null
              ? 'Scans completed vs members in all circles.'
              : 'Coverage appears after live risk summaries load.'}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <AlertTriangle className="h-4 w-4 text-[#CC6B49]" />
              Risk Overview
            </div>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
              {!hasCircles ? '—' : avgRiskScore !== null ? `Avg ${avgRiskScore}/100` : 'No score yet'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 px-3 py-2">
              <p className="text-2xl font-black text-red-700 dark:text-red-300">{hasCircles ? highRiskCircles : '—'}</p>
              <p className="text-xs text-red-600/90 dark:text-red-300/80">High-risk circles</p>
            </div>
            <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/30 px-3 py-2">
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{hasCircles ? (membersWithoutSurvey ?? '—') : '—'}</p>
              <p className="text-xs text-amber-700/90 dark:text-amber-300/80">Pending Risk X-Ray scans</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            12-Month Goal Progress
          </div>
          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${averageGoalProgress ?? 0}%` }} />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {!hasCircles
                ? 'Join or create a circle to view goal progress.'
                : `${circlesAtGoal}/${circles.length} circles at 3-month pool goal • runway ${runwayLabel ?? '—'}`}
            </div>
            {monthlyGoalTrend.length === 0 ? (
              <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                No monthly progress data yet.
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-6 gap-1">
                {monthlyGoalTrend.map(item => (
                  <div key={item.label} className="flex flex-col items-center gap-1">
                    <div className="w-full rounded-sm bg-slate-100 dark:bg-slate-800" style={{ height: '36px', position: 'relative' }}>
                      <div
                        className="absolute bottom-0 left-0 w-full rounded-sm bg-gradient-to-t from-blue-500 to-blue-300"
                        style={{ height: `${Math.max(0, item.value * 0.36)}px` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Activity className="h-4 w-4 text-purple-500" />
            Activity Feed
          </div>
          <div className="space-y-2">
            {activityFeed.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                Activity will appear here once circles become active.
              </div>
            ) : (
              activityFeed.map(item => (
                <div key={`${item.title}-${item.detail}`} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                  <p className={`text-xs font-semibold ${item.tone === 'alert' ? 'text-red-600 dark:text-red-300' : item.tone === 'positive' ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{item.detail}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="space-y-4 xl:col-span-9">
          {(showCreate || showJoin) && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-fade-in">
              <div className="mb-4 flex items-center gap-2 text-sm">
                <button
                  onClick={() => { setShowCreate(true); setShowJoin(false); setError('') }}
                  className={`rounded-full px-3 py-1.5 font-medium transition-colors ${showCreate ? 'bg-red-50 dark:bg-red-950/50 text-[#CC0000] dark:text-red-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowJoin(true); setShowCreate(false); setError('') }}
                  className={`rounded-full px-3 py-1.5 font-medium transition-colors ${showJoin ? 'bg-red-50 dark:bg-red-950/50 text-[#CC0000] dark:text-red-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Join
                </button>
              </div>

              {showCreate && (
                <>
                  <h3 className="font-bold text-[#231F20] dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#CC0000]" /> Create a New Circle
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input placeholder="Circle name (e.g. 'Our Family')" value={circleName} onChange={e => setCircleName(e.target.value)} />
                    <Input placeholder="Description (optional)" value={circleDesc} onChange={e => setCircleDesc(e.target.value)} />
                  </div>
                  {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleCreate} disabled={creating || !circleName}>{creating ? 'Creating...' : 'Create Circle'}</Button>
                    <Button variant="ghost" onClick={() => { setShowCreate(false); setError('') }}>Cancel</Button>
                  </div>
                </>
              )}

              {showJoin && (
                <>
                  <h3 className="font-bold text-[#231F20] dark:text-slate-100 mb-4 flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-[#CC0000]" /> Join a Circle
                  </h3>
                  <div className="max-w-xs">
                    <Input placeholder="Enter 8-character invite code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} maxLength={8} className="uppercase tracking-widest font-mono" />
                  </div>
                  {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleJoin} disabled={joining || !inviteCode}>{joining ? 'Joining...' : 'Join Circle'}</Button>
                    <Button variant="ghost" onClick={() => { setShowJoin(false); setError('') }}>Cancel</Button>
                  </div>
                </>
              )}
            </div>
          )}

          {circles.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-14 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40">
                <Users className="h-8 w-8 text-[#CC0000]" />
              </div>
              <h3 className="text-xl font-bold text-[#231F20] dark:text-slate-100 mb-2">{t('dashboard.noCircles')}</h3>
              <p className="mx-auto mb-6 max-w-sm text-sm text-slate-500 dark:text-slate-400">{t('dashboard.noCirclesDesc')}</p>
              <Button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="gap-2">
                <Plus className="w-4 h-4" /> {t('dashboard.createCircle')}
              </Button>
            </div>
          ) : (
            <section className="space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#231F20] dark:text-slate-100">Your Circles</h2>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {filteredCircles.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search circles, code, or description"
                        className="w-full sm:w-64 pl-8"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-500 dark:text-slate-300">
                        <Filter className="h-3.5 w-3.5" />
                        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as RiskFilter)} className="bg-transparent outline-none">
                          <option value="all">All risk</option>
                          <option value="high">High</option>
                          <option value="moderate">Moderate</option>
                          <option value="stable">Stable</option>
                        </select>
                      </label>
                      <label className="rounded-xl border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-500 dark:text-slate-300">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortMode)} className="bg-transparent outline-none">
                          <option value="risk">Sort: Risk</option>
                          <option value="pool">Sort: Pool</option>
                          <option value="members">Sort: Members</option>
                          <option value="name">Sort: Name</option>
                        </select>
                      </label>
                      <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 p-0.5">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`rounded-lg px-2 py-1 ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}
                          title="Grid view"
                        >
                          <Grid3X3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`rounded-lg px-2 py-1 ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}
                          title="List view"
                        >
                          <List className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {filteredCircles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No circles match your current filters.</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try clearing search or switching the risk filter.</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {filteredCircles.map(circle => (
                    <CircleGridCard
                      key={circle.id}
                      circle={circle}
                      scanStats={resolveCircleScanStats(circle, surveyedByCircle[circle.id])}
                    />
                  ))}
                  {Array.from({ length: placeholderCount }).map((_, idx) => (
                    <CirclePlaceholderCard key={`placeholder-${idx}`} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCircles.map(circle => (
                    <CircleListCard key={circle.id} circle={circle} />
                  ))}
                </div>
              )}
            </section>
          )}
        </section>

        <aside className="space-y-4 xl:col-span-3">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Sparkles className="h-4 w-4 text-[#CC6B49]" />
              SafeCircle Community Insights
            </div>
            <div className="mt-3 space-y-2">
              <InsightCard
                icon={<BellRing className="h-3.5 w-3.5 text-blue-500" />}
                title="Weekly readiness habit"
                detail="Run one Risk X-Ray check-in weekly for each circle to keep risk drift low."
              />
              <InsightCard
                icon={<CalendarClock className="h-3.5 w-3.5 text-emerald-500" />}
                title="Pool governance best practice"
                detail="Set a monthly review cadence so pool targets track member count changes."
              />
              <InsightCard
                icon={<Activity className="h-3.5 w-3.5 text-purple-500" />}
                title="Response playbook tip"
                detail="Keep one admin designated per circle to coordinate first 24-hour crisis actions."
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#CC6B49]/30 bg-[#CC6B49]/10 dark:bg-[#CC6B49]/20 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#7A2E1A] dark:text-[#F0B7A3]">
              <Shield className="h-4 w-4" />
              Crisis posture
            </div>
            <p className="mt-2 text-xs text-[#7A2E1A]/90 dark:text-[#F0B7A3]/90">
              All quiet right now. Keep pool runway healthy and high-risk circles monitored.
            </p>
            <Link href={circles[0] ? `/circle/${circles[0].id}` : '/dashboard'} className="mt-3 inline-flex">
              <Button size="sm" className="gap-1.5 bg-[#CC6B49] hover:bg-[#b75d3f] text-white">
                Open circle
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-300">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-white">{value}</p>
    </div>
  )
}

function InsightCard({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  )
}

function CircleGridCard({ circle, scanStats }: { circle: Circle; scanStats: CircleScanStats }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const riskScore = circle.group_risk_score
  const riskColor = typeof riskScore === 'number' ? getRiskColor(riskScore) : '#94a3b8'
  const riskLabel =
    typeof riskScore === 'number' ? (riskScore >= 70 ? 'High risk' : riskScore >= 40 ? 'Moderate' : 'Stable') : null

  const healthScore = typeof riskScore === 'number' ? Math.max(0, 100 - riskScore) : 85
  const memberCount = circle.members?.length ?? 0
  const poolAmount = circle.pool?.total_balance ?? 0
  const { pending: pendingScans, hasReliableData } = scanStats
  const recentEvent = !hasReliableData
    ? 'Open circle for Risk X-Ray status'
    : pendingScans > 0
    ? 'Risk X-Ray pending'
    : 'Risk profile updated'

  const avatarItems = circle.members?.slice(0, 3).map((m, idx) => ({
    name: m.full_name || `Member ${idx + 1}`,
    avatarUrl: HARDCODED_AVATARS[idx % HARDCODED_AVATARS.length],
  })) ?? []

  const copyCode = async () => {
    if (!circle.invite_code) return
    try {
      await navigator.clipboard.writeText(circle.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="h-1.5 w-full" style={{ backgroundColor: riskColor }} />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-[#231F20] dark:text-slate-100">{circle.name}</h3>
            {circle.description && (
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{circle.description}</p>
            )}
            {riskLabel && (
              <div className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${riskColor}22`, color: riskColor }}>
                {riskLabel}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Health</p>
            <p className="text-lg font-black" style={{ color: riskColor }}>{healthScore}</p>
            <p className="text-[9px] text-slate-400">/100</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
            <p className="text-xl font-black text-slate-900 dark:text-slate-100">{memberCount}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <Users className="h-3 w-3" /> {t('dashboard.members')}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2">
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(poolAmount)}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
              <Wallet className="h-3 w-3" /> Emergency Pool
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Last event</p>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{recentEvent}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center -space-x-2">
            {avatarItems.length === 0 ? (
              <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] text-slate-500 dark:text-slate-400">No members</span>
            ) : (
              avatarItems.map((item, idx) => (
                <img
                  key={`${circle.id}-avatar-${idx}`}
                  src={item.avatarUrl}
                  alt={item.name}
                  className="h-7 w-7 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                />
              ))
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1">
            <code className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#CC0000]">
              {circle.invite_code || '—'}
            </code>
            <button onClick={copyCode} className="text-slate-500 hover:text-[#CC0000] transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <Link href={`/circle/${circle.id}`} className="inline-flex">
          <Button size="sm" className="gap-2 transition-all group-hover:gap-3">
            {t('dashboard.viewCircle')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function CircleListCard({ circle }: { circle: Circle }) {
  const riskScore = circle.group_risk_score
  const riskColor = typeof riskScore === 'number' ? getRiskColor(riskScore) : '#94a3b8'
  const memberCount = circle.members?.length ?? 0
  const pool = circle.pool?.total_balance ?? 0
  const riskLabel =
    typeof riskScore === 'number' ? (riskScore >= 70 ? 'High risk' : riskScore >= 40 ? 'Moderate' : 'Stable') : null

  return (
    <Link
      href={`/circle/${circle.id}`}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{circle.name}</p>
        {circle.description && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{circle.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs">
        {riskLabel && (
          <span className="rounded-full px-2 py-1 font-semibold" style={{ backgroundColor: `${riskColor}22`, color: riskColor }}>{riskLabel}</span>
        )}
        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-slate-600 dark:text-slate-300">{memberCount} members</span>
        <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2 py-1 font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(pool)}</span>
        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
      </div>
    </Link>
  )
}

function CirclePlaceholderCard() {
  return (
    <button
      type="button"
      className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/50 p-5 text-left transition-all hover:border-[#CC6B49] hover:bg-[#CC6B49]/5"
    >
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-[#CC6B49]/10 p-2">
          <Plus className="h-5 w-5 text-[#CC6B49]" />
        </div>
        <p className="mt-3 text-xs font-semibold tracking-wide text-[#CC6B49]">ADD NEW CIRCLE TO THIS SLOT</p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Scale your protection network as your community grows.
        </p>
      </div>
    </button>
  )
}
