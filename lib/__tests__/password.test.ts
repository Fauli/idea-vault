import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../password'

describe('password', () => {
  describe('hashPassword', () => {
    it('returns a bcrypt hash', async () => {
      const hash = await hashPassword('mypassword')
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/)
    })

    it('produces different hashes for the same password', async () => {
      const hash1 = await hashPassword('mypassword')
      const hash2 = await hashPassword('mypassword')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const hash = await hashPassword('correctpassword')
      const result = await verifyPassword('correctpassword', hash)
      expect(result).toBe(true)
    })

    it('returns false for incorrect password', async () => {
      const hash = await hashPassword('correctpassword')
      const result = await verifyPassword('wrongpassword', hash)
      expect(result).toBe(false)
    })

    it('handles empty password', async () => {
      const hash = await hashPassword('')
      const result = await verifyPassword('', hash)
      expect(result).toBe(true)
    })
  })
})
