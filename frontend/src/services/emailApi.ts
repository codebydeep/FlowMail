import api from './axios'
import { EmailSummary, EmailDetail } from '@/store/emailStore'

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
}

export interface SendEmailPayload {
  to: string[]
  cc?: string[]
  subject: string
  body: string
  inReplyTo?: string
  idempotencyKey?: string
}

export const emailApi = {
  getInbox: async (page = 0, size = 20): Promise<PageResponse<EmailSummary>> => {
    const { data } = await api.get<PageResponse<EmailSummary>>('/emails', {
      params: { page, size },
    })
    return data
  },

  getEmail: async (id: number): Promise<EmailDetail> => {
    const { data } = await api.get<EmailDetail>(`/emails/${id}`)
    return data
  },

  search: async (q: string, page = 0, size = 20): Promise<PageResponse<EmailSummary>> => {
    const { data } = await api.get<PageResponse<EmailSummary>>('/emails/search', {
      params: { q, page, size },
    })
    return data
  },

  send: async (payload: SendEmailPayload): Promise<void> => {
    await api.post('/emails/send', payload)
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<{ count: number }>('/emails/unread-count')
    return data.count
  },
}
