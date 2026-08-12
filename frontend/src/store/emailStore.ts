import { create } from 'zustand'

export interface EmailSummary {
  id: number
  senderEmail: string
  senderName: string
  subject: string
  snippet: string
  receivedAt: string
  read: boolean
  starred: boolean
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
  intent?: string
  requiresAction?: boolean
}

export interface EmailDetail extends EmailSummary {
  threadId: number
  recipients: string[]
  cc: string[]
  bodyPlain: string
  bodyHtml: string
}

interface EmailState {
  emails: EmailSummary[]
  selectedEmail: EmailDetail | null
  loading: boolean
  searchResults: EmailSummary[]
  unreadCount: number
  totalPages: number
  currentPage: number

  setEmails: (emails: EmailSummary[], totalPages: number) => void
  addEmail: (email: EmailSummary) => void  // for real-time push
  setSelectedEmail: (email: EmailDetail | null) => void
  markAsRead: (id: number) => void
  setLoading: (loading: boolean) => void
  setSearchResults: (results: EmailSummary[]) => void
  setUnreadCount: (count: number) => void
  setCurrentPage: (page: number) => void
}

export const useEmailStore = create<EmailState>((set) => ({
  emails: [],
  selectedEmail: null,
  loading: false,
  searchResults: [],
  unreadCount: 0,
  totalPages: 0,
  currentPage: 0,

  setEmails: (emails, totalPages) => set({ emails, totalPages }),

  addEmail: (email) =>
    set((state) => ({
      emails: [email, ...state.emails],
      unreadCount: state.unreadCount + 1,
    })),

  setSelectedEmail: (email) => set({ selectedEmail: email }),

  markAsRead: (id) =>
    set((state) => ({
      emails: state.emails.map((e) => (e.id === id ? { ...e, read: true } : e)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  setLoading: (loading) => set({ loading }),

  setSearchResults: (results) => set({ searchResults: results }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  setCurrentPage: (page) => set({ currentPage: page }),
}))
