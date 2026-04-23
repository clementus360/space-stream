'use client'

import { useRef, useEffect, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2, LoaderCircle } from 'lucide-react'
import Hls from 'hls.js'

interface VideoPlayerProps {
  streamUrl: string
  title: string
  username: string
}

type QualityOption = {
  label: string
  value: string
  levelIndex?: number
  variantUrl?: string
  height?: number
}

const getHeightFromPath = (variantPath: string): number | null => {
  const match = variantPath.match(/(?:^|[^0-9])(\d{3,4})(?:p)?(?:\b|\.|\/)/i)
  if (!match) return null
  const parsed = Number(match[1])
  if (!Number.isFinite(parsed)) return null
  if (parsed < 144 || parsed > 4320) return null
  return parsed
}

const getHeightFromHlsLevel = (level: { height?: number; name?: string; url?: string[] }): number | null => {
  if (typeof level.height === 'number' && level.height > 0) {
    return level.height
  }

  const fromName = level.name ? getHeightFromPath(level.name) : null
  if (fromName) return fromName

  const urls = Array.isArray(level.url) ? level.url : []
  for (const candidateUrl of urls) {
    const fromUrl = getHeightFromPath(candidateUrl)
    if (fromUrl) return fromUrl
  }

  return null
}

const parseMasterPlaylistVariants = (playlistText: string, masterUrl: string): QualityOption[] => {
  const lines = playlistText.split('\n').map((line) => line.trim())
  const options: QualityOption[] = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line.startsWith('#EXT-X-STREAM-INF')) continue

    let uriLine = ''
    for (let j = i + 1; j < lines.length; j += 1) {
      const candidate = lines[j]
      if (!candidate) continue
      if (candidate.startsWith('#')) continue
      uriLine = candidate
      break
    }

    if (!uriLine) continue

    const resolutionMatch = line.match(/RESOLUTION=\d+x(\d+)/i)
    const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/i)

    const resolutionHeight = resolutionMatch ? Number(resolutionMatch[1]) : null
    const pathHeight = getHeightFromPath(uriLine)
    const resolvedHeight = resolutionHeight || pathHeight
    const label = resolvedHeight
      ? `${resolvedHeight}p`
      : bandwidthMatch
        ? `${Math.round(Number(bandwidthMatch[1]) / 1000)}kbps`
        : `Quality ${options.length + 1}`

    const variantUrl = new URL(uriLine, masterUrl).toString()

    options.push({
      label,
      value: `native-${options.length}`,
      variantUrl,
      height: resolvedHeight ?? undefined,
    })
  }

  const unique = new Map<string, QualityOption>()
  options.forEach((option) => {
    const key = option.height ? `h-${option.height}` : `u-${option.label}-${option.variantUrl}`
    if (!unique.has(key)) {
      unique.set(key, option)
    }
  })

  return Array.from(unique.values()).sort((a, b) => {
    const aHeight = a.height ?? 0
    const bHeight = b.height ?? 0
    return aHeight - bHeight
  })
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  title,
  username,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const bufferingTimeoutRef = useRef<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBuffering, setIsBuffering] = useState(true)
  const [bufferingMessage, setBufferingMessage] = useState('Connecting to stream...')
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([
    { label: 'Auto', value: 'auto', levelIndex: -1 },
  ])
  const [selectedQuality, setSelectedQuality] = useState('auto')

  const clearBufferingTimer = () => {
    if (bufferingTimeoutRef.current !== null) {
      window.clearTimeout(bufferingTimeoutRef.current)
      bufferingTimeoutRef.current = null
    }
  }

  const showImmediateBuffering = (message: string) => {
    clearBufferingTimer()
    setIsBuffering(true)
    setBufferingMessage(message)
  }

  const scheduleBufferingOverlay = (message: string) => {
    clearBufferingTimer()
    bufferingTimeoutRef.current = window.setTimeout(() => {
      setIsBuffering(true)
      setBufferingMessage(message)
    }, 350)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let isActive = true

    const hideBuffering = () => {
      clearBufferingTimer()
      setIsBuffering(false)
    }

    setError(null)
    showImmediateBuffering('Connecting to stream...')
    setQualityOptions([{ label: 'Auto', value: 'auto', levelIndex: -1 }])
    setSelectedQuality('auto')

    // Handle play/pause
    const handlePlay = () => {
      setIsPlaying(true)
      hideBuffering()
    }
    const handlePause = () => setIsPlaying(false)
    const handleLoadStart = () => {
      setError(null)
      showImmediateBuffering('Connecting to stream...')
    }
    const handleWaiting = () => {
      if (video.readyState < 3) {
        scheduleBufferingOverlay('Buffering, waiting for stream chunks...')
      }
    }
    const handleStalled = () => {
      if (video.readyState < 3) {
        scheduleBufferingOverlay('Playback stalled, retrying...')
      }
    }
    const handlePlaying = () => {
      setError(null)
      hideBuffering()
    }
    const handleSeeking = () => {
      scheduleBufferingOverlay('Seeking...')
    }
    const handleSeeked = () => {
      hideBuffering()
    }
    const handleError = (e: Event) => {
      const videoElement = e.target as HTMLVideoElement
      hideBuffering()
      setError(`Playback error: ${videoElement.error?.message || 'Unknown error'}`)
    }
    const handleLoadedMetadata = () => {
      showImmediateBuffering('Starting playback...')
      video.play().catch((err) => {
        hideBuffering()
        setError(`Auto-play failed: ${err.message}`)
      })
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('stalled', handleStalled)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('seeking', handleSeeking)
    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('error', handleError)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    // Setup HLS playback
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      fetch(streamUrl)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch master playlist: ${res.status}`)
          }
          return res.text()
        })
        .then((playlistText) => {
          if (!isActive) return
          const variantOptions = parseMasterPlaylistVariants(playlistText, streamUrl)
          setQualityOptions([
            { label: 'Auto', value: 'auto' },
            ...variantOptions,
          ])
        })
        .catch(() => {
          // Keep Auto only if parsing fails.
          if (!isActive) return
          setQualityOptions([{ label: 'Auto', value: 'auto' }])
        })
    } else if (Hls.isSupported()) {
      showImmediateBuffering('Connecting to stream...')
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      })
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const options: QualityOption[] = [
          { label: 'Auto', value: 'auto', levelIndex: -1 },
        ]

        const levels = hls.levels
          .map((level, index) => ({ level, index }))
          .map(({ level, index }) => ({
            index,
            detectedHeight: getHeightFromHlsLevel(level),
          }))
          .filter((item) => item.detectedHeight !== null)
          .sort((a, b) => (a.detectedHeight as number) - (b.detectedHeight as number))

        const seenHeights = new Set<number>()

        levels.forEach(({ detectedHeight, index }) => {
          const height = detectedHeight as number
          if (seenHeights.has(height)) return
          seenHeights.add(height)
          options.push({
            label: `${height}p`,
            value: `hls-${index}`,
            levelIndex: index,
            height,
          })
        })

        setQualityOptions(options)
      })
      hls.on(Hls.Events.FRAG_LOADING, () => {
        // Fragment loading is normal during steady playback; do not surface it immediately.
      })
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        hideBuffering()
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) {
          hideBuffering()
          setError(`Playback error: ${data?.type || 'Unknown error'}`)
          return
        }

        if (
          data?.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT ||
          data?.details === Hls.ErrorDetails.FRAG_LOAD_ERROR ||
          data?.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR
        ) {
          scheduleBufferingOverlay('Reconnecting to stream chunks...')
        }
      })
    } else {
      hideBuffering()
      setError('Your browser does not support HLS playback.')
    }

    return () => {
      isActive = false
      clearBufferingTimer()
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      video.removeAttribute('src')
      video.load()
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('stalled', handleStalled)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('seeking', handleSeeking)
      video.removeEventListener('seeked', handleSeeked)
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

  const handleQualityChange = (qualityValue: string) => {
    setSelectedQuality(qualityValue)

    const hls = hlsRef.current
    const selectedOption = qualityOptions.find((option) => option.value === qualityValue)
    if (!selectedOption) return

    if (!hls && videoRef.current) {
      if (qualityValue === 'auto') {
        showImmediateBuffering('Switching quality...')
        videoRef.current.src = streamUrl
        videoRef.current.load()
        videoRef.current.play().catch(() => {
          // Ignore autoplay restrictions.
        })
        return
      }

      if (selectedOption.variantUrl) {
        showImmediateBuffering('Switching quality...')
        videoRef.current.src = selectedOption.variantUrl
        videoRef.current.load()
        videoRef.current.play().catch(() => {
          // Ignore autoplay restrictions.
        })
      }

      return
    }

    if (!hls) return

    if (selectedOption.levelIndex === -1) {
      showImmediateBuffering('Switching quality...')
      hls.currentLevel = -1
      setSelectedQuality('auto')
      return
    }

    if (typeof selectedOption.levelIndex === 'number') {
      showImmediateBuffering('Switching quality...')
      hls.currentLevel = selectedOption.levelIndex
    }
  }

  return (
    <div
      ref={containerRef}
      className="group relative w-full bg-black rounded-lg overflow-hidden shadow-lg"
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

      {!error && isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 z-10">
          <div className="flex flex-col items-center gap-3 text-white">
            <LoaderCircle className="w-8 h-8 animate-spin" />
            <p className="text-sm text-gray-100">{bufferingMessage}</p>
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
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-black to-transparent p-3 opacity-100 transition-opacity duration-300 md:p-4 md:opacity-0 md:group-hover:opacity-100">
        {/* Progress bar (placeholder) */}
        <div className="w-full h-1 bg-gray-600 rounded-full mb-3 cursor-pointer" />

        {/* Control buttons */}
        <div className="flex flex-col gap-3 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
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

            <div className="ml-2">
              <select
                value={selectedQuality}
                onChange={(e) => handleQualityChange(e.target.value)}
                className="min-w-0 max-w-full bg-black/60 border border-white/20 rounded px-2 py-1 pr-7 text-xs text-white outline-none"
                title="Playback quality"
                disabled={qualityOptions.length <= 1}
              >
                {qualityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
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
      <div className="absolute top-0 left-0 right-0 z-10 bg-linear-to-b from-black to-transparent p-4 text-white pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold">LIVE</span>
        </div>
      </div>
    </div>
  )
}
