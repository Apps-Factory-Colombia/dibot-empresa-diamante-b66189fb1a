import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

type PackageManifest = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

async function sourceFiles(directory: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(path))
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(path)
  }
  return files
}

const manifest = JSON.parse(await readFile('package.json', 'utf8')) as PackageManifest
const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
const main = await readFile('src/main.tsx', 'utf8')
const files = await sourceFiles('src')
const source = await Promise.all(files.map((file) => readFile(file, 'utf8')))
const queryClientCount = source.reduce((count, content) => count + (content.match(/new QueryClient\s*\(/g)?.length ?? 0), 0)

if (!main.includes('QueryClientProvider')) throw new Error('Contrato roto: src/main.tsx debe montar QueryClientProvider.')
if (!main.includes('<QueryClientProvider') || !main.includes('</QueryClientProvider>')) throw new Error('Contrato roto: App debe estar dentro de QueryClientProvider.')
if (!main.includes('BrowserRouter')) throw new Error('Contrato roto: src/main.tsx debe montar BrowserRouter para useRoutes/useNavigate.')
if (!main.includes('<BrowserRouter') || !main.includes('</BrowserRouter>')) throw new Error('Contrato roto: App debe estar dentro de BrowserRouter.')
if (!main.includes('AppErrorBoundary')) throw new Error('Contrato roto: el entrypoint debe tener un fallback visible para errores de runtime.')
if (queryClientCount !== 1) throw new Error(`Contrato roto: se esperaba un único QueryClient global y se encontraron ${queryClientCount}.`)
if (dependencies['@phosphor-icons/react']) throw new Error('Contrato roto: elimina @phosphor-icons/react; usa lucide-react.')
if (!dependencies['lucide-react']) throw new Error('Contrato roto: falta la dependencia lucide-react.')
if (!dependencies['@hookform/resolvers']) throw new Error('Contrato roto: falta @hookform/resolvers para formularios React Hook Form + Zod.')

console.log('[contracts] QueryClientProvider, QueryClient único y lucide-react verificados.')
