import { spawn } from 'node:child_process'

type BuildJob = { name: string; args: string[] }

const jobs: BuildJob[] = [
  { name: 'TypeScript app', args: ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.app.json'] },
  { name: 'TypeScript tooling', args: ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.node.json'] },
  { name: 'TypeScript server', args: ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.server.json'] },
  { name: 'Vite', args: ['node_modules/vite/bin/vite.js', 'build'] },
]

function runJob(job: BuildJob) {
  console.log(`\n[build] ${job.name}`)
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, job.args, { stdio: 'inherit', windowsHide: true })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(`${job.name} terminó con código ${code ?? 'null'}${signal ? ` (${signal})` : ''}.`))
    })
  })
}

const results = await Promise.allSettled(jobs.map(runJob))
const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
if (failures.length > 0) {
  for (const failure of failures) console.error(`[build] ${failure.reason instanceof Error ? failure.reason.message : String(failure.reason)}`)
  process.exitCode = 1
} else {
  await import('./build-esbuild.ts')
}
