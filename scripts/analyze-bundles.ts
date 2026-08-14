import { readFile } from 'node:fs/promises'
import { analyzeMetafile, type Metafile } from 'esbuild'

try {
  const source = await readFile('dist/esbuild-metafile.json', 'utf8')
  const metafile = JSON.parse(source) as Metafile
  if (Object.keys(metafile.inputs).length === 0) console.log('[analyze] No hay bundles server-side para analizar.')
  else console.log(await analyzeMetafile(metafile, { verbose: false }))
} catch (error) {
  if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
    console.log('[analyze] No existe dist/esbuild-metafile.json. Ejecuta bun run build primero.')
  } else {
    throw error
  }
}
