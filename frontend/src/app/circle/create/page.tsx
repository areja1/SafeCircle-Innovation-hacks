'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCircle } from '@/lib/api'

export default function CreateCirclePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await createCircle({ name, description: desc })
      router.push(`/circle/${res.data.id}`)
    } catch {
      setError('Failed to create circle. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2563EB] mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />Dashboard
      </Link>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-br from-[#1E293B] to-slate-700 px-8 py-10 text-white text-center">
          <div className="w-14 h-14 bg-[#2563EB] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black">Create Your Circle</h1>
          <p className="text-slate-300 text-sm mt-1">Invite your family, friends, or neighbors</p>
        </div>

        <form onSubmit={handleCreate} className="p-8 space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Circle Name *</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Our Family, Roommates 2026, etc."
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Description (optional)</label>
            <Input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="A brief description of this circle"
            />
          </div>

          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">After creating your circle:</p>
            <ul className="text-xs space-y-1 text-blue-600 list-disc list-inside">
              <li>You'll get a unique invite code to share</li>
              <li>Each member completes a Risk X-Ray scan</li>
              <li>Everyone contributes to the Emergency Pool</li>
            </ul>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button type="submit" disabled={loading || !name} className="w-full gap-2" size="lg">
            <Plus className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Circle'}
          </Button>
        </form>
      </div>
    </div>
  )
}
