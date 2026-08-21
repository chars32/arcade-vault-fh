# SPEC 03 — Acerca de + formulario de contacto con Resend

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-08-21
> **Objective:** Portar la pantalla "Acerca de" (`references/templates/home-about/about.jsx`) como la ruta `/acerca-de`, enlazada desde el Nav, con el formulario de contacto enviando correos reales vía Resend a través de una Server Action.

## Por qué existe este spec

El spec 02 dejó el link "Acerca de" del Nav explícitamente sin funcionalidad (`<a>Acerca de</a>` sin `href` ni `onClick`), y su CSS (`.about-*`, `.highlight-*`, `.contact-*`, `.terminal-success`) nunca se portó a `app/globals.css`. Este spec cierra ambos huecos y añade la única pieza de backend real del proyecto hasta ahora: el envío de correo del formulario de contacto, que en el prototipo (`about.jsx`) es enteramente simulado en cliente (nunca falla, no llega a ningún lado).

## Scope

**In:**

- Nueva ruta `app/acerca-de/page.tsx` (Client Component) portando `about.jsx`: hero "Acerca de" con mission statement y `highlight-row` (3 tarjetas con `HighlightIcon`), divisor animado (`about-divider`), y sección de contacto (`contact-grid`) con el formulario.
- Scroll-reveal (`useEffect` + `IntersectionObserver`, clases `.reveal`/`.in`) igual que en el resto de secciones portadas, reutilizando el mismo patrón que `app/page.tsx` (spec 02).
- Formulario de contacto con 3 campos (nombre, correo, mensaje) que al enviarse invoca una **Server Action** (`app/acerca-de/actions.ts`, `"use server"`) que llama a la API de Resend con el paquete `resend`.
- Validación en cliente antes de invocar la Server Action: los 3 campos no vacíos (dispara `shake`, igual que el prototipo) y el campo correo con formato de email válido (`type="email"` + `input.checkValidity()` o regex simple; si el formato es inválido también dispara `shake`).
- Estados del formulario manejados con `useActionState` + `useFormStatus` (o el `pending` de `useActionState`): `idle` (formulario visible), `pending` (botón deshabilitado, texto "ENVIANDO…"), `error` (formulario visible con los valores conservados + mensaje de error inline, sin usar el estado `shake`), `success` (reemplaza el formulario por el bloque `terminal-success` existente del prototipo, igual copy).
- Server Action `sendContactMessage`: recibe `FormData`, valida server-side (nombre/correo/mensaje no vacíos, correo con formato válido) con verificación simple (sin librería nueva tipo zod, para no introducir una dependencia extra en un formulario de 3 campos), llama a `resend.emails.send(...)` con remitente `onboarding@resend.dev` y destinatario `chars24@gmail.com`, y devuelve `{ status: "success" } | { status: "error", message: string }`.
- Asunto del correo: `Nuevo mensaje de contacto — {nombre}`. Cuerpo (texto plano): incluye nombre, correo del remitente (para poder responder) y el mensaje completo.
- `components/nav.tsx` actualizado: "Acerca de" pasa a ser un link real (`next/link` con `href="/acerca-de"` en desktop, `onClick={() => go("/acerca-de")}` en el panel móvil), sumado a `isActive()` (`pathname === "/acerca-de"`).
- CSS portado a `app/globals.css`: todo el bloque `/* ===== ABOUT PAGE ===== */` de `references/templates/home-about/styles.css` (`.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`/`.highlight`/`.hl-*`, `.about-divider`/`.div-bar`/`.div-pixels` + `@keyframes pxblink`, `.about-contact`/`.contact-grid`/`.contact-intro`/`.contact-title`/`.contact-sub`/`.contact-tips`/`.tip*`, `.contact-form` + `@keyframes shake`, `.terminal-success`/`.term-*`), más una regla nueva para el mensaje de error inline del formulario (`.contact-error`, siguiendo el mismo lenguaje visual: texto en `var(--magenta)` con `text-shadow`, tamaño `--mono` 12px).
- Dependencia nueva `resend` en `package.json`.
- Variable de entorno `RESEND_API_KEY` leída en la Server Action vía `process.env.RESEND_API_KEY`.
- Documentar en este spec los pasos para que el usuario complete `.env.local` con su API key real (ver sección "Configuración local" más abajo).

**Out of scope (para specs futuras):**

- Dominio propio verificado en Resend (se usa el remitente sandbox `onboarding@resend.dev`, que solo entrega a la dirección con la que el usuario se registró en Resend).
- Rate limiting / protección anti-spam (honeypot, captcha, límite de envíos por IP o por sesión).
- Persistencia de los mensajes de contacto (no se guardan en ningún storage; solo se envían por correo).
- Notificación de confirmación al remitente (correo de "recibimos tu mensaje" al `email` ingresado en el formulario). Solo se envía el correo interno a `chars24@gmail.com`.
- Tests automatizados.
- Cualquier cambio de copy/contenido respecto al prototipo (textos del hero, highlights, tips de contacto se portan tal cual).

## Data model

Esta spec no introduce estructuras de datos persistentes. El único "modelo" es la forma del resultado de la Server Action:

```ts
// app/acerca-de/actions.ts
type ContactFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };
```

No hay tipos nuevos en `lib/`. El formulario en sí (`{ name, email, msg }`) vive solo como estado local del componente cliente, igual que en el prototipo.

## Configuración local

1. Crear una cuenta en [resend.com](https://resend.com) (si no existe ya) y generar una API key de pruebas.
2. Crear `.env.local` en la raíz del proyecto (ya cubierto por `.env*` en `.gitignore`, no se commitea) con:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Mientras se use el remitente sandbox `onboarding@resend.dev`, Resend solo entrega correos a la dirección de email con la que el usuario creó su cuenta de Resend — si `chars24@gmail.com` no es esa dirección, los envíos de prueba pueden no llegar a la bandeja aunque la API responda éxito. Esto es una limitación conocida del modo sandbox, no un bug de la implementación.

## Implementation plan

1. Instalar la dependencia `resend` (`npm install resend`). Prueba manual: `package.json` incluye `"resend"` y `npm run build` sigue funcionando.
2. Portar a `app/globals.css` el bloque CSS de `/* ===== ABOUT PAGE ===== */` listado en el scope, más la regla nueva `.contact-error`. Prueba manual: no hay errores de build ni de sintaxis CSS.
3. Crear `app/acerca-de/actions.ts` con `"use server"` y la función `sendContactMessage(prevState: ContactFormState, formData: FormData): Promise<ContactFormState>`: valida los 3 campos server-side, instancia `new Resend(process.env.RESEND_API_KEY)`, llama a `resend.emails.send({ from: "onboarding@resend.dev", to: "chars24@gmail.com", subject: ..., text: ... })` dentro de un `try/catch`, y devuelve `{ status: "success" }` o `{ status: "error", message: "No se pudo enviar tu mensaje. Intenta de nuevo." }`. Prueba manual: sin API key configurada, la función no lanza una excepción no controlada (el `try/catch` la atrapa y devuelve `status: "error"`).
4. Crear `app/acerca-de/page.tsx` (Client Component) portando el JSX de `about.jsx`: `useEffect` de reveal, sección hero con `highlight-row` y `HighlightIcon`, `about-divider`, y la sección de contacto usando `useActionState(sendContactMessage, { status: "idle" })` para manejar `pending`/`error`/`success`, con validación cliente (`shake`) antes de dejar que el `formAction` corra. Prueba manual: `/acerca-de` muestra las 3 secciones del prototipo con el mismo look visual.
5. Actualizar `components/nav.tsx`: cambiar el `<a>Acerca de</a>` de desktop por `<Link href="/acerca-de" className={isActive("acerca") ? "active" : ""}>`, el del panel móvil por `<a className={isActive("acerca") ? "active" : ""} onClick={() => go("/acerca-de")}>`, y sumar `"acerca"` al tipo/lógica de `isActive()`. Prueba manual: el link "Acerca de" navega y se resalta como activo en `/acerca-de`, en desktop y en el panel móvil.
6. Verificación end-to-end manual: completar el formulario en `/acerca-de` con datos válidos y confirmar que (a) el botón muestra "ENVIANDO…" y se deshabilita durante el envío, (b) si `RESEND_API_KEY` es válida y apunta a una cuenta cuya dirección registrada es `chars24@gmail.com`, el correo llega con el asunto y cuerpo esperados, (c) si se deja un campo vacío o un correo con formato inválido, el formulario hace `shake` y no invoca la Server Action, (d) forzando un error (API key inválida) el formulario muestra el mensaje de error inline y conserva los valores ingresados.
7. Ejecutar `npm run build` y confirmar que compila sin errores de TypeScript ni de rutas.

## Acceptance criteria

- [x] `/acerca-de` muestra el hero "Acerca de" con mission statement y las 3 tarjetas de `highlight-row`.
- [x] Las secciones con clase `reveal` aparecen animadas (`in`) al hacer scroll hasta ellas.
- [x] El Nav muestra "Acerca de" como link funcional (desktop y panel móvil) que navega a `/acerca-de` y se marca activo ahí.
- [x] Enviar el formulario con algún campo vacío dispara la animación `shake` y no llama a la Server Action.
- [x] Enviar el formulario con un correo de formato inválido (ej. `sinarroba`) dispara `shake` y no llama a la Server Action.
- [x] Con los 3 campos válidos, al enviar el botón muestra "ENVIANDO…" y se deshabilita hasta que la Server Action resuelve.
- [x] Un envío exitoso reemplaza el formulario por el bloque `terminal-success` con el nombre ingresado, igual que el prototipo.
- [x] Un envío fallido (ej. `RESEND_API_KEY` inválida o ausente) muestra un mensaje de error inline sin perder los valores ya escritos en el formulario, y permite reintentar.
- [ ] Con una API key válida de Resend y una cuenta cuya dirección registrada sea `chars24@gmail.com`, el correo recibido tiene el asunto `Nuevo mensaje de contacto — {nombre}` y el cuerpo incluye nombre, correo y mensaje.
- [x] `npm run build` completa sin errores de TypeScript ni de rutas.

## Decisions

- **Sí:** Server Action (`"use server"`) invocada directamente desde el `<form action={...}>` vía `useActionState`, en vez de un Route Handler (`app/api/.../route.ts`). Es el patrón nativo de Next 16 App Router para mutaciones desde formularios y evita mantener un endpoint HTTP propio solo para este caso.
- **Sí:** paquete oficial `resend` (SDK) en vez de llamar a la API HTTP de Resend a mano con `fetch`. Menos código, tipado, y es el uso recomendado por Resend para Next.js.
- **Sí:** remitente sandbox `onboarding@resend.dev`. No hay dominio propio verificado todavía; documentar la limitación (solo entrega a la cuenta registrada) en vez de bloquear el spec por eso.
- **No:** dominio propio verificado en Resend — se deja para una spec futura si el proyecto pasa a producción real.
- **Sí:** validación de formato de email además de "no vacío", tanto en cliente como en la Server Action (defensa en profundidad simple, sin librería de validación).
- **No:** usar `zod` u otra librería de validación — el formulario tiene 3 campos con reglas simples, no justifica la dependencia.
- **Sí:** estado de error inline separado del `shake` de validación. `shake` comunica "corrige el formulario"; el mensaje de error comunica "el envío falló en el servidor", son causas distintas y merecen feedback distinto.
- **No:** correo de confirmación al remitente — fuera de scope, se documenta explícitamente arriba.
- **No:** rate limiting / anti-spam — el formulario no tiene tráfico público real todavía; se revisita si el proyecto sale a producción.
- **Sí:** ruta `app/acerca-de/page.tsx` (español, con guion) en vez de `app/about/page.tsx`, por consistencia con `/salon-de-la-fama` y `/biblioteca`.

## Risks

| Riesgo                                                                                                                    | Mitigación                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY` ausente o inválida en el entorno del usuario                                                             | La Server Action envuelve la llamada en `try/catch` y devuelve `status: "error"` con mensaje inline, sin romper la página ni dejar una excepción no controlada. |
| Remitente sandbox (`onboarding@resend.dev`) no entrega a `chars24@gmail.com` si esa no es la cuenta registrada en Resend  | Documentado explícitamente en "Configuración local"; no es un bug de la implementación, es una limitación conocida del modo sandbox.                            |
| Confusión entre el estado `shake` (validación cliente) y el estado de error del servidor si no se diferencian visualmente | Se usa un mensaje de texto inline (`.contact-error`) para errores de servidor, distinto de la sola animación `shake` de validación.                             |

## What is **not** in this spec

- Dominio propio verificado en Resend.
- Rate limiting o protección anti-spam del formulario.
- Persistencia de los mensajes de contacto.
- Correo de confirmación al remitente.
- Tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
