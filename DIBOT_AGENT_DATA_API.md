# API independiente de estado de Dibot

Esta API es un CRUD independiente del workflow, Box, OpenCode, GitHub y Dokploy. Lee las apps registradas y permite crear, consultar, actualizar y eliminar `agent_jobs` y `agent_tasks` en la base de control.

## Acceso

Configura Mastra:

```dotenv
DIBOT_AGENT_API_TOKEN=un-token-largo-y-secreto
```

Usa el token como `Authorization: Bearer ...` o `x-dibot-api-token`. Nunca lo expongas en React, `VITE_*`, el navegador ni GitHub.

Localmente:

```text
DIBOT_API_URL=http://localhost:4111
```

En producción, `DIBOT_API_URL` debe ser la URL pública de Mastra. Las rutas personalizadas se sirven desde la raíz, no bajo `/api`.

## Apps

Las apps se pueden registrar y consultar por `userId` y `appId`. El registro no ejecuta el workflow ni despliega nada; solo crea la relación de control que después protegerá los jobs.

Registrar una app nueva:

```bash
curl -X POST "$DIBOT_API_URL/dibot/apps" \
  -H "Authorization: Bearer $DIBOT_AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "appId": "app-001",
    "appName": "Mi primera app",
    "status": "creating",
    "lastRequest": {"source": "template"}
  }'
```

`POST /dibot/apps` devuelve `201` y rechaza con `409` si el `appId` ya existe. Para un nuevo flujo usa un `appId` nuevo; no reutilices uno existente accidentalmente.

Consultar apps:

```bash
curl "$DIBOT_API_URL/dibot/apps?userId=user-123" \
  -H "Authorization: Bearer $DIBOT_AGENT_API_TOKEN"

curl "$DIBOT_API_URL/dibot/apps?appId=app-001" \
  -H "Authorization: Bearer $DIBOT_AGENT_API_TOKEN"

curl "$DIBOT_API_URL/dibot/apps/app-001" \
  -H "Authorization: Bearer $DIBOT_AGENT_API_TOKEN"
```

`GET /dibot/apps/:appId` devuelve la app y sus jobs. La respuesta incluye `repositoryUrl`, `repositoryPublished`, `deploymentUrl`, `deployed`, `status` y `link` dentro de cada job. Esta API no publica ni verifica esos enlaces: guarda los enlaces que reporta el job.

Parámetros opcionales para listar: `userId`, `appId`, `limit` (1–200).

## Agent jobs

| Método | Ruta | Acción |
|---|---|---|
| GET | `/dibot/agent-jobs?userId=...&appId=...&status=...` | Lista jobs |
| POST | `/dibot/agent-jobs` | Crea un job y sus tasks iniciales |
| GET | `/dibot/agent-jobs/:jobId` | Lee el job con sus tasks |
| PATCH | `/dibot/agent-jobs/:jobId` | Actualiza el job |
| DELETE | `/dibot/agent-jobs/:jobId?userId=...` | Elimina el job y sus tasks |

Crear un job:

```bash
curl -X POST "$DIBOT_API_URL/dibot/agent-jobs" \
  -H "Authorization: Bearer $DIBOT_AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "appId": "app-001",
    "type": "implementation",
    "executor": "template-agent",
    "status": "running",
    "currentStep": "Construyendo dashboard",
    "tasks": [
      {"name": "Implementar", "position": 1, "status": "running"},
      {"name": "Validar", "position": 2, "status": "pending"}
    ]
  }'
```

Actualizar progreso o el resultado. Cuando el job reporta `repositoryUrl` o `deploymentUrl`, la API sincroniza esos valores en el registro canónico de la app. Si el job termina como `completed` y existen ambos enlaces, la app pasa a `status: "ready"`.

```bash
curl -X PATCH "$DIBOT_API_URL/dibot/agent-jobs/JOB_ID" \
  -H "Authorization: Bearer $DIBOT_AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "currentStep": "Trabajo terminado",
    "result": {
      "repositoryUrl": "https://github.com/organizacion/app-001",
      "deploymentUrl": "https://app-001.example.com",
      "githubPublished": true,
      "dokployPublished": true
    }
  }'
```

Estados de job: `queued`, `running`, `completed`, `failed`, `cancelled`.

## Agent tasks

| Método | Ruta | Acción |
|---|---|---|
| GET | `/dibot/agent-tasks?userId=...&appId=...&jobId=...` | Lista tasks |
| POST | `/dibot/agent-tasks` | Crea una task |
| GET | `/dibot/agent-tasks/:taskId` | Lee una task |
| PATCH | `/dibot/agent-tasks/:taskId` | Actualiza una task |
| DELETE | `/dibot/agent-tasks/:taskId?userId=...` | Elimina una task |

Crear una task independiente:

```bash
curl -X POST "$DIBOT_API_URL/dibot/agent-tasks" \
  -H "Authorization: Bearer $DIBOT_AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "jobId": "JOB_ID",
    "name": "Confirmar publicación",
    "position": 3,
    "status": "running"
  }'
```

Estados de task: `pending`, `running`, `completed`, `failed`.

## Uso desde la plantilla

La IA server-side de la plantilla puede usar estas variables:

```dotenv
DIBOT_API_URL=https://mastra.example.com
DIBOT_AGENT_API_TOKEN=un-token-largo-y-secreto
```

Flujo recomendado:

1. Buscar la app con `GET /dibot/apps?userId=...` o `GET /dibot/apps/:appId`.
2. Crear el job con `POST /dibot/agent-jobs`.
3. Crear tasks en el mismo POST o con `POST /dibot/agent-tasks`.
4. Actualizar job y tasks con `PATCH` mientras trabaja.
5. Al terminar, marcar el job como `completed` y guardar en `result` las URLs reales (`repositoryUrl` y `deploymentUrl`) y, opcionalmente, `dokployApplicationId` y flags informativos. Las URLs son las que actualizan la app; los flags por sí solos no marcan una publicación.
6. Consultar `GET /dibot/agent-jobs/:jobId` para mostrar el estado completo.

Para crear una app desde cero, primero ejecuta `POST /dibot/apps`; después crea el job con el mismo `userId` y `appId`. Para actualizar una app existente, primero consulta `GET /dibot/apps/:appId` y usa ese mismo identificador únicamente después de confirmar que pertenece al usuario correcto.

La API no inicia agentes ni despliega aplicaciones; únicamente administra los datos para que la IA, un panel o un servicio externo los use.
