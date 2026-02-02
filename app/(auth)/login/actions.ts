'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { createSession } from '@/lib/session'
import { setSessionCookie } from '@/lib/cookies'
import { checkLoginRateLimit, resetLoginRateLimit } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginState = {
  error?: string
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  // Validate input
  const result = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return { error: 'Invalid email or password' }
  }

  const { email, password } = result.data
  const normalizedEmail = email.toLowerCase()

  // Check rate limit
  const rateLimitResult = await checkLoginRateLimit(normalizedEmail)
  if (!rateLimitResult.success) {
    console.log(`[auth] Rate limited login attempt for: ${normalizedEmail}`)
    const minutes = Math.ceil(rateLimitResult.retryAfterSeconds / 60)
    return {
      error: `Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    }
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user) {
    console.log(`[auth] Failed login attempt for unknown email: ${normalizedEmail}`)
    return { error: 'Invalid email or password' }
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash)

  if (!isValid) {
    console.log(`[auth] Failed login attempt for: ${normalizedEmail}`)
    return { error: 'Invalid email or password' }
  }

  // Reset rate limit on successful login
  await resetLoginRateLimit(normalizedEmail)

  // Create session and set cookie
  const token = await createSession(user.id)
  await setSessionCookie(token)

  console.log(`[auth] Successful login for: ${normalizedEmail}`)

  // Redirect to app
  redirect('/items')
}
