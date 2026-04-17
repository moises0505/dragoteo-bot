# DRAGOTEO / DRAGOBOT

Backend conversacional para un chatbot orientado a Operaciones Académicas y Docentes.

Hoy opera sobre Google Chat, con Firestore como fuente de verdad y un menú conversacional guiado como núcleo del sistema. La prioridad actual del proyecto no es una IA abierta, sino una navegación clara, controlada y trazable que reduzca ambigüedad y prepare una evolución futura hacia WhatsApp y una capa de IA con guardrails.

## Estado Actual Del Proyecto

- Canal actual: Google Chat
- Backend actual: Node.js + Express
- Fuente de verdad: Firestore
- Documento de menú activo asumido por código: `publishedMenus/main`
- Colección principal de sesiones: `chatSessions`
- Entry point del backend: `index.js`
- Script editorial de publicación de menú: `seed-menu.js`

## Principio Rector

Proteger la lógica conversacional del menú.

Las decisiones del proyecto deben favorecer:

- claridad
- mínima complejidad real
- trazabilidad
- mantenibilidad
- portabilidad futura a WhatsApp
- incorporación futura de IA sin romper la disciplina del menú

## Estructura Del Repo

```text
.
├── index.js
├── seed-menu.js
├── package.json
├── package-lock.json
├── README.md
└── AGENTS.md
```

### Archivos Clave

- `index.js`
  Backend HTTP del bot. Recibe mensajes, consulta el menú publicado en Firestore, mantiene sesiones y responde al usuario.

- `seed-menu.js`
  Construye y publica el árbol conversacional en `publishedMenus/main`.

- `package.json`
  Define dependencias y script de arranque.

- `AGENTS.md`
  Documento de gobierno operativo del proyecto en este workspace. Define prioridades de arquitectura, portabilidad y disciplina conversacional.

## Cómo Funciona

1. Google Chat envía un `POST /chat`.
2. El backend normaliza el mensaje recibido.
3. Lee el menú desde `publishedMenus/main`.
4. Recupera o crea la sesión del usuario en `chatSessions`.
5. Resuelve navegación por número, texto completo o fragmento.
6. Responde con el siguiente menú o con una hoja terminal.

## Modelo Conversacional

El árbol del menú se publica en Firestore como un mapa de nodos.

Tipos de nodo observados:

- `menu`
- `leaf`
- `audience_option`

El flujo actual comienza con un selector de audiencia:

- `prepa`
- `universidad`
- `ambas`

Después de eso, el usuario navega por menús numerados y puede usar comandos globales.

## Comandos Globales

El backend actual reconoce:

- `ayuda`
- `inicio`
- `menú`
- `menu`
- `menus`
- `volver`
- `reiniciar`

También interpreta como arranque:

- `hola`
- `start`
- evento `ADDED_TO_SPACE`

## Sesiones

Las sesiones se guardan en `chatSessions`.

Campos observables:

- `audience`
- `currentNodeId`
- `stack`
- `updatedAt`

La expiración actual de sesión es de 5 minutos.

## Fuente De Verdad

La fuente activa confirmada por código es:

```text
publishedMenus/main
```

Importante:

- No asumir que otros documentos o colecciones con nombres parecidos son la fuente activa.
- No asumir que existe una app administrativa mandando sobre el bot productivo solo por convención.
- No asumir que lo más nuevo en nombre es lo que usa producción.

## Levantar Localmente

Requisitos inferidos:

- Node.js compatible con las dependencias instaladas
- `npm install` ejecutado en el repo
- acceso al proyecto correcto de Google Cloud si se quiere usar Firestore real
- credenciales válidas para Firestore si se quiere probar `POST /chat` o publicar menú

Instalación y arranque:

```bash
npm install
npm start
```

También puede arrancarse con:

```bash
node index.js
```

El backend levanta en:

```text
PORT || 8080
```

Health check básico:

```text
GET /
```

Respuesta esperada:

```text
DRAGOTEO está vivo.
```

Qué sí puede confirmarse localmente con evidencia del repo:

- que el proceso Node arranca
- que el entrypoint es `index.js`
- que el servicio intenta escuchar en `PORT || 8080`

Qué no puede operarse completamente sin dependencias externas:

- `POST /chat`, porque depende de Firestore y de que exista `publishedMenus/main`
- publicación del menú, porque `seed-menu.js` escribe directo en Firestore
- validación real de Google Chat, porque la configuración del bot no está en el repo

Error confirmado al intentar publicar sin configuración GCP:

```text
Unable to detect a Project Id in the current environment.
```

## Publicar El Menú

El menú se publica con:

```bash
npm run publish-menu
```

o directamente:

```bash
node seed-menu.js
```

Ese script:

- arma el árbol conversacional en memoria
- escribe `publishedMenus/main`
- reemplaza el documento completo

Antes de ejecutarlo conviene:

- respaldar el documento actual
- validar la estructura del árbol
- confirmar que el cambio corresponde al bot activo

Prerequisitos mínimos para que funcione:

- Project ID resoluble por Google Cloud SDK / ADC
- credenciales con permisos de escritura sobre Firestore
- acceso al proyecto correcto donde vive `publishedMenus/main`

## Despliegue

Este repositorio no incluye scripts o configuración explícita de despliegue para Cloud Run, Firebase o Google Chat.

Con la evidencia disponible, el backend está preparado para un despliegue HTTP simple, compatible con Cloud Run o infraestructura equivalente, pero la configuración real del servicio y del bot en Google Chat debe validarse fuera del repo.

Huecos operativos que siguen fuera del repositorio:

- nombre del servicio real
- proyecto y región de despliegue
- cuenta de servicio usada por el backend
- URL productiva configurada en Google Chat
- comando exacto de despliegue
- procedimiento versionado de rollback

## Portabilidad A WhatsApp

La meta futura es migrar o extender el bot a WhatsApp sin reescribir el corazón del sistema.

Lo que ya ayuda:

- menú modelado como datos en Firestore
- navegación por nodos
- matching textual desacoplable

Lo que hoy sigue acoplado a Google Chat:

- extracción del payload
- construcción del session ID
- manejo del evento `ADDED_TO_SPACE`

## IA Futura

La IA no es el centro del sistema en esta etapa.

La dirección recomendada es:

- mantener el menú como estructura principal
- usar IA solo con base en contenido validado
- evitar respuestas inventadas
- reconducir al menú cuando falte contexto

## Qué Revisar Primero Si Algo Falla

1. `publishedMenus/main`
2. `chatSessions`
3. `index.js`
4. payload entrante desde Google Chat
5. credenciales y acceso a Firestore

## Mayor Riesgo De Continuidad Hoy

La mayor ausencia operativa del repo no es de código, sino de configuración versionada: no hay referencia confirmada al proyecto GCP, al servicio real de Cloud Run ni a la configuración del bot en Google Chat. Eso impide retomar despliegue o validación productiva sin memoria humana o acceso manual a consola.

## Notas De Continuidad

- La lógica del menú vale más que la cosmética.
- No conviene introducir sobrearquitectura mientras el flujo principal siga siendo backend + Firestore + Google Chat.
- Cualquier evolución futura debe proteger:
  - esquema del menú
  - esquema de sesión
  - navegación
  - trazabilidad
  - portabilidad de canal
