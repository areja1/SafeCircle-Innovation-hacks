import axios from 'axios'
import type { SurveyAnswers } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('supabase_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// CIRCLES
export const getCircles = () => api.get('/circles')
export const createCircle = (data: { name: string; description?: string }) => api.post('/circles', data)
export const getCircle = (id: string) => api.get(`/circles/${id}`)
export const joinCircle = (id: string, invite_code: string) => api.post(`/circles/${id}/join`, { invite_code })
export const joinCircleByCode = (invite_code: string) => api.post('/circles/join-by-code', { invite_code })
export const leaveCircle = (id: string) => api.delete(`/circles/${id}/leave`)

// RISK X-RAY
export const submitRiskSurvey = (circleId: string, answers: SurveyAnswers) =>
  api.post(`/circles/${circleId}/risk-xray`, answers)
export const getRiskReport = (circleId: string) => api.get(`/circles/${circleId}/risk-xray`)
export const getGroupRiskSummary = (circleId: string) => api.get(`/circles/${circleId}/risk-xray/summary`)

// CRISIS MODE
export const startCrisis = (data: { crisis_type: string; state: string }) => api.post('/crisis/start', data)
export const getCrisisSession = (sessionId: string) => api.get(`/crisis/${sessionId}`)
export const completeStep = (sessionId: string, stepId: string) =>
  api.patch(`/crisis/${sessionId}/step`, { step_id: stepId, completed: true })

// EMERGENCY POOL
export const getPool = (circleId: string) => api.get(`/circles/${circleId}/pool`)
export const contribute = (circleId: string, amount: number) =>
  api.post(`/circles/${circleId}/pool/contribute`, { amount })
export const requestFunds = (circleId: string, data: { amount: number; reason: string; crisis_type: string }) =>
  api.post(`/circles/${circleId}/pool/request`, data)
export const voteFunds = (circleId: string, data: { request_id: string; vote: boolean }) =>
  api.post(`/circles/${circleId}/pool/vote`, data)

// BENEFITS
export const checkBenefits = (data: Record<string, unknown>) => api.get('/benefits/check', { params: data })

export default api
