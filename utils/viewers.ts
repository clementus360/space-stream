export const normalizeViewerCount = (value: unknown): number => {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value)

  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return 0
  }

  return Math.max(0, Math.floor(parsed))
}

export const formatViewerCount = (count: unknown): string => {
  return normalizeViewerCount(count).toLocaleString()
}