# AGENTS.md — DRAGOTEO / DRAGOBOT

## Identidad del proyecto
DRAGOBOT / DRAGOTEO es un chatbot orientado a Operaciones Académicas y Docentes.

Actualmente opera en Google Chat, pero debe diseñarse de forma que pueda migrarse o extenderse con la menor fricción posible a otros canales, especialmente WhatsApp.

## Estado estratégico actual
La prioridad actual no es hacer que una IA responda libremente, sino construir un sistema de menú conversacional sólido, claro, mantenible y controlado.

El menú existe para:
- delimitar el espacio de respuesta
- reducir ambigüedad
- evitar respuestas inventadas
- preparar la futura incorporación de IA con guardrails claros

## Prioridad actual
La parte más estable y prioritaria del proyecto es:
- Backend del bot en Cloud Run
- Firestore como fuente de verdad
- Google Chat como canal principal
- Lógica del menú conversacional
- Gestión de sesiones

## Fuente de verdad actual
Salvo evidencia directa en código o configuración, asumir como fuente activa del bot:
- `publishedMenus/main`

## Sesiones
La colección principal de sesiones es:
- `chatSessions`

## Principio rector
Proteger y fortalecer la lógica conversacional del menú.

Toda decisión técnica debe favorecer:
- claridad
- mínima complejidad necesaria
- portabilidad entre canales
- armonía arquitectónica
- mantenibilidad
- buena experiencia de usuario

## Arquitectura objetivo
El sistema debe evolucionar con separación clara entre:
1. núcleo conversacional
2. motor del menú
3. gestión de sesiones
4. adaptadores de canal
5. capa futura de IA
6. persistencia

### Regla crítica
Google Chat no debe contaminar el núcleo del sistema.

Toda lógica que pueda ser agnóstica del canal debe permanecer agnóstica del canal.

## Meta de migración futura
El sistema debe poder migrarse o extenderse a WhatsApp sin reescribir el corazón del bot.

Por ello:
- no acoplar la lógica del menú a formatos exclusivos de Google Chat
- no depender estructuralmente de widgets o interacciones propias de un solo canal
- diseñar entradas y salidas normalizadas
- tratar Google Chat como adaptador actual y WhatsApp como adaptador futuro

## IA futura: política obligatoria
En el futuro se incorporará inteligencia artificial para las respuestas, pero hoy la estructura principal debe seguir siendo el menú.

### Reglas para IA
- La IA no debe reemplazar prematuramente la lógica del menú.
- La IA debe operar con restricciones claras.
- La IA no debe inventar procesos, rutas, políticas, nombres, catálogos, enlaces ni estados del sistema.
- Si la IA no tiene base suficiente, debe reconducir al menú, pedir precisión o usar un fallback controlado.
- El menú actual es el mecanismo principal para reducir alucinaciones.
- No diseñar ahora una capa de IA sobredimensionada si todavía no se necesita.

## Archivos clave a revisar primero
Antes de cualquier cambio, revisar en este orden:
1. `index.js`
2. `package.json`
3. accesos a Firestore
4. handlers de Google Chat
5. referencias a `publishedMenus/main`
6. referencias a `chatSessions`
7. scripts de despliegue
8. configuraciones de Firebase / Cloud Run

## No asumir sin verificar
No asumir automáticamente que estos elementos son la fuente activa del bot:
- `botDrafts/dragoteo-docentes`
- `publishedMenus/dragoteo-docentes`
- `publishedMenus/{botId}/versions/{versionId}`
- `users/{email}`

No asumir que la app administrativa web es el centro del sistema, salvo que el código activo lo confirme.

No asumir que el documento con nombre más nuevo o más largo es el que usa producción.

No asumir que una estructura diseñada para Google Chat funcionará igual en WhatsApp sin adaptación.

## Regla de trabajo
Distinguir siempre entre:
- hechos confirmados por evidencia
- inferencias razonables
- hipótesis pendientes

## Regla anti-sobrecódigo
No agregar código, archivos, helpers, wrappers, servicios, documentos o configuraciones de más.

Solo se permite crear nuevas piezas si:
- reducen complejidad real
- mejoran portabilidad
- reducen duplicación relevante
- fortalecen mantenibilidad
- aíslan mejor la lógica del canal
- mejoran la trazabilidad del sistema

Evitar:
- abstracciones prematuras
- refactors cosméticos
- documentación inflada
- duplicación de lógica
- estructura “enterprise” innecesaria
- carpetas o archivos nuevos sin beneficio real

## Regla de armonización
Todo cambio debe armonizar con el sistema existente.

Nunca:
- arreglar una parte rompiendo otra
- mejorar UX rompiendo trazabilidad
- mejorar estructura rompiendo despliegue
- mejorar velocidad rompiendo claridad
- cambiar nombres sin coherencia con la nomenclatura existente

## UX Learning: principios obligatorios
Toda propuesta de mejora debe considerar principios de UX Learning, especialmente:
- reducir carga cognitiva
- hacer visibles las opciones
- favorecer reconocimiento sobre memoria
- ofrecer progresión clara paso a paso
- dar feedback inmediato
- permitir volver, reiniciar y retomar contexto fácilmente
- minimizar ambigüedad
- anticipar errores comunes de interacción
- redactar opciones comprensibles para usuarios reales
- proponer mejoras de interacción antes que mejoras cosméticas

## Proactividad esperada del agente
El agente debe ser proactivo, super organizado y orientado a continuidad.

Debe proponer mejoras en:
- estructura del menú
- claridad de opciones
- flujo conversacional
- mensajes de ayuda
- manejo de errores
- recuperación de contexto
- portabilidad futura a WhatsApp
- inserción futura y segura de IA
- orden del repositorio
- despliegue y continuidad operativa

## Perfil esperado del agente
Actuar como experto en:
- Firebase
- Firestore
- Git
- despliegues
- chatbots
- Google Chat
- WhatsApp
- arquitectura conversacional
- UX Learning
- documentación técnica útil

## Política de cambios
- No hacer cambios destructivos sin justificación explícita.
- No refactorizar por estética.
- No mover la fuente de verdad sin confirmar impacto.
- No tocar producción sin revisar el flujo real de despliegue.
- No borrar restos/legacy sin documentarlos primero.
- No introducir acoplamientos que dificulten la migración futura a WhatsApp.
- No construir una capa de IA prematura que complique el menú actual.

## Contratos que deben protegerse
Siempre identificar y preservar:
- esquema del menú
- esquema de sesión
- comandos globales
- flujo de navegación
- publicación del menú activo
- contratos de entrada por canal
- contratos de salida por canal

## Documentación obligatoria
Cuando se analice o modifique el proyecto, documentar:
- qué archivo se tocó
- por qué
- impacto esperado
- riesgos
- validación realizada
- pasos de despliegue necesarios
- impacto sobre el menú
- impacto sobre la futura migración a WhatsApp
- impacto sobre la futura capa de IA

## Política de pruebas
Todo cambio debe validarse contra:
- selección de contexto
- navegación del menú
- coincidencia por texto / fragmento / número
- comandos `ayuda`, `inicio`, `menú`, `volver`, `reiniciar`
- persistencia y recuperación de sesión
- compatibilidad con `publishedMenus/main`
- impacto en despliegue
- impacto en futura migración de canal

## Observabilidad
Preservar o mejorar:
- logs útiles
- trazabilidad de sesión
- identificación de nodo actual
- identificación de fallback
- claridad de errores
- capacidad de diagnóstico rápido

## Despliegue: separación obligatoria
Separar claramente:
1. cambios de código en Git
2. despliegue de frontend en Firebase Hosting, si aplica
3. despliegue de reglas/índices de Firestore, si aplica
4. despliegue del backend real del bot en Cloud Run
5. validación posterior en el canal real

## Flujo recomendado de operación
1. revisar contexto y archivos clave
2. editar solo lo necesario
3. validar
4. documentar
5. commit/push
6. desplegar únicamente lo que realmente cambió
7. probar bot real en Google Chat
8. revisar logs/sesiones si falla

## Definición de terminado
Un cambio no está terminado si no se sabe:
- qué tocó
- por qué
- cómo probarlo
- cómo desplegarlo
- cómo revertirlo
- cómo impacta al menú
- cómo impacta a la futura migración a WhatsApp
- cómo impacta a la futura capa de IA

## Comandos operativos mínimos

### Git
```bash
git status
git pull --rebase origin main
git add .
git commit -m "mensaje"
git push origin main