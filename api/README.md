# Dibot API y base de datos

Las apps generadas usan esta capa server-side para persistencia. El navegador nunca debe recibir `TURSO_AUTH_TOKEN` ni `TURSO_PLATFORM_API_TOKEN`.

## Flujo MVP

1. Define las tablas de la app en `api/db/schema.ts`.
2. Ejecuta `bun run db:check` para verificar organización, grupo y `TURSO_DATABASE_ID`.
3. Si la app necesita una base nueva, ejecuta `bun run db:create`. Este comando crea una única base nueva, genera su token de conexión y actualiza `.env` y `.env.turso`.
4. Ejecuta `bun run db:push` para sincronizar el schema con Turso.
5. Expón handlers tipados desde `api/` y consúmelos desde React con TanStack Query.

## Variables

La creación necesita `TURSO_PLATFORM_API_TOKEN`, `TURSO_ORG_SLUG`, `TURSO_GROUP` y `TURSO_DATABASE_NAME`. La conexión runtime usa `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` y `TURSO_DATABASE_ID`.

`TURSO_PLATFORM_API_TOKEN` es el único token válido para consultar la organización y crear bases. `TURSO_AUTH_TOKEN` es únicamente el token de conexión de una base concreta.
