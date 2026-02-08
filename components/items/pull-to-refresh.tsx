'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type PullToRefreshProps = {
  children: React.ReactNode
  className?: string
}

const THRESHOLD = 80 // Pull distance needed to trigger refresh

export function PullToRefresh({ children, className }: PullToRefreshProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start pull if at top of scroll
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY)
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return

      const currentY = e.touches[0].clientY
      const diff = currentY - startY

      // Only allow pulling down
      if (diff > 0) {
        // Apply resistance to make it feel natural
        const resistance = Math.min(diff * 0.5, THRESHOLD * 1.5)
        setPullDistance(resistance)
      }
    },
    [isPulling, isRefreshing, startY]
  )

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(THRESHOLD * 0.6) // Keep a small indicator visible

      // Trigger refresh
      router.refresh()

      // Reset after a delay to show the animation
      setTimeout(() => {
        setIsRefreshing(false)
        setPullDistance(0)
      }, 1000)
    } else {
      setPullDistance(0)
    }

    setIsPulling(false)
  }, [isPulling, pullDistance, isRefreshing, router])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const progress = Math.min(pullDistance / THRESHOLD, 1)

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-200',
          pullDistance > 0 || isRefreshing ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          top: Math.max(pullDistance - 40, -40),
          height: 32,
        }}
      >
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10',
            isRefreshing && 'animate-spin'
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4 text-foreground/60"
            style={{
              transform: isRefreshing
                ? 'none'
                : `rotate(${progress * 180}deg)`,
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
