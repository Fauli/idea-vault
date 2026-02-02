import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function NewItemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">New Idea</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Create form coming in Milestone B
        </p>
      </div>
      <form className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <Input id="title" placeholder="What's your idea?" />
        </div>
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            className="flex h-12 w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2"
          >
            <option value="idea">Idea</option>
            <option value="recipe">Recipe</option>
            <option value="activity">Activity</option>
            <option value="project">Project</option>
            <option value="location">Location</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Add some details..."
            className="flex w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-base placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2"
          />
        </div>
        <div className="flex gap-3">
          <Link href="/items" className="flex-1">
            <Button type="button" variant="secondary" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" className="flex-1">
            Save
          </Button>
        </div>
      </form>
    </div>
  )
}
