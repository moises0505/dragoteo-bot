# DRAGOTEO Repo Map

## Alcance Real Del Repo

Fuera de `node_modules`, el repositorio visible contiene solo cinco archivos:

```text
.
├── AGENTS.md
├── index.js
├── package-lock.json
├── package.json
└── seed-menu.js
```

## Lectura Rápida Del Árbol

- `AGENTS.md`
  - Gobierno operativo del proyecto en este workspace.
  - Define prioridades: menú, Firestore, sesiones, Google Chat hoy, WhatsApp mañana, IA después.
  - `git status --short` lo reporta como no trackeado, así que su vigencia es operativa, no confirmadamente versionada.

- `index.js`
  - Entry point real del backend.
  - Contiene servidor Express, lógica de navegación, matching, sesiones, render de mensajes y acceso a Firestore.
  - Es el archivo más crítico y también el más acoplado.

- `package.json`
  - Define paquete `dragobot-bot`.
  - `main: index.js`.
  - Script único: `start`.
  - Dependencias mínimas: `express` y `@google-cloud/firestore`.

- `package-lock.json`
  - Lockfile de dependencias.
  - No añade lógica de dominio.

- `seed-menu.js`
  - Constructor editorial del menú.
  - Publica `publishedMenus/main` completo en Firestore.
  - No participa en el runtime HTTP del bot.

## Archivos Clave Y Función

### Runtime

- `index.js`
  - `normalizeText`: limpia acentos, menciones y puntuación.
  - `getSessionId`: construye el ID de sesión con campos de Google Chat.
  - `getVisibleChildren`: filtra hijos según audiencia.
  - `buildMenuMessage`: renderiza opciones numeradas.
  - `buildLeafMessage`: renderiza hojas y fallback temporal.
  - `findMatchingOption`: matching por número, texto exacto, prefijo, inclusión y tokens.
  - `app.post("/chat")`: flujo central.

### Publicación De Datos

- `seed-menu.js`
  - `addMenu`, `addLeaf`, `addAudienceOption`: helpers editoriales.
  - `main()`: escribe el documento `publishedMenus/main`.

## Entrypoints Confirmados

- Backend HTTP: `index.js`
- Publicación de menú: `seed-menu.js`
- Inicio por npm: `npm start`

## Configuración Crítica Detectada

- `PORT` en `index.js`
- Credenciales implícitas de Google Cloud para `new Firestore()`
- Firestore como dependencia obligatoria

## Archivos Dudosos, Duplicados O Legacy

### Dudosos

- `AGENTS.md`
  - No es código de producto.
  - Es crítico como gobierno del análisis y probablemente del mantenimiento, pero no está confirmado como parte versionada del repo.

### Duplicados

- No hay duplicación de módulos en el repo fuente.

### Legacy U Obsoleto

- No hay evidencia de módulos legacy internos porque el repo es extremadamente pequeño.
- Sí hay ausencia de piezas que normalmente acompañarían producción: deploy scripts, pruebas, config de Firebase o Cloud Run. Eso no prueba que no existan; solo que no están aquí.

## Módulos Con Acoplamiento Fuerte Al Canal

### Fuerte

- `index.js`
  - sesión basada en `space.name` y `user.name`
  - lectura de `message.argumentText`
  - lectura de `message.text`
  - evento `ADDED_TO_SPACE`

### Medio

- `buildMenuMessage` y `buildLeafMessage`
  - hoy generan texto plano útil para casi cualquier canal
  - pero asumen un estilo de interacción textual particular

### Bajo

- `seed-menu.js`
  - modela menú y audiencia de forma relativamente portable

## Señales De Que No Hay App Administrativa En Este Repo

- No hay `src/`, `public/`, `firebase.json`, `hosting`, `vite.config`, `next.config`, `app/` ni equivalentes.
- No hay evidencia de frontend ni de panel administrativo local.
- Con la evidencia disponible, este repo parece enfocarse solo en backend y publicación manual del menú.

## Qué Revisar Primero

1. [index.js](/Users/dnavarro/dragoteo-bot/index.js)
2. [package.json](/Users/dnavarro/dragoteo-bot/package.json)
3. [seed-menu.js](/Users/dnavarro/dragoteo-bot/seed-menu.js)
4. [AGENTS.md](/Users/dnavarro/dragoteo-bot/AGENTS.md)
