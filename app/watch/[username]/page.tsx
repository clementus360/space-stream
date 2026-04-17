'use client'

import { useParams } from 'next/navigation'
import { useStreams } from '@/context/stream-provider'
import { streamApi } from '@/utils/api/stream'
import { useEffect, useState } from 'react'
import { StreamInfo } from '@/utils/api/stream.types'
import { Avatar } from '@/components'
import { VideoPlayer } from '@/components/VideoPlayer'
import { Loader } from 'lucide-react'

export default function StreamPage() {
  const params = useParams()
  const username = params.username as string
  const { getStream, liveStreams } = useStreams()
  const [stream, setStream] = useState<StreamInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadStream = async () => {
      try {
        setLoading(true)
        setError(null)
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
              throw err
            }
            if (isMounted) {
              setStream(match)
            }
          } else {
            throw err
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load stream')
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

      const shouldUpdateViewerCount =
        nextViewerCount > 0 || prev.viewer_count === 0

      if (
        (!shouldUpdateViewerCount || prev.viewer_count === nextViewerCount) &&
        prev.resolution === nextResolution &&
        prev.profile_image_url === nextProfileImage
      ) {
        return prev
      }

      return {
        ...prev,
        viewer_count: shouldUpdateViewerCount ? nextViewerCount : prev.viewer_count,
        resolution: nextResolution,
        profile_image_url: nextProfileImage,
      }
    })
  }, [liveStreams, stream?.username])

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

  if (error || !stream) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Stream not found</p>
          <p className="text-muted-foreground">{error || 'The stream you are looking for does not exist.'}</p>
        </div>
      </div>
    )
  }

  const streamUrl = `${process.env.NEXT_PUBLIC_DISTRIBUTION_API_URL}/watch/${stream.session_id}/master.m3u8`

  return (
    <div className="min-h-screen pb-16">
      <section className="pt-10">
        {/* Video Player */}
        <div className="mb-6">
          <VideoPlayer
            streamUrl={streamUrl}
            title={stream.title}
            username={stream.username}
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

              <div className="flex items-center gap-4 mb-6">
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
                    {stream.viewer_count.toLocaleString()} viewers
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
                    {stream.viewer_count.toLocaleString()}
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
