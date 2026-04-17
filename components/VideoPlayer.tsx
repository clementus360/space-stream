'use client'

import { useRef, useEffect, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import Hls from 'hls.js'

interface VideoPlayerProps {
  streamUrl: string
  title: string
  username: string
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  title,
  username,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setError(null)

    // Handle play/pause
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleError = (e: Event) => {
      const videoElement = e.target as HTMLVideoElement
      setError(`Playback error: ${videoElement.error?.message || 'Unknown error'}`)
    }
    const handleLoadedMetadata = () => {
      video.play().catch((err) => {
        setError(`Auto-play failed: ${err.message}`)
      })
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('error', handleError)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    // Setup HLS playback
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      })
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) {
          setError(`Playback error: ${data?.type || 'Unknown error'}`)
        }
      })
    } else {
      setError('Your browser does not support HLS playback.')
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      video.removeAttribute('src')
      video.load()
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [streamUrl])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }

    setIsFullscreen(!isFullscreen)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg"
      style={{ aspectRatio: '16 / 9' }}
    >
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center text-white">
            <p className="text-lg font-semibold mb-2">Stream Error</p>
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full"
        controls={false}
        crossOrigin="anonymous"
        preload="metadata"
        playsInline
      />

      {/* Custom controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity duration-300 group">
        {/* Progress bar (placeholder) */}
        <div className="w-full h-1 bg-gray-600 rounded-full mb-3 cursor-pointer" />

        {/* Control buttons */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/20 rounded transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info overlay (top) */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 text-white">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold">LIVE</span>
        </div>
      </div>
    </div>
  )
}
