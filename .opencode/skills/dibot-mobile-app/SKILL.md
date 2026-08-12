---
name: dibot-mobile-app
description: Construye apps móviles consumer desde la plantilla Dibot con React, Vite y Capacitor.
---

# Dibot Mobile App

Usa esta skill cuando el usuario quiera crear, rediseñar, extender o reparar una app de esta plantilla.

## Modo rápido

Elige una única dirección visual y empieza a implementar. No hagas planes largos, no presentes alternativas, no hagas investigación si no bloquea el trabajo y no replantees decisiones reversibles. Prioridad: vertical slice funcional, calidad móvil y build verde.

## Contrato

- Conserva React, Vite, TypeScript, Tailwind, Base UI, Motion, Embla, Phosphor, React Router, Zustand, TanStack Query, React Hook Form, Zod y Capacitor.
- Inspecciona solo `package.json`, `src/`, rutas, tokens, datos/servicios, stores y configuración nativa relevante.
- Diseña para 390 px, con safe areas y controles de 44–56 px.
- Usa Query para remoto, Zustand para local, RHF + Zod para formularios y Base UI para overlays accesibles.
- Reutiliza componentes y tokens; crea otros solo si el patrón es realmente nuevo.
- Mantén loading, empty, error, success y submitting donde apliquen.
- Ejecuta `bun run build` al finalizar y corrige solo los errores necesarios.

## Delegación

Si hay features independientes, delega hasta tres a `feature-builder`. Usa `fixer` solo para errores de integración o build. Evita que dos agentes editen los mismos archivos.
