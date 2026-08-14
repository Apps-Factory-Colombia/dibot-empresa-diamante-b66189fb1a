# Dibot Mobile Template

Plantilla vacia para generar aplicaciones mobile-first. OpenCode recibe el brief, las referencias visuales y crea el producto desde `src/App.tsx`.

## Desarrollo

```bash
bun install
bun run dev
```

## Verificacion y velocidad

```bash
bun install --frozen-lockfile
bun run dibot:verify
bun run analyze
```

El build ejecuta TypeScript y Vite en paralelo y usa esbuild para entradas opcionales de `api/index.ts`, `workers/index.ts`, `cli/index.ts` e `internal/index.ts`. Cada bundle server-side genera datos en `dist/esbuild-metafile.json` para analizar dependencias. Si la app declara tablas o API, `dibot:verify` también prueba la conexión real con Turso.

## Base de datos

La capa server-side esta en `api/`. Configura Turso, define tablas en `api/db/schema.ts` y ejecuta `bun run db:push` cuando la app lo requiera.

## OpenCode

Usa `prompt-builder` para convertir la idea en un superprompt y `dibot-fast` como agente principal tanto para crear como para actualizar y reparar la app.

## Workflow automatizado

El workflow recibe el nombre, registra el job, provisiona una base Turso nueva en `create`, ejecuta `dibot-fast` y exige schema, seed, API, frontend conectado, TypeScript, Vite, esbuild, health runtime y lint. Si algo falla vuelve a llamar a `dibot-fast` con el diagnóstico exacto hasta que la puerta completa pase.

```powershell
$env:DIBOT_API_URL='https://api-dibot.appsfactory.com.co'
$env:DIBOT_AGENT_API_TOKEN='...'

# App nueva: nombre, registro, Turso, prompt-builder y dibot-fast
bun run dibot:workflow -- user-123 app-001 "Pulso" create "Crea una app movil de notas rapidas"

# App existente: dibot-fast en UPDATE MODE sobre la misma API y base
bun run dibot:workflow -- user-123 app-001 "Pulso" update "Agrega busqueda y conserva el diseno actual"
```

Tambien acepta flags: `--user-id`, `--app-id`, `--app-name`, `--mode` y `--prompt`. El resultado final incluye tiempos, nombre y base verificada.
El workflow tambien muestra el tiempo total, el tiempo de OpenCode y el tiempo de validacion; esas duraciones quedan incluidas en el JSON final como `duration`, `openCodeDuration` y `verificationDuration`.
En `create`, el workflow reutiliza el superprompt por hash desde `.dibot-runtime/superprompts/`; cambia automáticamente cuando cambia el brief.
