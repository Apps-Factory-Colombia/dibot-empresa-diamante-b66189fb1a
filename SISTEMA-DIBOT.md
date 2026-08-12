# Sistema Dibot

Este documento explica cómo funciona la plantilla, qué hace cada agente, cómo se usan las referencias visuales, cómo se conectan las apps a Turso y cómo observar OpenCode por HTTP/SSE.

## 1. Qué es la plantilla

`prueba-dibot` es un lienzo vacío para crear aplicaciones móviles con React, Vite, TypeScript y Bun. No contiene un producto de negocio fijo.

El agente recibe la idea del usuario, las referencias visuales de Mobbin, el superprompt generado por `prompt-builder` y las reglas técnicas de la plantilla. Después construye la app en `src/`, crea `api/` cuando necesita persistencia y valida el resultado.

## 2. Arquitectura general

```text
Idea del usuario
      ↓
prompt-builder
      ├── superprompt
      ├── references/mobbin/*.jpg
      └── references/mobbin/README.md
      ↓
dibot-fast
      ├── UI en src/
      ├── API y schema en api/
      ├── base nueva en Turso si hace falta
      ├── sincronización con db:push
      └── bun run build + bun run lint
      ↓
App funcional
```

Para cambios posteriores:

```text
Petición de cambio → dibot-update → modificación puntual → build + lint
```

## 3. Agentes disponibles

### `prompt-builder`

Convierte una idea corta en un superprompt para `dibot-fast`. Hace una búsqueda estándar de Mobbin con hasta seis referencias en una sola llamada, guarda las imágenes en `references/mobbin/` y crea un README con el análisis visual.

Analiza:

- Paleta y contraste.
- Tipografía y escala.
- Espaciado y ritmo vertical.
- Radios y sombras.
- Navegación.
- Cards, filtros y formularios.
- Estados de carga, vacío, error y éxito.
- Patrones de interacción y movimiento.

No construye la app. Su salida debe ser el superprompt y las referencias guardadas.

### `dibot-fast`

Es el agente principal para crear una app completa. Debe leer el superprompt, abrir todas las imágenes de `references/mobbin/`, elegir una dirección visual, implementar el flujo principal, añadir estados, configurar Turso si hace falta y ejecutar build/lint.

Las referencias sirven para extraer el lenguaje visual, no para copiar literalmente pantallas, marcas, logos, textos o assets.

### `dibot-update`

Es el agente para modificaciones rápidas sobre una app existente. Úsalo para peticiones como “agrega favoritos”, “cambia el color del botón”, “añade un filtro” o “cambia este texto”. Conserva la dirección visual y modifica solo lo relacionado con la petición.

```powershell
opencode run --agent dibot-update "Agrega favoritos a los productos. Conserva el diseño existente y ejecuta build y lint."
```

Si el cambio necesita base de datos, actualiza el schema y ejecuta `db:push`.

### `feature-builder`

Agente auxiliar para implementar una feature aislada sin cambiar toda la arquitectura.

### `api-builder`

Agente auxiliar para crear tablas, acceso server-side y endpoints. Usa Drizzle ORM, `@libsql/client`, Turso y validación de datos.

### `fixer`

Agente auxiliar para corregir errores concretos de integración o build. No debe rediseñar la app.

## 4. Flujo recomendado para crear una app

### Preparar el proyecto

```powershell
bun install
```

Configura `.env` con variables server-side. Nunca pongas tokens Turso en variables `VITE_*`.

### Autenticar Mobbin

```powershell
opencode mcp auth mobbin
opencode mcp list
```

Debe aparecer `mobbin connected`.

### Generar el superprompt

```powershell
opencode run --agent prompt-builder "Quiero una app para vender ropa deportiva con catálogo, filtros, carrito y checkout."
```

El agente debe crear:

```text
references/mobbin/01-*.jpg
references/mobbin/02-*.jpg
references/mobbin/...
references/mobbin/README.md
```

### Ejecutar `dibot-fast`

Pasa el superprompt, el README y todas las imágenes:

```powershell
opencode run --agent dibot-fast `
  --file prompt-builder-output.txt `
  --file references/mobbin/README.md `
  --file references/mobbin/01-reference.jpg `
  --file references/mobbin/02-reference.jpg `
  "Implementa la app usando el superprompt adjunto y analiza visualmente todas las referencias antes de diseñar."
```

Adjunta todos los archivos `.jpg` o `.png` creados en `references/mobbin/`.

## 5. Imágenes reales de internet

Cuando el producto se beneficie de fotografías o ilustraciones reales, el agente puede usar fuentes públicas como Unsplash, Pexels o Wikimedia Commons.

Reglas:

1. Preferir URLs directas y estables.
2. Guardar una copia en `public/assets/` cuando sea posible.
3. Añadir `alt` descriptivo.
4. Guardar fuente o crédito junto al asset.
5. Mantener un fallback local si la red falla.
6. No usar assets de Mobbin como assets de producción.
7. No copiar imágenes, logos o contenido de una app de referencia sin permiso.

Las imágenes de Mobbin son referencias de diseño. Las imágenes reales del producto deben venir de una fuente pública apropiada o de assets proporcionados por el usuario.

## 6. Base de datos Turso

`TURSO_PLATFORM_API_TOKEN` permite consultar la organización y crear una base nueva. `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` y `TURSO_DATABASE_ID` conectan la app con una base concreta.

También se usan `TURSO_ORG_SLUG`, `TURSO_GROUP` y `TURSO_DATABASE_NAME`. Los secretos permanecen en `.env`, nunca en el frontend.

### Flujo seguro

```powershell
bun run db:check
bun run db:create
bun run db:push
```

`db:create` verifica organización, grupo y nombre, crea una sola base nueva, genera el token de conexión y actualiza `.env` y `.env.turso`. No elimina bases existentes.

Las tablas se definen en `api/db/schema.ts`. El cliente server-side está en `api/db/client.ts` y Drizzle usa `drizzle.config.ts`.

Para migraciones versionadas:

```powershell
bun run db:generate
bun run db:migrate
```

## 7. OpenCode por HTTP y eventos

Inicia el servidor local:

```powershell
$env:OPENCODE_SERVER_USERNAME='opencode'
$env:OPENCODE_SERVER_PASSWORD='una-clave-local'
bun run opencode:serve
```

Queda disponible en `http://127.0.0.1:4096`.

Endpoints principales:

```text
/global/health  estado del servidor
/agent          agentes disponibles
/config         configuración cargada
/doc            especificación OpenAPI
/event          eventos SSE globales
```

Para observar eventos:

```powershell
$env:OPENCODE_SERVER_USERNAME='opencode'
$env:OPENCODE_SERVER_PASSWORD='una-clave-local'
$env:OPENCODE_EVENTS_URL='http://127.0.0.1:4096/event'
bun run opencode:events
```

Para conectar un agente al servidor:

```powershell
opencode run --attach http://127.0.0.1:4096 --agent dibot-fast "Construye la app solicitada."
```

OpenCode ofrece HTTP y SSE localmente. HTTPS requiere un reverse proxy o túnel TLS. No expongas el puerto públicamente sin autenticación.

## 8. Scripts principales

| Comando | Función |
|---|---|
| `bun install` | Instala dependencias. |
| `bun run dev` | Inicia Vite en desarrollo. |
| `bun run build` | Compila TypeScript y Vite. |
| `bun run lint` | Ejecuta ESLint. |
| `bun run preview` | Sirve el build compilado. |
| `bun run db:check` | Verifica organización, grupo e ID de Turso. |
| `bun run db:create` | Crea una base nueva y actualiza `.env`. |
| `bun run db:push` | Sincroniza el schema Drizzle con Turso. |
| `bun run db:generate` | Genera migraciones Drizzle. |
| `bun run db:migrate` | Ejecuta migraciones. |
| `bun run opencode:serve` | Inicia el servidor HTTP de OpenCode. |
| `bun run opencode:events` | Observa eventos SSE de OpenCode. |

## 9. Errores comunes

### Mobbin no conecta

```powershell
opencode mcp list
opencode mcp auth mobbin
```

Si la búsqueda falla, `prompt-builder` debe continuar documentando el bloqueo y crear el superprompt sin reintentar indefinidamente.

### Falta una variable Turso

Revisa `.env` y confirma `TURSO_PLATFORM_API_TOKEN` para crear bases, o `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` y `TURSO_DATABASE_ID` para conectar una base existente.

### `db:push` falla porque faltan dependencias

```powershell
bun install
bun run db:push
```

### La app compila, pero no conecta con Turso

Comprueba que `bun run db:check` encuentre el ID configurado, que `api/db/schema.ts` tenga tablas exportadas y que los secretos no estén en el cliente.

### Un cambio rediseñó demasiado la app

Usa `dibot-update` y escribe explícitamente:

```text
Aplica únicamente este cambio. Conserva colores, tipografía, spacing,
radios, navegación y componentes existentes. No rediseñes las pantallas
no relacionadas.
```

## 10. Regla práctica

Usa `prompt-builder` para crear desde una idea, `dibot-fast` para construir el producto completo y `dibot-update` para modificarlo después. Mantén las referencias visuales junto al superprompt, usa imágenes reales públicas con crédito cuando aporten valor y deja toda credencial Turso en server-side.
