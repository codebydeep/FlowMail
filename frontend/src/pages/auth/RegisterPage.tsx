import { useState, FormEvent, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { authApi } from '@/services/authApi'
import { useAuthStore } from '@/store/authStore'
import { staggerContainer, staggerItem } from '@/lib/motion'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const orbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(orbRef.current, {
        y: -40, x: 30, duration: 8, ease: 'sine.inOut', repeat: -1, yoyo: true,
      })
    })
    return () => ctx.revert()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await authApi.register(name, email, password)
      setAuth(res.user, res.accessToken, res.refreshToken)
      navigate('/inbox')
    } catch {
      toast.error('Registration failed. Email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 relative overflow-hidden">
      <div ref={orbRef}
        className="absolute w-[500px] h-[500px] rounded-full bg-brand-700 blur-[140px] opacity-[0.10] -top-40 right-0 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      <motion.div
        className="w-full max-w-sm z-10"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem} className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">FlowMail</h1>
          <p className="text-sm text-zinc-500 mt-1">Your email workflow, reimagined</p>
        </motion.div>

        <motion.div variants={staggerItem}>
          <div className="glass glass-highlight relative rounded-2xl p-7">
            <h2 className="text-base font-semibold text-zinc-100 mb-5">Create account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Name', value: name, set: setName, type: 'text', placeholder: 'Your name', autoComplete: 'name' },
                { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
                { label: 'Password', value: password, set: setPassword, type: 'password', placeholder: 'Min 8 characters', autoComplete: 'new-password' },
              ].map(({ label, value, set, type, placeholder, autoComplete }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
                  <input
                    type={type}
                    required
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="input"
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                  />
                </div>
              ))}
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
                    Creating...
                  </span>
                ) : 'Create account'}
              </motion.button>
            </form>
            <p className="mt-5 text-center text-xs text-zinc-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
