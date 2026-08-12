import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { emailApi } from '@/services/emailApi'
import { aiApi, EmailAnalysis } from '@/services/aiApi'
import { useEmailStore, EmailDetail } from '@/store/emailStore'
import { MeetingDetectedBanner } from '@/components/MeetingDetectedBanner'
import { ComposeModal } from '@/components/ComposeModal'
import { slideRight, fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { formatDistanceToNow, format } from 'date-fns'
import clsx from 'clsx'

export default function EmailDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setSelectedEmail, markAsRead } = useEmailStore()
  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReply, setShowReply] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    const emailId = parseInt(id)
    setLoading(true)

    emailApi.getEmail(emailId)
      .then((e) => {
        setEmail(e)
        setSelectedEmail(e)
        markAsRead(emailId)
      })
      .catch(() => navigate('/inbox'))
      .finally(() => setLoading(false))

    aiApi.getAnalysis(emailId).then(setAnalysis).catch(() => {})
  }, [id, navigate, setSelectedEmail, markAsRead])

  // GSAP scroll reveal for email body paragraphs
  useEffect(() => {
    if (!bodyRef.current || loading) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        bodyRef.current!.querySelectorAll('p, pre'),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out', delay: 0.15 }
      )
    }, bodyRef)
    return () => ctx.revert()
  }, [loading, email])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center gap-3">
          <div className="w-4 h-4 rounded skeleton" />
          <div className="h-4 w-48 rounded skeleton" />
        </div>
        <div className="p-6 space-y-4">
          <div className="h-6 w-64 rounded skeleton" />
          <div className="h-4 w-40 rounded skeleton" />
          <div className="h-px bg-white/[0.05]" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={clsx('h-3 rounded skeleton', i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-4/5' : 'w-3/5')} />
          ))}
        </div>
      </div>
    )
  }

  if (!email) return null

  const received = new Date(email.receivedAt)

  return (
    <motion.div
      {...slideRight}
      className="flex flex-col h-full"
    >
      {/* Topbar */}
      <div ref={headerRef} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05]">
        <motion.button
          whileHover={{ x: -2, scale: 1.05 }} whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/inbox')}
          className="btn-ghost p-1.5"
          aria-label="Back"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        <h1 className="flex-1 text-sm font-semibold text-zinc-100 truncate">{email.subject}</h1>

        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowReply(true)}
          className="btn-primary text-xs py-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Reply
        </motion.button>
      </div>

      {/* Meeting AI Banner */}
      {analysis && (
        <MeetingDetectedBanner
          analysis={analysis}
          senderEmail={email.senderEmail}
          emailId={email.id}
        />
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="p-5 md:p-7 max-w-3xl"
        >
          {/* Email header */}
          <motion.div variants={staggerItem} className="mb-5">
            <h2 className="text-xl font-bold text-zinc-100 mb-4 leading-snug">{email.subject}</h2>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/30 to-brand-700/30 border border-brand-500/20 flex items-center justify-center text-brand-300 text-sm font-bold shrink-0">
                {(email.senderName || email.senderEmail)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{email.senderName || email.senderEmail}</p>
                    <p className="text-xs text-zinc-600">{email.senderEmail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-zinc-500">{format(received, 'MMM d, yyyy · h:mm a')}</p>
                    <p className="text-[10px] text-zinc-700">{formatDistanceToNow(received, { addSuffix: true })}</p>
                  </div>
                </div>
                {email.recipients?.length > 0 && (
                  <p className="text-xs text-zinc-600 mt-1">To: {email.recipients.join(', ')}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* AI analysis chips */}
          {analysis && (
            <motion.div variants={staggerItem} className="flex gap-2 mb-5 flex-wrap">
              <span className={clsx(
                'text-[10px] px-2.5 py-1 rounded-lg border font-medium',
                analysis.priority === 'HIGH'   ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                analysis.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-zinc-800 text-zinc-500 border-zinc-700'
              )}>
                {analysis.priority} PRIORITY
              </span>
              {analysis.requiresAction && (
                <span className="text-[10px] px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
                  ACTION REQUIRED
                </span>
              )}
              {analysis.intent && (
                <span className="text-[10px] px-2.5 py-1 rounded-lg bg-canvas-300 text-zinc-400 border border-white/[0.06] font-medium">
                  {analysis.intent.replace(/_/g, ' ')}
                </span>
              )}
              {analysis.confidence > 0.8 && (
                <span className="text-[10px] px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium">
                  {Math.round(analysis.confidence * 100)}% confidence
                </span>
              )}
            </motion.div>
          )}

          {/* Divider */}
          <motion.div variants={staggerItem} className="border-t border-white/[0.05] mb-5" />

          {/* Email body */}
          <motion.div ref={bodyRef} variants={staggerItem}>
            {email.bodyHtml ? (
              <div
                className="prose prose-invert prose-sm max-w-none
                           prose-p:text-zinc-300 prose-headings:text-zinc-100
                           prose-a:text-brand-400 hover:prose-a:text-brand-300
                           prose-blockquote:border-l-brand-600 prose-blockquote:text-zinc-500
                           prose-code:bg-canvas-300 prose-code:text-brand-300"
                dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
              />
            ) : (
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                {email.bodyPlain}
              </pre>
            )}
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showReply && (
          <ComposeModal
            onClose={() => setShowReply(false)}
            defaultTo={email.senderEmail}
            defaultSubject={email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`}
            inReplyTo={email.id.toString()}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
