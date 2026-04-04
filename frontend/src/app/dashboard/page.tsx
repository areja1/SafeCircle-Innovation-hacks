'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { Plus, Users, Shield, Wallet, ArrowRight, Copy, Check, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useCircles } from '@/hooks/useCircle'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { createCircle, joinCircle } from '@/lib/api'
import { getRiskColor } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
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
      // We need a circleId — for now join via a search; in real app backend handles it
      // Use a placeholder endpoint
      await joinCircle('lookup', inviteCode)
      await refetch()
      setShowJoin(false)
      setInviteCode('')
    } catch {
      setError('Invalid invite code or circle not found')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#1E293B]">
          {t('dashboard.welcome')}, {firstName} 👋
        </h1>
        <p className="text-slate-500 mt-1">Your safety circles at a glance</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-black text-[#2563EB]">{circles.length}</p>
          <p className="text-xs text-slate-500 mt-1">Active Circles</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-black text-[#10B981]">
            {circles.reduce((sum, c) => sum + (c.members?.length ?? 0), 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">People Protected</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-3xl font-black text-amber-500">
            {formatCurrency(circles.reduce((sum, c) => sum + (c.pool?.total_balance ?? 0), 0))}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Pool</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Button onClick={() => { setShowCreate(true); setShowJoin(false) }} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('dashboard.createCircle')}
        </Button>
        <Button variant="outline" onClick={() => { setShowJoin(true); setShowCreate(false) }} className="gap-2">
          <LogIn className="w-4 h-4" />
          {t('dashboard.joinCircle')}
        </Button>
      </div>

      {/* Create / Join forms */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 animate-fade-in">
          <h3 className="font-bold text-[#1E293B] mb-4">Create a New Circle</h3>
          <div className="space-y-3">
            <Input placeholder="Circle name (e.g. 'Our Family')" value={circleName} onChange={e => setCircleName(e.target.value)} />
            <Input placeholder="Description (optional)" value={circleDesc} onChange={e => setCircleDesc(e.target.value)} />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating || !circleName} className="flex-1">
                {creating ? 'Creating...' : 'Create Circle'}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 animate-fade-in">
          <h3 className="font-bold text-[#1E293B] mb-4">Join a Circle</h3>
          <div className="space-y-3">
            <Input placeholder="Enter 8-character invite code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} maxLength={8} className="uppercase tracking-widest font-mono" />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleJoin} disabled={joining || !inviteCode} className="flex-1">
                {joining ? 'Joining...' : 'Join Circle'}
              </Button>
              <Button variant="ghost" onClick={() => setShowJoin(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Circles list */}
      {circles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-[#2563EB]" />
          </div>
          <h3 className="text-xl font-bold text-[#1E293B] mb-2">{t('dashboard.noCircles')}</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">{t('dashboard.noCirclesDesc')}</p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('dashboard.createCircle')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {circles.map(circle => (
            <CircleCard key={circle.id} circle={circle} />
          ))}
        </div>
      )}
    </div>
  )
}

function CircleCard({ circle }: { circle: Circle }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const riskScore = circle.group_risk_score
  const riskColor = riskScore !== undefined ? getRiskColor(riskScore) : '#94a3b8'

  const copyCode = async () => {
    await navigator.clipboard.writeText(circle.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-[#1E293B] truncate">{circle.name}</h3>
          {circle.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{circle.description}</p>
          )}
        </div>
        {riskScore !== undefined && (
          <div
            className="w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-black ml-3 flex-shrink-0 shadow-sm"
            style={{ backgroundColor: riskColor }}
          >
            <span className="text-sm leading-none">{riskScore}</span>
            <span className="text-[8px] opacity-80">/100</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {circle.members?.length ?? 0} {t('dashboard.members')}
        </span>
        {circle.pool && (
          <span className="flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" />
            {formatCurrency(circle.pool.total_balance)}
          </span>
        )}
      </div>

      {/* Invite code */}
      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 mb-4">
        <span className="text-xs text-slate-400">Code:</span>
        <code className="text-xs font-mono font-bold text-[#2563EB] flex-1 uppercase tracking-widest">
          {circle.invite_code}
        </code>
        <button onClick={copyCode} className="text-slate-400 hover:text-[#2563EB] transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <Link href={`/circle/${circle.id}`}>
        <Button className="w-full gap-2 group-hover:gap-3 transition-all" size="sm">
          {t('dashboard.viewCircle')}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  )
}
