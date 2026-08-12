# OpenCode por HTTP y eventos SSE

La plantilla incluye un servidor local de OpenCode para inspeccionar sesiones, prompts, respuestas, herramientas y estados del agente. OpenCode expone HTTP y SSE; no activa HTTPS por sí mismo.

## Servidor local

En una terminal dentro del proyecto:

```powershell
$env:OPENCODE_SERVER_USERNAME='opencode'
$env:OPENCODE_SERVER_PASSWORD='pon-una-clave-local'
bun run opencode:serve
```

El servidor queda en `http://127.0.0.1:4096`.

Endpoints útiles:

- Salud: `http://127.0.0.1:4096/global/health`
- Agentes: `http://127.0.0.1:4096/agent`
- Configuración: `http://127.0.0.1:4096/config`
- OpenAPI: `http://127.0.0.1:4096/doc`
- Eventos SSE: `http://127.0.0.1:4096/event`

En otra terminal, con la misma contraseña:

```powershell
$env:OPENCODE_SERVER_USERNAME='opencode'
$env:OPENCODE_SERVER_PASSWORD='pon-una-clave-local'
$env:OPENCODE_EVENTS_URL='http://127.0.0.1:4096/event'
bun run opencode:events
```

La consola mostrará los eventos JSON emitidos por OpenCode, incluidos mensajes, llamadas de herramientas y cambios de estado. El CLI conectado muestra además la respuesta final del agente:

```powershell
opencode run --attach http://127.0.0.1:4096 --agent dibot-fast "Tu prompt aquí"
```

Para exponerlo por HTTPS usa un reverse proxy local o una herramienta de túnel con TLS. No publiques directamente el puerto sin contraseña y nunca envíes tokens Turso al navegador.
