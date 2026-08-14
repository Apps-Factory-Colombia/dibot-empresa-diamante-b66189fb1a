import 'dotenv/config'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createClient, type InValue } from '@libsql/client'

type NormalizedRow = Record<string, string | number | boolean | null>
type TableSnapshot = { columns: string[]; rows: NormalizedRow[] }
type DatabaseSnapshot = { databaseId: string; tables: Record<string, TableSnapshot> }

const snapshotPath = '.dibot-runtime/update-db-snapshot.json'
const url = process.env.TURSO_DATABASE_URL?.trim()
const authToken = process.env.TURSO_AUTH_TOKEN?.trim()
const databaseId = process.env.TURSO_DATABASE_ID?.trim()
if (!url || !authToken || !databaseId) throw new Error('Snapshot requiere TURSO_DATABASE_URL, TURSO_AUTH_TOKEN y TURSO_DATABASE_ID.')
const configuredDatabaseId = databaseId

const client = createClient({ url, authToken })

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

function normalize(value: InValue): string | number | boolean | null {
  if (value === null || typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof ArrayBuffer) return Buffer.from(value).toString('base64')
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('base64')
  return String(value)
}

async function capture(): Promise<DatabaseSnapshot> {
  const tableResult = await client.execute("select name from sqlite_schema where type = 'table' and name not like 'sqlite_%' and name != '__drizzle_migrations' order by name")
  const tables: Record<string, TableSnapshot> = {}
  for (const row of tableResult.rows) {
    const name = String(row.name)
    const info = await client.execute(`pragma table_info(${quoteIdentifier(name)})`)
    const columns = info.rows.map((column) => String(column.name))
    const result = await client.execute(`select ${columns.map(quoteIdentifier).join(', ')} from ${quoteIdentifier(name)}`)
    tables[name] = {
      columns,
      rows: result.rows.map((source) => Object.fromEntries(columns.map((column) => [column, normalize(source[column] as InValue)]))),
    }
  }
  return { databaseId: configuredDatabaseId, tables }
}

function rowKey(row: NormalizedRow) {
  return JSON.stringify(Object.entries(row).sort(([left], [right]) => left.localeCompare(right)))
}

async function saveBefore() {
  await mkdir('.dibot-runtime', { recursive: true })
  const snapshot = await capture()
  await writeFile(snapshotPath, `${JSON.stringify(snapshot)}\n`, 'utf8')
  const rows = Object.values(snapshot.tables).reduce((total, table) => total + table.rows.length, 0)
  console.log(`[snapshot] Protegidas ${rows} fila(s) en ${Object.keys(snapshot.tables).length} tabla(s).`)
}

async function verifyAfter() {
  const before = JSON.parse(await readFile(snapshotPath, 'utf8')) as DatabaseSnapshot
  if (before.databaseId !== configuredDatabaseId) throw new Error(`Update cambió de base: ${before.databaseId} -> ${configuredDatabaseId}.`)
  const after = await capture()

  for (const [tableName, tableBefore] of Object.entries(before.tables)) {
    const tableAfter = after.tables[tableName]
    if (!tableAfter) throw new Error(`Update eliminó la tabla existente ${tableName}.`)
    const remaining = new Map<string, number>()
    for (const row of tableAfter.rows) {
      const projected = Object.fromEntries(tableBefore.columns.map((column) => [column, row[column] ?? null]))
      const key = rowKey(projected)
      remaining.set(key, (remaining.get(key) ?? 0) + 1)
    }
    for (const row of tableBefore.rows) {
      const key = rowKey(row)
      const count = remaining.get(key) ?? 0
      if (count < 1) throw new Error(`Update perdió o sobrescribió datos existentes de la tabla ${tableName}.`)
      remaining.set(key, count - 1)
    }
  }
  console.log(`[snapshot] TURSO_DATABASE_ID y filas previas conservados en ${Object.keys(before.tables).length} tabla(s).`)
}

const command = process.argv[2]
if (command === 'before') await saveBefore()
else if (command === 'verify') await verifyAfter()
else throw new Error('Uso: bun scripts/snapshot-database.ts <before|verify>')
