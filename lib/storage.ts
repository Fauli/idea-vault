import { mkdir, writeFile, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

// Base directory for uploads - can be configured via env
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads')

// Allowed image MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

// Max file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * Generate a unique storage key for a file
 */
export function generateStorageKey(extension: string): string {
  const timestamp = Date.now()
  const randomPart = crypto.randomBytes(8).toString('hex')
  return `${timestamp}-${randomPart}${extension}`
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  }
  return extensions[mimeType] || '.bin'
}

/**
 * Upload an image to storage
 * @returns The storage key and URL for the uploaded file
 */
export async function uploadImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ storageKey: string; url: string }> {
  await ensureUploadDir()

  const extension = getExtensionFromMime(mimeType)
  const storageKey = generateStorageKey(extension)
  const filePath = path.join(UPLOAD_DIR, storageKey)

  await writeFile(filePath, buffer)

  // URL will be served via API route
  const url = `/api/uploads/${storageKey}`

  return { storageKey, url }
}

/**
 * Delete an image from storage
 */
export async function deleteImage(storageKey: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, storageKey)

  try {
    await unlink(filePath)
  } catch (error) {
    // File might not exist, which is okay
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}

/**
 * Get the file path for a storage key
 */
export function getFilePath(storageKey: string): string {
  return path.join(UPLOAD_DIR, storageKey)
}

/**
 * Check if a file exists
 */
export async function fileExists(storageKey: string): Promise<boolean> {
  const filePath = path.join(UPLOAD_DIR, storageKey)
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Validate an uploaded file
 */
export function validateImageFile(
  size: number,
  mimeType: string
): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    }
  }

  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Download and cache a remote image
 * Returns the local URL or null if download fails
 */
export async function cacheRemoteImage(
  remoteUrl: string
): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(remoteUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PocketIdeasBot/1.0)',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || ''

    // Only cache actual images
    const isImage = ALLOWED_IMAGE_TYPES.some(type => contentType.includes(type.split('/')[1]))
    if (!isImage) return null

    const buffer = Buffer.from(await response.arrayBuffer())

    // Skip if too large
    if (buffer.length > MAX_FILE_SIZE) return null

    // Determine mime type
    let mimeType = 'image/jpeg' // default
    if (contentType.includes('png')) mimeType = 'image/png'
    else if (contentType.includes('webp')) mimeType = 'image/webp'
    else if (contentType.includes('gif')) mimeType = 'image/gif'

    const { url } = await uploadImage(buffer, mimeType)
    return url
  } catch {
    // Network error, timeout, etc - return null
    return null
  }
}
