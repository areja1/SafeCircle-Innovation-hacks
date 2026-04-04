'use client'

import { useTranslation } from 'react-i18next'
import { Car, Briefcase, Heart, Home, AlertCircle } from 'lucide-react'
import type { CrisisType } from '@/types'
import { cn } from '@/lib/utils'

interface CrisisSelectorProps {
  onSelect: (type: CrisisType) => void
  loading?: boolean
  selected?: CrisisType | null
}

const crisisOptions: { type: CrisisType; labelKey: string; icon: React.ElementType; color: string; bg: string; description: string }[] = [
  {
    type: 'car_accident',
    labelKey: 'crisis.carAccident',
    icon: Car,
    color: 'text-red-600',
    bg: 'bg-red-50 hover:bg-red-100 border-red-200',
    description: 'Collision, fender bender, or auto damage',
  },
  {
    type: 'job_loss',
    labelKey: 'crisis.jobLoss',
    icon: Briefcase,
    color: 'text-orange-600',
    bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    description: 'Laid off, fired, or lost your income',
  },
  {
    type: 'medical_emergency',
    labelKey: 'crisis.medical',
    icon: AlertCircle,
    color: 'text-purple-600',
    bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    description: 'ER visit, hospitalization, or injury',
  },
  {
    type: 'death_in_family',
    labelKey: 'crisis.death',
    icon: Heart,
    color: 'text-pink-600',
    bg: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
    description: 'Loss of a family member or loved one',
  },
  {
    type: 'home_damage',
    labelKey: 'crisis.homeDamage',
    icon: Home,
    color: 'text-amber-600',
    bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
    description: 'Fire, flood, storm, or structural damage',
  },
]

export default function CrisisSelector({ onSelect, loading, selected }: CrisisSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#1E293B]">{t('crisis.selectCrisis')}</h2>
        <p className="text-sm text-slate-500 mt-1">We'll give you a step-by-step plan immediately</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {crisisOptions.map(({ type, labelKey, icon: Icon, color, bg, description }) => (
          <button
            key={type}
            onClick={() => !loading && onSelect(type)}
            disabled={loading}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 group",
              bg,
              selected === type && "ring-2 ring-offset-2 ring-current scale-95",
              loading && "opacity-60 cursor-wait"
            )}
          >
            <div className={cn("p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform", color)}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className={cn("font-bold text-sm", color)}>{t(labelKey)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <div className="w-4 h-4 rounded-full border-2 border-[#2563EB]/30 border-t-[#2563EB] animate-spin" />
            Building your action plan...
          </div>
        </div>
      )}
    </div>
  )
}
