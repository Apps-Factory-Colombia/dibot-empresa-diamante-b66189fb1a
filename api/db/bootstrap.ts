import { sql } from 'drizzle-orm'
import { db, tursoClient } from './client.js'
import { menuProducts } from './schema.js'
import { menuSeedProducts } from './menu-products.js'

export async function ensureMenuProductsTable() {
  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS menu_products (
      id TEXT PRIMARY KEY NOT NULL,
      source_number INTEGER NOT NULL,
      section TEXT NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price INTEGER NOT NULL,
      image_key TEXT,
      available INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
}

export async function seedMenuProducts() {
  await ensureMenuProductsTable()
  const existing = await db.select({ id: menuProducts.id }).from(menuProducts)
  if (existing.length >= menuSeedProducts.length) return
  const existingIds = new Set(existing.map((product) => product.id))

  const now = new Date()
  const values = menuSeedProducts.filter((product) => !existingIds.has(product.id)).map((product) => ({
    id: product.id,
    sourceNumber: product.sourceNumber,
    section: product.section,
    category: product.category,
    name: product.name,
    description: product.description,
    price: product.price,
    available: product.available,
    sortOrder: product.sortOrder,
    createdAt: now,
    updatedAt: now,
  }))

  for (let index = 0; index < values.length; index += 40) {
    await db.insert(menuProducts).values(values.slice(index, index + 40)).onConflictDoNothing({ target: menuProducts.id })
  }
}

export async function countMenuProducts() {
  await ensureMenuProductsTable()
  const result = await db.select({ count: sql<number>`count(*)` }).from(menuProducts)
  return Number(result[0]?.count ?? 0)
}
