import axios from 'axios'
import { User } from '@/store/authStore'

const base = axios.create({ baseURL: '/api/auth' })

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export const authApi = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const { data } = await base.post<AuthResponse>('/register', { name, email, password })
    return data
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await base.post<AuthResponse>('/login', { email, password })
    return data
  },

  logout: async (): Promise<void> => {
    // Gateway forwards X-User-Id header from JWT
    await base.post('/logout')
  },
}
