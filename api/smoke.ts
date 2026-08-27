import { eq } from 'drizzle-orm'
import { attentionRequests } from './db/schema'
import { db } from './db/client'

const smokeId = '__dibot_smoke__'
const firstName = 'Prueba Empresa Diamante'

try {
  await db.delete(attentionRequests).where(eq(attentionRequests.id, smokeId))
  await db.insert(attentionRequests).values({ id: smokeId, name: firstName, address: 'Calle Rosa 1', location: 'Centro', whatsapp: '5555555555', serviceId: 'eventos', message: 'Prueba', status: 'pendiente', createdAt: new Date(), updatedAt: new Date() })

  const created = await db.select().from(attentionRequests).where(eq(attentionRequests.id, smokeId)).limit(1)
  if (created[0]?.name !== firstName) throw new Error('Smoke create/read falló.')

  const updatedName = `${firstName} Updated`
  await db.update(attentionRequests).set({ name: updatedName, updatedAt: new Date() }).where(eq(attentionRequests.id, smokeId))
  const updated = await db.select().from(attentionRequests).where(eq(attentionRequests.id, smokeId)).limit(1)
  if (updated[0]?.name !== updatedName) throw new Error('Smoke update falló.')
} finally {
  await db.delete(attentionRequests).where(eq(attentionRequests.id, smokeId))
}

const deleted = await db.select().from(attentionRequests).where(eq(attentionRequests.id, smokeId)).limit(1)
if (deleted.length !== 0) throw new Error('Smoke delete falló.')

console.log('[smoke] CRUD Turso create/read/update/delete verificado.')
