import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * Stable infrastructure row. dibot-fast extends this schema with the
 * product-specific entities inferred from the user's prompt; this row keeps
 * the base API, seed and health check runnable before that extension.
 */
export const appMeta = sqliteTable('app_meta', {
  id: text('id').primaryKey(),
  appName: text('app_name').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  detail: text('detail').notNull(),
  accent: text('accent').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export const attentionRequests = sqliteTable('attention_requests', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  location: text('location').notNull(),
  whatsapp: text('whatsapp').notNull(),
  serviceId: text('service_id').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('pendiente'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const menuCards = sqliteTable('menu_cards', {
  id: text('id').primaryKey(),
  serviceId: text('service_id').notNull(),
  order: integer('menu_order').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  description: text('description').notNull(),
  color: text('color').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export const menuProducts = sqliteTable('menu_products', {
  id: text('id').primaryKey(),
  sourceNumber: integer('source_number').notNull(),
  section: text('section').notNull(),
  category: text('category').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  price: integer('price').notNull(),
  imageKey: text('image_key'),
  available: integer('available', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})
