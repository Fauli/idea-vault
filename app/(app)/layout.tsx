import { BottomNav } from '@/components/bottom-nav'
import { OfflineIndicator } from '@/components/offline-indicator'
import { ToastProvider } from '@/components/ui/toast'
import { requireAuth } from '@/lib/auth'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <OfflineIndicator />
        <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background">
          <div className="mx-auto flex h-14 max-w-lg items-center px-4">
            <h1 className="text-lg font-semibold">Pocket Ideas</h1>
          </div>
        </header>
        <main className="flex-1 pb-20">
          <div className="mx-auto max-w-lg px-4 py-4">{children}</div>
        </main>
        <BottomNav />
      </div>
    </ToastProvider>
  )
}
