import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calendarApi, CreateEventPayload } from '@/services/calendarApi'
import { EmailAnalysis } from '@/services/aiApi'
import { scaleIn } from '@/lib/motion'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Props {
  analysis: EmailAnalysis
  senderEmail: string
  emailId: number
  onScheduled?: () => void
}

export function MeetingDetectedBanner({ analysis, senderEmail, emailId, onScheduled }: Props) {
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [scheduled, setScheduled] = useState(false)

  if (dismissed || analysis.intent !== 'MEETING_REQUEST') return null

  async function handleSchedule() {
    setLoading(true)
    try {
      const now = new Date()
      const start = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      start.setHours(9, 0, 0, 0)
      const end = new Date(start.getTime() + 30 * 60 * 1000)

      const payload: CreateEventPayload = {
        title: `Meeting with ${senderEmail}`,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        attendeeEmails: [senderEmail],
        sourceEmailId: emailId,
        sendInvite: true,
      }
      await calendarApi.createEvent(payload)
      setScheduled(true)
      toast.success('Meeting scheduled and invite sent!')
      onScheduled?.()
      setTimeout(() => setDismissed(true), 1800)
    } catch {
      toast.error('Failed to schedule meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        {...scaleIn}
        className="mx-4 mt-3 relative overflow-hidden rounded-xl border border-brand-500/20 bg-brand-500/[0.07]"
      >
        {/* Subtle gradient fill */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-transparent pointer-events-none" />

        <div className="relative p-4">
          {scheduled ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-brand-300 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Meeting scheduled! Invite sent to {senderEmail}
            </motion.div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <motion.span
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="text-base"
                    >
                      📅
                    </motion.span>
                    <span className="text-xs font-semibold text-brand-300">Meeting intent detected</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.entities?.date && (
                      <span className="text-[10px] bg-canvas-400 border border-white/[0.07] px-2 py-0.5 rounded-md text-zinc-400">
                        📆 {analysis.entities.date}
                      </span>
                    )}
                    {analysis.entities?.time && (
                      <span className="text-[10px] bg-canvas-400 border border-white/[0.07] px-2 py-0.5 rounded-md text-zinc-400">
                        🕘 {analysis.entities.time}
                      </span>
                    )}
                    {analysis.entities?.person && (
                      <span className="text-[10px] bg-canvas-400 border border-white/[0.07] px-2 py-0.5 rounded-md text-zinc-400">
                        👤 {analysis.entities.person}
                      </span>
                    )}
                  </div>
                  {analysis.summary && (
                    <p className="mt-2 text-[11px] text-zinc-500 italic">{analysis.summary}</p>
                  )}
                </div>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-zinc-700 hover:text-zinc-400 text-lg leading-none transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="flex gap-2">
                <motion.button
                  onClick={handleSchedule}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className={clsx(
                    'flex-1 btn-primary text-xs py-2',
                    loading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Scheduling...
                    </span>
                  ) : '📅 Schedule + Reply'}
                </motion.button>
                <button
                  onClick={() => setDismissed(true)}
                  className="btn-ghost text-xs px-3"
                >
                  Ignore
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
