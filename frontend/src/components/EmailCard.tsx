import { motion } from 'framer-motion'
import { EmailSummary } from '@/store/emailStore'
import { formatDistanceToNow } from 'date-fns'
import { staggerItem } from '@/lib/motion'
import clsx from 'clsx'

const PRIORITY_DOT: Record<string, string> = {
  HIGH:   'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]',
  MEDIUM: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.7)]',
  LOW:    'bg-zinc-700',
}

const INTENT_CHIP: Record<string, { label: string; color: string }> = {
  MEETING_REQUEST: { label: '📅 Meeting',   color: 'bg-brand-500/15 text-brand-400 border-brand-500/20' },
  ACTION_REQUIRED: { label: '⚡ Action',    color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  FOLLOW_UP:       { label: '🔁 Follow-up', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  URGENT:          { label: '🚨 Urgent',    color: 'bg-red-500/15 text-red-400 border-red-500/20' },
}

interface Props {
  email: EmailSummary
  selected?: boolean
  onClick: () => void
}

export function EmailCard({ email, selected, onClick }: Props) {
  const timeAgo = formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })
  const chip = email.intent ? INTENT_CHIP[email.intent] : null

  return (
    <motion.button
      variants={staggerItem}
      onClick={onClick}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)', x: 1 }}
      whileTap={{ scale: 0.995 }}
      className={clsx(
        'w-full text-left px-4 py-3 border-b border-white/[0.04] transition-colors relative group',
        selected && 'bg-brand-500/[0.07] border-l-2 border-l-brand-500',
        !email.read && 'bg-white/[0.015]'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Priority dot */}
        <div className="pt-1.5 shrink-0">
          <motion.div
            animate={email.priority === 'HIGH' ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className={clsx(
              'w-1.5 h-1.5 rounded-full',
              email.priority ? PRIORITY_DOT[email.priority] : 'bg-zinc-800'
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Sender + time */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={clsx(
              'text-sm truncate',
              email.read ? 'text-zinc-400 font-normal' : 'text-zinc-100 font-semibold'
            )}>
              {email.senderName || email.senderEmail}
            </span>
            <span className="text-[11px] text-zinc-600 shrink-0 whitespace-nowrap group-hover:text-zinc-500 transition-colors">
              {timeAgo}
            </span>
          </div>

          {/* Subject */}
          <p className={clsx(
            'text-sm truncate mb-1',
            email.read ? 'text-zinc-500' : 'text-zinc-300'
          )}>
            {email.subject || '(no subject)'}
          </p>

          {/* Snippet + intent chip */}
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-600 truncate flex-1">{email.snippet}</p>
            {chip && (
              <span className={clsx(
                'text-[10px] px-1.5 py-0.5 rounded-md border font-medium shrink-0',
                chip.color
              )}>
                {chip.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  )
}
