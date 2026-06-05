import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { WebSocket } from 'ws'
import { neonConfig } from '@neondatabase/serverless'

// Required for local development
neonConfig.webSocketConstructor = WebSocket

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})

export const prisma = new PrismaClient({ adapter })