'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import type { SurveyAnswers } from '@/types'
import { cn } from '@/lib/utils'

interface QuestionnaireFormProps {
  onSubmit: (answers: SurveyAnswers) => void
  loading?: boolean
}

type Answer = string | boolean | number

interface Question {
  id: keyof SurveyAnswers
  title: string
  subtitle?: string
  type: 'choice' | 'yesno' | 'number'
  options?: { value: string; label: string; emoji?: string }[]
  unit?: string
  placeholder?: string
  dependsOn?: { field: keyof SurveyAnswers; value: Answer }
}

const questions: Question[] = [
  {
    id: 'employment_type',
    title: 'How do you make your income?',
    subtitle: 'This helps us understand your coverage gaps',
    type: 'choice',
    options: [
      { value: 'w2_employee', label: 'Regular employee (W-2)', emoji: '🏢' },
      { value: 'gig_worker', label: 'Gig work (DoorDash, Uber, etc.)', emoji: '🚗' },
      { value: 'self_employed', label: 'Self-employed / freelance', emoji: '💼' },
      { value: 'unemployed', label: 'Currently not working', emoji: '🔍' },
      { value: 'student', label: 'Student', emoji: '📚' },
    ],
  },
  {
    id: 'has_health_insurance',
    title: 'Do you have health insurance?',
    subtitle: 'One ER visit without insurance can cost $2,200+',
    type: 'yesno',
  },
  {
    id: 'health_insurance_type',
    title: 'What type of health insurance do you have?',
    subtitle: 'Different plans have different coverage gaps',
    type: 'choice',
    dependsOn: { field: 'has_health_insurance', value: true },
    options: [
      { value: 'employer', label: 'Through my employer', emoji: '🏢' },
      { value: 'marketplace', label: 'ACA / Marketplace plan', emoji: '🏪' },
      { value: 'medicaid', label: 'Medicaid / Medicare', emoji: '🏥' },
      { value: 'other', label: 'Other', emoji: '📋' },
    ],
  },
  {
    id: 'has_life_insurance',
    title: 'Do you have life insurance?',
    subtitle: 'Without it, your family faces $88,000+ in unexpected costs',
    type: 'yesno',
  },
  {
    id: 'has_renters_insurance',
    title: 'Do you have renters insurance?',
    subtitle: "Your landlord's insurance does NOT cover your belongings",
    type: 'yesno',
  },
  {
    id: 'has_auto_insurance',
    title: 'Do you have auto insurance?',
    subtitle: 'Required by law and critical financial protection',
    type: 'yesno',
  },
  {
    id: 'drives_for_gig_apps',
    title: 'Do you drive for DoorDash, Uber, Lyft, or similar apps?',
    subtitle: 'This is critical — regular auto insurance may not cover you while working',
    type: 'yesno',
  },
  {
    id: 'household_size',
    title: 'How many people are in your household?',
    subtitle: 'Affects your benefit eligibility and safety net size',
    type: 'number',
    placeholder: '2',
  },
  {
    id: 'monthly_income',
    title: 'What is your approximate monthly income?',
    subtitle: 'Used to calculate your safety net and benefit eligibility',
    type: 'number',
    unit: '$',
    placeholder: '2500',
  },
  {
    id: 'emergency_savings',
    title: 'How much do you have saved for emergencies?',
    subtitle: 'Experts recommend 3 months of expenses',
    type: 'number',
    unit: '$',
    placeholder: '500',
  },
  {
    id: 'credit_score_range',
    title: 'What is your credit score range?',
    subtitle: 'Poor credit adds $4,500+/year in hidden costs',
    type: 'choice',
    options: [
      { value: 'no_score', label: 'No credit score', emoji: '❓' },
      { value: 'below_580', label: 'Below 580 (Poor)', emoji: '🔴' },
      { value: '580_669', label: '580-669 (Fair)', emoji: '🟡' },
      { value: '670_739', label: '670-739 (Good)', emoji: '🟢' },
      { value: '740_plus', label: '740+ (Excellent)', emoji: '⭐' },
      { value: 'unknown', label: "I don't know", emoji: '🤷' },
    ],
  },
]

const defaultAnswers: SurveyAnswers = {
  employment_type: 'w2_employee',
  has_health_insurance: false,
  health_insurance_type: 'none',
  has_renters_insurance: false,
  has_auto_insurance: false,
  drives_for_gig_apps: false,
  has_rideshare_endorsement: false,
  monthly_income: 0,
  emergency_savings: 0,
  household_size: 1,
  has_life_insurance: false,
  credit_score_range: 'unknown',
}

function getVisibleQuestions(answers: SurveyAnswers): Question[] {
  return questions.filter(q => {
    if (!q.dependsOn) return true
    return answers[q.dependsOn.field] === q.dependsOn.value
  })
}

export default function QuestionnaireForm({ onSubmit, loading }: QuestionnaireFormProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<SurveyAnswers>(defaultAnswers)
  const [inputVal, setInputVal] = useState('')
  const [touchedYesNo, setTouchedYesNo] = useState<Record<string, boolean>>({})

  const visibleQuestions = getVisibleQuestions(answers)
  const q = visibleQuestions[step]
  const total = visibleQuestions.length
  const isLast = step === total - 1

  const handleChoice = (value: string) => {
    setAnswers(prev => ({ ...prev, [q.id]: value }))
    if (!isLast) setTimeout(() => setStep(s => s + 1), 200)
  }

  const handleYesNo = (value: boolean) => {
    const updated = { ...answers, [q.id]: value }
    // If user says No to health insurance, reset type to 'none'
    if (q.id === 'has_health_insurance' && !value) {
      updated.health_insurance_type = 'none'
    }
    setAnswers(updated)
    setTouchedYesNo(prev => ({ ...prev, [q.id]: true }))
    if (!isLast) setTimeout(() => setStep(s => s + 1), 200)
  }

  const handleNext = () => {
    if (q.type === 'number') {
      setAnswers(prev => ({ ...prev, [q.id]: parseInt(inputVal) || 0 }))
      setInputVal('')
    }
    if (isLast) {
      const final = q.type === 'number'
        ? { ...answers, [q.id]: parseInt(inputVal) || 0 }
        : answers
      onSubmit(final)
    } else {
      setStep(s => s + 1)
    }
  }

  const currentAnswer = answers[q.id]

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>{t('riskXray.question')} {step + 1} {t('riskXray.of')} {total}</span>
          <span>{Math.round(((step + 1) / total) * 100)}%</span>
        </div>
        <Progress value={step + 1} max={total} indicatorClassName="bg-[#2563EB]" />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 animate-fade-in">
        <h2 className="text-xl font-bold text-[#1E293B] mb-2">{q.title}</h2>
        {q.subtitle && <p className="text-sm text-slate-500 mb-5">{q.subtitle}</p>}

        {/* Choice */}
        {q.type === 'choice' && q.options && (
          <div className="space-y-2">
            {q.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleChoice(opt.value)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all font-medium text-sm",
                  currentAnswer === opt.value
                    ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-[#1E293B]"
                )}
              >
                {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
                {opt.label}
                {currentAnswer === opt.value && (
                  <span className="ml-auto text-[#2563EB]">✓</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Yes/No */}
        {q.type === 'yesno' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleYesNo(true)}
              className={cn(
                "p-4 rounded-xl border-2 font-bold text-lg transition-all",
                touchedYesNo[q.id] && currentAnswer === true
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-slate-100 hover:border-green-200 hover:bg-green-50 text-slate-700"
              )}
            >
              ✓ Yes
            </button>
            <button
              onClick={() => handleYesNo(false)}
              className={cn(
                "p-4 rounded-xl border-2 font-bold text-lg transition-all",
                touchedYesNo[q.id] && currentAnswer === false
                  ? "border-red-400 bg-red-50 text-red-700"
                  : "border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-700"
              )}
            >
              ✗ No
            </button>
          </div>
        )}

        {/* Number */}
        {q.type === 'number' && (
          <div className="relative">
            {q.unit && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-lg">
                {q.unit}
              </span>
            )}
            <input
              type="number"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder={q.placeholder}
              className="w-full h-14 pl-9 pr-4 rounded-xl border-2 border-slate-200 focus:border-[#2563EB] focus:outline-none text-xl font-bold text-[#1E293B] bg-white transition-colors"
              onKeyDown={e => e.key === 'Enter' && handleNext()}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            {t('riskXray.back')}
          </Button>
        )}
        {(q.type === 'number' || isLast) && (
          <Button onClick={handleNext} disabled={loading} className="gap-2 min-w-[140px] ml-auto">
            {loading ? 'Analyzing...' : isLast ? t('riskXray.submit') : t('riskXray.next')}
            {!loading && <ChevronRight className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </div>
  )
}
