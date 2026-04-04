import { Shield } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#1E293B] text-slate-300 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Safe<span className="text-blue-400">Circle</span></span>
          </div>
          <p className="text-sm text-slate-400 text-center">
            Protecting families, immigrants, and gig workers from financial crisis.
          </p>
          <p className="text-xs text-slate-500">
            Built with ❤️ at Innovation Hacks 2026
          </p>
        </div>
      </div>
    </footer>
  )
}
