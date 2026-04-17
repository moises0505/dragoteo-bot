# DRAGOTEO Master Context

## Estado Del Análisis

Este documento se construyó después de leer completo `AGENTS.md`, que en este workspace funciona como instrucción de más alto nivel del proyecto. Su marco rector coincide con la evidencia principal encontrada en el código: proteger la lógica del menú, mantener a Firestore como fuente de verdad, conservar Google Chat como canal actual sin contaminar el núcleo, y preparar el camino para WhatsApp e IA futura sin sobrearquitectura.

### Hechos Confirmados

- El backend activo del bot está concentrado en `index.js`.
- El servicio HTTP usa `express` y escucha en `PORT || 8080`.
- El bot lee el menú en cada solicitud desde `publishedMenus/main`.
- Las sesiones se guardan en `chatSessions`.
- El canal actual esperado es Google Chat, por la forma del payload y por el uso de `body.space.name`, `body.user.name`, `message.argumentText` y `ADDED_TO_SPACE`.
- Existe un script editorial separado, `seed-menu.js`, que publica un árbol completo en `publishedMenus/main`.
- El proyecto visible en este repo no incluye frontend, Dockerfile, `app.yaml`, `firebase.json`, workflow CI, pruebas automatizadas ni scripts de despliegue.

### Inferencias Razonables

- El backend está pensado para ejecutarse en Cloud Run o un runtime HTTP equivalente, porque usa `PORT` y un servidor Express plano.
- El despliegue operativo real depende de configuración externa al repo: credenciales de Google Cloud, despliegue del contenedor o source deploy, y configuración del endpoint en Google Chat.
- `seed-menu.js` cumple el rol de publicación manual/editorial del menú, no de runtime.

### Hipótesis Pendientes De Validación

- Que el servicio efectivamente esté desplegado en Cloud Run hoy.
- Que Google Chat apunte en producción al endpoint `/chat` de este backend.
- Que `seed-menu.js` sea el único mecanismo real de publicación del menú.
- Que no existan índices, reglas o secretos gestionados en otro repo o consola.

## Objetivo Del Producto

DRAGOTEO / DRAGOBOT es un chatbot de Operaciones Académicas y Docentes. Su valor actual no está en contestar libremente, sino en conducir al usuario por un menú conversacional controlado que reduce ambigüedad, facilita reconocimiento de opciones y prepara una futura capa de IA con guardrails. Esa dirección está alineada tanto con `AGENTS.md` como con el código actual.

## Arquitectura Real Observada

### Núcleo Runtime

- `index.js` contiene:
  - normalización de entrada
  - construcción de mensajes de menú
  - matching por número, nombre o fragmento
  - gestión de sesión
  - resolución de navegación
  - respuestas finales para nodos hoja

### Persistencia

- Firestore es la única persistencia observable.
- Colecciones activas observadas:
  - `publishedMenus`
  - `chatSessions`

### Capa Editorial Del Menú

- `seed-menu.js` arma un objeto `nodes` en memoria y lo publica como `publishedMenus/main`.
- El menú sembrado tiene:
  - 27 nodos `menu`
  - 74 nodos `leaf`
  - 3 nodos `audience_option`

### Canal

- Google Chat está acoplado al backend en la extracción del payload y en la estrategia de session ID.
- No existe hoy una capa explícita de adaptadores de canal.

## Flujo Principal Del Bot

1. Google Chat envía un `POST /chat`.
2. El backend normaliza el texto recibido desde `message.argumentText`, `message.text` o `body.text`.
3. Lee `publishedMenus/main`.
4. Resuelve o crea la sesión en `chatSessions` usando `space.name` + `user.name`.
5. Si la sesión expiró, reinicia al nodo raíz.
6. Si el usuario envía un comando global, ejecuta navegación especial.
7. Si es primer contacto, `hola`, `start` o `ADDED_TO_SPACE`, muestra el selector inicial o el menú principal si ya existe audiencia.
8. Si el nodo actual no es `menu`, resetea a raíz o a `main_menu`.
9. Busca coincidencia entre hijos visibles del nodo actual.
10. Si encuentra una opción de audiencia, fija `audience` y pasa a `main_menu`.
11. Si encuentra un nodo `menu`, avanza y apila el nodo en `stack`.
12. Si encuentra un nodo `leaf`, responde con el texto configurado o con fallback temporal.

## Fuente De Verdad Actual

### Confirmado

- La fuente activa del runtime es `publishedMenus/main` porque `index.js` la consulta directamente en cada request.

### No Confirmado

- No hay evidencia en este repo de que `botDrafts/dragoteo-docentes`, `publishedMenus/dragoteo-docentes`, `publishedMenus/{botId}/versions/{versionId}` o `users/{email}` participen en el flujo activo.

## Componentes Críticos

- `index.js`: backend completo del bot.
- `seed-menu.js`: publicación del menú base.
- Firestore:
  - `publishedMenus/main`
  - `chatSessions`
- Configuración externa no visible:
  - credenciales GCP
  - despliegue HTTP
  - enlace del bot de Google Chat al endpoint

## Componentes Secundarios O Experimentales

### Confirmado Ausente En Este Repo

- frontend administrativo
- pipelines CI/CD
- pruebas automáticas
- scripts de deploy
- configuración Firebase Hosting
- reglas o índices Firestore

### Pieza Dudosa

- `AGENTS.md` está presente y fue la guía del análisis, pero `git status --short` lo reporta sin seguimiento. Operativamente es relevante; como artefacto versionado del repo, no está confirmado.

## Mapa De Datos

### `publishedMenus/main`

Documento con forma observable:

- `name`
- `status`
- `version`
- `welcomeMessage`
- `rootNodeId`
- `nodes`

`nodes` es un mapa por ID. Cada nodo observado puede ser:

- `menu`
  - `id`
  - `label`
  - `type: "menu"`
  - `audience`
  - `children: string[]`
- `leaf`
  - `id`
  - `label`
  - `type: "leaf"`
  - `audience`
  - `response` opcional
- `audience_option`
  - `id`
  - `label`
  - `type: "audience_option"`
  - `audience: "both"`
  - `value`

### `chatSessions/{space__user}`

Documento con forma observable:

- `audience: "prepa" | "universidad" | "ambas" | null`
- `currentNodeId: string`
- `stack: string[]`
- `updatedAt: ISO string`

## Mapa De Despliegue

### Confirmado

- La app se levanta con `node index.js`.
- El puerto es configurable por `process.env.PORT`.
- Firestore se inicializa con credenciales por defecto del entorno.

### Inferido Con Alta Confianza

- El backend está listo para Cloud Run o servicio HTTP equivalente.
- El despliegue real requiere al menos:
  - proyecto GCP
  - cuenta de servicio con acceso a Firestore
  - configuración del bot de Google Chat apuntando a `/chat`

### No Visible En El Repo

- Dockerfile
- comandos `gcloud run deploy`
- manifest de Cloud Run
- configuración de Google Chat app
- publicación frontend

## Riesgos Actuales

### Riesgo Alto

- `index.js` mezcla en un solo archivo:
  - adaptador de canal
  - motor de menú
  - persistencia
  - UX textual
  Esto acelera cambios pequeños, pero dificulta migración a WhatsApp y validación aislada.

- El session ID depende de campos de Google Chat (`space.name`, `user.name`). Eso impide reutilizar directamente la sesión en otros canales.

- Las hojas casi no tienen `response` en `seed-menu.js`, así que gran parte del bot termina en un placeholder temporal. La estructura navega bien, pero la capa de contenido está incompleta.

### Riesgo Medio

- No hay cache de menú; cada request lee `publishedMenus/main`. Es simple y correcto para consistencia, pero puede aumentar latencia y dependencia directa de Firestore.

- La expiración de sesión es fija a 5 minutos. Puede ser demasiado agresiva para interacciones reales con menús largos.

- No hay validación explícita de firma/autenticidad del canal en el código visible.

- No hay pruebas automatizadas del flujo de navegación ni del matching.

### Riesgo Bajo Pero Relevante

- `seed-menu.js` hace `set(data)` completo sobre `publishedMenus/main`. Si se usa sin disciplina editorial, puede sobrescribir ajustes manuales del documento.

## Deuda Técnica

### Prioridad 1

- Separar motor de menú, sesión y adaptador Google Chat sin cambiar comportamiento.
- Definir contratos explícitos de entrada y salida de canal.
- Cubrir con pruebas de navegación, matching y comandos globales.

### Prioridad 2

- Formalizar validación del documento `publishedMenus/main`.
- Añadir observabilidad más precisa: session ID, nodo actual, nodo anterior, match elegido, fallback, expiración.
- Convertir `seed-menu.js` en una publicación más segura con validación previa y diff visible.

### Prioridad 3

- Preparar una interfaz de canal normalizada para futuros adaptadores.
- Introducir respuestas reales en hojas prioritarias antes de pensar en IA.

## Prioridades Recomendadas

1. Proteger y probar el flujo actual de menú.
2. Documentar el contrato de `publishedMenus/main` y `chatSessions`.
3. Aislar acoplamientos con Google Chat sin rehacer la app.
4. Endurecer publicación del menú.
5. Mejorar contenido y UX textual de hojas prioritarias.
6. Solo después: preparar integración multi-canal.
7. Mucho después: IA con guardrails sobre el mismo árbol y datos confiables.

## Implicaciones Para Migración A WhatsApp

### Lo Que Ya Ayuda

- El menú está modelado como datos en Firestore.
- La navegación usa tipos de nodo genéricos (`menu`, `leaf`, `audience_option`).
- El matching por texto y número no depende estructuralmente de widgets de Google Chat.

### Lo Que Hoy Estorba

- Extracción del payload y session ID están ligados a Google Chat.
- Las respuestas están diseñadas como texto corrido, no como salida normalizada por canal.
- No existe una capa `channel adapter`.

### Qué Habría Que Aislar Primero

- `getSessionId(body)`
- lectura del texto entrante
- mapeo de eventos de inicio
- formateo de respuesta final
- política de comandos disponibles por canal

## Implicaciones Para IA Futura

### Decisiones Actuales Que Sí Ayudan

- Menú como sistema rector.
- Firestore como fuente explícita.
- Navegación por nodos y contexto de sesión.
- Posibilidad de limitar IA a responder solo dentro de un nodo o sobre contenido respaldado.

### Reglas Recomendadas Para Una IA Posterior

- La IA no debe decidir el árbol de navegación.
- La IA debe recibir:
  - nodo actual
  - audiencia seleccionada
  - historial mínimo
  - contenido aprobado del nodo
- Si no hay base suficiente, debe devolver al menú o pedir precisión.
- La IA no debe inventar contactos, procesos, enlaces o políticas fuera de Firestore o contenido aprobado.

## Qué Revisar Primero Si Algo Falla

1. `publishedMenus/main` existe y tiene `rootNodeId` y `nodes`.
2. El endpoint `/chat` está recibiendo el payload esperado del canal.
3. El backend tiene acceso a Firestore.
4. Se está creando o leyendo correctamente `chatSessions`.
5. El texto entrante realmente llega en `message.argumentText`, `message.text` o `body.text`.
6. El nodo actual existe y sus `children` apuntan a nodos válidos.

## Si Mañana Hubiera Que Retomar Dragoteo Desde Cero Operativo

### A. Checklist De Diagnóstico Rápido

- Confirmar que el endpoint HTTP responde `DRAGOTEO está vivo.` en `/`.
- Confirmar que Google Chat sigue apuntando al backend correcto.
- Leer `publishedMenus/main` y verificar `rootNodeId`, `status`, `version` y `nodes`.
- Revisar si se crean documentos en `chatSessions` al enviar mensajes reales.
- Probar `hola`, `ayuda`, `menú`, `volver`, `inicio`, `reiniciar`.
- Verificar que el selector inicial de audiencia siga funcionando.

### B. Checklist Antes De Tocar Producción

- Identificar si el cambio afecta:
  - runtime
  - menú publicado
  - sesiones
  - canal
- Confirmar que no se está asumiendo una fuente distinta de `publishedMenus/main`.
- Separar cambio de código de cambio editorial de menú.
- Preparar prueba manual en Google Chat con casos reales.

### C. Checklist Antes De Cambiar Firestore

- Respaldar o exportar el documento actual `publishedMenus/main`.
- Verificar impacto sobre `rootNodeId`, `nodes`, `children`, `audience` y `type`.
- Revisar que ningún `children[]` apunte a IDs inexistentes.
- Confirmar que el cambio no rompe comandos globales ni navegación por `stack`.
- Validar impacto sobre futura portabilidad a WhatsApp.

### D. Checklist Antes De Desplegar

- Ejecutar arranque local con `npm start` o `node index.js`.
- Verificar que el servicio levanta en `PORT`.
- Validar credenciales de Firestore en el entorno objetivo.
- Confirmar si el deploy es solo de backend, solo de datos o ambos.
- Preparar rollback: versión previa del código y copia del menú publicado.

### E. Checklist Después De Desplegar

- Probar conversación nueva desde Google Chat.
- Probar reentrada con sesión existente.
- Probar expiración o reset manual con `reiniciar`.
- Revisar logs del backend para errores de Firestore y payload.
- Confirmar que el bot sigue leyendo `publishedMenus/main` y no otra fuente.
