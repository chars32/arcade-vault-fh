# SPEC 02 — Página Home (landing)

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-08-21
> **Objective:** Portar la landing (`references/templates/home-about/home.jsx`) como la nueva ruta raíz `/`, moviendo la Biblioteca actual a `/biblioteca` y respetando toda la navegación del prototipo excepto el link "Acerca de", que queda sin funcionalidad.

## Por qué existe este spec

El spec 01 dejó `/` como la Biblioteca. El prototipo real (`references/templates/home-about/`) tiene una Home separada como landing raíz, con su propio Nav de 4 links (Inicio, Biblioteca, Salón de la Fama, Acerca de). Para respetar esa navegación sin implementar "Acerca de", hay que reubicar la Biblioteca a su propia ruta y sumar los estilos CSS de Home (~130 reglas nuevas) que aún no están en `app/globals.css`.

## Scope

**In:**

- Nueva Home en `/` (`app/page.tsx` reescrito), portando `references/templates/home-about/home.jsx`: hero con silуetas flotantes animadas, sección "¿Por qué Arcade Vault?" (feature grid), preview de juegos (usa `GAMES.slice(0, 6)` real de `lib/data.ts`), sección de stats, "Actividad en vivo" (últimas puntuaciones + top jugadores, con los datos de ejemplo hardcodeados del prototipo, sin generar con `seededScores`), sección de precios (plan único gratuito + FAQ), CTA final.
- Mover la Biblioteca actual (contenido íntegro de `app/page.tsx` de spec 01) a `app/biblioteca/page.tsx`, sin cambios de comportamiento.
- Efecto de scroll-reveal (`useReveal` + `IntersectionObserver`, clases `.reveal`/`.in`) portado igual que en el prototipo.
- `components/nav.tsx` actualizado: 4 links — "Inicio" (`/`), "Biblioteca" (`/biblioteca`), "Salón de la Fama" (`/salon-de-la-fama`), "Acerca de" (sin `href` funcional ni `onClick`, no navega). Mismo tratamiento en el panel móvil.
- Todos los enlaces internos que hoy asumen que `/` es la biblioteca se actualizan a `/biblioteca`: botón "VOLVER AL VAULT" en `app/juegos/[id]/page.tsx`, botón de cierre en `app/juegos/[id]/jugar/page.tsx`, botón en `app/salon-de-la-fama/page.tsx`, y el `router.push` post-login/invitado en `app/auth/page.tsx`.
- CSS de Home portado a `app/globals.css`: `.home`, `.home-hero`, `.home-silos` + siluetas SVG (`FloatingSilhouettes`), `.hero-eyebrow`, `.home-title`, `.home-sub`, `.home-ctas`, `.hero-scroll` + `@keyframes bounce`/`float`, `.home-section`, `.section-head/-title/-rule`, `.feature-grid`/`.feature-card`/`.ft-*` (+ `FeatureIcon`), `.mini-rail`/`.mini-card`/`.mini-*` (+ `MiniCard`), `.home-stats`/`.stat-*`, `.activity-grid`/`.activity-card`/`.ticker`/`.tick-*`/`.top-list`/`.top-*`, `.pricing-grid`/`.price-card`/`.pc-*`/`.pricing-faq`/`.faq-*`, `.home-final`/`.final-*`, `.reveal`/`.reveal.in`. Se excluyen del port las reglas exclusivas de `about.jsx` (secciones de "Acerca de").

**Out of scope (para specs futuras):**

- Página o ruta "Acerca de" (`about.jsx`) — el link queda en el Nav sin navegar, ninguna otra parte de esa pantalla se implementa.
- Generar "Últimas puntuaciones" / "Top jugadores · hoy" dinámicamente con `seededScores` — se mantienen como datos de ejemplo estáticos, igual que el prototipo.
- Cualquier cambio de contenido/copy respecto al prototipo (textos, precios, FAQ se portan tal cual).
- Tests automatizados.

## Data model

Esta spec no introduce estructuras de datos nuevas. Reutiliza `GAMES` de `lib/data.ts` (spec 01) para la sección "Juegos disponibles ahora" (`GAMES.slice(0, 6)`). El resto del contenido dinámico de Home ("Actividad en vivo") son arrays literales dentro del componente, copiados del prototipo, sin tipos ni módulo propio.

## Implementation plan

1. Crear `app/biblioteca/page.tsx` con el contenido íntegro y sin cambios del actual `app/page.tsx` (la Biblioteca de spec 01). Prueba manual: `/biblioteca` se ve y funciona igual que `/` antes de este spec.
2. Portar a `app/globals.css` las reglas CSS de Home listadas en el scope, tomadas de `references/templates/home-about/styles.css` (sin las de `about.jsx`). Prueba manual: no hay errores de build ni de sintaxis CSS.
3. Reescribir `app/page.tsx` como la nueva Home (Client Component), portando `home.jsx`: `useReveal`, `FloatingSilhouettes`, `MiniCard`, `FeatureIcon` y el componente `Home` con sus 7 secciones, reemplazando `navigate({name:...})` por `useRouter().push(...)`/`next/link` (`/biblioteca`, `/auth`, `/salon-de-la-fama`). Prueba manual: `/` muestra la landing completa, el scroll-reveal anima las secciones al hacer scroll, y los CTAs navegan a las rutas correctas.
4. Actualizar `components/nav.tsx`: agregar link "Inicio" (`/`) antes de "Biblioteca", cambiar el href de "Biblioteca" a `/biblioteca`, agregar "Acerca de" sin `href`/`onClick` funcional, y ajustar `isActive` para que "Inicio" esté activo solo en `pathname === "/"` y "Biblioteca" en `/biblioteca` y `/juegos/*`. Replicar los mismos 4 links en el panel móvil. Prueba manual: el link activo cambia correctamente al navegar entre `/`, `/biblioteca`, `/salon-de-la-fama`; click en "Acerca de" no hace nada.
5. Actualizar los enlaces que apuntaban a `/` esperando la biblioteca para que apunten a `/biblioteca`: `app/juegos/[id]/page.tsx` (botón "VOLVER AL VAULT"), `app/juegos/[id]/jugar/page.tsx` (botón de cierre/salir), `app/salon-de-la-fama/page.tsx` (botón de volver), `app/auth/page.tsx` (`router.push` tras login/registro/invitado). Prueba manual: desde cada una de esas pantallas, el botón de volver lleva a `/biblioteca`, no a la Home.
6. Revisar responsive: comprobar en viewport móvil (<840px) que las secciones de Home colapsan según las media queries ya portadas (`.feature-grid`, `.pricing-grid`, etc.) y que el Nav de 4 links cabe en el panel lateral.
7. Ejecutar `npm run build` y confirmar que compila sin errores de TypeScript ni de rutas.

## Acceptance criteria

- [x] `/` muestra la landing completa: hero con siluetas animadas, sección "¿Por qué Arcade Vault?", preview de 6 juegos reales, stats, actividad en vivo, precios/FAQ y CTA final.
- [x] Las secciones de Home con clase `reveal` aparecen animadas (`in`) al hacer scroll hasta ellas.
- [x] `/biblioteca` muestra el mismo contenido y comportamiento (buscador, filtro, grid) que tenía `/` antes de este spec.
- [x] El Nav muestra 4 links: Inicio, Biblioteca, Salón de la Fama, Acerca de — en ese orden, en desktop y en el panel móvil.
- [x] Click en "Acerca de" no navega a ninguna parte ni produce error en consola.
- [x] "EXPLORAR JUEGOS" y "VER TODOS LOS JUEGOS →" en Home navegan a `/biblioteca`.
- [x] "CREAR CUENTA" (hero) y "EMPEZAR GRATIS →" (precios) en Home navegan a `/auth`.
- [x] "VER SALÓN →" en Home navega a `/salon-de-la-fama`.
- [x] "INSERTAR MONEDA →" (CTA final) navega a `/biblioteca`.
- [x] Click en una mini-card de la sección "Juegos disponibles ahora" navega a `/juegos/[id]` del juego correcto.
- [x] El logo del Nav navega a `/` desde cualquier pantalla.
- [x] "VOLVER AL VAULT" en el detalle de juego, el botón de salir del reproductor, el botón de volver en Salón de la Fama, y el flujo de login/registro/invitado en `/auth` navegan a `/biblioteca` (no a `/`).
- [x] En viewport móvil (<840px), las secciones de Home colapsan correctamente y el panel lateral del Nav muestra los 4 links.
- [x] `npm run build` completa sin errores de TypeScript ni de rutas.

## Decisions

- **Sí:** Home pasa a ocupar la ruta raíz `/`, y la Biblioteca se reubica a `/biblioteca`. Replica la estructura de navegación del prototipo (`home-about/nav.jsx`), donde Home es la landing raíz y Biblioteca es una sección aparte.
- **No:** no se crea una ruta `/acerca-de` ni se porta `about.jsx`. Queda fuera de este spec; el link "Acerca de" se agrega al Nav pero sin destino, tal como pidió el usuario.
- **Sí:** "Acerca de" se renderiza con el mismo estilo que los demás links del Nav, simplemente sin `href` ni `onClick` — no se le aplica un estilo "deshabilitado" distinto, para no apartarse visualmente del diseño del prototipo.
- **Sí:** las secciones "Últimas puntuaciones" y "Top jugadores · hoy" de "Actividad en vivo" se dejan con los datos de ejemplo hardcodeados del prototipo, sin generarlos con `seededScores`. El prototipo tampoco lo hace, y no hay un juego/seed obvio que usar para esa vista agregada.
- **Sí:** el CSS de Home se porta tal cual desde `references/templates/home-about/styles.css` a `app/globals.css`, igual que el patrón ya usado en spec 01 — el diseño ya está definido, no se invoca `/frontend-design`.
- **Sí:** todos los enlaces "volver"/"salir" que en spec 01 apuntaban a `/` (biblioteca) se actualizan a `/biblioteca`, porque `/` ahora es la Home y no tendría sentido que "volver al vault" te regrese a la landing.

## Risks

| Riesgo                                                                                                                | Mitigación                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El `IntersectionObserver` de `useReveal` corre en el servidor durante SSR y falla porque `document` no existe         | El componente `Home` se marca `"use client"` (igual que el resto de páginas del proyecto) y el hook corre dentro de `useEffect`, que solo se ejecuta en el navegador.                                                                                                                         |
| Enlaces internos olvidados que sigan apuntando a `/` esperando la biblioteca, rompiendo la navegación silenciosamente | El paso 5 del plan lista explícitamente los 4 archivos a actualizar; se verifica con una búsqueda de `href="/"` / `push("/")` antes de cerrar el spec (ya identificados: `app/juegos/[id]/page.tsx`, `app/juegos/[id]/jugar/page.tsx`, `app/salon-de-la-fama/page.tsx`, `app/auth/page.tsx`). |
| Conflicto de nombres de clases CSS entre el CSS ya portado (spec 01) y el nuevo CSS de Home                           | Las clases de Home (`.home-*`, `.feature-*`, `.mini-*`, `.stat-*`, `.activity-*`, `.tick-*`, `.top-*`, `.pricing-*`, `.pc-*`, `.faq-*`, `.final-*`) son namespaced y no existen hoy en `app/globals.css` (verificado), por lo que no hay colisión esperada.                                   |

## What is **not** in this spec

- La pantalla/ruta "Acerca de" y cualquier contenido de `about.jsx`.
- Datos dinámicos (`seededScores`) para "Actividad en vivo" en Home.
- Cambios de copy o diseño respecto al prototipo.
- Tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
