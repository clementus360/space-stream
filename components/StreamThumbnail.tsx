import { useEffect, useRef, useState } from 'react'

interface ThumbnailExtractorProps {
  streamUrl: string
  onThumbnailGenerated?: (dataUrl: string) => void
  width?: number
  height?: number
}

export const useThumbnailExtractor = ({
  streamUrl,
  onThumbnailGenerated,
  width = 320,
  height = 180,
}: ThumbnailExtractorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)

  useEffect(() => {
    if (!streamUrl) return

    const video = document.createElement('video')
    video.src = streamUrl
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.autoplay = false

    const extractThumbnail = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Draw the current frame of the video onto the canvas
        ctx.drawImage(video, 0, 0, width, height)

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setThumbnail(dataUrl)
        onThumbnailGenerated?.(dataUrl)

        // Cleanup
        video.pause()
        video.src = ''
      } catch (err) {
        console.error('Failed to extract thumbnail:', err)
      }
    }

    const handleLoadedMetadata = () => {
      // Use a small timeout to ensure the frame is ready
      setTimeout(extractThumbnail, 100)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    const handleError = () => {
      console.error('Failed to load stream for thumbnail')
    }

    video.addEventListener('error', handleError)

    // Start loading the video
    video.load()

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
      video.pause()
      video.src = ''
    }
  }, [streamUrl, width, height, onThumbnailGenerated])

  return thumbnail
}

interface ThumbnailProps {
  streamUrl: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export const StreamThumbnail: React.FC<ThumbnailProps> = ({
  streamUrl,
  alt,
  width = 320,
  height = 180,
  className = '',
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const extractedThumbnail = useThumbnailExtractor({
    streamUrl,
    onThumbnailGenerated: (dataUrl) => {
      setThumbnail(dataUrl)
      setIsLoading(false)
    },
    width,
    height,
  })

  return (
    <div className={`relative overflow-hidden bg-black ${className}`} style={{ aspectRatio: '16/9' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-pulse bg-gray-800 w-full h-full" />
        </div>
      )}
      {thumbnail && (
        <img
          src={thumbnail}
          alt={alt}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )
}
