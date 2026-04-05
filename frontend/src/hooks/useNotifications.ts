'use client'

import { useState, useEffect, useCallback } from 'react'
import { getNotifications } from '@/lib/api'

export interface Notification {
  id: string
  type: 'contribution' | 'fund_request' | 'request_approved' | 'request_denied'
  circle_name: string
  circle_id: string
  message: string
  timestamp: string
  read: boolean
}

export function useNotifications(enabled: boolean = true) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const res = await getNotifications()
      setNotifications(res.data || [])
    } catch {
      // silently fail — notifications are non-critical
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    fetch()
    // Poll every 30s
    const id = setInterval(fetch, 30_000)
    return () => clearInterval(id)
  }, [fetch])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, unreadCount, loading, refetch: fetch }
}
