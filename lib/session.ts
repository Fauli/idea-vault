import { randomBytes, createHash } from 'crypto'
import { prisma } from './db'
import type { UserModel as User } from '@/app/generated/prisma/models'

const SESSION_EXPIRY_DAYS = 30

/**
 * Hash a session token using SHA-256
 * We store hashed tokens so a DB leak doesn't expose valid sessions
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Create a new session for a user
 * Returns the plain token (to be sent to client)
 */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  return token
}

/**
 * Validate a session token and return the associated user
 * Returns null if token is invalid or expired
 */
export async function validateSession(token: string): Promise<User | null> {
  const tokenHash = hashToken(token)

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!session) {
    return null
  }

  // Check if session has expired
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }

  return session.user
}

/**
 * Delete a session by its token
 */
export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashToken(token)

  await prisma.session.deleteMany({
    where: { tokenHash },
  })
}

/**
 * Delete all expired sessions (cleanup utility)
 * Can be run periodically via cron or on-demand
 */
export async function deleteExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })

  return result.count
}
