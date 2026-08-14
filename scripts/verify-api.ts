import 'dotenv/config'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const required = process.env.DIBOT_REQUIRE_PERSISTENCE === '1'
const entry = resolve('dist/server/api/index.js')

if (!existsSync(entry)) {
  if (required) throw new Error('API obligatoria: esbuild no generó dist/server/api/index.js.')
  console.log('[api] Sin bundle de API; se omite la prueba de runtime.')
  process.exit(0)
}

const port = 43000 + Math.floor(Math.random() * 1000)
const appName = process.env.DIBOT_APP_NAME?.trim()
const child = spawn(process.execPath, [entry], {
  cwd: process.cwd(),
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
})

let serverOutput = ''
child.stdout.on('data', (chunk: Buffer) => { serverOutput += chunk.toString() })
child.stderr.on('data', (chunk: Buffer) => { serverOutput += chunk.toString() })

const deadline = Date.now() + 20_000
let verified = false

try {
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`La API terminó antes del health check. ${serverOutput.slice(-2000)}`)
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`)
      const body = await response.json() as { ok?: boolean; database?: boolean; appName?: string }
      if (!response.ok || body.ok !== true || body.database !== true) {
        throw new Error(`Health inválido (${response.status}): ${JSON.stringify(body)}`)
      }
      if (appName && body.appName !== appName) throw new Error(`La API reportó appName=${body.appName ?? 'vacío'}; se esperaba ${appName}.`)
      verified = true
      console.log(`[api] Runtime, health y Turso verificados en /api/health${appName ? ` para ${appName}` : ''}.`)
      break
    } catch (error) {
      if (Date.now() + 200 >= deadline) throw error
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 200))
    }
  }
  if (!verified) throw new Error(`La API no respondió en 20 s. ${serverOutput.slice(-2000)}`)
} finally {
  child.kill()
}
