import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const root = process.cwd()
const esbuildPlatformBinary = join(
  root,
  'node_modules',
  '@esbuild',
  `${process.platform}-${process.arch}`,
  process.platform === 'win32' ? 'esbuild.exe' : 'bin/esbuild',
)
const requiredBinaries = [
  join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
  join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
  join(root, 'node_modules', 'esbuild', 'package.json'),
  join(root, 'node_modules', 'esbuild', 'bin', 'esbuild'),
  esbuildPlatformBinary,
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
  : '[deps] Faltan dependencias de build; instalando dependencias de forma segura...')

// esbuild has a native optional package and a postinstall script. In a Box,
// Bun can fail to enqueue that script with ENOENT and leave node_modules in a
// partial state. The optional package already contains the native binary, so
// lifecycle scripts are unnecessary for this app. Disable Bun's native linker
// too: it avoids reusing a broken workspace link after a killed install.
const installEnvironment = {
  ...process.env,
  BUN_FEATURE_FLAG_DISABLE_NATIVE_DEPENDENCY_LINKER: '1',
}
const configuredTimeout = Number.parseInt(process.env.DIBOT_BUN_INSTALL_TIMEOUT_MS ?? '', 10)
const installTimeoutMs = Number.isFinite(configuredTimeout)
  ? Math.min(Math.max(configuredTimeout, 30_000), 600_000)
  : 180_000

function dependenciesReady() {
  return requiredBinaries.every((file) => existsSync(file))
}

async function runInstall(args: string[], description: string): Promise<number> {
  return new Promise<number>((resolve) => {
    let settled = false
    let timedOut = false
    let forceKillTimer: NodeJS.Timeout | undefined
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: installEnvironment,
      stdio: 'inherit',
      windowsHide: true,
    })
    const timeoutTimer = setTimeout(() => {
      timedOut = true
      console.error(`[deps] ${description} superó ${Math.round(installTimeoutMs / 1000)} s; deteniendo Bun...`)
      try {
        child.kill('SIGTERM')
      } catch {
        // The exit handler below still resolves the attempt on platforms where
        // SIGTERM is not available.
      }
      forceKillTimer = setTimeout(() => {
        if (!settled) {
          try {
            child.kill('SIGKILL')
          } catch {
            // Nothing else to do; the parent workflow will report the failure.
          }
        }
      }, 5_000)
    }, installTimeoutMs)

    const finish = (code: number) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutTimer)
      if (forceKillTimer) clearTimeout(forceKillTimer)
      resolve(code)
    }

    child.once('error', (error) => {
      console.error(`[deps] No se pudo ejecutar Bun: ${error.message}`)
      finish(1)
    })

    child.once('exit', (exitCode, signal) => {
      const code = exitCode ?? (timedOut ? 124 : 1)
      if (code !== 0) {
        console.error(`[deps] ${description} terminó con código ${code}${signal ? ` (${signal})` : ''}.`)
      }
      finish(code)
    })
  })
}

async function installDependencies(): Promise<number> {
  const attempts = [
    {
      args: ['install', '--frozen-lockfile', '--ignore-scripts'],
      description: 'La instalación de dependencias',
    },
    {
      args: ['install', '--frozen-lockfile', '--ignore-scripts', '--no-cache', '--force'],
      description: 'El reintento completo de dependencias',
    },
  ]

  for (let attempt = 0; attempt < attempts.length; attempt += 1) {
    const current = attempts[attempt]
    const code = await runInstall(current.args, current.description)
    if (code === 0 && dependenciesReady()) return 0

    if (attempt === attempts.length - 1) {
      console.error('[deps] La instalación terminó sin todos los binarios requeridos.')
      return code || 1
    }

    console.warn('[deps] Instalación parcial; reintentando sin borrar el directorio de trabajo...')
  }

  return 1
}

const installCode = await installDependencies()
if (installCode !== 0) {
  console.error(`[deps] bun install terminó con código ${installCode}.`)
  process.exit(installCode)
}

await rememberFingerprint(fingerprint)
console.log('[deps] Dependencias instaladas.')
