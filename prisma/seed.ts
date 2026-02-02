import 'dotenv/config'
import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hashPassword } from '../lib/password'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  // Get passwords from environment variables
  const passwordF = process.env.SEED_PASSWORD_F
  const passwordK = process.env.SEED_PASSWORD_K

  if (!passwordF || !passwordK) {
    console.error('Error: SEED_PASSWORD_F and SEED_PASSWORD_K must be set')
    console.error('Example: SEED_PASSWORD_F=secret1 SEED_PASSWORD_K=secret2 pnpm db:seed')
    process.exit(1)
  }

  console.log('Seeding users...')

  // Upsert user F
  const userF = await prisma.user.upsert({
    where: { email: 'f@pocket.local' },
    update: {
      passwordHash: await hashPassword(passwordF),
    },
    create: {
      email: 'f@pocket.local',
      name: 'F',
      passwordHash: await hashPassword(passwordF),
    },
  })
  console.log(`✓ User F: ${userF.email}`)

  // Upsert user K
  const userK = await prisma.user.upsert({
    where: { email: 'k@pocket.local' },
    update: {
      passwordHash: await hashPassword(passwordK),
    },
    create: {
      email: 'k@pocket.local',
      name: 'K',
      passwordHash: await hashPassword(passwordK),
    },
  })
  console.log(`✓ User K: ${userK.email}`)

  console.log('Seeding complete!')

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
