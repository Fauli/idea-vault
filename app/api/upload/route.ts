import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/session'
import { getSessionCookie } from '@/lib/cookies'
import {
  uploadImage,
  validateImageFile,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/storage'

export async function POST(request: NextRequest) {
  // Check authentication
  const token = await getSessionCookie()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await validateSession(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const validation = validateImageFile(file.size, file.type)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Convert to buffer and upload
    const buffer = Buffer.from(await file.arrayBuffer())
    const { storageKey, url } = await uploadImage(buffer, file.type)

    return NextResponse.json({
      storageKey,
      url,
      contentType: file.type,
      byteSize: file.size,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// Return allowed methods and file constraints
export async function GET() {
  return NextResponse.json({
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
  })
}
