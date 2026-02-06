import Link from 'next/link'
import { LogoutButton } from './logout-button'
import { ExportButton } from './export-button'
import { ThemeToggle } from './theme-toggle'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Manage your account
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-foreground/10 p-4">
          <h3 className="font-medium">Appearance</h3>
          <p className="mt-1 text-sm text-foreground/60">
            Choose your preferred color scheme.
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </div>

        <Link
          href="/trash"
          className="flex items-center justify-between rounded-lg border border-foreground/10 p-4 transition-colors hover:border-foreground/20"
        >
          <div>
            <h3 className="font-medium">Trash</h3>
            <p className="mt-1 text-sm text-foreground/60">
              View and restore deleted items (30-day retention)
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5 text-foreground/40"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </Link>

        <div className="rounded-lg border border-foreground/10 p-4">
          <h3 className="font-medium">Data</h3>
          <p className="mt-1 text-sm text-foreground/60">
            Export all your items as a JSON file for backup or migration.
          </p>
          <div className="mt-4">
            <ExportButton />
          </div>
        </div>

        <div className="rounded-lg border border-foreground/10 p-4">
          <h3 className="font-medium">Account</h3>
          <p className="mt-1 text-sm text-foreground/60">
            Sign out of your account on this device.
          </p>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </div>

        <div className="rounded-lg border border-foreground/10 p-4">
          <h3 className="font-medium">About</h3>
          <p className="mt-2 text-sm text-foreground/60">
            Made with love by Fauli
          </p>
        </div>
      </div>
    </div>
  )
}
