'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '@/utils/api/auth'
import { AuthState, AuthActions } from '@/types/auth-state'
import { TokenResponse, User, UserStatus } from '@/types/auth'
import { ConfirmModal } from '@/components/sections/auth/ConfirmModal'

type AuthContextValue = AuthState & AuthActions & {
  ensureValidToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const STORAGE_KEY = 'auth_state'
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

// Helper to check if token is expired or about to expire
const isTokenExpiringSoon = (tokens: TokenResponse | null): boolean => {
  if (!tokens || !tokens.issued_at) return false
  
  const issuedAt = tokens.issued_at
  const expiresIn = tokens.expires_in * 1000 // Convert seconds to milliseconds
  const expiresAt = issuedAt + expiresIn
  const now = Date.now()
  
  // Refresh if less than threshold remains
  return (expiresAt - now) < REFRESH_THRESHOLD_MS
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showRefreshModal, setShowRefreshModal] = useState(false)

  // ---- Load persisted state ----
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setState((s) => ({ ...s, isLoading: false }))
      return
    }

    const parsed = JSON.parse(raw) as AuthState
    setState({ ...parsed, isLoading: false })
  }, [])

  // ---- Persist ----
  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  // ---- Login ----
  const login = async (username: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }))

    const tokens: TokenResponse = await authApi.login({ username, password })
    // Add issued_at timestamp
    tokens.issued_at = Date.now()
    
    const user: User = await authApi.getCurrentUser(tokens.access_token)

    setState({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
    })
  }

  // ---- Logout ----
  const logout = async () => {
    try {
      if (state.tokens?.access_token) {
        await authApi.logout(state.tokens.access_token)
      }
    } finally {
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  // ---- Register ----
  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await authApi.register({ username, email, password, roles: ['user'] })
      return { success: true, message: res.message }
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed' }
    }
  }

  // ---- Refresh token ----
  const refresh = useCallback(async (showModal: boolean = false) => {
    if (isRefreshing) return // Prevent multiple simultaneous refresh attempts
    
    if (!state.tokens?.refresh_token) {
      await logout()
      return
    }

    // Show modal if requested
    if (showModal) {
      setShowRefreshModal(true)
    }

    setIsRefreshing(true)
    
    try {
      const refreshed = await authApi.refresh({
        refresh_token: state.tokens.refresh_token,
      })

      // Add issued_at timestamp to new tokens
      refreshed.issued_at = Date.now()

      const user = await authApi.getCurrentUser(refreshed.access_token)

      setState({
        tokens: refreshed,
        user,
        isAuthenticated: true,
        isLoading: false,
      })
      
      if (showModal) {
        setShowRefreshModal(false)
      }
    } catch (err) {
      console.error('Token refresh failed:', err)
      if (showModal) {
        setShowRefreshModal(false)
      }
      await logout()
    } finally {
      setIsRefreshing(false)
    }
  }, [state.tokens?.refresh_token])

  // ---- Check and proactively refresh token before API calls ----
  const ensureValidToken = useCallback(async () => {
    if (isTokenExpiringSoon(state.tokens)) {
      console.log('Token expiring soon, refreshing proactively...')
      // Show modal and refresh
      await refresh(true)
    }
  }, [state.tokens, refresh])

  // ---- Auto-refresh on mount if we have tokens ----
  useEffect(() => {
    if (state.isAuthenticated && state.tokens && !isRefreshing) {
      // Validate token on mount/reload
      authApi.validate(state.tokens.access_token)
        .then((res) => {
          if (!res.valid) {
            refresh()
          }
        })
        .catch(() => {
          refresh()
        })
    }
  }, []) // Only run once on mount

  // ---- API call wrapper with automatic proactive token refresh ----
  const apiCallWithRefresh = useCallback(async <T,>(
    apiCall: (accessToken: string) => Promise<T>
  ): Promise<T> => {
    if (!state.tokens?.access_token) {
      throw new Error('Not authenticated')
    }

    // Check and refresh token before making the request
    await ensureValidToken()

    try {
      return await apiCall(state.tokens.access_token)
    } catch (err: any) {
      // If we get a 401, try refreshing the token and retry once
      if (err.message?.includes('401') || err.message?.includes('unauthorized')) {
        console.log('Got 401, attempting token refresh...')
        await refresh()
        
        // Retry with the new token
        if (state.tokens?.access_token) {
          return await apiCall(state.tokens.access_token)
        }
      }
      throw err
    }
  }, [state.tokens?.access_token, ensureValidToken, refresh])

  return (
    <>
      <AuthContext.Provider value={{ ...state, login, register, logout, refresh, apiCallWithRefresh, ensureValidToken }}>
        {children}
      </AuthContext.Provider>

      {/* Modal for token refresh confirmation */}
      <ConfirmModal
        isOpen={showRefreshModal}
        title="Session Refreshed"
        description="Your session has been automatically refreshed to keep you logged in."
        confirmLabel="Continue"
        cancelLabel=""
        onConfirm={() => setShowRefreshModal(false)}
        onCancel={() => setShowRefreshModal(false)}
      />
    </>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
