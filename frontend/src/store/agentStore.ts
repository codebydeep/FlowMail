import { create } from 'zustand'

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  task?: AgentTask
}

export interface AgentTask {
  id: number
  status: 'PLANNING' | 'AWAITING_CONFIRMATION' | 'EXECUTING' | 'COMPLETED' | 'FAILED'
  userInput: string
  plan: AgentPlanStep[]
  result?: Record<string, unknown>
}

export interface AgentPlanStep {
  step: number
  action: string
  description: string
  [key: string]: unknown
}

interface AgentState {
  messages: AgentMessage[]
  pendingTask: AgentTask | null
  sessionId: string
  loading: boolean

  addMessage: (message: AgentMessage) => void
  setPendingTask: (task: AgentTask | null) => void
  setLoading: (loading: boolean) => void
  clearSession: () => void
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const useAgentStore = create<AgentState>((set) => ({
  messages: [],
  pendingTask: null,
  sessionId: generateSessionId(),
  loading: false,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setPendingTask: (task) => set({ pendingTask: task }),

  setLoading: (loading) => set({ loading }),

  clearSession: () =>
    set({ messages: [], pendingTask: null, sessionId: generateSessionId() }),
}))
