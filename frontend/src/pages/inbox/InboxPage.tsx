import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { emailApi } from '@/services/emailApi'
import { useEmailStore } from '@/store/emailStore'
import { EmailCard } from '@/components/EmailCard'
import { ComposeModal } from '@/components/ComposeModal'
import { staggerContainer, fadeUp } from '@/lib/motion'
import clsx from 'clsx'

const TABS = [
  { key: 'all',    label: 'All' },
  { key: 'HIGH',   label: '🔴 Action' },
  { key: 'MEDIUM', label: '🟡 Follow-up' },
  { key: 'LOW',    label: '🔵 FYI' },
]

// ── Skeleton row ────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="px-4 py-3 border-b border-white/[0.04] flex gap-3">
      <div className="w-1.5 h-1.5 mt-2 rounded-full skeleton shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-28 rounded skeleton" />
          <div className="h-3 w-12 rounded skeleton" />
        </div>
        <div className="h-3 w-48 rounded skeleton" />
        <div className="h-2.5 w-36 rounded skeleton" />
      </div>
    </div>
  )
}

export default function InboxPage() {
  const navigate = useNavigate()
  const { emails, loading, setEmails, setLoading, totalPages, currentPage, setCurrentPage } = useEmailStore()
  const [tab, setTab] = useState('all')
  const [showCompose, setShowCompose] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const selectedEmailId = useRef<number | null>(null)

  const fetchInbox = useCallback(async (page = 0) => {
    setLoading(true)
    try {
      const res = await emailApi.getInbox(page, 25)
      setEmails(res.content, res.totalPages)
      setCurrentPage(page)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [setEmails, setLoading, setCurrentPage])

  useEffect(() => { fetchInbox(0) }, [fetchInbox])

  // GSAP header entrance
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      )
    }
  }, [])

  // Keyboard: N = compose
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((document.activeElement as HTMLElement)?.tagName?.toLowerCase() === 'input') return
      if (e.key === 'n') setShowCompose(true)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const filtered = tab === 'all' ? emails : emails.filter((e) => e.priority === tab)

  const counts = {
    HIGH:   emails.filter((e) => e.priority === 'HIGH').length,
    MEDIUM: emails.filter((e) => e.priority === 'MEDIUM').length,
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <div ref={headerRef} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">Inbox</h1>
          <motion.div className="flex gap-3 mt-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {counts.HIGH > 0 && (
              <span className="text-xs text-red-400">{counts.HIGH} need action</span>
            )}
            {counts.MEDIUM > 0 && (
              <span className="text-xs text-amber-400">{counts.MEDIUM} follow-up</span>
            )}
          </motion.div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => fetchInbox(currentPage)}
            className="btn-ghost p-2"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowCompose(true)}
            className="btn-primary"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Compose
            <kbd className="ml-1 text-[9px] bg-brand-700/60 px-1 rounded opacity-70">N</kbd>
          </motion.button>
        </div>
      </div>

      {/* ── Priority tabs ──────────────────────────────────────────────── */}
      <div className="flex border-b border-white/[0.05] px-4 relative">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'relative text-xs py-2.5 px-3 transition-colors',
              tab === key ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'
            )}
          >
            {label}
            {tab === key && (
              <motion.div
                layoutId="inbox-tab"
                className="absolute bottom-0 left-0 right-0 h-px bg-brand-500"
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Email list ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {loading && emails.length === 0 && (
          <div>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        )}

        {!loading && filtered.length === 0 && (
          <motion.div
            {...fadeUp}
            className="flex flex-col items-center justify-center h-40 text-zinc-600"
          >
            <p className="text-sm">No emails</p>
            {tab !== 'all' && (
              <button onClick={() => setTab('all')} className="text-xs text-brand-400 mt-1 hover:text-brand-300 transition-colors">
                Show all
              </button>
            )}
          </motion.div>
        )}

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          key={tab + currentPage}
        >
          {filtered.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              selected={selectedEmailId.current === email.id}
              onClick={() => {
                selectedEmailId.current = email.id
                navigate(`/inbox/${email.id}`)
              }}
            />
          ))}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            {...fadeUp}
            className="flex items-center justify-center gap-4 py-4 border-t border-white/[0.05]"
          >
            <button
              disabled={currentPage === 0}
              onClick={() => fetchInbox(currentPage - 1)}
              className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed text-xs"
            >
              ← Prev
            </button>
            <span className="text-xs text-zinc-600">{currentPage + 1} / {totalPages}</span>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => fetchInbox(currentPage + 1)}
              className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed text-xs"
            >
              Next →
            </button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
      </AnimatePresence>
    </div>
  )
}
