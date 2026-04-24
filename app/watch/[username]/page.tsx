'use client'

import { useParams } from 'next/navigation'
import { useStreams } from '@/context/stream-provider'
import { streamApi } from '@/utils/api/stream'
import { useEffect, useRef, useState } from 'react'
import { StreamInfo } from '@/utils/api/stream.types'
import { Avatar } from '@/components'
import { VideoPlayer } from '@/components/VideoPlayer'
import { Button } from '@/components/ui/Button'
import { Loader, Home } from 'lucide-react'
import { formatViewerCount } from '@/utils/viewers'
import { buildDistributionWatchUrl } from '@/utils/distribution'

export default function StreamPage() {
  const params = useParams()
  const username = params.username as string
  const { getStream, liveStreams } = useStreams()
  const [stream, setStream] = useState<StreamInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streamEnded, setStreamEnded] = useState(false)
  const consecutiveStreamFetchFailures = useRef(0)

  const handleStreamEnded = () => {
    setStreamEnded(true)
    setError(null)
  }

  useEffect(() => {
    let isMounted = true

    const loadStream = async () => {
      try {
        setLoading(true)
        setError(null)
        setStreamEnded(false)
        consecutiveStreamFetchFailures.current = 0
        try {
          const streamData = await getStream(username)
          if (isMounted) {
            setStream(streamData)
          }
        } catch (err: any) {
          if (err?.message?.includes('404')) {
            const live = await streamApi.getLiveStreams(100)
            const match = live.streams.find((item) => item.username === username)
            if (!match) {
              if (isMounted) {
                consecutiveStreamFetchFailures.current += 1
                if (consecutiveStreamFetchFailures.current >= 3) {
                  setStreamEnded(true)
                  setError(null)
                } else {
                  setError('Stream metadata is temporarily unavailable. Retrying...')
                }
              }
              return
            }
            if (isMounted) {
              setStream(match)
              consecutiveStreamFetchFailures.current = 0
            }
          } else {
            throw err
          }
        }
      } catch (err: any) {
        if (isMounted) {
          consecutiveStreamFetchFailures.current += 1
          if (consecutiveStreamFetchFailures.current >= 3) {
            setError(err.message || 'Failed to load stream')
          } else {
            setError('Stream metadata is temporarily unavailable. Retrying...')
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadStream()

    return () => {
      isMounted = false
    }
  }, [username, getStream])

  useEffect(() => {
    if (!stream?.username) return
    const live = liveStreams.find((item) => item.username === stream.username)
    if (!live) return

    setStream((prev) => {
      if (!prev) return prev
      const nextViewerCount = live.viewer_count
      const nextResolution = live.resolution ?? prev.resolution
      const nextProfileImage = live.profile_image_url ?? prev.profile_image_url

      if (
        prev.viewer_count === nextViewerCount &&
        prev.resolution === nextResolution &&
        prev.profile_image_url === nextProfileImage
      ) {
        return prev
      }

      return {
        ...prev,
        viewer_count: nextViewerCount,
        resolution: nextResolution,
        profile_image_url: nextProfileImage,
      }
    })
  }, [liveStreams, stream?.username])

  useEffect(() => {
    if (!stream || streamEnded) return

    let cancelled = false
    const interval = window.setInterval(async () => {
      try {
        await streamApi.getStream(username)
        consecutiveStreamFetchFailures.current = 0
      } catch (err: any) {
        if (cancelled) return
        if (err?.message?.includes('404') || err?.message?.includes('410')) {
          consecutiveStreamFetchFailures.current += 1
          if (consecutiveStreamFetchFailures.current >= 3) {
            handleStreamEnded()
          }
        } else {
          consecutiveStreamFetchFailures.current += 1
        }
      }
    }, 20000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [stream, streamEnded, username])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading stream...</p>
        </div>
      </div>
    )
  }

  if (streamEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-4xl font-semibold text-foreground mb-2">Stream has ended</p>
          <p className="text-muted-foreground mb-6">
            The stream from <span className="font-medium">@{username}</span> is no longer live. Check back later or find another stream!
          </p>
          <a href="/">
            <Button variant="primary" size="md" icon={<Home className="w-4 h-4" />}>
              Back to Live Channels
            </Button>
          </a>
        </div>
      </div>
    )
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Stream not found</p>
          <p className="text-muted-foreground mb-6">
            {error || 'The stream you are looking for does not exist.'}
          </p>
          <a href="/">
            <Button variant="primary" size="md" icon={<Home className="w-4 h-4" />}>
              Back to Live Channels
            </Button>
          </a>
        </div>
      </div>
    )
  }

  const streamUrl = buildDistributionWatchUrl(stream.session_id)

  return (
    <div className="min-h-screen pb-16">
      <section className="pt-10">
        {/* Video Player */}
        <div className="mb-6">
          <VideoPlayer
            streamUrl={streamUrl}
            title={stream.title}
            username={stream.username}
            onStreamEnded={handleStreamEnded}
          />
        </div>

        {/* Stream Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {stream.title || 'Untitled Stream'}
              </h1>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center mb-6">
                <Avatar
                  src={stream.profile_image_url}
                  alt={stream.username}
                  username={stream.username}
                  size="lg"
                />
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {stream.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatViewerCount(stream.viewer_count)} viewers
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
                <p className="text-sm text-muted-foreground">
                  {stream.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Stream Info</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">
                    Resolution
                  </p>
                  <p className="text-sm text-foreground mt-1">
                    {stream.resolution || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">
                    Viewers
                  </p>
                  <p className="text-sm text-foreground mt-1">
                    {formatViewerCount(stream.viewer_count)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
