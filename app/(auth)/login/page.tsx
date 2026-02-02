import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Pocket Ideas</h1>
          <p className="mt-2 text-foreground/60">Sign in to continue</p>
        </div>
        <form className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
        <p className="text-center text-sm text-foreground/50">
          Authentication coming in Milestone B
        </p>
      </div>
    </div>
  )
}
