import api from './axios'

export interface CalendarEvent {
  id: number
  userId: number
  title: string
  description?: string
  location?: string
  startTime: string
  endTime: string
  timezone: string
  allDay: boolean
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED'
  sourceEmailId?: number
}

export interface AvailabilitySlot {
  start: string
  end: string
}

export interface CreateEventPayload {
  title: string
  description?: string
  location?: string
  startTime: string
  endTime: string
  timezone?: string
  attendeeEmails?: string[]
  sourceEmailId?: number
  sendInvite?: boolean
}

export const calendarApi = {
  getEvents: async (from: string, to: string): Promise<CalendarEvent[]> => {
    const { data } = await api.get<CalendarEvent[]>('/calendar/events', {
      params: { from, to },
    })
    return data
  },

  createEvent: async (payload: CreateEventPayload): Promise<CalendarEvent> => {
    const { data } = await api.post<CalendarEvent>('/calendar/events', payload)
    return data
  },

  getAvailability: async (
    from: string,
    to: string,
    duration = 30
  ): Promise<AvailabilitySlot[]> => {
    const { data } = await api.get<AvailabilitySlot[]>('/calendar/availability', {
      params: { from, to, duration },
    })
    return data
  },
}
