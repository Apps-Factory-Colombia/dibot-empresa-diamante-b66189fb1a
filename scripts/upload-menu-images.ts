import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { eq } from 'drizzle-orm'
import { db } from '../api/db/client.js'
import { ensureMenuProductsTable, seedMenuProducts } from '../api/db/bootstrap.js'
import { menuProducts } from '../api/db/schema.js'
import { menuSeedProducts } from '../api/db/menu-products.js'

const bucket = process.env.R2_BUCKET ?? 'dibot'
const folder = (process.env.R2_APP_FOLDER ?? 'empresa-diamante-b66189fb1a').replace(/^\/+|\/+$/g, '')
const endpoint = process.env.ENDPOINT_S3
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error('Faltan las credenciales S3 de R2 en .env.')

const s3 = new S3Client({ endpoint, region: 'auto', credentials: { accessKeyId, secretAccessKey } })
const sources: Record<string, string> = {
  hotcakes: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=82',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=82',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=82',
  tacos: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=900&q=82',
  garnachas: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=82',
  chilaquiles: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?auto=format&fit=crop&w=900&q=82',
  eggs: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=82',
  meat: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=82',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=82',
  seafood: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=82',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=82',
  coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=82',
  tea: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=82',
  smoothie: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=900&q=82',
  soda: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=82',
  beer: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=82',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=82',
}

const sourceCache = new Map<string, { bytes: Uint8Array; contentType: string }>()
async function download(kind: string) {
  const cached = sourceCache.get(kind)
  if (cached) return cached
  const response = await fetch(sources[kind] ?? sources.restaurant)
  if (!response.ok) throw new Error(`No se pudo descargar la imagen ${kind} (${response.status}).`)
  const data = { bytes: new Uint8Array(await response.arrayBuffer()), contentType: response.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg' }
  sourceCache.set(kind, data)
  return data
}

function imageKind(product: typeof menuSeedProducts[number]) {
  const text = `${product.section} ${product.category} ${product.name} ${product.description}`.toLowerCase()
  if (text.includes('café') || text.includes('cafe') || text.includes('espresso') || text.includes('expresso')) return 'coffee'
  if (text.includes('té') || text.includes('te ')) return 'tea'
  if (text.includes('chocolate')) return 'coffee'
  if (text.includes('licuado')) return 'smoothie'
  if (text.includes('refresco') || text.includes('agua mineral') || text.includes('agua natural')) return 'soda'
  if (text.includes('cerveza') || text.includes('vino') || text.includes('alcoh')) return 'beer'
  if (product.imageKind === 'restaurant') return 'garnachas'
  return sources[product.imageKind] ? product.imageKind : 'restaurant'
}

async function uploadOne(product: typeof menuSeedProducts[number], dbProduct: typeof menuProducts.$inferSelect) {
  const kind = imageKind(product)
  const image = await download(kind)
  const key = `${folder}/products/${product.id}.jpg`
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: image.bytes, ContentType: image.contentType, CacheControl: 'public, max-age=31536000, immutable' }))
  await db.update(menuProducts).set({ imageKey: key, updatedAt: new Date() }).where(eq(menuProducts.id, dbProduct.id))
  return kind
}

await ensureMenuProductsTable()
await seedMenuProducts()
const rows = await db.select().from(menuProducts)
const byId = new Map(rows.map((row) => [row.id, row]))
for (let index = 0; index < menuSeedProducts.length; index += 8) {
  const batch = menuSeedProducts.slice(index, index + 8).filter((product) => byId.has(product.id)).map((product) => uploadOne(product, byId.get(product.id)!))
  const kinds = await Promise.all(batch)
  console.log(`[r2] ${Math.min(index + batch.length, menuSeedProducts.length)}/${menuSeedProducts.length} imágenes listas (${[...new Set(kinds)].join(', ')})`)
}
console.log(`[r2] Menú cargado en ${bucket}/${folder}/products`)
