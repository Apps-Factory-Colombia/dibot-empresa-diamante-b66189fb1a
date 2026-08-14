# Inicio rápido

1. Copia `.env.example` a `.env` y configura solo secretos server-side.
2. Ejecuta `bun install --frozen-lockfile` (el workflow también lo hará automáticamente si detecta que la copia no tiene dependencias).
3. Abre OpenCode en esta carpeta y adjunta el brief y las referencias visuales.
4. Pide una app completa con un vertical slice funcional.
5. Ejecuta el workflow con nombre; este crea Turso y exige schema, seed, API y frontend conectado.
6. Valida con `bun run dibot:verify`; incluye contratos, datos sembrados, TypeScript frontend/server, Vite, esbuild, health API y lint.

## Prompt base

```text
Construye una app móvil desde esta plantilla vacía.
Producto: [producto]. Usuarios: [usuarios]. Flujo principal: [flujo].
Usa las imágenes adjuntas como referencia de composición y crea branding original.
Usa dibot-fast, decide una sola dirección visual, implementa rápido y deja `bun run dibot:verify` funcionando. Conserva el `QueryClientProvider` de `src/main.tsx` y usa `lucide-react` para iconos.
Conecta Drizzle + Turso, crea seed y API real, y corrige hasta que bun run dibot:verify pase completo.
```
