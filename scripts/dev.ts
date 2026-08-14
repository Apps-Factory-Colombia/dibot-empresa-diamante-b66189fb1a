import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'

const children: ChildProcess[] = []

function start(args: string[]) {
  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  })
  children.push(child)
  child.once('exit', (code) => {
    if (code && code !== 0) process.exitCode = code
    stop()
  })
}

function stop() {
  for (const child of children) {
    if (!child.killed) child.kill()
  }
}

process.once('SIGINT', stop)
process.once('SIGTERM', stop)

if (existsSync('api/index.ts')) start(['--watch', 'api/index.ts'])
start(['node_modules/vite/bin/vite.js'])
