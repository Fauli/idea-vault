'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type HeroImageProps = {
  image: {
    id: string
    url: string
    width: number | null
    height: number | null
  }
  onOpen?: () => void
  className?: string
}

export function HeroImage({ image, onOpen, className }: HeroImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'relative -mx-4 aspect-[4/3] w-[calc(100%+2rem)] overflow-hidden bg-foreground/5',
        className
      )}
    >
      <Image
        src={image.url}
        alt=""
        fill
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        sizes="100vw"
        priority
        onLoad={() => setIsLoaded(true)}
      />
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-foreground/10" />
      )}
      {/* Tap to view indicator */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-3.5 w-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
          />
        </svg>
        View
      </div>
    </button>
  )
}
