import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'

const root = process.cwd()
const requiredBinaries = [
  join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
  join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
  join(root, 'node_modules', 'esbuild', 'package.json'),
  join(root, 'node_modules', 'esbuild', 'bin', 'esbuild'),
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

// Keep Bun's normal cache unless the Box explicitly provides another one. A
// workspace-local cache can retain a partially unpacked native package after
// a failed lifecycle script (notably esbuild), making every retry fail again.
const installEnvironment = { ...process.env }
const configuredCacheDirectory = installEnvironment.BUN_INSTALL_CACHE_DIR?.trim()

async function installDependencies(attempt: number): Promise<number> {
  const code = await new Promise<number>((resolve) => {
    const child = spawn(process.execPath, ['install', '--frozen-lockfile'], {
      cwd: root,
      env: installEnvironment,
      stdio: 'inherit',
      windowsHide: true,
    })

    child.once('error', (error) => {
      console.error(`[deps] No se pudo ejecutar Bun: ${error.message}`)
      resolve(1)
    })

    child.once('exit', (exitCode, signal) => {
      if (exitCode === 0 && requiredBinaries.every((file) => existsSync(file))) {
        resolve(0)
        return
      }
      console.error(`[deps] bun install dejó dependencias incompletas o terminó con código ${exitCode ?? 'null'}${signal ? ` (${signal})` : ''}.`)
      resolve(exitCode ?? 1)
    })
  })

  if (code === 0 || attempt >= 2) return code

  console.warn('[deps] Reparando instalación parcial y reintentando una sola vez...')
  await rm(join(root, 'node_modules'), { recursive: true, force: true })
  if (configuredCacheDirectory) {
    await rm(configuredCacheDirectory, { recursive: true, force: true })
  }
  return installDependencies(attempt + 1)
}

const installCode = await installDependencies(1)
if (installCode !== 0) {
  console.error(`[deps] bun install terminó con código ${installCode}.`)
  process.exit(installCode)
}

await rememberFingerprint(fingerprint)
console.log('[deps] Dependencias instaladas.')
