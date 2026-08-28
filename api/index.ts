import { and, asc, desc, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { appMeta, attentionRequests, menuCards, menuProducts, services } from './db/schema'
import { db } from './db/client'
import { seedMenuProducts } from './db/bootstrap'
import { adminLoginResponse, adminLogoutResponse, isAdminRequest, validAdminCredentials } from './auth/admin'
import { deleteProductImage, imageUrl, isAppImageKey, readProductImage, uploadProductImage } from './storage/r2'
import { json, readJson, startApiServer } from './server'

type ProductInput = {
  section?: string
  category?: string
  name?: string
  description?: string
  price?: number | string
  available?: boolean
  sortOrder?: number | string
}

function toProductResponse(product: typeof menuProducts.$inferSelect) {
  return { ...product, imageUrl: imageUrl(product.imageKey) }
}

function productIdFromPath(pathname: string) {
  const match = pathname.match(/^\/api\/admin\/products\/([^/]+)$/)
  return match?.[1] ? decodeURIComponent(match[1]) : undefined
}

function imageProductIdFromPath(pathname: string) {
  const match = pathname.match(/^\/api\/admin\/products\/([^/]+)\/image$/)
  return match?.[1] ? decodeURIComponent(match[1]) : undefined
}

function positiveNumber(value: number | string | undefined, fallback = 0) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : fallback
}

function requiredText(value: string | undefined, label: string) {
  const text = value?.trim()
  if (!text) throw new Error(`${label} es obligatorio.`)
  return text
}

async function readMeta() {
  const rows = await db.select().from(appMeta).orderBy(desc(appMeta.updatedAt)).limit(1)
  return rows[0]
}

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (request.method === 'GET' && pathname === '/api/health') {
    const meta = await readMeta()
    return json({ ok: true, database: true, appName: meta?.appName || 'Empresa Diamante' })
  }

  if (request.method === 'GET' && pathname === '/api/meta') return json({ data: await readMeta() })
  if (request.method === 'GET' && pathname === '/api/services') return json({ data: await db.select().from(services) })
  if (request.method === 'GET' && pathname === '/api/menu-cards') return json({ data: await db.select().from(menuCards).orderBy(menuCards.order) })
  if (request.method === 'GET' && pathname === '/api/requests') return json({ data: await db.select().from(attentionRequests).orderBy(desc(attentionRequests.createdAt)) })

  if (request.method === 'GET' && pathname === '/api/menu-products') {
    const section = url.searchParams.get('section')
    const category = url.searchParams.get('category')
    const filters = [eq(menuProducts.available, true)]
    if (section) filters.push(eq(menuProducts.section, section))
    if (category) filters.push(eq(menuProducts.category, category))
    const products = await db.select().from(menuProducts).where(and(...filters)).orderBy(asc(menuProducts.sortOrder))
    return json({ data: products.map(toProductResponse) })
  }

  const imageMatch = pathname.match(/^\/api\/images\/(.+)$/)
  if (request.method === 'GET' && imageMatch) {
    const key = decodeURIComponent(imageMatch[1])
    if (!isAppImageKey(key)) return json({ error: 'Imagen no encontrada.' }, { status: 404 })
    const image = await readProductImage(key)
    if (!image) return json({ error: 'Imagen no encontrada.' }, { status: 404 })
    return new Response(image.body as BodyInit, {
      headers: { 'cache-control': 'public, max-age=86400, immutable', 'content-type': image.contentType },
    })
  }

  if (request.method === 'POST' && pathname === '/api/requests') {
    const body = await readJson<Partial<typeof attentionRequests.$inferInsert>>(request)
    if (!body.name || !body.address || !body.location || !body.whatsapp || !body.serviceId) return json({ error: 'Completa Todos Los Datos Obligatorios.' }, { status: 400 })
    const now = new Date()
    const record = { id: randomUUID(), name: body.name, address: body.address, location: body.location, whatsapp: body.whatsapp, serviceId: body.serviceId, message: body.message ?? '', status: 'pendiente', createdAt: now, updatedAt: now }
    await db.insert(attentionRequests).values(record)
    return json({ data: record }, { status: 201 })
  }

  const requestMatch = pathname.match(/^\/api\/requests\/([^/]+)$/)
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

  if (request.method === 'POST' && pathname === '/api/admin/login') {
    const body = await readJson<{ email?: string; password?: string }>(request)
    if (!validAdminCredentials(body.email ?? '', body.password ?? '')) return json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 })
    return json({ ok: true, data: { email: body.email } }, { headers: { 'set-cookie': adminLoginResponse() } })
  }
  if (request.method === 'POST' && pathname === '/api/admin/logout') return json({ ok: true }, { headers: { 'set-cookie': adminLogoutResponse() } })
  if (pathname.startsWith('/api/admin/') && !isAdminRequest(request)) return json({ error: 'Inicia sesión como administrador.' }, { status: 401 })
  if (request.method === 'GET' && pathname === '/api/admin/me') return json({ ok: true })

  if (request.method === 'GET' && pathname === '/api/admin/requests') {
    const requests = await db.select().from(attentionRequests).orderBy(desc(attentionRequests.createdAt))
    return json({ data: requests })
  }
  const adminRequestMatch = pathname.match(/^\/api\/admin\/requests\/([^/]+)$/)
  if (adminRequestMatch && request.method === 'PATCH') {
    const body = await readJson<{ status?: string }>(request)
    const status = body.status?.trim()
    if (!status || !['pendiente', 'atendida', 'cancelada'].includes(status)) return json({ error: 'Estado de solicitud no válido.' }, { status: 400 })
    await db.update(attentionRequests).set({ status, updatedAt: new Date() }).where(eq(attentionRequests.id, decodeURIComponent(adminRequestMatch[1])))
    const updated = await db.select().from(attentionRequests).where(eq(attentionRequests.id, decodeURIComponent(adminRequestMatch[1]))).limit(1)
    return updated[0] ? json({ data: updated[0] }) : json({ error: 'Solicitud no encontrada.' }, { status: 404 })
  }

  if (request.method === 'GET' && pathname === '/api/admin/products') {
    const products = await db.select().from(menuProducts).orderBy(asc(menuProducts.sortOrder))
    return json({ data: products.map(toProductResponse) })
  }

  if (request.method === 'POST' && pathname === '/api/admin/products') {
    const body = await readJson<ProductInput>(request)
    const name = requiredText(body.name, 'El nombre')
    const now = new Date()
    const product = {
      id: randomUUID(), sourceNumber: 1000 + Math.floor(Math.random() * 999000), section: requiredText(body.section, 'La sección'), category: requiredText(body.category, 'La categoría'), name,
      description: body.description?.trim() ?? '', price: positiveNumber(body.price), available: body.available ?? true, sortOrder: positiveNumber(body.sortOrder, 999), createdAt: now, updatedAt: now,
    }
    await db.insert(menuProducts).values(product)
    return json({ data: toProductResponse({ ...product, imageKey: null }) }, { status: 201 })
  }

  const imageProductId = imageProductIdFromPath(pathname)
  if (imageProductId && request.method === 'POST') {
    const current = await db.select().from(menuProducts).where(eq(menuProducts.id, imageProductId)).limit(1)
    if (!current[0]) return json({ error: 'Producto no encontrado.' }, { status: 404 })
    const form = await request.formData()
    const file = form.get('image')
    if (!(file instanceof File)) return json({ error: 'Selecciona una imagen.' }, { status: 400 })
    const imageKey = await uploadProductImage(imageProductId, file)
    await db.update(menuProducts).set({ imageKey, updatedAt: new Date() }).where(eq(menuProducts.id, imageProductId))
    if (current[0].imageKey) await deleteProductImage(current[0].imageKey)
    const updated = { ...current[0], imageKey, updatedAt: new Date() }
    return json({ data: toProductResponse(updated) })
  }

  const productId = productIdFromPath(pathname)
  if (productId && request.method === 'PATCH') {
    const body = await readJson<ProductInput>(request)
    const patch: Partial<typeof menuProducts.$inferInsert> = { updatedAt: new Date() }
    if (body.name !== undefined) patch.name = requiredText(body.name, 'El nombre')
    if (body.section !== undefined) patch.section = requiredText(body.section, 'La sección')
    if (body.category !== undefined) patch.category = requiredText(body.category, 'La categoría')
    if (body.description !== undefined) patch.description = body.description.trim()
    if (body.price !== undefined) patch.price = positiveNumber(body.price)
    if (body.available !== undefined) patch.available = body.available
    if (body.sortOrder !== undefined) patch.sortOrder = positiveNumber(body.sortOrder)
    await db.update(menuProducts).set(patch).where(eq(menuProducts.id, productId))
    const updated = await db.select().from(menuProducts).where(eq(menuProducts.id, productId)).limit(1)
    return updated[0] ? json({ data: toProductResponse(updated[0]) }) : json({ error: 'Producto no encontrado.' }, { status: 404 })
  }
  if (productId && request.method === 'DELETE') {
    const current = await db.select().from(menuProducts).where(eq(menuProducts.id, productId)).limit(1)
    if (!current[0]) return json({ error: 'Producto no encontrado.' }, { status: 404 })
    await db.delete(menuProducts).where(eq(menuProducts.id, productId))
    if (current[0].imageKey) await deleteProductImage(current[0].imageKey)
    return json({ ok: true })
  }

  return json({ error: 'Ruta No Encontrada' }, { status: 404 })
}

await seedMenuProducts()
startApiServer(handler)
