'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { StreamInfo } from '@/utils/api/stream.types'
import { streamApi } from '@/utils/api/stream'

type StreamContextState = {
    liveStreams: StreamInfo[]
    loading: boolean
    error: string | null
    fetchLiveStreams: (limit?: number, options?: { silent?: boolean }) => Promise<void>
    getStream: (identifier: string) => Promise<StreamInfo>
}

const StreamContext = createContext<StreamContextState | null>(null)

export function StreamProvider({ children }: { children: React.ReactNode }) {
    const [liveStreams, setLiveStreams] = useState<StreamInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [liveLimit, setLiveLimit] = useState(24)
    const [hasLoaded, setHasLoaded] = useState(false)

    const fetchLiveStreams = useCallback(
        async (limit = liveLimit, options?: { silent?: boolean }) => {
            if (limit !== liveLimit) {
                setLiveLimit(limit)
            }
            const shouldSurface = !options?.silent || !hasLoaded
            if (!hasLoaded && shouldSurface) {
                setLoading(true)
            }
            try {
                const res = await streamApi.getLiveStreams(limit)
                setLiveStreams(res.streams)
                if (shouldSurface) {
                    setError(null)
                }
                if (!hasLoaded) {
                    setHasLoaded(true)
                }
            } catch (err: any) {
                if (shouldSurface) {
                    setError(err.message || 'Failed to load live streams')
                }
            } finally {
                if (!hasLoaded) {
                    setLoading(false)
                }
            }
        },
        [liveLimit, hasLoaded]
    )

    useEffect(() => {
        fetchLiveStreams(liveLimit, { silent: false })

        const interval = setInterval(() => {
            fetchLiveStreams(liveLimit, { silent: true })
        }, 20000)

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchLiveStreams(liveLimit, { silent: true })
            }
        }

        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            clearInterval(interval)
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [fetchLiveStreams, liveLimit])

    const getStream = useCallback((identifier: string) => {
        return streamApi.getStream(identifier)
    }, [])

    return (
        <StreamContext.Provider
            value={{
                liveStreams,
                loading,
                error,
                fetchLiveStreams,
                getStream,
            }}
        >
            {children}
        </StreamContext.Provider>
    )
}

export const useStreams = () => {
    const ctx = useContext(StreamContext)
    if (!ctx) throw new Error('useStreams must be used within StreamProvider')
    return ctx
}