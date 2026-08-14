---
name: dibot-mobile-app
description: Construye apps móviles consumer desde la plantilla Dibot con React, Vite y Capacitor.
---

# Dibot Mobile App

Usa esta skill cuando el usuario quiera crear, rediseñar, extender o reparar una app de esta plantilla.

## Modo rápido

Elige una única dirección visual y empieza a implementar. No hagas planes largos, no presentes alternativas, no hagas investigación si no bloquea el trabajo y no replantees decisiones reversibles. Prioridad: vertical slice funcional, calidad móvil y build verde.

## Contrato

- Conserva React, Vite, TypeScript, Tailwind, Base UI, Motion, Embla, lucide-react, React Router, Zustand, TanStack Query, React Hook Form, Zod, esbuild y Capacitor.
- Inspecciona solo `package.json`, `src/`, rutas, tokens, datos/servicios, stores y configuración nativa relevante.
- Diseña para 390 px, con safe areas y controles de 44–56 px.
- Usa Query para remoto, Zustand para local, RHF + Zod para formularios y Base UI para overlays accesibles.
- Reutiliza componentes y tokens; crea otros solo si el patrón es realmente nuevo.
- Mantén loading, empty, error, success y submitting donde apliquen.
- `src/main.tsx` ya monta un `QueryClientProvider` global. Consérvalo y no uses `useQuery`/`useQueryClient` fuera de ese árbol.
- `src/main.tsx` también monta `BrowserRouter` y `AppErrorBoundary`; consérvalos para que `useRoutes` tenga contexto y los errores no dejen una pantalla en blanco.
- Aplica las reglas de React best practices: evita imports de barril, usa rutas estáticamente analizables y paraleliza trabajo independiente.
- Implementa persistencia real en Turso, `api/index.ts`, schema Drizzle, seed idempotente y TanStack Query conectado a `/api/*`; no uses almacenamiento local como base del dominio.
- Añade `api/smoke.ts` con CRUD temporal y limpieza garantizada para verificar el flujo de datos real.
- En update no uses `push --force`: añade defaults o columnas nullable y conserva todas las filas protegidas por el snapshot del workflow.
- Ejecuta `bun run db:push`, `bun run db:seed` y `bun run dibot:verify` al finalizar. Corrige tus propios errores y repite hasta que DB, API, esbuild, runtime y lint estén en verde.

## Ejecución principal

`dibot-fast` conserva la responsabilidad del vertical slice completo y de su reparación final. Puede delegar features aisladas, pero debe integrar y verificar personalmente el resultado.
