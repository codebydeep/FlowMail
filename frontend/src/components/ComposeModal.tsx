import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { emailApi } from '@/services/emailApi'
import type { SendEmailPayload } from '@/services/emailApi'
import { overlayVariants, modalVariants } from '@/lib/motion'
import toast from 'react-hot-toast'

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

interface Props {
  onClose: () => void
  defaultTo?: string
  defaultSubject?: string
  defaultBody?: string
  inReplyTo?: string
}

export function ComposeModal({ onClose, defaultTo = '', defaultSubject = '', defaultBody = '', inReplyTo }: Props) {
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)
  const [loading, setLoading] = useState(false)

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!to.trim() || !body.trim()) { toast.error('To and body are required'); return }
    setLoading(true)
    try {
      const payload: SendEmailPayload = {
        to: to.split(',').map((t) => t.trim()).filter(Boolean),
        subject,
        body,
        inReplyTo,
        idempotencyKey: uuidv4(),
      }
      await emailApi.send(payload)
      toast.success('Email sent!')
      onClose()
    } catch {
      toast.error('Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      variants={overlayVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl w-full max-w-lg shadow-glass-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-zinc-100">
            {inReplyTo ? '↩ Reply' : '✉ New email'}
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>

        <form onSubmit={handleSend} className="p-5 space-y-3">
          {[
            { placeholder: 'To', value: to, set: setTo, type: 'text' },
            { placeholder: 'Subject', value: subject, set: setSubject, type: 'text' },
          ].map(({ placeholder, value, set, type }) => (
            <input
              key={placeholder}
              type={type}
              placeholder={placeholder}
              value={value}
              onChange={(e) => set(e.target.value)}
              className="input"
            />
          ))}
          <textarea
            placeholder="Write your message..."
            rows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input resize-none"
          />

          <div className="flex justify-end gap-2 pt-1">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="btn-ghost text-sm"
            >
              Discard
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="btn-primary"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
