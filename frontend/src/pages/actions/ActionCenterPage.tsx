import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { emailApi } from '@/services/emailApi'
import { useEmailStore, EmailSummary } from '@/store/emailStore'
import { ComposeModal } from '@/components/ComposeModal'
import { staggerContainer, staggerItem, fadeUp } from '@/lib/motion'

interface FollowUp { email: EmailSummary; daysAgo: number }

function Section({ title, dot, count, children }: {
  title: string; dot: string; count: number; children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${dot}`} />
        <h2 className="text-xs font-semibold text-zinc-300">{title}</h2>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${dot.replace('bg-', 'bg-').replace('-500', '-500/20')} ${dot.replace('bg-', 'text-').replace('-500', '-400')}`}>
          {count}
        </span>
      </div>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-2"
      >
        {children}
      </motion.div>
    </section>
  )
}

function ActionRow({ email, onView, onAction, actionLabel, actionClass = 'btn-primary' }: {
  email: EmailSummary
  onView: () => void
  onAction: () => void
  actionLabel: string
  actionClass?: string
  extra?: React.ReactNode
}) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ x: 2 }}
      className="glass rounded-xl p-3.5 flex items-start justify-between gap-3"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">
          {email.senderName || email.senderEmail}
        </p>
        <p className="text-xs text-zinc-500 truncate">{email.subject}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onView}
          className="text-xs text-zinc-400 hover:text-zinc-100 bg-canvas-300 hover:bg-canvas-400 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          View
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className={`text-xs px-2.5 py-1.5 rounded-lg ${actionClass}`}
        >
          {actionLabel}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function ActionCenterPage() {
  const navigate = useNavigate()
  const { emails, setEmails, setLoading } = useEmailStore()
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [replyTarget, setReplyTarget] = useState<EmailSummary | null>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
    )
    setLoading(true)
    emailApi.getInbox(0, 50)
      .then((res) => {
        setEmails(res.content, res.totalPages)
        const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000
        setFollowUps(
          res.content
            .filter((e) => new Date(e.receivedAt).getTime() < fiveDaysAgo && !e.read)
            .slice(0, 5)
            .map((email) => ({
              email,
              daysAgo: Math.floor((Date.now() - new Date(email.receivedAt).getTime()) / (24 * 60 * 60 * 1000)),
            }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [setEmails, setLoading])

  const actionItems    = emails.filter((e) => e.requiresAction)
  const meetingItems   = emails.filter((e) => e.intent === 'MEETING_REQUEST')
  const allEmpty       = !actionItems.length && !meetingItems.length && !followUps.length

  return (
    <div className="flex flex-col h-full">
      <div ref={headerRef} className="px-5 py-3.5 border-b border-white/[0.05]">
        <h1 className="text-sm font-semibold text-zinc-100">Action Center</h1>
        <p className="text-xs text-zinc-600 mt-0.5">Everything that needs your attention</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-7">

        {actionItems.length > 0 && (
          <Section title="Needs Action" dot="bg-red-500" count={actionItems.length}>
            {actionItems.slice(0, 5).map((email) => (
              <ActionRow
                key={email.id}
                email={email}
                onView={() => navigate(`/inbox/${email.id}`)}
                onAction={() => setReplyTarget(email)}
                actionLabel="Reply"
                actionClass="btn-primary text-xs py-1.5"
              />
            ))}
          </Section>
        )}

        {meetingItems.length > 0 && (
          <Section title="Meeting Requests" dot="bg-brand-500" count={meetingItems.length}>
            {meetingItems.slice(0, 5).map((email) => (
              <motion.div
                key={email.id}
                variants={staggerItem}
                whileHover={{ x: 2 }}
                className="glass rounded-xl p-3.5 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">📅</span>
                    <p className="text-sm font-medium text-zinc-100 truncate">
                      {email.senderName || email.senderEmail}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{email.subject}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/inbox/${email.id}`)}
                  className="btn-primary text-xs py-1.5 shrink-0"
                >
                  Schedule
                </motion.button>
              </motion.div>
            ))}
          </Section>
        )}

        {followUps.length > 0 && (
          <Section title="Follow-up Radar" dot="bg-amber-400" count={followUps.length}>
            {followUps.map(({ email, daysAgo }) => (
              <motion.div
                key={email.id}
                variants={staggerItem}
                whileHover={{ x: 2 }}
                className="glass rounded-xl p-3.5 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {email.senderName || email.senderEmail}
                  </p>
                  <p className="text-xs text-zinc-500 truncate mb-0.5">{email.subject}</p>
                  <p className="text-[11px] text-amber-400">
                    {daysAgo} day{daysAgo !== 1 ? 's' : ''} — no reply sent
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setReplyTarget(email)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20 transition-colors shrink-0"
                >
                  Follow up
                </motion.button>
              </motion.div>
            ))}
          </Section>
        )}

        {allEmpty && (
          <motion.div
            {...fadeUp}
            className="flex flex-col items-center justify-center h-48 text-zinc-700"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-12 h-12 rounded-2xl bg-canvas-300 border border-white/[0.05] flex items-center justify-center mb-3"
            >
              <svg className="w-6 h-6 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <p className="text-sm font-medium text-zinc-500">All clear</p>
            <p className="text-xs mt-0.5">No actions needed right now</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {replyTarget && (
          <ComposeModal
            onClose={() => setReplyTarget(null)}
            defaultTo={replyTarget.senderEmail}
            defaultSubject={replyTarget.subject.startsWith('Re:') ? replyTarget.subject : `Re: ${replyTarget.subject}`}
            inReplyTo={replyTarget.id.toString()}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
