# Dibot Box Workflow

## Objetivo

Esta plantilla se clona en un servidor Box para crear y actualizar aplicaciones móviles con React, Vite, Bun, API server-side, Drizzle, Turso y esbuild.

La API de Box debe ejecutar el workflow dentro de una carpeta aislada por aplicación. Nunca debe ejecutar dos workflows simultáneos sobre el mismo workspace.

## Identificadores

Cada solicitud usa cuatro datos:

- `userId`: usuario propietario en la base de control de Dibot.
- `appId`: identificador único de la aplicación. No se reutiliza en `create`.
- `appName`: nombre visible de la aplicación.
- `mode`: `create` o `update`.

La base de control registra la relación `userId + appId + appName`. La base Turso de la aplicación es independiente y se identifica mediante `TURSO_DATABASE_ID`.

El `userId` no se agrega automáticamente a las tablas de negocio. Si la aplicación es multiusuario, el prompt debe exigir `userId` en el schema, API y filtros de cada consulta.

## Flujo de create

1. La API valida el token del usuario y que `appId` no exista.
2. Clona la plantilla en un workspace aislado.
3. Copia las variables server-side a `.env`; nunca las envía al navegador.
4. Registra la app en `DIBOT_AGENT_DATA_API` con `userId`, `appId` y `appName`.
5. Ejecuta el workflow:

```powershell
bun run dibot:workflow -- user-123 app-001 "Mi App" create "Crea una app móvil de comidas rápidas"
```

6. El workflow crea una base Turso nueva con un nombre derivado de `appName` y `appId`.
7. `prompt-builder` genera el superprompt y las referencias visuales.
8. `dibot-fast` implementa frontend, schema, seed, API y CRUD real.
9. Se ejecutan `db:check`, `db:push`, `db:seed` y el smoke test CRUD.
10. `dibot:verify` valida providers React, rutas, TypeScript frontend/server, Vite, esbuild, health API, Turso, seed y ESLint.
11. Solo si todo pasa se marca el job como `completed`.

## Flujo de update

La API debe localizar la app por `userId + appId` y recuperar el workspace original junto con su `.env` server-side.

```powershell
bun run dibot:workflow -- user-123 app-001 "Mi App" update "Agrega favoritos y un filtro de favoritos"
```

En `update`:

- No se crea otra base Turso.
- Se verifica el `TURSO_DATABASE_ID` existente.
- Se toma un snapshot de las filas antes de modificar el schema.
- `dibot-fast` trabaja en modo update y conserva la dirección visual.
- Está prohibido `drizzle-kit push --force`.
- Las columnas nuevas deben tener default, ser nullable o migrarse en dos fases.
- Se ejecuta nuevamente seed, smoke CRUD, API, esbuild y lint.
- El workflow rechaza la entrega si cambia la base o pierde filas existentes.

## Contrato recomendado de la API de Box

### Crear una app

```http
POST /v1/apps
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "userId": "user-123",
  "appId": "app-001",
  "appName": "Mi App",
  "mode": "create",
  "prompt": "Crea una app móvil de comidas rápidas estilo Rappi"
}
```

### Actualizar una app

```http
POST /v1/apps/app-001/workflows
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "userId": "user-123",
  "appName": "Mi App",
  "mode": "update",
  "prompt": "Agrega favoritos y un filtro de favoritos"
}
```

La API debe responder inmediatamente con un `jobId` y ejecutar el proceso en segundo plano.

```json
{
  "jobId": "job-123",
  "userId": "user-123",
  "appId": "app-001",
  "status": "running"
}
```

## Ejecución dentro de Box

Ejemplo conceptual del worker:

```powershell
$workspace = "D:\dibot-workspaces\user-123\app-001"
git clone <TEMPLATE_REPOSITORY> $workspace
Copy-Item .env "$workspace\.env"
Set-Location $workspace
bun install --frozen-lockfile
bun run dibot:workflow -- user-123 app-001 "Mi App" create "..."
```

En producción, la API debe:

- Crear un workspace único por `appId`.
- Usar una cola para impedir ejecuciones simultáneas.
- Limitar CPU, memoria, tiempo y procesos secundarios.
- Guardar logs sin tokens ni contenido de `.env`.
- Persistir el estado del job en `DIBOT_AGENT_DATA_API`.
- Mantener `.env`, `.env.turso` y credenciales fuera de Git y del frontend.
- Conservar el workspace para futuros `update` o archivarlo después de publicarlo.

## Variables server-side

La API de Box debe inyectar estas variables sin mostrarlas en logs:

```dotenv
DIBOT_API_URL=https://api-de-control.example.com
DIBOT_AGENT_API_TOKEN=...

TURSO_PLATFORM_API_TOKEN=...
TURSO_ORG_SLUG=...
TURSO_GROUP=dibot
TURSO_DATABASE_NAME=...
```

Para `update`, también deben existir las variables de conexión de la base existente:

```dotenv
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
TURSO_DATABASE_ID=...
```

`TURSO_PLATFORM_API_TOKEN` sirve para consultar y crear bases. `TURSO_AUTH_TOKEN` solo sirve para conectarse a una base concreta.

## Estados del job

La API puede exponer estos estados:

```text
queued → running → completed
                 ↘ failed
```

Una app solo puede marcarse como lista cuando se cumplan simultáneamente:

- `verificationPassed: true`
- `apiRuntimeVerified: true`
- `databaseSeedVerified: true`
- build frontend y servidor correcto
- health API correcto
- smoke CRUD correcto
- `TURSO_DATABASE_ID` confirmado

## Archivos importantes de la plantilla

- `scripts/dibot-workflow.ts`: orquestación create/update y timers.
- `scripts/provision-turso.ts`: comprobación y creación no destructiva de Turso.
- `scripts/verify-turso.ts`: conexión y tablas pobladas.
- `scripts/verify-api.ts`: health runtime de la API compilada.
- `scripts/snapshot-database.ts`: protección de datos durante update.
- `scripts/build.ts`: TypeScript frontend/server y Vite en paralelo.
- `scripts/build-esbuild.ts`: bundle de API y metafile.
- `api/server.ts`: servidor HTTP compartido para API y frontend compilado.
- `opencode.json`: agentes y permisos de OpenCode.

## Regla final

La API de Box no debe responder que una app está lista solo porque OpenCode terminó. La respuesta exitosa requiere que el workflow termine con todas las validaciones verdes y que la app pueda conectarse a su API y a su base Turso real.
