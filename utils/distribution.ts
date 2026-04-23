const VIEWER_ID_STORAGE_KEY = 'viewer_id'

const generateViewerId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `v_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

export const getOrCreateViewerId = (): string | null => {
  if (typeof window === 'undefined') return null

  const existing = window.localStorage.getItem(VIEWER_ID_STORAGE_KEY)
  if (existing) {
    return existing
  }

  const nextId = generateViewerId()
  window.localStorage.setItem(VIEWER_ID_STORAGE_KEY, nextId)
  return nextId
}

export const buildDistributionWatchUrl = (sessionId: number | string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_DISTRIBUTION_API_URL
  if (!baseUrl) {
    return ''
  }

  const url = new URL(`/watch/${sessionId}/master.m3u8`, baseUrl)
  const viewerId = getOrCreateViewerId()

  if (viewerId) {
    url.searchParams.set('viewer_id', viewerId)
  }

  return url.toString()
}