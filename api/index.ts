import { desc } from 'drizzle-orm'
import { appMeta } from './db/schema'
import { db } from './db/client'
import { json, startApiServer } from './server'

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
      appName: meta?.appName || process.env.DIBOT_APP_NAME || 'Dibot App',
    })
  }

  if (request.method === 'GET' && url.pathname === '/api/meta') {
    return json({ data: await readMeta() })
  }

  return json({ error: 'Ruta no encontrada' }, { status: 404 })
}

startApiServer(handler)
