import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Load dotenv only in development (not in Docker where env vars are set by compose)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config')
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
