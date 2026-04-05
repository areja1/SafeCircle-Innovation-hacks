'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Shield, Scan, Wallet, Zap, ArrowRight, CheckCircle, Star, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/hooks/useAuth'

// State Farm palette
// Primary Red:   #CC0000
// Dark Red:      #A50000
// Charcoal:      #231F20
// Light Gray:    #F5F5F5
// Mid Gray:      #6B6B6B
// White:         #FFFFFF

const STATS = [
  { value: '45M', label: 'Americans are credit invisible' },
  { value: '$140B', label: 'in unclaimed benefits yearly' },
  { value: '$47K', label: 'average hidden costs per family' },
]

const FEATURES = [
  {
    icon: Scan,
    title: 'Risk X-Ray',
    desc: 'AI scans your circle for insurance gaps, unclaimed benefits, and hidden costs before a crisis hits.',
    badge: 'Powered by Claude AI',
    bullets: ['Insurance gap detection', 'Benefit eligibility check', 'Personalized risk score'],
  },
  {
    icon: Wallet,
    title: 'Emergency Pool',
    desc: 'Pool resources with your trusted circle. No bank account required. Democratic voting keeps it fair.',
    badge: 'Community powered',
    bullets: ['No minimums or fees', 'Transparent voting system', 'Stripe-secured payments'],
  },
  {
    icon: Zap,
    title: 'Crisis 911',
    desc: 'When disaster strikes, get step-by-step financial first aid with countdown timers for every deadline.',
    badge: 'Time-sensitive guidance',
    bullets: ['Car accident playbook', 'Job loss action plan', 'ER bill negotiation'],
  },
]

const FOR_WHO = [
  { emoji: '🚗', title: 'Gig Workers', desc: 'DoorDash, Uber, and Instacart drivers who face coverage gaps nobody warned them about.' },
  { emoji: '🌎', title: 'New Americans', desc: 'New to the US financial system? We explain everything in plain English — no jargon.' },
  { emoji: '👨‍👩‍👧', title: 'Working Families', desc: 'One paycheck from crisis? Build a real safety net with the people you already trust.' },
]

const CRISIS_EXAMPLES = [
  { emoji: '🚗', event: 'Car accident', savings: 'Save $15,000', detail: "Don't accept the first offer — it's 40% below fair value" },
  { emoji: '💼', event: 'Job loss', savings: 'Save $2,400', detail: 'File unemployment ASAP — each week delay = $400–600 lost' },
  { emoji: '🏥', event: 'ER visit', savings: 'Save $8,000', detail: 'Request itemized bill + charity care — hospitals must offer it' },
]

const TESTIMONIALS = [
  { name: 'Maria G.', role: 'DoorDash Driver', quote: 'SafeCircle found $3,200 in benefits I had no idea I qualified for. This changed everything.', avatar: 'M' },
  { name: 'James T.', role: 'Freelance Designer', quote: 'When I lost my biggest client, my circle had funds ready in 48 hours. I didn\'t have to panic.', avatar: 'J' },
  { name: 'Priya S.', role: 'Working Mom', quote: 'We use it with our extended family. Everyone contributes a little, and we\'re all protected.', avatar: 'P' },
]

export default function LandingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#CC0000]">
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[#A50000] rounded-full translate-x-1/2 translate-y-1/3 opacity-50" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 mb-7 text-sm text-white/90">
                <Shield className="w-3.5 h-3.5" />
                Community-powered financial protection
              </div>
              <h1 className="text-5xl sm:text-6xl font-black mb-5 leading-[1.05] text-white tracking-tight">
                {t('landing.tagline')}
                <span className="block mt-1 text-white/80">Financially Safe.</span>
              </h1>
              <p className="text-lg text-white/75 mb-8 leading-relaxed max-w-lg">
                {t('landing.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {user ? (
                  <Link href="/dashboard">
                    <Button size="xl" className="w-full sm:w-auto gap-2 bg-white text-[#CC0000] hover:bg-gray-100 font-bold shadow-xl px-8">
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button size="xl" className="w-full sm:w-auto gap-2 bg-white text-[#CC0000] hover:bg-gray-100 font-bold shadow-xl px-8">
                        {t('landing.cta_signup')}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="xl" variant="outline" className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 bg-transparent px-8">
                        {t('landing.cta_login')}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              <p className="mt-4 text-white/50 text-sm">Free for families · No credit card required</p>
            </div>

            {/* Right: floating card */}
            <div className="hidden lg:block relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 relative z-10 ml-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-[#CC0000] rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-[#231F20] text-sm">Circle: Rodriguez Family</p>
                    <p className="text-xs text-[#6B6B6B]">4 members protected</p>
                  </div>
                </div>
                <div className="space-y-3 mb-5">
                  {[
                    { label: 'Emergency Pool', value: '$1,240', bar: 62, color: 'bg-[#CC0000]' },
                    { label: 'Risk Score', value: '34/100', bar: 34, color: 'bg-amber-500' },
                    { label: 'Benefits Found', value: '$3,200', bar: 80, color: 'bg-emerald-500' },
                  ].map(({ label, value, bar, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#6B6B6B] font-medium">{label}</span>
                        <span className="font-black text-[#231F20]">{value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${bar}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#F5F5F5] rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-xs text-[#231F20] font-medium">Fund request approved — $500 released</p>
                  </div>
                </div>
              </div>
              {/* Decoration */}
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#A50000] rounded-2xl opacity-30" />
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto fill-white">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-[#CC0000] uppercase tracking-widest mb-10">The problem we&apos;re solving</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-100 rounded-2xl overflow-hidden shadow-sm">
            {STATS.map(({ value, label }, i) => (
              <div key={i} className="bg-white p-8 text-center">
                <p className="text-5xl font-black text-[#CC0000] mb-2">{value}</p>
                <p className="text-[#6B6B6B] text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────── */}
      <section className="py-20 bg-[#F5F5F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-[#231F20] mb-3">
              Your complete financial safety net
            </h2>
            <p className="text-[#6B6B6B] text-lg">Three tools. One circle. Full protection.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, badge, bullets }, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                {/* Red top bar */}
                <div className="h-1.5 bg-[#CC0000]" />
                <div className="p-6">
                  <div className="w-12 h-12 bg-[#CC0000]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#CC0000] transition-colors">
                    <Icon className="w-6 h-6 text-[#CC0000] group-hover:text-white transition-colors" />
                  </div>
                  <span className="inline-block text-xs font-semibold text-[#CC0000] bg-[#CC0000]/10 px-2.5 py-1 rounded-full mb-3">
                    {badge}
                  </span>
                  <h3 className="text-xl font-black text-[#231F20] mb-2">{title}</h3>
                  <p className="text-[#6B6B6B] text-sm leading-relaxed mb-4">{desc}</p>
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    {bullets.map((b, j) => (
                      <div key={j} className="flex items-center gap-2.5 text-sm text-[#231F20]">
                        <CheckCircle className="w-4 h-4 text-[#CC0000] flex-shrink-0" />
                        {b}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CRISIS EXAMPLES ───────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-xs font-bold text-[#CC0000] uppercase tracking-widest mb-3">Crisis 911</p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#231F20] mb-4 leading-tight">
                When crisis hits,<br />every hour counts
              </h2>
              <p className="text-[#6B6B6B] text-lg mb-8 leading-relaxed">
                SafeCircle gives you step-by-step guidance nobody taught you — and countdown timers so you never miss a critical deadline.
              </p>
              <Link href={user ? '/dashboard' : '/signup'}>
                <Button className="gap-2 bg-[#CC0000] hover:bg-[#A50000] text-white">
                  Get your action plan
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {CRISIS_EXAMPLES.map(({ emoji, event, savings, detail }, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-200 hover:border-[#CC0000]/30 hover:shadow-sm transition-all">
                  <div className="text-3xl">{emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-[#231F20]">{event}</h4>
                      <span className="text-[#CC0000] font-black text-sm bg-[#CC0000]/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">{savings}</span>
                    </div>
                    <p className="text-[#6B6B6B] text-sm">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHO IT'S FOR ──────────────────────────────────────────── */}
      <section className="py-20 bg-[#F5F5F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-[#231F20] mb-3">
              {t('landing.for_who')}
            </h2>
            <p className="text-[#6B6B6B] text-lg">Built for those the traditional system left behind.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FOR_WHO.map(({ emoji, title, desc }, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-7 hover:shadow-md hover:border-[#CC0000]/30 transition-all group text-center">
                <div className="text-5xl mb-5 inline-block group-hover:scale-110 transition-transform">{emoji}</div>
                <h3 className="font-black text-xl text-[#231F20] mb-3">{title}</h3>
                <p className="text-[#6B6B6B] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-[#CC0000] text-[#CC0000]" />)}
            </div>
            <h2 className="text-3xl font-black text-[#231F20] mb-2">Trusted by real families</h2>
            <p className="text-[#6B6B6B]">Real stories from real people building their safety nets.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, quote, avatar }, i) => (
              <div key={i} className="bg-[#F5F5F5] rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-[#CC0000] text-[#CC0000]" />)}
                </div>
                <p className="text-[#231F20] text-sm leading-relaxed mb-5 italic">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#CC0000] flex items-center justify-center text-white text-sm font-bold">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#231F20]">{name}</p>
                    <p className="text-xs text-[#6B6B6B]">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#CC0000] relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#A50000] rounded-full translate-x-1/3 translate-y-1/3 opacity-60" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[#A50000] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-40" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 mb-8 text-sm text-white/90">
            <Users className="w-3.5 h-3.5" />
            Join thousands of families protecting each other
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Start protecting your<br />circle today
          </h2>
          <p className="text-white/75 text-lg mb-10">It takes 2 minutes. It&apos;s free. It could save thousands.</p>
          <Link href={user ? '/dashboard' : '/signup'}>
            <Button size="xl" className="bg-white text-[#CC0000] hover:bg-gray-100 font-black gap-2 px-10 shadow-2xl">
              {user ? 'Go to Dashboard' : t('landing.cta_signup')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-white/50 text-sm mt-6">No credit card required · Free for families</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
