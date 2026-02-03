'use client'

import { useState, useRef, useTransition } from 'react'
import { addImage } from '@/lib/actions/images'
import { cn } from '@/lib/utils'

type ImageUploadProps = {
  itemId: string
  className?: string
}

export function ImageUpload({ itemId, className }: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)

    // Upload each file
    for (const file of Array.from(files)) {
      await uploadFile(file)
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const uploadFile = async (file: File) => {
    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF')
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size: 10MB')
      return
    }

    setUploadProgress(0)

    try {
      // Upload to API
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const uploadResult = await response.json()
      setUploadProgress(50)

      // Get image dimensions
      const dimensions = await getImageDimensions(file)

      // Save to database
      startTransition(async () => {
        await addImage({
          itemId,
          storageKey: uploadResult.storageKey,
          url: uploadResult.url,
          contentType: uploadResult.contentType,
          byteSize: uploadResult.byteSize,
          width: dimensions.width,
          height: dimensions.height,
        })
        setUploadProgress(null)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(null)
    }
  }

  const isUploading = uploadProgress !== null || isPending

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        id="image-upload"
        capture="environment"
      />

      <label
        htmlFor="image-upload"
        className={cn(
          'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-foreground/20 py-6 text-sm transition-colors',
          isUploading
            ? 'cursor-not-allowed opacity-50'
            : 'hover:border-foreground/30 hover:text-foreground/70',
          'text-foreground/50'
        )}
      >
        {isUploading ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8 animate-pulse"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            <span>Add photos</span>
            <span className="text-xs text-foreground/40">
              Tap to choose or take photo
            </span>
          </>
        )}
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

/**
 * Get image dimensions from a File
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}
