import { appMeta } from './schema'
import { db } from './client'

const appName = process.env.DIBOT_APP_NAME?.trim() || 'Dibot App'

await db.insert(appMeta).values({
  id: 'app',
  appName,
  updatedAt: new Date(),
}).onConflictDoNothing({
  target: appMeta.id,
})

console.log(`[seed] Base metadata preparada para ${appName}.`)
