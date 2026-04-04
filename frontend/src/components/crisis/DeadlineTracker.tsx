'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeadlineTrackerProps {
  crisisStartedAt: string
  deadlineHours: number
  className?: string
}

export default function DeadlineTracker({ crisisStartedAt, deadlineHours, className }: DeadlineTrackerProps) {
  const [hoursLeft, setHoursLeft] = useState(0)
  const [minutesLeft, setMinutesLeft] = useState(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculate = () => {
      const started = new Date(crisisStartedAt).getTime()
      const deadline = started + deadlineHours * 3600000
      const now = Date.now()
      const remaining = deadline - now

      if (remaining <= 0) {
        setIsExpired(true)
        setHoursLeft(0)
        setMinutesLeft(0)
        return
      }

      setHoursLeft(Math.floor(remaining / 3600000))
      setMinutesLeft(Math.floor((remaining % 3600000) / 60000))
    }

    calculate()
    const interval = setInterval(calculate, 60000)
    return () => clearInterval(interval)
  }, [crisisStartedAt, deadlineHours])

  const isUrgent = hoursLeft < 4 && !isExpired

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
      isExpired ? "bg-gray-100 text-gray-500" :
      isUrgent ? "bg-red-100 text-red-700 animate-pulse" :
      "bg-amber-100 text-amber-700",
      className
    )}>
      <Clock className="w-3 h-3" />
      {isExpired ? "Deadline passed" : `${hoursLeft}h ${minutesLeft}m left`}
    </div>
  )
}
