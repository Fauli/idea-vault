import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSessionCookie } from './cookies'
import { validateSession } from './session'
import type { UserModel as User } from '@/app/generated/prisma/models'

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 * Cached per request to avoid multiple DB queries
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getSessionCookie()

  if (!token) {
    return null
  }

  return validateSession(token)
})

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in server components or layouts that require auth
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}
