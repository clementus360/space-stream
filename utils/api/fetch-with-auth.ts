import { authApi } from './auth'

type FetchWithAuthOptions = {
  accessToken: string
  refreshToken: string
  onTokenRefresh: (newAccessToken: string, newRefreshToken: string, expiresIn: number) => void
  onUnauthorized: () => void
}

/**
 * Wrapper around fetch that automatically handles token refresh on 401 errors
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit,
  authOptions: FetchWithAuthOptions
): Promise<Response> {
  const { accessToken, refreshToken, onTokenRefresh, onUnauthorized } = authOptions

  // Add authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  }

  // Make initial request
  let response = await fetch(url, { ...options, headers })

  // If we get a 401, try to refresh the token and retry once
  if (response.status === 401) {
    try {
      const refreshed = await authApi.refresh({ refresh_token: refreshToken })
      
      // Notify the caller of the new tokens
      onTokenRefresh(refreshed.access_token, refreshed.refresh_token, refreshed.expires_in)

      // Retry the request with the new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${refreshed.access_token}`,
        },
      })
    } catch (refreshError) {
      // Refresh failed, user needs to log in again
      console.error('Token refresh failed:', refreshError)
      onUnauthorized()
      throw new Error('Session expired. Please log in again.')
    }
  }

  return response
}
