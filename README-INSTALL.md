# Inicio rápido

1. Copia `.env.example` a `.env` y configura solo secretos server-side.
2. Ejecuta `bun install`.
3. Abre OpenCode en esta carpeta y adjunta el brief y las referencias visuales.
4. Pide una app completa con un vertical slice funcional.
5. Si necesita persistencia, define el schema en `api/db/schema.ts`, ejecuta `bun run db:check`, luego `bun run db:create` y finalmente `bun run db:push`.
6. Valida con `bun run build` y `bun run lint`.

## Prompt base

```text
Construye una app móvil desde esta plantilla vacía.
Producto: [producto]. Usuarios: [usuarios]. Flujo principal: [flujo].
Usa las imágenes adjuntas como referencia de composición y crea branding original.
Usa dibot-fast, decide una sola dirección visual, implementa rápido y deja el build funcionando.
Si hay datos persistentes, delega api-builder, crea una base nueva con db:create y conecta Drizzle + Turso con bun run db:push.
```
