import { User, TokenResponse } from './auth'

export type AuthState = {
  user: User | null
  tokens: TokenResponse | null
  isAuthenticated: boolean
  isLoading: boolean
}

export type AuthActions = {
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>
  apiCallWithRefresh: <T>(apiCall: (accessToken: string) => Promise<T>) => Promise<T>
}