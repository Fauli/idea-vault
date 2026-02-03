import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { getFilePath, fileExists } from '@/lib/storage'

type Params = Promise<{ key: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { key } = await params

  // Sanitize key to prevent directory traversal
  const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '')
  if (sanitizedKey !== key) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  // Check if file exists
  const exists = await fileExists(sanitizedKey)
  if (!exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const filePath = getFilePath(sanitizedKey)
    const buffer = await readFile(filePath)

    // Determine content type from extension
    const extension = sanitizedKey.split('.').pop()?.toLowerCase()
    const contentTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    }
    const contentType = contentTypeMap[extension || ''] || 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}
