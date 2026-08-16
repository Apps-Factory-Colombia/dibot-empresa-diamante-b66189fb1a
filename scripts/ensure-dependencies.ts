import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const root = process.cwd()
const requiredBinaries = [
  join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
  join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
]

async function dependencyFingerprint() {
  const [manifest, lockfile] = await Promise.all([
    readFile(join(root, 'package.json')),
    readFile(join(root, 'bun.lock')),
  ])
  return createHash('sha256').update(manifest).update(lockfile).digest('hex')
}

async function rememberFingerprint(fingerprint: string) {
  const runtimeDirectory = join(root, '.dibot-runtime')
  await mkdir(runtimeDirectory, { recursive: true })
  await writeFile(join(runtimeDirectory, 'dependencies.fingerprint'), `${fingerprint}\n`, 'utf8')
}

const missing = requiredBinaries.filter((file) => !existsSync(file))
const fingerprint = await dependencyFingerprint()
const previousFingerprint = await readFile(join(root, '.dibot-runtime', 'dependencies.fingerprint'), 'utf8')
  .then((value) => value.trim())
  .catch(() => '')

if (missing.length === 0 && (!previousFingerprint || previousFingerprint === fingerprint)) {
  await rememberFingerprint(fingerprint)
  console.log(`[deps] Dependencias listas; bun install omitido (fingerprint ${fingerprint.slice(0, 12)}).`)
  process.exit(0)
}

console.log(previousFingerprint && previousFingerprint !== fingerprint
  ? '[deps] package.json o bun.lock cambió; actualizando dependencias de esta app...'
  : '[deps] Faltan dependencias de build; ejecutando bun install --frozen-lockfile...')

const child = spawn(process.execPath, ['install', '--frozen-lockfile'], {
  cwd: root,
  env: {
    ...process.env,
    BUN_INSTALL_CACHE_DIR: process.env.BUN_INSTALL_CACHE_DIR || join(root, '.dibot-runtime', 'bun-cache'),
  },
  stdio: 'inherit',
  windowsHide: true,
})

child.once('error', (error) => {
  console.error(`[deps] No se pudo ejecutar Bun: ${error.message}`)
  process.exit(1)
})

child.once('exit', async (code, signal) => {
  if (code === 0) {
    await rememberFingerprint(fingerprint)
    console.log('[deps] Dependencias instaladas.')
    return
  }
  console.error(`[deps] bun install terminó con código ${code ?? 'null'}${signal ? ` (${signal})` : ''}.`)
  process.exit(code ?? 1)
})
