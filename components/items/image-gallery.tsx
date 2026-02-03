'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { removeImage } from '@/lib/actions/images'
import { cn } from '@/lib/utils'

type ImageItem = {
  id: string
  url: string
  contentType: string
  byteSize: number
  width: number | null
  height: number | null
}

type ImageGalleryProps = {
  images: ImageItem[]
  hideFirst?: boolean
  className?: string
  openLightboxRef?: React.MutableRefObject<((index: number) => void) | null>
}

export function ImageGallery({ images, hideFirst = false, className, openLightboxRef }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Expose the open function via ref
  if (openLightboxRef) {
    openLightboxRef.current = (index: number) => setLightboxIndex(index)
  }

  const displayImages = hideFirst ? images.slice(1) : images

  if (displayImages.length === 0 && !hideFirst) {
    return null
  }

  return (
    <>
      {displayImages.length > 0 && (
        <div className={cn('grid grid-cols-3 gap-2', className)}>
          {displayImages.map((image) => {
            const originalIndex = images.findIndex((img) => img.id === image.id)
            return (
              <GalleryImage
                key={image.id}
                image={image}
                onClick={() => setLightboxIndex(originalIndex)}
              />
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  )
}

function GalleryImage({
  image,
  onClick,
}: {
  image: ImageItem
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
}

function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: {
  images: ImageItem[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}) {
  const [isPending, startTransition] = useTransition()
  const currentImage = images[currentIndex]

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

  const handlePrev = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') handlePrev()
    if (e.key === 'ArrowRight') handleNext()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
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

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleDelete()
        }}
        disabled={isPending}
        className="absolute right-16 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-red-500/50 disabled:opacity-50"
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

      {/* Navigation - Previous */}
      {currentIndex > 0 && (
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
      {currentIndex < images.length - 1 && (
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
      >
        <Image
          src={currentImage.url}
          alt=""
          width={currentImage.width || 800}
          height={currentImage.height || 600}
          className={cn('max-h-[90vh] w-auto object-contain', isPending && 'opacity-50')}
          priority
        />
      </div>

      {/* Image counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}
