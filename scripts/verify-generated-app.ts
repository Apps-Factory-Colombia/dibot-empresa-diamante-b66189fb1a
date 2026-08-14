import { access, readFile } from 'node:fs/promises'

async function exists(path: string) {
  try { await access(path); return true } catch { return false }
}

const required = process.env.DIBOT_REQUIRE_PERSISTENCE === '1'
if (!required) {
  console.log('[generated] Contrato de app completa desactivado para la plantilla vacía.')
  process.exit(0)
}

for (const file of ['api/index.ts', 'api/smoke.ts', 'api/db/schema.ts', 'api/db/seed.ts']) {
  if (!await exists(file)) throw new Error(`App incompleta: falta ${file}.`)
}

const [api, smoke, schema, seed, index, app] = await Promise.all([
  readFile('api/index.ts', 'utf8'),
  readFile('api/smoke.ts', 'utf8'),
  readFile('api/db/schema.ts', 'utf8'),
  readFile('api/db/seed.ts', 'utf8'),
  readFile('index.html', 'utf8'),
  readFile('src/App.tsx', 'utf8'),
])

if (!/sqliteTable\s*\(/.test(schema)) throw new Error('App incompleta: api/db/schema.ts no define tablas Drizzle.')
if (!api.includes('/api/health') || !api.includes('startApiServer')) throw new Error('App incompleta: api/index.ts debe usar startApiServer y exponer /api/health.')
if (!seed.trim()) throw new Error('App incompleta: api/db/seed.ts está vacío.')
if (!smoke.trim()) throw new Error('App incompleta: api/smoke.ts está vacío.')
if (!app.includes('/api/')) throw new Error('App incompleta: el frontend no consume la API server-side mediante /api/.')

const appName = process.env.DIBOT_APP_NAME?.trim()
if (appName && (!index.includes(`<title>${appName}</title>`) || !app.includes(appName))) {
  throw new Error(`Nombre incompleto: ${appName} debe aparecer en el título HTML y en la UI principal.`)
}

console.log('[generated] Nombre, schema, seed, smoke test, API y conexión frontend verificados.')
