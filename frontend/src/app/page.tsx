'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Shield, Scan, Wallet, Zap, ArrowRight, Users, TrendingDown, CheckCircle2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Footer from '@/components/layout/Footer'

const STATS = [
  { value: '45M', label: 'Americans are credit invisible', color: 'text-red-500' },
  { value: '$140B', label: 'in unclaimed benefits yearly', color: 'text-amber-500' },
  { value: '$47K', label: 'average hidden costs per family', color: 'text-blue-500' },
]

const FEATURES = [
  {
    icon: Scan,
    title: 'Risk X-Ray',
    desc: 'Our AI scans your circle for financial blind spots — insurance gaps, unclaimed benefits, and hidden costs — before a crisis hits.',
    color: 'bg-blue-50 text-[#2563EB]',
    badge: 'Powered by Claude AI',
  },
  {
    icon: Wallet,
    title: 'Emergency Pool',
    desc: 'Pool resources with your trusted circle — family, friends, neighbors. No bank account required. Democratic voting keeps it fair.',
    color: 'bg-green-50 text-[#10B981]',
    badge: 'Community powered',
  },
  {
    icon: Zap,
    title: 'Crisis 911',
    desc: 'When disaster strikes, get step-by-step financial first aid with countdown timers. Car accident? Job loss? We guide you through every deadline.',
    color: 'bg-red-50 text-red-500',
    badge: 'Time-sensitive guidance',
  },
]

const FOR_WHO = [
  { emoji: '🚗', title: 'Gig Workers', desc: 'DoorDash, Uber, Instacart drivers who lack employer benefits and have coverage gaps nobody warned them about.' },
  { emoji: '🌎', title: 'Immigrants', desc: 'New to the US financial system? We explain everything in plain English and Spanish, no jargon.' },
  { emoji: '👨‍👩‍👧', title: 'Working Families', desc: 'One paycheck from crisis? SafeCircle helps you build a real safety net with the people you trust.' },
]

const CRISIS_EXAMPLES = [
  { emoji: '🚗', event: 'Car accident', savings: '$15,000', detail: 'Don\'t accept the first offer — it\'s 40% below fair value' },
  { emoji: '💼', event: 'Job loss', savings: '$2,400', detail: 'File unemployment ASAP — each week delay = $400–600 lost' },
  { emoji: '🏥', event: 'ER visit', savings: '$8,000', detail: 'Request itemized bill + charity care — hospitals must offer it' },
]

export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E293B] via-[#1e3a5f] to-[#1E293B] text-white py-20 lg:py-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#2563EB]/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#10B981]/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6 text-sm text-blue-200">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            Community-powered financial protection
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            {t('landing.tagline')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Financially.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="xl" className="w-full sm:w-auto gap-2 bg-[#2563EB] hover:bg-blue-600 text-white shadow-2xl shadow-blue-900/50">
                {t('landing.cta_signup')}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="xl" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 bg-transparent">
                {t('landing.cta_login')}
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <div className="flex -space-x-1.5">
              {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500'].map((c, i) => (
                <div key={i} className={`w-6 h-6 rounded-full border-2 border-[#1E293B] ${c}`} />
              ))}
            </div>
            <span>Free for families, no credit card needed</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-slate-100 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {STATS.map(({ value, label, color }, i) => (
              <div key={i}>
                <p className={`text-5xl font-black ${color} mb-2`}>{value}</p>
                <p className="text-slate-500 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E293B] mb-4">
              Your complete financial safety net
            </h2>
            <p className="text-slate-500 text-lg">Three tools. One circle. Full protection.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, badge }, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-shadow group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="inline-block bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5 rounded-full mb-3">
                  {badge}
                </div>
                <h3 className="text-xl font-bold text-[#1E293B] mb-3">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crisis examples */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E293B] mb-4">
              When crisis hits, every hour counts
            </h2>
            <p className="text-slate-500 text-lg">SafeCircle gives you the steps nobody taught you</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {CRISIS_EXAMPLES.map(({ emoji, event, savings, detail }, i) => (
              <div key={i} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                <div className="text-4xl mb-3">{emoji}</div>
                <h4 className="font-bold text-lg mb-1">{event}</h4>
                <p className="text-green-400 font-black text-2xl mb-2">Save {savings}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E293B] mb-4">
              {t('landing.for_who')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FOR_WHO.map(({ emoji, title, desc }, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
                <div className="text-5xl mb-4">{emoji}</div>
                <h3 className="font-bold text-xl text-[#1E293B] mb-3">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 bg-gradient-to-br from-[#2563EB] to-blue-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black mb-4">Start protecting your circle today</h2>
          <p className="text-blue-100 text-lg mb-8">It takes 2 minutes. It's free. It could save thousands.</p>
          <Link href="/signup">
            <Button size="xl" className="bg-white text-[#2563EB] hover:bg-blue-50 gap-2 font-black">
              {t('landing.cta_signup')}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
