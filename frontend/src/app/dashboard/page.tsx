'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { Plus, Users, Wallet, ArrowRight, Copy, Check, LogIn, Shield, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useCircles } from '@/hooks/useCircle'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { createCircle, joinCircleByCode } from '@/lib/api'
import { getRiskColor, formatCurrency } from '@/lib/utils'
import type { Circle } from '@/types'

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

  if (authLoading || loading) return <PageLoader label="Loading your circles..." />

  if (!user) {
    router.push('/login')
    return null
  }

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there'
  const totalMembers = circles.reduce((sum, c) => sum + (c.members?.length ?? 0), 0)
  const totalPool = circles.reduce((sum, c) => sum + (c.pool?.total_balance ?? 0), 0)

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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#231F20]">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's your safety circle overview</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setShowCreate(true); setShowJoin(false); setError('') }} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('dashboard.createCircle')}
          </Button>
          <Button variant="outline" onClick={() => { setShowJoin(true); setShowCreate(false); setError('') }} className="gap-2">
            <LogIn className="w-4 h-4" />
            {t('dashboard.joinCircle')}
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#CC0000] to-[#A50000] rounded-2xl p-5 text-white shadow-lg shadow-red-200">
          <div className="flex items-center justify-between mb-3">
            <Shield className="w-5 h-5 text-blue-200" />
            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">Active</span>
          </div>
          <p className="text-4xl font-black">{circles.length}</p>
          <p className="text-blue-100 text-sm mt-1">Safety Circles</p>
        </div>
        <div className="bg-gradient-to-br from-[#10B981] to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-5 h-5 text-emerald-200" />
            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">Protected</span>
          </div>
          <p className="text-4xl font-black">{totalMembers}</p>
          <p className="text-emerald-100 text-sm mt-1">People in your circles</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-200">
          <div className="flex items-center justify-between mb-3">
            <Wallet className="w-5 h-5 text-amber-200" />
            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">Pooled</span>
          </div>
          <p className="text-4xl font-black">{formatCurrency(totalPool)}</p>
          <p className="text-amber-100 text-sm mt-1">Emergency funds ready</p>
        </div>
      </div>

      {/* Create / Join forms */}
      {(showCreate || showJoin) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 animate-fade-in">
          {showCreate && (
            <>
              <h3 className="font-bold text-[#231F20] mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#CC0000]" /> Create a New Circle
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Circle name (e.g. 'Our Family')" value={circleName} onChange={e => setCircleName(e.target.value)} />
                <Input placeholder="Description (optional)" value={circleDesc} onChange={e => setCircleDesc(e.target.value)} />
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <div className="flex gap-2 mt-3">
                <Button onClick={handleCreate} disabled={creating || !circleName}>{creating ? 'Creating...' : 'Create Circle'}</Button>
                <Button variant="ghost" onClick={() => { setShowCreate(false); setError('') }}>Cancel</Button>
              </div>
            </>
          )}
          {showJoin && (
            <>
              <h3 className="font-bold text-[#231F20] mb-4 flex items-center gap-2">
                <LogIn className="w-4 h-4 text-[#CC0000]" /> Join a Circle
              </h3>
              <div className="max-w-xs">
                <Input placeholder="Enter 8-character invite code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} maxLength={8} className="uppercase tracking-widest font-mono" />
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <div className="flex gap-2 mt-3">
                <Button onClick={handleJoin} disabled={joining || !inviteCode}>{joining ? 'Joining...' : 'Join Circle'}</Button>
                <Button variant="ghost" onClick={() => { setShowJoin(false); setError('') }}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Circles */}
      {circles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-[#CC0000]" />
          </div>
          <h3 className="text-xl font-bold text-[#231F20] mb-2">{t('dashboard.noCircles')}</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">{t('dashboard.noCirclesDesc')}</p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> {t('dashboard.createCircle')}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#231F20]">Your Circles</h2>
            <span className="text-xs text-slate-400">{circles.length} circle{circles.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {circles.map(circle => <CircleCard key={circle.id} circle={circle} />)}
          </div>
        </>
      )}
    </div>
  )
}

function CircleCard({ circle }: { circle: Circle }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const riskScore = circle.group_risk_score
  const riskColor = riskScore !== undefined ? getRiskColor(riskScore) : '#94a3b8'
  const memberCount = circle.members?.length ?? 0

  const copyCode = async () => {
    await navigator.clipboard.writeText(circle.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group overflow-hidden">
      {/* Card header with gradient */}
      <div className="h-2 w-full" style={{ backgroundColor: riskColor }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-[#231F20] truncate">{circle.name}</h3>
            {circle.description && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{circle.description}</p>
            )}
          </div>
          {riskScore !== undefined && (
            <div
              className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white font-black ml-3 flex-shrink-0 shadow-sm"
              style={{ backgroundColor: riskColor }}
            >
              <span className="text-sm leading-none">{riskScore}</span>
              <span className="text-[8px] opacity-80">/100</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-[#231F20]">{memberCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" /> {t('dashboard.members')}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-[#10B981]">{formatCurrency(circle.pool?.total_balance ?? 0)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-center gap-1">
              <Wallet className="w-3 h-3" /> Pool
            </p>
          </div>
        </div>

        {/* Invite code */}
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 mb-4 border border-slate-100">
          <span className="text-[10px] text-slate-400 font-medium">INVITE</span>
          <code className="text-xs font-mono font-bold text-[#CC0000] flex-1 uppercase tracking-widest">
            {circle.invite_code || '—'}
          </code>
          <button onClick={copyCode} className="text-slate-400 hover:text-[#CC0000] transition-colors p-0.5">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <Link href={`/circle/${circle.id}`} className="inline-flex">
          <Button className="gap-2 group-hover:gap-3 transition-all" size="sm">
            {t('dashboard.viewCircle')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
