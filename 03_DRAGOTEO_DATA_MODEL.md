# DRAGOTEO Data Model

## Resumen

Con la evidencia disponible, Firestore es la única fuente de verdad operativa del bot. El runtime solo usa dos rutas de datos:

- `publishedMenus/main`
- `chatSessions/{sessionId}`

No hay evidencia en este repo de colecciones adicionales activas en producción.

## Mapa De Colecciones Y Documentos

## `publishedMenus`

### Documento Confirmado En Uso

- `publishedMenus/main`

### Rol

- Fuente de verdad del árbol conversacional que el runtime consume en cada solicitud.

### Escritura Confirmada

- `seed-menu.js` hace `set(data)` sobre `publishedMenus/main`.

### Lectura Confirmada

- `index.js` hace `get()` sobre `publishedMenus/main`.

## `chatSessions`

### Documento Confirmado En Uso

- `chatSessions/{space.name}__{user.name}`

### Rol

- Persistencia del estado conversacional por usuario y espacio.

### Lectura/Escritura Confirmada

- `index.js` hace `get()` y `set(..., { merge: true })`.

## Esquema Observable De `publishedMenus/main`

```json
{
  "name": "DRAGOTEO",
  "status": "published",
  "version": 2,
  "welcomeMessage": "Hola, soy DRAGOTEO. Vamos a ubicar tu duda paso a paso.",
  "rootNodeId": "audience_selector",
  "nodes": {
    "node_id": {
      "id": "node_id",
      "label": "Texto visible",
      "type": "menu | leaf | audience_option",
      "audience": "both | prepa | universidad",
      "children": ["child1", "child2"],
      "value": "prepa | universidad | ambas",
      "response": "texto opcional"
    }
  }
}
```

## Tipos De Nodo Confirmados

### `menu`

- Campos observados:
  - `id`
  - `label`
  - `type: "menu"`
  - `audience`
  - `children`

### `leaf`

- Campos observados:
  - `id`
  - `label`
  - `type: "leaf"`
  - `audience`
  - `response` opcional

### `audience_option`

- Campos observados:
  - `id`
  - `label`
  - `type: "audience_option"`
  - `audience: "both"`
  - `value`

## Contratos De Datos Que Deben Preservarse

### Contrato 1: Existencia De `rootNodeId`

- El runtime asume que existe `rootNodeId`.
- Si no existe, usa fallback a `"audience_selector"`.
- Si el documento cambia de estructura, el bot puede degradarse.

### Contrato 2: `nodes` Como Mapa Por ID

- El runtime resuelve hijos con `nodes[id]`.
- No espera arrays de nodos ni estructuras anidadas complejas.

### Contrato 3: `children` Referencia IDs Existentes

- Si un `children[]` apunta a un ID inexistente, `getVisibleChildren()` lo filtra silenciosamente.
- Eso evita crash, pero puede ocultar errores editoriales.

### Contrato 4: Valores De `type`

- Solo hay comportamiento para:
  - `menu`
  - `leaf`
  - `audience_option`

### Contrato 5: Valores De `audience`

- El sistema observable usa:
  - `both`
  - `prepa`
  - `universidad`
- A nivel de sesión también aparece:
  - `ambas`

### Contrato 6: `chatSessions`

- La sesión debe conservar:
  - `audience`
  - `currentNodeId`
  - `stack`
  - `updatedAt`

## Relaciones

### `publishedMenus/main` -> `nodes`

- Relación lógica de árbol por referencia.

### `chatSessions` -> `publishedMenus/main`

- La sesión apunta a nodos del menú por `currentNodeId` y por IDs apilados en `stack`.
- No hay referencia materializada de documento a documento; la relación es por contrato lógico.

## Zonas Ambiguas

### Ambigüedad 1

- No hay esquema formal ni validación del documento `publishedMenus/main`.

### Ambigüedad 2

- No está documentado en código si `version` se usa para algo más que trazabilidad editorial.

### Ambigüedad 3

- `welcomeMessage` existe en datos sembrados, pero el runtime no la usa directamente.

### Ambigüedad 4

- No sabemos si existen colecciones paralelas de borradores o administración en otro repo o proyecto GCP.

## Riesgos De Consistencia

### Riesgo Alto

- `seed-menu.js` sobrescribe el documento completo con `set(data)`.
- Si el documento contiene metadatos agregados manualmente, se perderían.

### Riesgo Medio

- `children` inválidos no fallan fuerte; el error puede pasar desapercibido.

### Riesgo Medio

- `stack` puede quedar inconsistente con cambios editoriales del menú si se elimina o renombra un nodo mientras existen sesiones activas.

### Riesgo Medio

- `currentNodeId` puede apuntar a un nodo no `menu`; el runtime lo corrige, pero esa autocorrección es síntoma de inconsistencia.

## Observaciones Para Futura IA

- La IA futura debería consumir contenido aprobado asociado a nodos, no inferir rutas fuera del árbol.
- `leaf.response` es el lugar natural para contenido confiable.
- Si se incorpora IA, conviene extender el modelo con campos explícitos y pequeños, por ejemplo:
  - `summary`
  - `approvedContent`
  - `fallbackText`
  - `handoffPolicy`
- Mala idea: guardar prompts libres o instrucciones generativas mezcladas con el árbol sin contrato claro.

## Observaciones Para Multi-Canal

- El árbol y el filtrado por audiencia son reutilizables.
- `chatSessions` no es multi-canal todavía porque el ID depende del payload Google Chat.
- Para soportar WhatsApp sin romper producción, el contrato debería migrar a algo como:
  - `channel`
  - `conversationId`
  - `userId`
  - `sessionKey`

## Datos Productivos, Editoriales Y Residuales

### Productivo Confirmado

- `publishedMenus/main`
- `chatSessions`

### Editorial Confirmado

- `seed-menu.js` como fuente de construcción del menú a publicar

### Residual O Histórico

- No hay evidencia suficiente en este repo para clasificar otras colecciones porque no aparecen en el código.

## Validaciones Recomendadas Antes De Cambiar Datos

1. Verificar que `rootNodeId` exista como nodo.
2. Verificar que todos los `children[]` existan.
3. Verificar que todos los nodos tengan `type` válido.
4. Verificar que `audience` esté dentro del conjunto esperado.
5. Verificar que `main_menu` exista si el runtime lo sigue referenciando directamente.
6. Verificar que `audience_selector` exista o actualizar el fallback del runtime.
