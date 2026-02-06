'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

export function SuccessToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    const created = searchParams.get('created')
    const updated = searchParams.get('updated')

    if (created === 'true') {
      showToast('Item created!', { type: 'success' })
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('created')
      router.replace(url.pathname, { scroll: false })
    } else if (updated === 'true') {
      showToast('Changes saved!', { type: 'success' })
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('updated')
      router.replace(url.pathname, { scroll: false })
    }
  }, [searchParams, router, showToast])

  return null
}
