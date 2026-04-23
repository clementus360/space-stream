'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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
  const stateRef = useRef(state)
  const refreshPromiseRef = useRef<Promise<TokenResponse | null> | null>(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

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
  const logout = useCallback(async () => {
    try {
      const accessToken = stateRef.current.tokens?.access_token
      if (accessToken) {
        await authApi.logout(accessToken)
      }
    } finally {
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }, [])

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
  const refreshTokens = useCallback(async (showModal: boolean = false): Promise<TokenResponse | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const refreshToken = stateRef.current.tokens?.refresh_token
    if (!refreshToken) {
      await logout()
      return null
    }

    if (showModal) {
      setShowRefreshModal(true)
    }

    const refreshPromise = (async () => {
      setIsRefreshing(true)

      try {
        const refreshed = await authApi.refresh({
          refresh_token: refreshToken,
        })

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

        return refreshed
      } catch (err) {
        console.error('Token refresh failed:', err)
        if (showModal) {
          setShowRefreshModal(false)
        }
        await logout()
        return null
      } finally {
        setIsRefreshing(false)
        refreshPromiseRef.current = null
      }
    })()

    refreshPromiseRef.current = refreshPromise
    return refreshPromise
  }, [logout])

  const refresh = useCallback(async () => {
    await refreshTokens(false)
  }, [refreshTokens])

  // ---- Check and proactively refresh token before API calls ----
  const ensureValidToken = useCallback(async () => {
    const tokens = stateRef.current.tokens
    if (isTokenExpiringSoon(tokens)) {
      console.log('Token expiring soon, refreshing proactively...')
      await refreshTokens(false)
    }
  }, [refreshTokens])

  // ---- Auto-refresh on mount if we have tokens ----
  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated && state.tokens && !isRefreshing) {
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
  }, [state.isLoading, state.isAuthenticated, state.tokens?.access_token, isRefreshing, refresh])

  // ---- API call wrapper with automatic proactive token refresh ----
  const apiCallWithRefresh = useCallback(async <T,>(
    apiCall: (accessToken: string) => Promise<T>
  ): Promise<T> => {
    if (!stateRef.current.tokens?.access_token) {
      throw new Error('Not authenticated')
    }

    // Check and refresh token before making the request
    await ensureValidToken()

    const currentAccessToken = stateRef.current.tokens?.access_token
    if (!currentAccessToken) {
      throw new Error('Not authenticated')
    }

    try {
      return await apiCall(currentAccessToken)
    } catch (err: any) {
      // If we get a 401, try refreshing the token and retry once
      if (err.message?.includes('401') || err.message?.includes('unauthorized')) {
        console.log('Got 401, attempting token refresh...')
        const refreshed = await refreshTokens(false)

        // Retry with the latest token after refresh
        const nextAccessToken = refreshed?.access_token || stateRef.current.tokens?.access_token
        if (nextAccessToken) {
          return await apiCall(nextAccessToken)
        }
      }
      throw err
    }
  }, [ensureValidToken, refreshTokens])

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
