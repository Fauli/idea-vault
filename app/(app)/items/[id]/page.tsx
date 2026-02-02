import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Params = Promise<{ id: string }>

export default async function ItemDetailPage({ params }: { params: Params }) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Item Details</h2>
        <p className="mt-2 text-foreground/60">Item ID: {id}</p>
      </div>
      <div className="rounded-lg border border-dashed border-foreground/20 p-8 text-center">
        <p className="text-foreground/50">
          Item detail view coming in Milestone B
        </p>
      </div>
      <Link href="/items">
        <Button variant="secondary" className="w-full">
          Back to list
        </Button>
      </Link>
    </div>
  )
}
