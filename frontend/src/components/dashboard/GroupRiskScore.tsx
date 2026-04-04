'use client'

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { getRiskColor, getRiskLevel } from '@/lib/utils'

interface GroupRiskScoreProps {
  score: number
  label?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function GroupRiskScore({ score, label = "Group Risk Score", subtitle, size = 'md' }: GroupRiskScoreProps) {
  const color = getRiskColor(score)
  const { label: riskLabel } = getRiskLevel(score)
  const data = [{ value: score, fill: color }]

  const dimensions = { sm: 120, md: 180, lg: 220 }
  const dim = dimensions[size]

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: dim, height: dim }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="90%"
            data={data}
            startAngle={225}
            endAngle={-45}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: '#f1f5f9' }}
              dataKey="value"
              cornerRadius={8}
              fill={color}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>{score}</span>
          <span className="text-xs text-slate-500 font-medium">/100</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <span
          className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {riskLabel}
        </span>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  )
}
