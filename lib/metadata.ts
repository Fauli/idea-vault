/**
 * Fetches Open Graph metadata from a URL
 * Server-side only - uses fetch with timeout
 */

export type UrlMetadata = {
  title?: string
  description?: string
  imageUrl?: string
}

const TIMEOUT_MS = 5000
const MAX_BYTES = 100 * 1024 // 100KB - meta tags are in <head>

/**
 * Extract content from a meta tag
 */
function getMetaContent(html: string, property: string): string | undefined {
  // Match both property="..." and name="..." attributes
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return decodeHtmlEntities(match[1])
    }
  }
  return undefined
}

/**
 * Extract title from <title> tag
 */
function getTitleTag(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : undefined
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
}

/**
 * Resolve relative image URL to absolute
 */
function resolveImageUrl(imageUrl: string | undefined, baseUrl: string): string | undefined {
  if (!imageUrl) return undefined

  try {
    // Already absolute
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    // Protocol-relative
    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`
    }
    // Relative URL
    const base = new URL(baseUrl)
    return new URL(imageUrl, base).href
  } catch {
    return undefined
  }
}

/**
 * Fetch metadata from a URL
 * Returns empty object on any failure - never throws
 */
export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PocketIdeasBot/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    // Only process HTML responses
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      return {}
    }

    // Read only first chunk to get meta tags (they're in <head>)
    const reader = response.body?.getReader()
    if (!reader) return {}

    let html = ''
    let bytesRead = 0

    while (bytesRead < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done) break

      html += new TextDecoder().decode(value)
      bytesRead += value.length

      // Stop early if we've passed </head>
      if (html.includes('</head>')) break
    }

    // Cancel the rest of the response
    reader.cancel().catch(() => {})

    // Extract metadata
    const ogTitle = getMetaContent(html, 'og:title')
    const ogDescription = getMetaContent(html, 'og:description')
    const ogImage = getMetaContent(html, 'og:image')

    // Fallbacks
    const title = ogTitle || getMetaContent(html, 'twitter:title') || getTitleTag(html)
    const description = ogDescription || getMetaContent(html, 'twitter:description') || getMetaContent(html, 'description')
    const imageUrl = resolveImageUrl(
      ogImage || getMetaContent(html, 'twitter:image'),
      url
    )

    return {
      title: title?.slice(0, 500), // Reasonable limits
      description: description?.slice(0, 1000),
      imageUrl: imageUrl?.slice(0, 2000),
    }
  } catch {
    // Timeout, network error, parse error - all return empty
    return {}
  }
}
