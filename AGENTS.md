# Dibot Mobile App Template

Esta carpeta es una plantilla vacia y reutilizable para generar productos moviles con React + Vite. No contiene pantallas, branding, datos mock ni dominio de negocio. El agente debe construir la app solicitada desde el lienzo vacio.

## Velocidad

Usa `dibot-fast` como agente principal con una sola direccion visual, una arquitectura y un flujo principal. No escribas planes largos ni repitas inspecciones. Implementa pronto, delega la API a `api-builder` cuando haya persistencia y ejecuta `bun run build` al final.

## Stack

Conserva React, Vite, TypeScript, Bun, Tailwind, Base UI, Motion, Embla, Phosphor Icons, React Router, Zustand, TanStack Query, React Hook Form, Zod, Drizzle ORM, `@libsql/client` y Turso/libSQL. No agregues otra UI framework ni reemplaces la arquitectura.

## UI movil

- Diseña primero para 375–430 px y usa 390 px como referencia.
- Mantén safe areas, teclado usable y controles de 44–56 px.
- Define tokens semanticos para fondo, superficies, texto, primary, accent, estados, spacing y radios.
- Usa una sola direccion visual coherente. Las imagenes son referencia de composicion, no una licencia para copiar marca, logo o assets.
- Cuando no haya imagenes adjuntas, `prompt-builder` usa una búsqueda estándar de Mobbin y entrega hasta seis referencias para `dibot-fast`. Extrae color, tipografía, escala, spacing, radios, sombras, navegación, cards, estados y movimiento; no clones pantallas ni uses assets de terceros.
- Reutiliza componentes existentes cuando existan; la plantilla inicial es intencionalmente vacia.
- Las features importantes contemplan loading, empty, error, populated, submitting y success.

## API y Turso

- Todo acceso a Turso ocurre en `api/` o en un backend server-side. Nunca expongas `TURSO_AUTH_TOKEN` ni `TURSO_PLATFORM_API_TOKEN` al navegador ni uses `VITE_` para secretos.
- Usa Drizzle ORM + `@libsql/client` y define las tablas en `api/db/schema.ts`.
- Para MVP usa `bun run db:push` despues de definir el schema. Usa generate/migrate solo cuando el producto necesite migraciones versionadas.
- Verifica `TURSO_DATABASE_ID` contra Turso antes de usar una base existente. La URL y el token de conexion son `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`.
- Provisioning usa `TURSO_PLATFORM_API_TOKEN`, `TURSO_ORG_SLUG`, `TURSO_GROUP` y `TURSO_DATABASE_NAME`. `TURSO_DATABASE` es un JWT de conexion, no un token de Platform API.
- El flujo de provisioning solo puede crear una base nueva con `bun run db:create`; nunca reutilices una base sin verificar su `TURSO_DATABASE_ID`.
- Para cambios sobre una app existente usa el agente `dibot-update`; debe aplicar solo el cambio solicitado y conservar la dirección visual.

## Mobbin MCP

El servidor se llama `mobbin` y esta configurado en `opencode.json`. Su autenticacion es OAuth con `opencode mcp auth mobbin`; no requiere una API key en `.env`. Usa `prompt-builder` para convertir una idea corta en un superprompt y luego pega ese resultado en `dibot-fast`.

## Flujo minimo

1. Lee `package.json`, `src/`, `api/`, rutas, tokens y configuracion relevante.
2. Define en una frase producto, usuario, tono, navegacion y direccion visual.
3. Implementa un vertical slice funcional.
4. Si hay persistencia, crea schema/API, ejecuta `bun run db:check` y luego `bun run db:push`.
5. Corrige solo errores necesarios y ejecuta `bun run build` y `bun run lint`.

## Archivos clave

- `src/App.tsx`: lienzo vacio de la UI.
- `api/README.md`: contrato de API y base de datos.
- `api/db/client.ts`: cliente server-side Drizzle/Turso.
- `api/db/schema.ts`: schema que cada app debe completar.
- `drizzle.config.ts`: configuracion Turso para Drizzle Kit.
- `scripts/provision-turso.ts`: check por ID y creación no destructiva de una base nueva.
- `.opencode/prompts/`: instrucciones para build, features, API y fixes.
