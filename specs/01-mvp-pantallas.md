# SPEC 01 — MVP de pantallas visuales de Arcade Vault

> **Status:** Implementado
> **Depends on:** —
> **Date:** 2026-08-20
> **Objective:** Portar las cinco pantallas del prototipo (`references/templates/`) a rutas reales del App Router de Next.js, con navegación, datos mock y sesión/puntuaciones en localStorage, sin implementar ningún juego real.

## Por qué existe este spec

`app/globals.css` ya contiene el CSS del prototipo portado casi en su totalidad (variables, fondo, nav, cards, CRT, modal, podio, etc. — ver commit `3ea385a`), y `app/layout.tsx` ya carga las fuentes (`Press Start 2P`, `JetBrains Mono`, `Courier Prime`) y el fondo `.av-bg`/`.av-noise`. Este spec cubre lo que falta: los datos mock, la sesión, y los componentes/páginas React que consumen ese CSS ya existente.

## Scope

**In:**

- Cinco pantallas navegables como rutas reales del App Router: biblioteca (`/`), detalle de juego (`/juegos/[id]`), reproductor simulado (`/juegos/[id]/jugar`), autenticación (`/auth`), Salón de la Fama (`/salon-de-la-fama`).
- Barra de navegación (`Nav`) y footer en `app/layout.tsx`, incluyendo el menú móvil (hamburguesa + panel lateral).
- Catálogo de juegos, categorías y generador de puntuaciones (`GAMES`, `CATS`, `seededScores`) portados a `lib/data.ts`, tipados.
- Covers de juego (`cover-bricks`, `cover-tetro`, etc.) como los `div` con clases CSS del prototipo (gradientes generados por CSS), sin assets de imagen.
- Sesión de usuario (`av_user`) y puntuaciones guardadas (`av_scores`) persistidas en `localStorage`, con el mismo esquema que el prototipo.
- Formulario de auth (login / crear cuenta / invitado) sin validación real — cualquier input "loguea".
- Reproductor con la misma simulación visual del prototipo: HUD que tickea puntuación con un intervalo, subida de nivel cada 2500 puntos, pausa, fin de partida, modal para guardar puntuación con iniciales.
- Búsqueda por nombre y filtro por categoría en la biblioteca.
- Leaderboard en el detalle de cada juego y podio + tabla en el Salón de la Fama, generados con `seededScores`.

**Out of scope (para specs futuras):**

- Cualquier lógica de juego real (colisiones, inputs de juego, reglas). El reproductor sigue siendo una simulación visual, igual que el prototipo.
- Backend real / API / base de datos. Toda la persistencia es `localStorage`.
- Autenticación real (passwords hasheadas, sesiones server-side, OAuth con Google/GitHub — esos botones quedan como UI sin funcionalidad, igual que en el prototipo).
- Créditos/monedas funcionales (el contador "CRÉDITOS · 03" del Nav es decorativo, como en el prototipo).
- Tests automatizados.
- Dark/light theme toggle (el prototipo es un único tema oscuro neón).

## Data model

```ts
// lib/data.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string; // clase CSS: "cover-bricks", "cover-tetro", ...
  color: "cyan" | "magenta" | "green" | "yellow";
  best: number;
  plays: string;
};

export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
};

export const GAMES: Game[]; // los 8 juegos del prototipo, copiados tal cual
export const CATS: readonly ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];
export function seededScores(seed: number, count?: number): ScoreRow[];
```

```ts
// lib/session.ts (o session.tsx si expone Context/Provider)
export type SessionUser = { name: string };

// localStorage keys, iguales al prototipo:
// "av_user"   -> SessionUser | null (JSON)
// "av_scores" -> Array<{ game: string; score: number; name: string; at: number }> (JSON)
```

Convenciones:

- Los ids de juego (`bloque-buster`, `caida`, …) son los slugs usados en las rutas dinámicas `/juegos/[id]`.
- `seededScores` es una función pura determinística (mismo seed → mismas filas), copiada del prototipo sin cambios de comportamiento.
- El esquema de `av_user`/`av_scores` en `localStorage` es idéntico al del prototipo para no romper compatibilidad si se reutiliza el HTML original en paralelo.

## Implementation plan

1. Crear `lib/data.ts` con `Game`, `GameCategory`, `ScoreRow`, `GAMES`, `CATS` y `seededScores`, portados de `references/templates/data.jsx`.
2. Crear `lib/session.tsx`: un `SessionProvider` (Client Component) con Context que expone `{ user, login, logout }`, lee/escribe `av_user` en `localStorage`, y un hook `useSession()`. Envolver `children` con `SessionProvider` en `app/layout.tsx`. Prueba manual: la app sigue renderizando sin errores de hidratación.
3. Crear `lib/scores.ts` con `saveScore(entry: { game: string; score: number; name: string })` que hace push a `av_scores` en `localStorage`.
4. Crear `components/nav.tsx` (Client Component) portando `nav.jsx`: logo, links activos por ruta (`usePathname`), contador de créditos estático, botón de sesión (usa `useSession`), menú móvil con hamburguesa. Añadirlo a `app/layout.tsx` dentro de `<div id="root">`, antes de `<main>`. Prueba manual: la barra se ve en todas las rutas y el link activo cambia.
5. Crear `components/game-card.tsx` portando el `GameCard` de `biblioteca.jsx` (incluye el efecto tilt con `onMouseMove`).
6. Crear `app/page.tsx` (Client Component) portando `biblioteca.jsx`: hero, buscador, chips de categoría, grid de `GameCard` que navegan con `<Link href="/juegos/[id]">` (usando `next/link`), estado vacío "NO HAY RESULTADOS". Prueba manual: buscar y filtrar funciona, click en una card navega al detalle.
7. Crear `app/juegos/[id]/page.tsx` portando `detalle.jsx`: cover, tags, descripción, stat-strip, botones "JUGAR AHORA" (→ `/juegos/[id]/jugar`) y "VOLVER AL VAULT" (→ `/`), leaderboard con `seededScores`. Usar `notFound()` de Next si el `id` no existe en `GAMES`. Prueba manual: cada uno de los 8 juegos abre su ficha con datos correctos.
8. Crear `app/juegos/[id]/jugar/page.tsx` (Client Component) portando `reproductor.jsx`: HUD, `setInterval` de puntuación simulada, pausa, nivel, fin de partida, modal con input de iniciales y botón "GUARDAR PUNTUACIÓN" que llama a `saveScore` y marca `saved`. Prueba manual: jugar, pausar, terminar, guardar puntuación, y verificar en devtools que `av_scores` creció en `localStorage`.
9. Crear `app/auth/page.tsx` (Client Component) portando `auth.jsx`: tabs "INICIAR SESIÓN"/"CREAR CUENTA", campos sin validación, botón "JUGAR COMO INVITADO", botones sociales decorativos. Al enviar, llama a `useSession().login(...)` y redirige a `/` con `useRouter().push`. Prueba manual: loguear con cualquier texto navega a biblioteca y el Nav muestra el nombre de usuario.
10. Crear `app/salon-de-la-fama/page.tsx` (Client Component) portando `salon.jsx`: tabs por juego, podio (top 1-3), tabla completa, fila "tu mejor marca" cuando hay sesión iniciada. Prueba manual: cambiar de tab por juego recalcula el podio/tabla con `seededScores`.
11. Revisar responsive: comprobar en un viewport móvil que el menú hamburguesa y el panel lateral del `Nav` funcionan, y que el grid de biblioteca, el `av-detail`, el `podium` y el `hall-table` colapsan como en `globals.css` (media queries ya existentes).
12. Actualizar el footer en `app/layout.tsx` (o dentro del wrapper del Nav) con el texto `© 2026 ARCADE VAULT · HECHO CON PÍXELES Y NEÓN · v2.6.0`, igual que `app.jsx`.

## Acceptance criteria

- [x] `/` muestra el grid de los 8 juegos, con buscador y filtro de categoría funcionando.
- [x] Buscar un término sin resultados muestra el estado "NO HAY RESULTADOS".
- [x] Click en una card o en su botón "JUGAR" navega a `/juegos/[id]` con los datos correctos del juego.
- [x] `/juegos/[id]` muestra cover, descripción, stat-strip y un leaderboard de 10 filas generado con `seededScores`.
- [x] Un `id` inexistente en `/juegos/[id]` dispara la página `not-found` de Next.
- [x] "JUGAR AHORA" navega a `/juegos/[id]/jugar`.
- [x] En el reproductor, la puntuación sube sola cada ~220ms mientras no está en pausa ni terminado.
- [x] El botón "PAUSA"/"REANUDAR" detiene y reanuda el incremento de puntuación.
- [x] El botón "FIN" abre el modal de fin de partida con la puntuación final.
- [x] Guardar la puntuación con iniciales agrega una entrada a `av_scores` en `localStorage` y muestra el toast "PUNTUACIÓN GUARDADA\_".
- [x] "JUGAR DE NUEVO" reinicia puntuación, vidas, nivel y cierra el modal.
- [x] `/auth` permite loguear con cualquier usuario/contraseña, guarda `av_user` en `localStorage` y redirige a `/`.
- [x] "JUGAR COMO INVITADO" navega a `/` sin usuario logueado.
- [x] Tras loguear, el Nav muestra el nombre de usuario en vez del botón "Iniciar Sesión", y permite cerrar sesión.
- [x] `/salon-de-la-fama` muestra tabs por juego, un podio de top 3 y una tabla de 12 filas que cambian al seleccionar otro juego.
- [x] Con sesión iniciada, `/salon-de-la-fama` muestra la fila "▸ TU MEJOR MARCA EN {juego}".
- [x] En un viewport móvil (<840px), el Nav colapsa a hamburguesa y el panel lateral se abre/cierra correctamente.
- [x] `npm run build` completa sin errores de TypeScript ni de rutas.

## Decisions

- **Sí:** rutas de archivo reales del App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon-de-la-fama`) en vez de un router de hash como el prototipo. Aprovecha el App Router real, URLs compartibles y `next/link`.
- **No:** mantener el router de hash de `app.jsx`. No aporta nada sobre las rutas de archivo nativas de Next 16.
- **Sí:** simulación visual completa en el reproductor (HUD con `setInterval`, subida de nivel, modal de guardado), igual que el prototipo. "No implementar ningún juego" se interpreta como "no hay lógica de juego real", no como "sin la experiencia simulada".
- **Sí:** `localStorage` para `av_user` y `av_scores`, mismo esquema que el prototipo. No hay backend en este MVP.
- **No:** validación de formulario en `/auth`. El prototipo no valida nada; mantenerlo así evita fricción y trabajo fuera de scope.
- **Sí:** covers como CSS generado (`cover-bricks`, `cover-tetro`, …), ya definidos en `globals.css`. No se generan imágenes.
- **Sí:** `Nav` y footer viven en `app/layout.tsx` como layout raíz compartido, igual que `<Nav/>` + `<main/>` + `<footer/>` en `app.jsx`.
- **Sí:** menú móvil incluido en este MVP — el CSS responsive ya existe en `globals.css` (`.av-mobile-panel`, `@media (max-width: 840px)`).
- **Sí:** `GAMES`/`CATS`/`seededScores` viven en `lib/data.ts` (TypeScript tipado), no en JSON estático, porque `seededScores` es una función y no solo datos.
- **No:** se omite invocar `/frontend-design` para generar CSS nuevo, porque el diseño ya está completamente definido y portado en `globals.css` (spec previo `01-styles`, commit `3ea385a`). El trabajo de este spec es de componentes/datos, no de diseño visual desde cero.

## Risks

| Riesgo                                                                                                    | Mitigación                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desajuste de hidratación SSR al leer `localStorage` en `SessionProvider`/`Nav` (server no tiene `window`) | `SessionProvider` inicializa `user` en `null` en el render inicial y lo hidrata desde `localStorage` en un `useEffect`, igual que hace `app.jsx` con `useState(() => JSON.parse(...))` mitigado por marcar esos componentes como Client Components. |
| `localStorage` deshabilitado (modo privado)                                                               | Los `try/catch` alrededor de lectura/escritura de `localStorage` (igual que el prototipo) evitan que la app crashee; la sesión/puntuación simplemente no persiste.                                                                                  |
| Animación `tilt` de `GameCard` (basada en `getBoundingClientRect`) puede comportarse distinto en SSR      | El componente que la usa se marca `"use client"` y el efecto solo corre en el navegador.                                                                                                                                                            |

## What is **not** in this spec

- Lógica de juego real para cualquiera de los 8 juegos.
- Backend, API o base de datos.
- Autenticación real (passwords, OAuth funcional, sesiones server-side).
- Créditos/monedas funcionales.
- Tests automatizados.
- Cambios de tema (light/dark).

Cada uno de estos, si se implementa, va en su propio spec.
