import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  alt: string
  username: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  username,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
  }

  const hasImage = src && src.trim().length > 0

  if (hasImage) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          priority={size === 'lg'}
        />
      </div>
    )
  }

  // Fallback to initials
  return (
    <div
      className={`rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {username[0].toUpperCase()}
    </div>
  )
}
