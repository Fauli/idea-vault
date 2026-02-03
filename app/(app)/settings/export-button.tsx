'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportAllItems } from '@/lib/actions/export'

export function ExportButton() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleExport = () => {
    setError(null)
    startTransition(async () => {
      try {
        const data = await exportAllItems()

        // Create blob and trigger download
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        // Generate filename with date
        const date = new Date().toISOString().split('T')[0]
        link.download = `pocket-ideas-export-${date}.json`

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed')
      }
    })
  }

  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        onClick={handleExport}
        disabled={pending}
      >
        {pending ? 'Exporting...' : 'Export as JSON'}
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
