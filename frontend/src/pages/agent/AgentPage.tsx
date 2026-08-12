import { useState, useRef, useEffect, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { aiApi } from '@/services/aiApi'
import { useAgentStore, AgentMessage, AgentTask } from '@/store/agentStore'
import { staggerContainer, staggerItem, fadeUp, scaleIn } from '@/lib/motion'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

const ACTION_ICONS: Record<string, string> = {
  CREATE_CALENDAR_EVENT: '📅',
  SEND_EMAIL: '📧',
  ANSWER: '💬',
}

function PlanCard({ task, onConfirm, onCancel }: {
  task: AgentTask
  onConfirm: () => void
  onCancel: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  async function confirm() {
    setConfirming(true)
    await onConfirm()
    setConfirming(false)
  }

  return (
    <motion.div
      {...scaleIn}
      className="mt-2 bg-brand-600/[0.08] border border-brand-500/20 rounded-xl p-4"
    >
      <p className="text-[11px] font-semibold text-brand-400 uppercase tracking-wide mb-3">
        Proposed plan — confirm to execute
      </p>
      <div className="space-y-2.5 mb-4">
        {task.plan.map((step: any) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: step.step * 0.07 }}
            className="flex items-start gap-2.5"
          >
            <span className="text-sm mt-0.5 shrink-0">{ACTION_ICONS[step.action] ?? '⚙️'}</span>
            <div>
              <p className="text-xs font-medium text-zinc-300">{step.action?.replace(/_/g, ' ')}</p>
              <p className="text-[11px] text-zinc-500">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={confirm}
          disabled={confirming}
          className="flex-1 btn-primary text-xs py-2 justify-center disabled:opacity-50"
        >
          {confirming ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Executing...
            </span>
          ) : '✓ Confirm & Execute'}
        </motion.button>
        <button onClick={onCancel} className="btn-ghost text-xs px-3">Cancel</button>
      </div>
    </motion.div>
  )
}

function Bubble({ msg, pendingTask, onConfirm, onCancel }: {
  msg: AgentMessage
  pendingTask: AgentTask | null
  onConfirm: () => void
  onCancel: () => void
}) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      variants={staggerItem}
      className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-1 mr-2 shadow-glow-sm">
          AI
        </div>
      )}
      <div className="max-w-[80%]">
        <div className={clsx(
          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-brand-600 text-white rounded-br-sm shadow-glow-sm'
            : 'glass text-zinc-200 rounded-bl-sm'
        )}>
          <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
        </div>

        {/* Pending task confirmation */}
        {!isUser && msg.task && pendingTask?.id === msg.task.id
          && pendingTask.status === 'AWAITING_CONFIRMATION' && (
          <PlanCard task={pendingTask} onConfirm={onConfirm} onCancel={onCancel} />
        )}

        {/* Completed indicator */}
        {!isUser && msg.task?.status === 'COMPLETED' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-400"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Done
          </motion.div>
        )}

        <span className="text-[10px] text-zinc-700 mt-0.5 block px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}

const EXAMPLES = [
  { icon: '📅', text: 'Schedule a meeting with Rahul next Thursday at 9 AM' },
  { icon: '📧', text: 'Draft a follow-up email to Amit about the project proposal' },
  { icon: '🔍', text: 'Find emails about the pricing discussion' },
]

export default function AgentPage() {
  const { messages, pendingTask, sessionId, loading, addMessage, setPendingTask, setLoading, clearSession } = useAgentStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // GSAP header
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      )
    }
  }, [])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    addMessage({ id: uuidv4(), role: 'user', content: text, timestamp: new Date() })
    setLoading(true)

    try {
      const task = await aiApi.chat(text, sessionId)
      setPendingTask(task)

      const planDesc = task.plan.map((s: any) => `${s.step}. ${s.description}`).join('\n')
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: `I'll do the following:\n\n${planDesc}`,
        timestamp: new Date(),
        task,
      })
    } catch {
      toast.error('Agent failed')
      addMessage({ id: uuidv4(), role: 'assistant', content: 'Sorry, something went wrong. Try again.', timestamp: new Date() })
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!pendingTask) return
    setLoading(true)
    try {
      const result = await aiApi.confirmTask(pendingTask.id)
      setPendingTask(result)
      const text = result.result?.answer ? String(result.result.answer) : 'Done! All steps executed.'
      addMessage({ id: uuidv4(), role: 'assistant', content: text, timestamp: new Date(), task: result })
    } catch {
      toast.error('Execution failed')
    } finally { setLoading(false) }
  }

  function handleCancel() {
    setPendingTask(null)
    addMessage({ id: uuidv4(), role: 'assistant', content: 'Cancelled. What else can I help with?', timestamp: new Date() })
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">AI Agent</h1>
          <p className="text-xs text-zinc-600">Schedule, send emails, search — by chat</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearSession} className="btn-ghost text-xs">Clear</button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <motion.div
            {...fadeUp}
            className="flex flex-col items-center justify-center h-full text-center px-4"
          >
            {/* Animated orb */}
            <motion.div
              animate={{ y: [0, -8, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-700/20 border border-brand-500/20 flex items-center justify-center mb-5 shadow-glow"
            >
              <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
            </motion.div>
            <h2 className="text-base font-semibold text-zinc-100 mb-1">FlowMail AI</h2>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs">
              Tell me what you need — schedule meetings, send emails, find anything.
            </p>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-2 w-full max-w-sm"
            >
              {EXAMPLES.map(({ icon, text }) => (
                <motion.button
                  key={text}
                  variants={staggerItem}
                  whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.06)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setInput(text); inputRef.current?.focus() }}
                  className="w-full text-left glass rounded-xl px-4 py-3 flex items-center gap-3 transition-colors"
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs text-zinc-400 leading-snug">&ldquo;{text}&rdquo;</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {messages.map((msg) => (
              <Bubble
                key={msg.id}
                msg={msg}
                pendingTask={pendingTask}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              />
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-zinc-600">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  AI
                </div>
                <div className="glass rounded-2xl px-4 py-3 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      className="w-1.5 h-1.5 bg-zinc-600 rounded-full"
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </motion.div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-white/[0.05] px-4 py-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FlowMail to do something..."
              disabled={loading}
              className="input pr-10 disabled:opacity-50"
            />
            {input.length > 0 && (
              <motion.button
                type="button"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => setInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </div>
          <motion.button
            type="submit"
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-glow-sm hover:shadow-glow transition-all"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
      </form>
    </div>
  )
}
