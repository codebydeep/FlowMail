import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { calendarApi, CalendarEvent, CreateEventPayload } from '@/services/calendarApi'
import {
  format, startOfWeek, addDays, isSameDay, startOfDay,
  addWeeks, subWeeks, parseISO, isToday as isTodayFn,
} from 'date-fns'
import { staggerContainer, staggerItem, modalVariants, overlayVariants, fadeUp } from '@/lib/motion'
import toast from 'react-hot-toast'

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8) // 8 AM – 6 PM

function EventBlock({ event, idx }: { event: CalendarEvent; idx: number }) {
  const start = parseISO(event.startTime)
  const end   = parseISO(event.endTime)
  const hour = start.getHours()
  const minute = start.getMinutes()
  const durMin = (end.getTime() - start.getTime()) / 60000
  const top    = ((hour - 8) * 60 + minute) / (11 * 60) * 100
  const height = Math.max(durMin / (11 * 60) * 100, 2)

  const colors = [
    'bg-brand-600/80 border-brand-500/50 text-brand-100',
    'bg-emerald-600/70 border-emerald-500/50 text-emerald-100',
    'bg-purple-600/70 border-purple-500/50 text-purple-100',
    'bg-amber-600/70 border-amber-500/50 text-amber-100',
  ]
  const color = colors[idx % colors.length]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05, duration: 0.2 }}
      className={`absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 border overflow-hidden cursor-pointer ${color}`}
      style={{ top: `${top}%`, height: `${height}%`, minHeight: 18 }}
      title={event.title}
    >
      <p className="text-[10px] font-semibold truncate">{event.title}</p>
      <p className="text-[9px] opacity-80">{format(start, 'h:mm a')}</p>
    </motion.div>
  )
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [creating, setCreating] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const today = startOfDay(new Date())
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    const from = weekStart.toISOString()
    const to = addDays(weekStart, 7).toISOString()
    setLoading(true)
    calendarApi.getEvents(from, to)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [weekStart])

  // GSAP entrance for week columns
  useEffect(() => {
    if (!gridRef.current || loading) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        gridRef.current!.querySelectorAll('.day-col'),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power3.out' }
      )
    }, gridRef)
    return () => ctx.revert()
  }, [weekStart, loading])

  // GSAP header entrance
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      )
    }
  }, [])

  async function handleCreate() {
    if (!newTitle || !newStart || !newEnd) { toast.error('Fill all fields'); return }
    setCreating(true)
    try {
      const payload: CreateEventPayload = {
        title: newTitle,
        startTime: new Date(newStart).toISOString(),
        endTime:   new Date(newEnd).toISOString(),
        sendInvite: false,
      }
      const created = await calendarApi.createEvent(payload)
      setEvents((prev) => [...prev, created])
      toast.success('Event created!')
      setShowCreate(false)
      setNewTitle(''); setNewStart(''); setNewEnd('')
    } catch {
      toast.error('Failed to create event')
    } finally { setCreating(false) }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Topbar */}
      <div ref={headerRef} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          {[
            { onClick: () => setWeekStart((w) => subWeeks(w, 1)), icon: 'M15 19l-7-7 7-7' },
            { onClick: () => setWeekStart((w) => addWeeks(w, 1)), icon: 'M9 5l7 7-7 7' },
          ].map(({ onClick, icon }, i) => (
            <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={onClick} className="btn-ghost p-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
            </motion.button>
          ))}
          <h1 className="text-sm font-semibold text-zinc-100">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </h1>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="btn-ghost text-xs px-2 py-1"
          >
            Today
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreate(true)}
          className="btn-primary text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New event
        </motion.button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        {loading && (
          <motion.div {...fadeUp} className="flex items-center justify-center h-12 text-zinc-600 text-xs">
            Loading events...
          </motion.div>
        )}

        <div className="flex" style={{ minWidth: 0 }}>
          {/* Time gutter */}
          <div className="w-14 shrink-0 border-r border-white/[0.05]">
            <div className="h-10 border-b border-white/[0.05]" />
            {HOURS.map((h) => (
              <div key={h} className="h-14 border-b border-white/[0.03] flex items-start justify-end pr-2 pt-0.5">
                <span className="text-[10px] text-zinc-700 font-mono">{h % 12 || 12}{h < 12 ? 'a' : 'p'}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const isToday = isSameDay(day, today)
            const dayEvents = events.filter((e) => isSameDay(parseISO(e.startTime), day))

            return (
              <motion.div
                key={day.toISOString()}
                className="day-col flex-1 border-r border-white/[0.05] last:border-r-0"
                style={{ opacity: 0 }} // GSAP will animate this
              >
                {/* Day header */}
                <div className={`h-10 border-b border-white/[0.05] flex flex-col items-center justify-center
                  ${isToday ? 'bg-brand-600/10' : ''}`}>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wide">{format(day, 'EEE')}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center
                    ${isToday ? 'bg-brand-600 shadow-glow-sm' : ''}`}>
                    <span className={`text-xs font-semibold ${isToday ? 'text-white' : 'text-zinc-400'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                </div>

                {/* Hour rows + events */}
                <div className="relative">
                  {HOURS.map((h) => (
                    <div key={h} className="h-14 border-b border-white/[0.03]" />
                  ))}
                  {dayEvents.map((event, idx) => (
                    <EventBlock key={event.id} event={event} idx={idx} />
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Create event modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            variants={overlayVariants}
            initial="initial" animate="animate" exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl w-full max-w-sm p-6 shadow-glass-lg"
            >
              <h3 className="text-sm font-semibold text-zinc-100 mb-4">New event</h3>
              <div className="space-y-3">
                <input
                  type="text" placeholder="Title"
                  value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  className="input"
                />
                {[
                  { label: 'Start', value: newStart, set: setNewStart },
                  { label: 'End',   value: newEnd,   set: setNewEnd },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="text-xs text-zinc-600 mb-1 block">{label}</label>
                    <input
                      type="datetime-local"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="input"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <motion.button
                  onClick={() => setShowCreate(false)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 btn-ghost text-sm py-2 justify-center"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCreate} disabled={creating}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 btn-primary text-sm py-2 justify-center disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create event'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
