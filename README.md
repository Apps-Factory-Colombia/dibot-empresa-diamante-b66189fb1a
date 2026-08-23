# Dibot Mobile Template

Plantilla base de infraestructura para generar aplicaciones mobile-first. OpenCode crea el producto específico desde `src/App.tsx`; la plantilla ya incluye API, seed, smoke CRUD, health check liviano y contratos para evitar reparaciones estructurales.

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

El build ejecuta TypeScript y Vite en paralelo y usa esbuild para entradas opcionales de `api/index.ts`, `workers/index.ts`, `cli/index.ts` e `internal/index.ts`. Cada bundle server-side genera datos en `dist/esbuild-metafile.json`. `dibot:verify:fast` solo hace contratos, TypeScript y lint; `dibot:verify:release` es la puerta completa y ejecuta el único build de producción.

## Base de datos

La capa server-side esta en `api/`. Configura Turso, define tablas en `api/db/schema.ts` y ejecuta `bun run db:push` cuando la app lo requiera.

## OpenCode

Usa una sola sesión de `dibot-fast` con `gpt-5.6-luna` en `medium`: entiende el prompt natural, busca y analiza Mobbin una vez en `create`, decide una dirección visual original y construye la app. `prompt-builder` se conserva solo como compatibilidad conceptual y ya no abre una segunda sesión.

## Workflow automatizado

El workflow recibe el nombre, registra el job, provisiona una base Turso nueva en `create`, ejecuta `dibot-fast` y exige schema, seed, API, frontend conectado, TypeScript y lint sin compilar producción en el PC. Después publica GitHub; GitHub Actions ejecuta `dibot:verify:release`, crea una imagen Docker runtime y la publica en GHCR. Dokploy recibe esa imagen, hace pull y arranca el contenedor sin clonar ni volver a compilar.

```powershell
$env:DIBOT_API_URL='https://api.dibot.co'
$env:DIBOT_AGENT_API_TOKEN='...'

# App nueva: nombre, registro, Turso y una sesión dibot-fast
bun run dibot:workflow -- user-123 app-001 "Pulso" create "Crea una app movil de notas rapidas"

# App existente: dibot-fast en UPDATE MODE sobre la misma API y base
bun run dibot:workflow -- user-123 app-001 "Pulso" update "Agrega busqueda y conserva el diseno actual"
```

Tambien acepta flags: `--user-id`, `--app-id`, `--app-name`, `--mode` y `--prompt`. El resultado final incluye tiempos, nombre y base verificada.
El workflow tambien muestra el tiempo total, el tiempo de OpenCode y el tiempo de validacion; esas duraciones quedan incluidas en el JSON final como `duration`, `openCodeDuration` y `verificationDuration`.
En `create`, el workspace puede reutilizar las dependencias calientes de la plantilla cuando el `bun.lock` coincide; así se evita reinstalar los paquetes en cada app.
