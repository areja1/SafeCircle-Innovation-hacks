'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import RiskXRayTab from '../RiskXRayTab'

export default function RiskXRayPage() {
  const { circleId } = useParams<{ circleId: string }>()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/circle/${circleId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2563EB] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to Circle
      </Link>
      <RiskXRayTab circleId={circleId} />
    </div>
  )
}
