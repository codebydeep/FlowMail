import api from './axios'
import { AgentTask } from '@/store/agentStore'

export interface EmailAnalysis {
  emailId: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  intent: string
  category: string
  sentiment: string
  requiresAction: boolean
  summary: string
  entities: {
    date?: string
    time?: string
    person?: string
    action?: string
  }
  confidence: number
}

export const aiApi = {
  getAnalysis: async (emailId: number): Promise<EmailAnalysis> => {
    const { data } = await api.get<EmailAnalysis>(`/ai/analysis/${emailId}`)
    return data
  },

  chat: async (message: string, sessionId: string): Promise<AgentTask> => {
    const { data } = await api.post<AgentTask>('/ai/agent/chat', { message, sessionId })
    return data
  },

  confirmTask: async (taskId: number): Promise<AgentTask> => {
    const { data } = await api.post<AgentTask>(`/ai/agent/confirm/${taskId}`)
    return data
  },
}
