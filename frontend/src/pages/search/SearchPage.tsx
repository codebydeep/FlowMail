import { useState, FormEvent, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { emailApi } from '@/services/emailApi'
import { EmailSummary } from '@/store/emailStore'
import { useNavigate } from 'react-router-dom'
import { EmailCard } from '@/components/EmailCard'
import { staggerContainer, fadeUp } from '@/lib/motion'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<EmailSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
    )
    inputRef.current?.focus()
  }, [])

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await emailApi.search(q)
      setResults(res.content)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={headerRef} className="px-5 py-4 border-b border-white/[0.05]">
        <h1 className="text-sm font-semibold text-zinc-100 mb-3">Search</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by subject, sender, keywords..."
              className="input pl-10"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading || !query.trim()}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="btn-primary disabled:opacity-40"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Search'}
          </motion.button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-24 gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-zinc-700 border-t-brand-500 rounded-full"
            />
            <span className="text-sm text-zinc-600">Searching...</span>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <motion.div {...fadeUp} className="flex flex-col items-center justify-center h-32 text-zinc-600">
            <svg className="w-8 h-8 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
          </motion.div>
        )}

        {!loading && results.length > 0 && (
          <>
            <motion.div {...fadeUp} className="px-5 py-2.5 border-b border-white/[0.04]">
              <p className="text-xs text-zinc-600">
                {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
              </p>
            </motion.div>
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
              {results.map((email) => (
                <EmailCard
                  key={email.id}
                  email={email}
                  onClick={() => navigate(`/inbox/${email.id}`)}
                />
              ))}
            </motion.div>
          </>
        )}

        {!searched && (
          <motion.div {...fadeUp} className="flex flex-col items-center justify-center h-64 text-zinc-700">
            <div className="w-14 h-14 rounded-2xl bg-canvas-200 border border-white/[0.05] flex items-center justify-center mb-3 opacity-40">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm">Search by subject, sender, or any keyword</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
