'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { removeImage, reorderImages } from '@/lib/actions/images'
import { cn } from '@/lib/utils'
import { useTransition } from 'react'

type ImageItem = {
  id: string
  url: string
  contentType: string
  byteSize: number
  width: number | null
  height: number | null
}

type ItemImagesProps = {
  images: ImageItem[]
  itemId: string
  showHero?: boolean
  className?: string
}

export function ItemImages({ images, itemId, showHero = false, className }: ItemImagesProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [reorderList, setReorderList] = useState<ImageItem[]>(images)
  const [isPending, startTransition] = useTransition()

  // Sync reorderList when images change
  useEffect(() => {
    setReorderList(images)
  }, [images])

  const hasHero = showHero && images.length > 0
  const heroImage = hasHero ? images[0] : null
  const galleryImages = hasHero ? images.slice(1) : images

  const handleMoveToFirst = (index: number) => {
    if (index === 0) return
    const newList = [...reorderList]
    const [moved] = newList.splice(index, 1)
    newList.unshift(moved)
    setReorderList(newList)
  }

  const handleSaveOrder = () => {
    startTransition(async () => {
      await reorderImages(itemId, reorderList.map((img) => img.id))
      setIsReordering(false)
    })
  }

  const handleCancelReorder = () => {
    setReorderList(images)
    setIsReordering(false)
  }

  // Reorder mode UI
  if (isReordering) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground/70">
            Tap an image to make it the cover
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {reorderList.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => handleMoveToFirst(index)}
              disabled={isPending}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg bg-foreground/5',
                index === 0 && 'ring-2 ring-foreground',
                isPending && 'opacity-50'
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 150px"
              />
              {index === 0 && (
                <div className="absolute bottom-1 left-1 rounded bg-foreground px-1.5 py-0.5 text-xs text-background">
                  Cover
                </div>
              )}
              {index > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-black">
                    Set as cover
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={isPending}
            className="flex-1 rounded-lg bg-foreground py-2.5 text-sm font-medium text-background disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save Order'}
          </button>
          <button
            type="button"
            onClick={handleCancelReorder}
            disabled={isPending}
            className="flex-1 rounded-lg border border-foreground/20 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Hero Image */}
      {heroImage && (
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="relative -mx-4 mb-4 aspect-[4/3] w-[calc(100%+2rem)] overflow-hidden bg-foreground/5"
        >
          <Image
            src={heroImage.url}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
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
            {images.length > 1 ? `1 of ${images.length}` : 'View'}
          </div>
        </button>
      )}

      {/* Gallery Grid */}
      {galleryImages.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {galleryImages.map((image) => {
            const originalIndex = images.findIndex((img) => img.id === image.id)
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setLightboxIndex(originalIndex)}
                className="relative aspect-square overflow-hidden rounded-lg bg-foreground/5"
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 150px"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* Reorder button - only show if multiple images */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={() => setIsReordering(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/20 py-2.5 text-sm text-foreground/60 hover:bg-foreground/5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
          Reorder photos
        </button>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          itemId={itemId}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  )
}

function Lightbox({
  images,
  itemId,
  currentIndex,
  onClose,
  onNavigate,
}: {
  images: ImageItem[]
  itemId: string
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}) {
  const [isPending, startTransition] = useTransition()
  const currentImage = images[currentIndex]

  // Zoom and pan state
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const lastPosition = useRef({ x: 0, y: 0 })
  const lastTouchDistance = useRef<number | null>(null)
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Swipe state (only active when not zoomed)
  const [swipeStart, setSwipeStart] = useState<number | null>(null)
  const [swipeEnd, setSwipeEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  // Reset zoom when changing images
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [currentIndex])

  const handleDelete = () => {
    if (!confirm('Delete this image?')) return

    startTransition(async () => {
      await removeImage(currentImage.id)
      if (images.length === 1) {
        onClose()
      } else if (currentIndex >= images.length - 1) {
        onNavigate(currentIndex - 1)
      }
    })
  }

  const handleSetAsCover = () => {
    if (currentIndex === 0) return

    startTransition(async () => {
      const newOrder = [...images]
      const [moved] = newOrder.splice(currentIndex, 1)
      newOrder.unshift(moved)
      await reorderImages(itemId, newOrder.map((img) => img.id))
      onNavigate(0)
    })
  }

  const handlePrev = () => {
    if (currentIndex > 0 && scale === 1) {
      onNavigate(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < images.length - 1 && scale === 1) {
      onNavigate(currentIndex + 1)
    }
  }

  // Get distance between two touch points
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Get center point between two touches
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return null
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    }
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      e.preventDefault()
      lastTouchDistance.current = getTouchDistance(e.touches)
      lastTouchCenter.current = getTouchCenter(e.touches)
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        // Pan start when zoomed
        setIsDragging(true)
        lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      } else {
        // Swipe start when not zoomed
        setSwipeEnd(null)
        setSwipeStart(e.touches[0].clientX)
      }
    }
  }, [scale])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      // Pinch zoom
      e.preventDefault()
      const newDistance = getTouchDistance(e.touches)
      if (newDistance) {
        const delta = newDistance / lastTouchDistance.current
        setScale((prev) => Math.min(Math.max(prev * delta, 1), 4))
        lastTouchDistance.current = newDistance
      }
    } else if (e.touches.length === 1) {
      if (isDragging && scale > 1) {
        // Pan when zoomed
        const dx = e.touches[0].clientX - lastPosition.current.x
        const dy = e.touches[0].clientY - lastPosition.current.y
        setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
        lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      } else if (scale === 1) {
        // Swipe tracking
        setSwipeEnd(e.touches[0].clientX)
      }
    }
  }, [isDragging, scale])

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null
    lastTouchCenter.current = null
    setIsDragging(false)

    // Handle swipe navigation (only when not zoomed)
    if (scale === 1 && swipeStart !== null && swipeEnd !== null) {
      const distance = swipeStart - swipeEnd
      if (distance > minSwipeDistance) {
        handleNext()
      } else if (distance < -minSwipeDistance) {
        handlePrev()
      }
    }
    setSwipeStart(null)
    setSwipeEnd(null)

    // Snap back if zoomed out too much
    if (scale < 1.1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [scale, swipeStart, swipeEnd, handleNext, handlePrev])

  // Double tap to zoom
  const lastTap = useRef<number>(0)
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      // Double tap detected
      if (scale > 1) {
        setScale(1)
        setPosition({ x: 0, y: 0 })
      } else {
        setScale(2)
      }
    }
    lastTap.current = now
  }, [scale])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') handlePrev()
    if (e.key === 'ArrowRight') handleNext()
  }

  const handleBackdropClick = () => {
    if (scale === 1) {
      onClose()
    } else {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 touch-none"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
    >
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
        {/* Set as cover button - only show if not first image */}
        {currentIndex > 0 && scale === 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleSetAsCover()
            }}
            disabled={isPending}
            className="rounded-full bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-50"
          >
            {isPending ? 'Setting...' : 'Set as cover'}
          </button>
        )}
        {currentIndex === 0 && scale === 1 && (
          <span className="rounded-full bg-white/10 px-3 py-2 text-sm text-white/70">
            Cover photo
          </span>
        )}
        {scale > 1 && <div />}

        <div className="flex gap-2">
          {/* Delete button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            disabled={isPending}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-red-500/50 disabled:opacity-50"
            aria-label="Delete image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation - Previous */}
      {currentIndex > 0 && scale === 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handlePrev()
          }}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          aria-label="Previous image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Navigation - Next */}
      {currentIndex < images.length - 1 && scale === 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          aria-label="Next image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={handleDoubleTap}
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <Image
          src={currentImage.url}
          alt=""
          width={currentImage.width || 800}
          height={currentImage.height || 600}
          className={cn('max-h-[90vh] w-auto object-contain', isPending && 'opacity-50')}
          priority
          draggable={false}
        />
      </div>

      {/* Image counter */}
      {images.length > 1 && scale === 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
          {Math.round(scale * 100)}% - Double tap to reset
        </div>
      )}
    </div>
  )
}
