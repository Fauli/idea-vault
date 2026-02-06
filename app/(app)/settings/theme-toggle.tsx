'use client'

import { useTheme } from '@/components/theme-provider'

const themes = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex gap-2">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            theme === t.value
              ? 'border-foreground bg-foreground text-background'
              : 'border-foreground/20 hover:border-foreground/40'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
