import { useEffect, useState, useRef, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCommandPaletteStore } from '@/store/uiStore'
import { emailApi } from '@/services/emailApi'
import { EmailSummary } from '@/store/emailStore'
import { overlayVariants, commandVariants, staggerContainer, staggerItem } from '@/lib/motion'
import clsx from 'clsx'

interface Cmd {
  id: string; icon: string; label: string; description?: string; action: () => void
}

export function CommandPalette() {
  const { close } = useCommandPaletteStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [emailResults, setEmailResults] = useState<EmailSummary[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Debounced email search
  useEffect(() => {
    if (query.trim().length < 2) { setEmailResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await emailApi.search(query, 0, 5)
        setEmailResults(res.content)
      } catch { setEmailResults([]) }
      finally { setSearching(false) }
    }, 280)
    return () => clearTimeout(t)
  }, [query])

  const go = (to: string) => { navigate(to); close() }

  const navCmds: Cmd[] = [
    { id: 'inbox',    icon: '📧', label: 'Go to Inbox',       action: () => go('/inbox') },
    { id: 'calendar', icon: '📅', label: 'Go to Calendar',    action: () => go('/calendar') },
    { id: 'agent',    icon: '🤖', label: 'Open AI Agent',     description: 'Chat to schedule & send', action: () => go('/agent') },
    { id: 'actions',  icon: '⚡', label: 'Action Center',     description: 'Emails needing attention', action: () => go('/actions') },
    { id: 'search',   icon: '🔍', label: 'Search emails',     action: () => go('/search') },
    { id: 'settings', icon: '⚙️', label: 'Settings',          action: () => go('/settings') },
  ]

  const filtered = query.trim()
    ? navCmds.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : navCmds

  const allItems: Cmd[] = [
    ...filtered,
    ...emailResults.map((e) => ({
      id: `e-${e.id}`,
      icon: e.read ? '✉️' : '📬',
      label: e.subject || '(no subject)',
      description: `From: ${e.senderName || e.senderEmail}`,
      action: () => go(`/inbox/${e.id}`),
    })),
  ]

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, allItems.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); allItems[selected]?.action() }
    if (e.key === 'Escape')    { close() }
  }

  return (
    <motion.div
      variants={overlayVariants}
      initial="initial" animate="animate" exit="exit"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <motion.div
        variants={commandVariants}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl glass rounded-2xl shadow-glass-lg overflow-hidden"
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          <svg className="w-4 h-4 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={onKey}
            placeholder="Search or jump to..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
          />
          <AnimatePresence>
            {searching && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-3.5 h-3.5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            )}
          </AnimatePresence>
          <kbd className="text-[10px] bg-canvas-400 border border-white/[0.06] px-1.5 py-0.5 rounded-md text-zinc-600 font-mono">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-1">
          {allItems.length === 0 && query.trim().length >= 2 && !searching && (
            <p className="px-5 py-4 text-sm text-zinc-600">No results for &ldquo;{query}&rdquo;</p>
          )}

          {/* Navigation section */}
          {filtered.length > 0 && (
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
              {!query.trim() && (
                <p className="px-5 py-2 text-[10px] text-zinc-700 uppercase tracking-widest font-semibold">
                  Navigate
                </p>
              )}
              {filtered.map((item, idx) => (
                <motion.button
                  key={item.id}
                  variants={staggerItem}
                  onClick={item.action}
                  onMouseEnter={() => setSelected(idx)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                    selected === idx
                      ? 'bg-brand-600/15 text-zinc-100'
                      : 'text-zinc-400 hover:bg-white/[0.04]'
                  )}
                >
                  <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
                  <div className="min-w-0 text-left">
                    <p className={clsx('font-medium', selected === idx ? 'text-zinc-100' : 'text-zinc-300')}>
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-zinc-600 truncate">{item.description}</p>
                    )}
                  </div>
                  {selected === idx && (
                    <motion.kbd
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="ml-auto text-[10px] bg-canvas-400 px-1.5 py-0.5 rounded-md text-zinc-500 font-mono shrink-0"
                    >
                      ↵
                    </motion.kbd>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Email results section */}
          {emailResults.length > 0 && (
            <div>
              <p className="px-5 pt-3 pb-1 text-[10px] text-zinc-700 uppercase tracking-widest font-semibold">
                Emails
              </p>
              {emailResults.map((email, idx) => {
                const absIdx = filtered.length + idx
                return (
                  <motion.button
                    key={email.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => go(`/inbox/${email.id}`)}
                    onMouseEnter={() => setSelected(absIdx)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                      selected === absIdx
                        ? 'bg-brand-600/15 text-zinc-100'
                        : 'text-zinc-400 hover:bg-white/[0.04]'
                    )}
                  >
                    <span className="text-base w-5 text-center shrink-0">{email.read ? '✉️' : '📬'}</span>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium text-zinc-300 truncate">
                        {email.subject || '(no subject)'}
                      </p>
                      <p className="text-[11px] text-zinc-600 truncate">
                        {email.senderName || email.senderEmail}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-5 px-4 py-2.5 border-t border-white/[0.05] text-[10px] text-zinc-700">
          <span><kbd className="bg-canvas-400 px-1 py-0.5 rounded mr-1">↑↓</kbd>navigate</span>
          <span><kbd className="bg-canvas-400 px-1 py-0.5 rounded mr-1">↵</kbd>select</span>
          <span><kbd className="bg-canvas-400 px-1 py-0.5 rounded mr-1">Esc</kbd>close</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
