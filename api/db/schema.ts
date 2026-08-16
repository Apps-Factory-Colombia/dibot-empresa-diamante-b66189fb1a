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
