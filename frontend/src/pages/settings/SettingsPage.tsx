import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { useAuthStore } from '@/store/authStore'
import { staggerContainer, staggerItem } from '@/lib/motion'

const SHORTCUTS = [
  { key: '⌘K', label: 'Open command palette' },
  { key: 'N',  label: 'New email (in inbox)' },
  { key: 'G',  label: 'Go to Calendar' },
  { key: 'A',  label: 'Go to Agent' },
  { key: '/',  label: 'Search' },
]

export default function SettingsPage() {
  const { user } = useAuthStore()
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
    )
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div ref={headerRef} className="px-5 py-3.5 border-b border-white/[0.05]">
        <h1 className="text-sm font-semibold text-zinc-100">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-xl space-y-6"
        >
          {/* Profile */}
          <motion.section variants={staggerItem}>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Profile</p>
            <div className="glass rounded-2xl p-5 flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/30 to-brand-700/50 border border-brand-500/20 flex items-center justify-center text-brand-300 text-xl font-bold shrink-0"
              >
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{user?.name}</p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
              </div>
            </div>
          </motion.section>

          {/* Integrations */}
          <motion.section variants={staggerItem}>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Integrations</p>
            <div className="glass rounded-2xl divide-y divide-white/[0.05]">
              {[
                {
                  name: 'Gmail', desc: 'Read and send emails', logo: '📧',
                  color: 'bg-red-500/10 border-red-500/20 text-red-400',
                },
                {
                  name: 'Google Calendar', desc: 'Sync events and availability', logo: '📅',
                  color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
                },
              ].map(({ name, desc, logo, color }) => (
                <div key={name} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{logo}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{name}</p>
                      <p className="text-xs text-zinc-600">{desc}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-lg border font-medium ${color}`}>
                    Via Corsair
                  </span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Keyboard shortcuts */}
          <motion.section variants={staggerItem}>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">
              Keyboard shortcuts
            </p>
            <div className="glass rounded-2xl divide-y divide-white/[0.04]">
              {SHORTCUTS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-zinc-400">{label}</span>
                  <kbd className="text-[11px] bg-canvas-300 border border-white/[0.07] px-2 py-0.5 rounded-lg font-mono text-zinc-400">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Version */}
          <motion.section variants={staggerItem}>
            <p className="text-[10px] text-zinc-700 text-center">FlowMail v0.1.0 · Built with ❤️</p>
          </motion.section>
        </motion.div>
      </div>
    </div>
  )
}
