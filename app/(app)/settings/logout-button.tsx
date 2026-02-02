'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/(auth)/logout/actions'

export function LogoutButton() {
  const [pending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <Button
      variant="secondary"
      onClick={handleLogout}
      disabled={pending}
    >
      {pending ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
