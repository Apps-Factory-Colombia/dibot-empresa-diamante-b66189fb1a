import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN. Configure the server environment first.')
}

export const tursoClient = createClient({ url, authToken })
export const db = drizzle({ client: tursoClient })
