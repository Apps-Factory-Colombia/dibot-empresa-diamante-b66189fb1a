import { eq } from 'drizzle-orm'
import { appMeta } from './db/schema'
import { db } from './db/client'

const smokeId = '__dibot_smoke__'
const firstName = `${process.env.DIBOT_APP_NAME?.trim() || 'Dibot App'} Smoke`

try {
  await db.delete(appMeta).where(eq(appMeta.id, smokeId))
  await db.insert(appMeta).values({ id: smokeId, appName: firstName, updatedAt: new Date() })

  const created = await db.select().from(appMeta).where(eq(appMeta.id, smokeId)).limit(1)
  if (created[0]?.appName !== firstName) throw new Error('Smoke create/read falló.')

  const updatedName = `${firstName} Updated`
  await db.update(appMeta).set({ appName: updatedName, updatedAt: new Date() }).where(eq(appMeta.id, smokeId))
  const updated = await db.select().from(appMeta).where(eq(appMeta.id, smokeId)).limit(1)
  if (updated[0]?.appName !== updatedName) throw new Error('Smoke update falló.')
} finally {
  await db.delete(appMeta).where(eq(appMeta.id, smokeId))
}

console.log('[smoke] CRUD Turso create/read/update/delete verificado.')
