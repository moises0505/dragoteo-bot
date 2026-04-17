# DRAGOTEO Runtime Flow

## Resumen Operativo

El runtime actual es un único servicio Express que recibe mensajes en `POST /chat`, consulta el menú publicado en Firestore, recupera o crea una sesión y devuelve texto plano con navegación guiada. La lógica conversacional principal sí está centralizada en el menú, pero convive en el mismo archivo con detalles específicos de Google Chat.

## Handler HTTP Confirmado

### `GET /`

- Responde `"DRAGOTEO está vivo."`
- Sirve como health check básico.

### `POST /chat`

- Es el endpoint central del bot.
- Realiza todo el flujo de entrada, navegación, persistencia y respuesta.

## Flujo Narrado Completo

1. Llega el payload a `POST /chat`.
2. El backend toma:
   - `body.type` o `body.eventType` como tipo de evento
   - `message.argumentText`, `message.text` o `body.text` como texto entrante
3. `normalizeText()`:
   - pasa a minúsculas
   - elimina menciones tipo `@usuario`
   - remueve acentos
   - limpia puntuación
   - compacta espacios
4. Lee `publishedMenus/main` desde Firestore.
5. Si el documento no existe, responde `No encontré el menú publicado.`
6. Construye `sessionId` con `space.name` + `user.name`.
7. Busca `chatSessions/{sessionId}`.
8. Si no existe sesión, crea una sesión por defecto:
   - `audience: null`
   - `currentNodeId: rootNodeId`
   - `stack: []`
   - `updatedAt: now`
9. Si existe y expiró por más de 5 minutos, reinicia desde raíz y avisa al usuario.
10. Si el usuario mandó un comando global, ejecuta la rama correspondiente.
11. Si el evento es de entrada inicial o saludo, muestra el selector de audiencia o el menú principal.
12. Obtiene el nodo actual.
13. Si el nodo actual no es `menu`, normaliza el estado y regresa a raíz o `main_menu`.
14. Obtiene hijos visibles del nodo actual según `audience`.
15. Aplica matching contra la entrada del usuario.
16. Si el matching es ambiguo, ofrece sugerencias.
17. Si no hay matching, vuelve a renderizar el menú actual.
18. Si la coincidencia es de tipo `audience_option`, fija audiencia y entra a `main_menu`.
19. Si es `menu`, avanza y actualiza `stack`.
20. Si es `leaf`, responde con el contenido de la hoja o fallback temporal.

## Funciones Núcleo

### Normalización

- `normalizeText(text)`
  - Reduce variaciones de captura del usuario.
  - Es portable a otros canales.

### Sesión

- `getSessionId(body)`
  - Acoplamiento fuerte a Google Chat.
- `createDefaultSession(rootNodeId)`
- `isSessionExpired(updatedAt)`

### Navegación

- `getNode(nodes, id)`
- `isVisibleForAudience(nodeAudience, selectedAudience)`
- `getVisibleChildren(node, nodes, selectedAudience)`

### Presentación

- `buildMenuMessage(title, children, selectedAudience)`
- `buildLeafMessage(node, selectedAudience)`

### Matching

- `scoreMatch(input, label)`
- `findMatchingOption(userText, children)`

## Comandos Globales Confirmados

- `ayuda`
- `reiniciar`
- `inicio`
- `menu`
- `menus`
- `menú`
- `volver`
- activadores de inicio:
  - `ADDED_TO_SPACE`
  - mensaje vacío
  - `hola`
  - `start`

## Reglas De Navegación

### Inicio

- Si no hay audiencia elegida, el bot muestra `audience_selector`.
- Si ya hay audiencia guardada y llega saludo/inicio, lleva a `main_menu`.

### Selección De Audiencia

- Las opciones son:
  - `prepa`
  - `universidad`
  - `ambas`
- Al seleccionar una:
  - guarda `session.audience`
  - fija `currentNodeId = "main_menu"`
  - inicializa `stack = ["main_menu"]`

### Avance En Menús

- Cuando el usuario selecciona un nodo `menu`:
  - `currentNodeId = matched.id`
  - `stack.push(matched.id)`

### Retroceso

- `volver`
  - si hay profundidad mayor a 1, hace `pop`
  - si no, vuelve a `main_menu` o a raíz

### Menú Actual

- `menu`, `menus`, `menú`
  - re-renderiza el nodo actual

### Reinicio Total

- `reiniciar`
  - borra estado lógico de conversación
  - regresa a raíz sin audiencia

### Inicio

- `inicio`
  - si ya hay audiencia, va a `main_menu`
  - si no, vuelve al selector inicial

## Matching De Opciones

### Prioridad Del Matching

1. Número exacto visible en el menú.
2. Coincidencia exacta del texto normalizado.
3. El label comienza con el texto del usuario.
4. El texto del usuario comienza con el label.
5. El label contiene el texto.
6. Solapamiento parcial por tokens.

### Ambigüedad

- Si las dos mejores opciones empatan y no tienen score 100, el bot no decide.
- Devuelve hasta tres sugerencias.

### No Match

- Informa que no encontró la opción en la sección actual.
- Repite el menú actual.

## Sesiones

### Colección

- `chatSessions`

### ID De Documento

- `${space.name}__${user.name}`

### Campos Observados

- `audience`
- `currentNodeId`
- `stack`
- `updatedAt`

### Timeout

- 5 minutos exactos.
- Si expira:
  - reinicia la sesión
  - informa al usuario
  - devuelve al nodo raíz

## Errores Y Fallbacks

### Menú No Publicado

- Respuesta: `No encontré el menú publicado.`

### Nodo Actual Inválido

- Si `currentNodeId` apunta a un nodo no `menu`, el runtime se autocorrige y vuelve a raíz o `main_menu`.

### Tipo De Nodo Sin Acción

- Respuesta: `La opción seleccionada no tiene una acción válida.`

### Error General

- Hace `console.error(error)`.
- Devuelve: `Ocurrió un error al procesar tu solicitud.`

## Puntos De Acoplamiento Con Google Chat

### Entrada

- `body.space.name`
- `body.user.name`
- `body.message.argumentText`
- `body.message.text`
- `body.type`
- `body.eventType`
- `ADDED_TO_SPACE`

### Sesión

- El session ID depende de identificadores propios del canal actual.

### Semántica De Inicio

- La lógica interpreta un evento específico de alta al espacio.

## Qué Ya Es Relativamente Agnóstico Del Canal

- Modelo de nodos
- navegación por árbol
- `audience`
- `stack`
- matching textual
- timeout de sesión
- render básico en texto

## Oportunidades De Desacoplamiento Para WhatsApp

### Primera Capa A Extraer

- `extractIncomingEvent(body)`
- `extractUserText(body)`
- `buildSessionKey(channelPayload)`
- `formatOutgoingMessage(state, node, visibleChildren)`

### Segunda Capa

- un contrato normalizado tipo:
  - `channel`
  - `conversationId`
  - `userId`
  - `messageText`
  - `eventType`

### Tercera Capa

- políticas de UX por canal:
  - límites de longitud
  - uso de listas numeradas
  - botones rápidos cuando el canal lo permita

## Recomendaciones De UX Learning

- Mantener números visibles en todos los menús.
- Conservar comandos globales cortos y consistentes.
- Reducir la carga cognitiva en hojas largas incorporando, cuando exista contenido real:
  - siguiente paso
  - contacto
  - opción de volver
- Revisar si 5 minutos de timeout es adecuado para usuarios reales.
- En ambigüedad, además de sugerencias, conviene mantener el contexto visible del menú actual.
