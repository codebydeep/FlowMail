import { useState, FormEvent, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { authApi } from '@/services/authApi'
import { useAuthStore } from '@/store/authStore'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const orbRef1 = useRef<HTMLDivElement>(null)
  const orbRef2 = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // GSAP floating orb animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(orbRef1.current, {
        y: -30, x: 20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true,
      })
      gsap.to(orbRef2.current, {
        y: 20, x: -25, duration: 9, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.5,
      })
    })
    return () => ctx.revert()
  }, [])

  // Mouse-tracking tilt on card
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      gsap.to(card, {
        rotateX: -dy * 3,
        rotateY: dx * 3,
        duration: 0.5,
        ease: 'power2.out',
        transformPerspective: 900,
      })
    }
    const onLeave = () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power2.out' })
    }
    card.addEventListener('mousemove', onMove)
    card.addEventListener('mouseleave', onLeave)
    return () => { card.removeEventListener('mousemove', onMove); card.removeEventListener('mouseleave', onLeave) }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      setAuth(res.user, res.accessToken, res.refreshToken)
      navigate('/inbox')
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient orbs */}
      <div ref={orbRef1}
        className="absolute w-[480px] h-[480px] rounded-full bg-brand-600 blur-[120px] opacity-[0.12] -top-24 -left-24 pointer-events-none" />
      <div ref={orbRef2}
        className="absolute w-[320px] h-[320px] rounded-full bg-brand-400 blur-[100px] opacity-[0.08] bottom-0 right-0 pointer-events-none" />

      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      <motion.div
        className="w-full max-w-sm z-10"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Logo */}
        <motion.div variants={staggerItem} className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">FlowMail</h1>
          <p className="text-sm text-zinc-500 mt-1">Turn conversations into actions</p>
        </motion.div>

        {/* Card */}
        <motion.div variants={staggerItem}>
          <div
            ref={cardRef}
            className="glass glass-highlight relative rounded-2xl p-7"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <h2 className="text-base font-semibold text-zinc-100 mb-5">Sign in</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  'w-full py-2.5 rounded-xl text-sm font-semibold text-white mt-1',
                  'bg-gradient-to-r from-brand-600 to-brand-500',
                  'shadow-glow-sm hover:shadow-glow transition-shadow',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </motion.button>
            </form>

            <p className="mt-5 text-center text-xs text-zinc-500">
              No account?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
