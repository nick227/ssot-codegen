import React, { useState } from 'react'
import { clsx } from 'clsx'

export interface MediaLoaderProps {
  variant?: 'carousel' | 'gallery' | 'single'
  images: string[]
  currentIndex?: number
  onIndexChange?: (index: number) => void
  lazyLoad?: boolean
  className?: string
}

export function MediaLoader({
  variant = 'single',
  images,
  currentIndex: controlledIndex,
  onIndexChange,
  lazyLoad = true,
  className
}: MediaLoaderProps) {
  const [internalIndex, setInternalIndex] = useState(0)
  const currentIndex = controlledIndex ?? internalIndex

  const handleIndexChange = (index: number) => {
    if (onIndexChange) {
      onIndexChange(index)
    } else {
      setInternalIndex(index)
    }
  }

  if (variant === 'single' && images.length > 0) {
    return (
      <div className={clsx('relative', className)}>
        <img
          src={images[0]}
          alt=""
          className="w-full h-full object-cover rounded-lg"
          loading={lazyLoad ? 'lazy' : 'eager'}
        />
      </div>
    )
  }

  if (variant === 'carousel') {
    return (
      <div className={clsx('relative', className)}>
        <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg">
          {images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt=""
              className={clsx(
                'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              )}
              loading={lazyLoad && index > currentIndex ? 'lazy' : 'eager'}
            />
          ))}
        </div>
        {images.length > 1 && (
          <>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={clsx(
                    'w-2 h-2 rounded-full transition-all',
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  )}
                  onClick={() => handleIndexChange(index)}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
            {currentIndex > 0 && (
              <button
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                onClick={() => handleIndexChange(currentIndex - 1)}
                aria-label="Previous image"
              >
                ←
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                onClick={() => handleIndexChange(currentIndex + 1)}
                aria-label="Next image"
              >
                →
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  // Gallery variant
  return (
    <div className={clsx('grid grid-cols-2 gap-2', className)}>
      {images.map((image, index) => (
        <img
          key={index}
          src={image}
          alt=""
          className="w-full aspect-square object-cover rounded-lg"
          loading={lazyLoad ? 'lazy' : 'eager'}
        />
      ))}
    </div>
  )
}

