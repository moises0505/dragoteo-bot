# DRAGOTEO Risks And Next Steps

## Contradicciones O Tensiones Detectadas

### 1. Estrategia Deseada Vs Implementación Actual

- `AGENTS.md` pide separar núcleo, menú, sesiones y adaptadores de canal.
- El código actual concentra todo en `index.js`.
- No es una contradicción funcional, pero sí una tensión arquitectónica clara.

### 2. Menú Como Fuente De Respuesta Vs Contenido Real

- La navegación está bastante definida.
- Muchas hojas no tienen `response` y caen en un placeholder temporal.
- El sistema disciplina la conversación, pero todavía no entrega suficiente conocimiento aprobado en las hojas.

### 3. Portabilidad A WhatsApp Vs Session ID Actual

- La meta es multi-canal.
- La sesión depende de identificadores de Google Chat.
- Es una deuda concreta para portabilidad futura.

### 4. Gobierno Del Proyecto Vs Estado Del Repo

- `AGENTS.md` es central para operar el proyecto.
- En Git aparece no trackeado.
- Eso crea riesgo de pérdida de contexto de gobierno.

## Riesgos Priorizados

## Riesgo 1: Acoplamiento Fuerte A Google Chat

Impacto:

- dificulta migración a WhatsApp
- vuelve frágil cualquier segundo canal
- mezcla payload del canal con lógica del menú

Dónde se ve:

- `getSessionId(body)`
- extracción de `message.argumentText`
- evento `ADDED_TO_SPACE`

## Riesgo 2: Falta De Validación Del Menú Publicado

Impacto:

- errores editoriales silenciosos
- hijos huérfanos
- nodos inexistentes
- rutas incompletas

Dónde se ve:

- `seed-menu.js` publica sin validación estructural previa
- `index.js` filtra nodos faltantes sin levantar error fuerte

## Riesgo 3: Hojas Sin Respuesta Configurada

Impacto:

- UX incompleta
- percepción de bot “vacío”
- reduce utilidad operativa pese a buena navegación

Dónde se ve:

- `buildLeafMessage()` usa fallback temporal si no hay `response`

## Riesgo 4: Ausencia De Pruebas Automatizadas

Impacto:

- cada cambio en navegación o matching puede romper producción sin aviso

## Riesgo 5: Despliegue Poco Trazable Dentro Del Repo

Impacto:

- cuesta retomar operación meses después
- mayor dependencia de memoria humana o consola manual

## Riesgo 6: Timeout De Sesión Muy Corto

Impacto:

- usuarios reales pueden perder contexto antes de terminar una consulta

## Deuda Técnica Priorizada

### P1

- Extraer adaptador Google Chat de `index.js`
- Formalizar contrato del menú
- Añadir pruebas del runtime

### P2

- Mejorar observabilidad de sesión y navegación
- Hacer publicación del menú más segura
- Reducir lógica “hardcodeada” a `main_menu` y `audience_selector`

### P3

- Diseñar un identificador de sesión multi-canal
- Preparar salida normalizada por canal

## Quick Wins Recomendados

### Quick Win 1

- Añadir validación previa en `seed-menu.js`:
  - nodos duplicados
  - hijos inexistentes
  - tipos inválidos
  - ausencia de `main_menu`
  - ausencia de `audience_selector`

Motivo:

- mejora trazabilidad y reduce errores reales sin sobrearquitectura.

### Quick Win 2

- Agregar pruebas de mesa para:
  - `normalizeText`
  - `scoreMatch`
  - `findMatchingOption`
  - comandos globales

Motivo:

- protege el núcleo del menú con costo bajo.

### Quick Win 3

- Enriquecer primero las hojas más usadas con `response` real.

Motivo:

- mejora UX más que cualquier refactor cosmético.

### Quick Win 4

- Registrar en logs:
  - session ID
  - nodo actual
  - match elegido
  - ambigüedad
  - timeout

Motivo:

- acelera diagnóstico y continuidad operativa.

### Quick Win 5

- Trackear formalmente `AGENTS.md` o mover su contenido a documentación versionada equivalente.

Motivo:

- protege el gobierno del proyecto.

## Plan De Evolución Por Fases

## Fase 1: Proteger Producción Actual

- No cambiar comportamiento conversacional base.
- Documentar contratos de datos.
- Añadir pruebas mínimas.
- Añadir validación del menú.
- Confirmar runbook real de despliegue fuera del repo.

## Fase 2: Fortalecer Menú Y UX Learning

- Priorizar hojas críticas con respuestas reales.
- Revisar labels para reconocimiento sobre memoria.
- Revisar ambigüedades frecuentes.
- Evaluar timeout con evidencia de uso.

## Fase 3: Desacoplar Canal Sin Reescribir Todo

- Introducir una capa mínima de adaptación:
  - entrada normalizada
  - salida normalizada
  - session key abstracta
- Mantener Firestore y menú como están.

## Fase 4: Preparar WhatsApp

- Implementar adaptador WhatsApp sobre el mismo motor.
- Ajustar UX por canal:
  - mensajes más cortos
  - confirmaciones más claras
  - posible reducción de opciones por pantalla

## Fase 5: IA Controlada Por Menú

- Solo sobre hojas con contenido aprobado.
- IA subordinada al nodo actual.
- IA con fallback estricto al menú.

## Pasos Sugeridos Para Facilitar Migración A WhatsApp

1. Separar extracción del payload del resto del runtime.
2. Reemplazar `getSessionId(body)` por una función basada en un contrato multi-canal.
3. Mantener `publishedMenus/main` como árbol central.
4. Convertir render de salida en una función por canal.
5. Definir comandos equivalentes por canal sin romper el comportamiento actual.

## Pasos Sugeridos Para Futura Capa De IA Controlada Por Menú

1. Completar `leaf.response` en nodos prioritarios.
2. Definir qué fuentes son autorizadas para IA.
3. Limitar IA a reexplicar, resumir o clarificar contenido ya aprobado.
4. Obligar a IA a responder dentro del contexto del nodo actual.
5. Mantener siempre rutas de escape:
   - volver
   - inicio
   - menú
   - pedir precisión

## Malas Mejoras O Mejoras Riesgosas

- Migrar ya a una arquitectura compleja con microservicios.
- Introducir LLM libre antes de consolidar contenido de hojas.
- Acoplar más fuerte el árbol a widgets exclusivos de Google Chat.
- Rehacer todo el repo “porque está en un solo archivo” sin primero proteger contratos y navegación.
- Añadir frontend o CMS nuevo sin demostrar que reduce complejidad real.

## Qué Revisar Primero Si Hay Incidencia

1. `publishedMenus/main`
2. `chatSessions`
3. payload entrante del canal
4. nodo actual y `stack`
5. selección de audiencia
6. respuesta de hojas sin contenido
