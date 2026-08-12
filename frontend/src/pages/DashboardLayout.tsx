import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useEmailStore } from '@/store/emailStore'
import { useSidebarStore, useCommandPaletteStore } from '@/store/uiStore'
import { authApi } from '@/services/authApi'
import { emailApi } from '@/services/emailApi'
import toast from 'react-hot-toast'
import { useEffect, useCallback, useRef } from 'react'
import { useNavigate as useNav } from 'react-router-dom'
import { sidebarVariants, fadeIn, staggerContainer, staggerItem } from '@/lib/motion'
import clsx from 'clsx'
import { gsap } from 'gsap'

// ── Sidebar nav items ──────────────────────────────────────────────────────
const NAV = [
  {
    to: '/inbox', label: 'Inbox', shortcut: 'G I',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  },
  {
    to: '/calendar', label: 'Calendar', shortcut: 'G C',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    to: '/actions', label: 'Actions', shortcut: 'G A',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M13 10V3L4 14h7v7l9-11h-7z" />,
  },
  {
    to: '/agent', label: 'AI Agent', shortcut: 'G S',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />,
  },
  {
    to: '/search', label: 'Search', shortcut: '/',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  },
]

function NavItem({ item, collapsed, badge }: {
  item: typeof NAV[0]
  collapsed: boolean
  badge?: number | null
}) {
  return (
    <NavLink to={item.to}>
      {({ isActive }) => (
        <motion.div
          whileHover={{ x: collapsed ? 0 : 2 }}
          whileTap={{ scale: 0.97 }}
          className={clsx(
            'relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors select-none cursor-pointer',
            isActive
              ? 'bg-brand-600/15 text-brand-400'
              : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.04]'
          )}
        >
          {/* Active indicator bar */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-brand-500"
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          )}

          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {item.icon}
          </svg>

          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {badge != null && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={clsx(
                'ml-auto flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-brand-600',
                collapsed
                  ? 'absolute top-0.5 right-0.5 w-4 h-4'
                  : 'min-w-[18px] h-[18px] px-1'
              )}
            >
              {badge > 99 ? '99+' : badge}
            </motion.span>
          )}
        </motion.div>
      )}
    </NavLink>
  )
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const { unreadCount, setUnreadCount } = useEmailStore()
  const { collapsed, toggle } = useSidebarStore()
  const { open: openCmd } = useCommandPaletteStore()
  const logoRef = useRef<HTMLDivElement>(null)

  // Logo entrance animation via GSAP
  useEffect(() => {
    if (logoRef.current) {
      gsap.fromTo(logoRef.current,
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 }
      )
    }
  }, [])

  // Global keyboard shortcuts
  const handleKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openCmd() }
    const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase()
    if (tag === 'input' || tag === 'textarea') return
    if (e.key === '/') { e.preventDefault(); navigate('/search') }
  }, [openCmd, navigate])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  useEffect(() => {
    emailApi.getUnreadCount().then(setUnreadCount).catch(() => {})
  }, [setUnreadCount])

  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/login')
    toast.success('Signed out')
  }

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">

      {/* ── Ambient background orbs ─────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="orb w-96 h-96 bg-brand-600 -top-32 -left-32 opacity-[0.07]" />
        <div className="orb w-64 h-64 bg-brand-500 bottom-0 right-0 opacity-[0.05]" />
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <motion.aside
        variants={sidebarVariants}
        animate={collapsed ? 'closed' : 'open'}
        initial={false}
        className="relative z-20 flex flex-col shrink-0 border-r border-white/[0.06] bg-canvas-50/80 backdrop-blur-sm overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-white/[0.05]">
          <div ref={logoRef} className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-sm shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" />
              </svg>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="font-semibold text-sm text-zinc-100 tracking-tight whitespace-nowrap"
                >
                  FlowMail
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={toggle}
            className="text-zinc-600 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        {/* Command palette trigger */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="px-3 pt-3"
            >
              <button
                onClick={openCmd}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg
                           bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07]
                           text-zinc-500 text-xs transition-colors group"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="flex-1 text-left group-hover:text-zinc-300 transition-colors">
                  Quick actions...
                </span>
                <kbd className="text-[9px] bg-canvas-400 px-1.5 py-0.5 rounded-md font-mono text-zinc-600">
                  ⌘K
                </kbd>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav */}
        <motion.nav
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex-1 px-2 pt-3 pb-2 space-y-0.5 overflow-y-auto"
        >
          {NAV.map((item) => (
            <motion.div key={item.to} variants={staggerItem}>
              <NavItem
                item={item}
                collapsed={collapsed}
                badge={item.to === '/inbox' && unreadCount > 0 ? unreadCount : null}
              />
            </motion.div>
          ))}
        </motion.nav>

        {/* Settings + User footer */}
        <div className="border-t border-white/[0.05] px-2 py-2 space-y-0.5">
          <NavItem item={{ to: '/settings', label: 'Settings', shortcut: '', icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          )}} collapsed={collapsed} />

          {/* User chip */}
          <motion.div
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
            onClick={handleLogout}
            title="Sign out"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-medium text-zinc-300 truncate">{user?.name}</p>
                  <p className="text-[10px] text-zinc-600 truncate">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  )
}
