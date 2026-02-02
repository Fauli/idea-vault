import { LogoutButton } from './logout-button'

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
          <h3 className="font-medium">Account</h3>
          <p className="mt-1 text-sm text-foreground/60">
            Sign out of your account on this device.
          </p>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  )
}
