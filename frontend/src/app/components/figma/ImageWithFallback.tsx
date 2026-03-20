import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean
}

export function ImageWithFallback({ priority, ...props }: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const { src, alt, style, className, ...rest } = props

  if (didError) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-zinc-900 ${className ?? ''}`}
        style={style}
      >
        <img src={ERROR_IMG_SRC} alt="Error loading image" data-original-url={src} />
      </div>
    )
  }

  return (
    <div className={`relative ${className ?? ''}`} style={style}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 animate-pulse rounded-[inherit]" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'low'}
        onError={() => { setDidError(true); setIsLoading(false) }}
        onLoad={() => setIsLoading(false)}
        {...rest}
      />
    </div>
  )
}
