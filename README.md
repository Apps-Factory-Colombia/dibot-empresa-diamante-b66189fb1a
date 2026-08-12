# Dibot Mobile Template

Consulta [SISTEMA-DIBOT.md](<SISTEMA-DIBOT.md>) para la explicación completa del flujo de agentes, Mobbin, imágenes, Turso y OpenCode HTTP/SSE.

Plantilla vacia para generar aplicaciones mobile-first. La carpeta no contiene una app de ejemplo: OpenCode recibe el brief, las referencias visuales y crea el producto desde `src/App.tsx`.

## Desarrollo

```bash
bun install
bun run dev
```

## Base de datos

La capa server-side esta en `api/`. Copia `.env.example`, configura una URL y token de base Turso, define tablas en `api/db/schema.ts` y ejecuta:

```bash
bun run db:push
```

Para comprobar una base por ID:

```bash
bun run db:check
```

La creación de una base nueva requiere `TURSO_PLATFORM_API_TOKEN`, `TURSO_ORG_SLUG`, `TURSO_GROUP` y `TURSO_DATABASE_NAME`. Ejecuta `bun run db:create` y luego `bun run db:push`. Lee `api/README.md` antes de usarlo.

## OpenCode

Usa el agente principal `dibot-fast` con GPT-5.6 Luna y reasoning medium. Para cambios puntuales sobre una app ya creada usa `dibot-update`, que conserva el diseño y trabaja solo sobre la modificación solicitada. Si la app necesita datos, `dibot-fast` puede delegar a `api-builder`, que usa Drizzle + Turso y verifica `TURSO_DATABASE_ID` antes de conectar.

Mobbin MCP ya está configurado para investigar hasta seis referencias visuales por flujo y guardarlas para `dibot-fast`. Autentícalo con `opencode mcp auth mobbin`. Para convertir una idea en un superprompt usa `prompt-builder` y luego pasa su salida junto con `references/mobbin/*` a `dibot-fast`. Consulta [MOBBIN-OPENCODE.md](<MOBBIN-OPENCODE.md>) para el flujo completo.

La plantilla solo crea una base nueva cuando el agente lo necesita y actualiza automáticamente `.env` y `.env.turso`.
