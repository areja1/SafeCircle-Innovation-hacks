import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function getRiskLevel(score: number): { label: string; color: string; bg: string } {
  if (score <= 30) return { label: 'Low Risk', color: 'text-green-600', bg: 'bg-green-50' }
  if (score <= 60) return { label: 'Moderate Risk', color: 'text-amber-600', bg: 'bg-amber-50' }
  return { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-50' }
}

export function getRiskColor(score: number): string {
  if (score <= 30) return '#10B981'
  if (score <= 60) return '#F59E0B'
  return '#EF4444'
}

export function getPriorityColor(priority: string): {
  border: string;
  bg: string;
  text: string;
  badge: string;
} {
  switch (priority) {
    case 'critical':
    case 'red':
      return { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-500 text-white' }
    case 'high':
    case 'orange':
      return { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-500 text-white' }
    case 'medium':
    case 'yellow':
      return { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-500 text-white' }
    case 'green':
      return { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-500 text-white' }
    default:
      return { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-600', badge: 'bg-gray-400 text-white' }
  }
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function hoursUntilDeadline(crisisStartedAt: string, deadlineHours: number): number {
  const started = new Date(crisisStartedAt).getTime()
  const deadline = started + deadlineHours * 3600000
  const now = Date.now()
  return Math.max(0, Math.floor((deadline - now) / 3600000))
}
