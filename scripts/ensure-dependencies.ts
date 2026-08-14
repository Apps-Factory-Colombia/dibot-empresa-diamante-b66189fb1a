import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'

const root = process.cwd()
const requiredBinaries = [
  join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
  join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
]

const missing = requiredBinaries.filter((file) => !existsSync(file))

if (missing.length === 0) {
  console.log('[deps] Dependencias listas.')
  process.exit(0)
}

console.log('[deps] Faltan dependencias de build; ejecutando bun install --frozen-lockfile...')

const child = spawn(process.execPath, ['install', '--frozen-lockfile'], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  windowsHide: true,
})

child.once('error', (error) => {
  console.error(`[deps] No se pudo ejecutar Bun: ${error.message}`)
  process.exit(1)
})

child.once('exit', (code, signal) => {
  if (code === 0) {
    console.log('[deps] Dependencias instaladas.')
    return
  }
  console.error(`[deps] bun install terminó con código ${code ?? 'null'}${signal ? ` (${signal})` : ''}.`)
  process.exit(code ?? 1)
})
