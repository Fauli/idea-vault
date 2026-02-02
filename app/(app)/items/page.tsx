import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ItemsPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Lightbulb illustration */}
        <div className="rounded-full bg-foreground/5 p-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-12 w-12 text-foreground/40"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">No ideas yet</h2>
          <p className="max-w-[240px] text-sm text-foreground/60">
            Capture your first idea, recipe, activity, or anything worth
            remembering.
          </p>
        </div>

        {/* CTA */}
        <Link href="/items/new">
          <Button size="lg">Add your first idea</Button>
        </Link>
      </div>
    </div>
  )
}
