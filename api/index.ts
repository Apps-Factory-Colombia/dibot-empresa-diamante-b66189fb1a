import { desc, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { appMeta, attentionRequests, services } from './db/schema'
import { db } from './db/client'
import { json, readJson, startApiServer } from './server'

async function readMeta() {
  const rows = await db.select().from(appMeta).orderBy(desc(appMeta.updatedAt)).limit(1)
  return rows[0]
}

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)

  if (request.method === 'GET' && url.pathname === '/api/health') {
    const meta = await readMeta()
    return json({
      ok: true,
      database: true,
      appName: meta?.appName || 'Empresa Diamante',
    })
  }

  if (request.method === 'GET' && url.pathname === '/api/meta') {
    return json({ data: await readMeta() })
  }

  if (request.method === 'GET' && url.pathname === '/api/services') return json({ data: await db.select().from(services) })
  if (request.method === 'GET' && url.pathname === '/api/requests') return json({ data: await db.select().from(attentionRequests).orderBy(desc(attentionRequests.createdAt)) })
  if (request.method === 'POST' && url.pathname === '/api/requests') {
    const body = await readJson<Partial<typeof attentionRequests.$inferInsert>>(request)
    if (!body.name || !body.address || !body.location || !body.whatsapp || !body.serviceId) return json({ error: 'Completa Todos Los Datos Obligatorios.' }, { status: 400 })
    const now = new Date()
    const record = { id: randomUUID(), name: body.name, address: body.address, location: body.location, whatsapp: body.whatsapp, serviceId: body.serviceId, message: body.message ?? '', status: 'pendiente', createdAt: now, updatedAt: now }
    await db.insert(attentionRequests).values(record)
    return json({ data: record }, { status: 201 })
  }
  const requestMatch = url.pathname.match(/^\/api\/requests\/([^/]+)$/)
  if (requestMatch && request.method === 'PATCH') {
    const body = await readJson<Partial<typeof attentionRequests.$inferInsert>>(request)
    await db.update(attentionRequests).set({ ...body, updatedAt: new Date() }).where(eq(attentionRequests.id, requestMatch[1]))
    const updated = await db.select().from(attentionRequests).where(eq(attentionRequests.id, requestMatch[1])).limit(1)
    return updated[0] ? json({ data: updated[0] }) : json({ error: 'Solicitud No Encontrada.' }, { status: 404 })
  }
  if (requestMatch && request.method === 'DELETE') {
    await db.delete(attentionRequests).where(eq(attentionRequests.id, requestMatch[1]))
    return json({ ok: true })
  }

  return json({ error: 'Ruta No Encontrada' }, { status: 404 })
}

startApiServer(handler)
