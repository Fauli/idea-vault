'use server'

import { redirect } from 'next/navigation'
import { getSessionCookie, clearSessionCookie } from '@/lib/cookies'
import { deleteSession } from '@/lib/session'

export async function logout(): Promise<void> {
  const token = await getSessionCookie()

  if (token) {
    await deleteSession(token)
  }

  await clearSessionCookie()
  redirect('/login')
}
