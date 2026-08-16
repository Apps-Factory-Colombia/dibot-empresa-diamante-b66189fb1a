import { appMeta } from './schema'
import { db } from './client'

const appName = process.env.DIBOT_APP_NAME?.trim() || 'Dibot App'

await db.insert(appMeta).values({
  id: 'app',
  appName,
  updatedAt: new Date(),
}).onConflictDoUpdate({
  target: appMeta.id,
  set: { appName, updatedAt: new Date() },
})

console.log(`[seed] Base metadata preparada para ${appName}.`)
