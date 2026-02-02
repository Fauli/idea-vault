import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '../db'
import { hashPassword } from '../password'
import {
  createSession,
  validateSession,
  deleteSession,
  deleteExpiredSessions,
} from '../session'

describe('session', () => {
  let testUserId: string

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'session-test@example.com',
        passwordHash: await hashPassword('testpass'),
        name: 'Test User',
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    // Clean up test user (cascades to sessions)
    await prisma.user.delete({ where: { id: testUserId } })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up sessions before each test
    await prisma.session.deleteMany({ where: { userId: testUserId } })
  })

  describe('createSession', () => {
    it('returns a 64-character hex token', async () => {
      const token = await createSession(testUserId)
      expect(token).toMatch(/^[a-f0-9]{64}$/)
    })

    it('creates a session in the database', async () => {
      await createSession(testUserId)
      const sessions = await prisma.session.findMany({
        where: { userId: testUserId },
      })
      expect(sessions).toHaveLength(1)
    })

    it('stores hashed token, not plain token', async () => {
      const token = await createSession(testUserId)
      const session = await prisma.session.findFirst({
        where: { userId: testUserId },
      })
      expect(session?.tokenHash).not.toBe(token)
      expect(session?.tokenHash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('validateSession', () => {
    it('returns user for valid token', async () => {
      const token = await createSession(testUserId)
      const user = await validateSession(token)
      expect(user).not.toBeNull()
      expect(user?.id).toBe(testUserId)
      expect(user?.email).toBe('session-test@example.com')
    })

    it('returns null for invalid token', async () => {
      const user = await validateSession('invalid-token')
      expect(user).toBeNull()
    })

    it('returns null for expired session', async () => {
      const token = await createSession(testUserId)

      // Manually expire the session
      await prisma.session.updateMany({
        where: { userId: testUserId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      })

      const user = await validateSession(token)
      expect(user).toBeNull()
    })

    it('deletes expired session on validation', async () => {
      const token = await createSession(testUserId)

      await prisma.session.updateMany({
        where: { userId: testUserId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      })

      await validateSession(token)

      const sessions = await prisma.session.findMany({
        where: { userId: testUserId },
      })
      expect(sessions).toHaveLength(0)
    })
  })

  describe('deleteSession', () => {
    it('removes session from database', async () => {
      const token = await createSession(testUserId)

      await deleteSession(token)

      const sessions = await prisma.session.findMany({
        where: { userId: testUserId },
      })
      expect(sessions).toHaveLength(0)
    })

    it('does not throw for non-existent token', async () => {
      await expect(deleteSession('non-existent')).resolves.not.toThrow()
    })
  })

  describe('deleteExpiredSessions', () => {
    it('deletes expired sessions and returns count', async () => {
      // Create 2 sessions and expire them
      await createSession(testUserId)
      await createSession(testUserId)

      await prisma.session.updateMany({
        where: { userId: testUserId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      })

      const count = await deleteExpiredSessions()
      expect(count).toBeGreaterThanOrEqual(2)
    })

    it('does not delete valid sessions', async () => {
      await createSession(testUserId)

      await deleteExpiredSessions()

      const sessions = await prisma.session.findMany({
        where: { userId: testUserId },
      })
      expect(sessions).toHaveLength(1)
    })
  })
})
