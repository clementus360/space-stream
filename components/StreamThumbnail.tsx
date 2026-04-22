'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

interface ThumbnailExtractorProps {
  streamUrl: string
  onThumbnailGenerated?: (dataUrl: string) => void
  onError?: (err: Error) => void
  width?: number
  height?: number
  enabled?: boolean
}

export const useThumbnailExtractor = ({
  streamUrl,
  onThumbnailGenerated,
  onError,
  width = 320,
  height = 180,
  enabled = true,
}: ThumbnailExtractorProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!streamUrl || !enabled) return

    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.autoplay = false
    videoRef.current = video

    const extractThumbnail = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Failed to get canvas context')
        }

        // Draw the current frame of the video onto the canvas
        ctx.drawImage(video, 0, 0, width, height)

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setThumbnail(dataUrl)
        onThumbnailGenerated?.(dataUrl)

        // Cleanup
        video.pause()
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to extract thumbnail')
        console.error('Failed to extract thumbnail:', error)
        onError?.(error)
      }
    }

    const handleLoadedMetadata = () => {
      // Extract frame after a brief delay to ensure it's ready
      timeoutRef.current = setTimeout(extractThumbnail, 150)
    }

    const handleError = (e: Event) => {
      const videoElement = e.target as HTMLVideoElement
      const error = new Error(`Failed to load stream: ${videoElement.error?.message || 'Unknown error'}`)
      console.error('Video load error:', error)
      onError?.(error)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)

    // Check if it's an HLS stream
    if (streamUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
        })
        hlsRef.current = hls

        hls.loadSource(streamUrl)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // Attempt to play to load the first frame
          video.play().catch((err) => {
            console.debug('Auto-play failed (expected for thumbnail):', err)
          })
        })

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            const error = new Error(`HLS error: ${data.response?.code || data.type}`)
            console.error('HLS fatal error:', error)
            onError?.(error)
          }
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari has native HLS support
        video.src = streamUrl
        video.load()
      } else {
        const error = new Error('HLS not supported in this browser')
        console.error(error.message)
        onError?.(error)
      }
    } else {
      // Regular video URL
      video.src = streamUrl
      video.load()
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }

      video.pause()
      video.src = ''
      videoRef.current = null
    }
  }, [streamUrl, width, height, onThumbnailGenerated, onError, enabled])

  return thumbnail
}

interface ThumbnailProps {
  streamUrl: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackGradient?: string
  lazy?: boolean
}

export const StreamThumbnail: React.FC<ThumbnailProps> = ({
  streamUrl,
  alt,
  width = 320,
  height = 180,
  className = '',
  fallbackGradient = 'bg-gradient-to-br from-black/80 via-black/50 to-primary/60',
  lazy = true,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(!lazy)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasError, setHasError] = useState(false)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Unobserve after becoming visible
          if (containerRef.current) {
            observer.unobserve(containerRef.current)
          }
        }
      },
      { rootMargin: '100px' } // Start loading 100px before entering viewport
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [lazy])

  const extractedThumbnail = useThumbnailExtractor({
    streamUrl,
    onThumbnailGenerated: (dataUrl) => {
      setThumbnail(dataUrl)
      setIsLoading(false)
      setHasError(false)
    },
    onError: (err) => {
      console.warn(`Thumbnail extraction failed for ${alt}:`, err.message)
      setHasError(true)
      setIsLoading(false)
    },
    width,
    height,
    enabled: isVisible,
  })

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${fallbackGradient} ${className}`}
      style={{ aspectRatio: '16/9' }}
    >
      {/* Gradient overlay (shows while loading) */}
      {isLoading && !thumbnail && (
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,#ffffff_0,transparent_55%)]" />
      )}

      {/* Loading shimmer (optional) */}
      {isLoading && !thumbnail && (
        <div className="absolute inset-0 animate-pulse bg-black/20" />
      )}

      {/* Actual thumbnail image */}
      {thumbnail && (
        <img
          src={thumbnail}
          alt={alt}
          className="w-full h-full object-cover"
        />
      )}

      {/* Error state - show gradient only */}
      {hasError && !thumbnail && (
        <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
          Thumbnail unavailable
        </div>
      )}
    </div>
  )
}
