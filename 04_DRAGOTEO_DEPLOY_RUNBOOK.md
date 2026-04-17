# DRAGOTEO Deploy Runbook

## Nivel De Certeza

Este runbook mezcla:

- hechos confirmados por el repo
- inferencias de alta confianza
- huecos explícitos de evidencia

No hay scripts de despliegue ni configuración de infraestructura dentro del repositorio, así que cualquier paso de publicación a Cloud Run, Google Chat o Firebase debe tratarse como pendiente de validación operacional.

## Cómo Levantar Localmente

### Requisitos Inferidos

- Node.js compatible con `express@5` y `@google-cloud/firestore@8`
- Acceso a Firestore del proyecto correcto
- Credenciales GCP disponibles por ADC o entorno equivalente

### Comandos Confirmados

```bash
npm install
npm start
```

`package.json` solo define:

```bash
npm start
```

que ejecuta:

```bash
node index.js
```

### Comportamiento Esperado

- El backend escucha en `process.env.PORT` o `8080`.
- `GET /` responde `"DRAGOTEO está vivo."`

## Cómo Publicar Menú / Datos

### Hecho Confirmado

Existe un script editorial:

```bash
node seed-menu.js
```

### Qué Hace

- Construye el árbol de menú en memoria.
- Escribe `publishedMenus/main`.
- Sobrescribe el documento completo con `set(data)`.

### Precauciones Antes De Ejecutarlo

- Respaldar el documento actual `publishedMenus/main`.
- Confirmar que el cambio deseado corresponde al bot activo.
- Revisar impacto en sesiones vivas si cambian IDs de nodos.
- No asumir que cambiar `seed-menu.js` y correrlo equivale a desplegar backend.

## Cómo Desplegar Backend

### Confirmado En El Repo

- No existen comandos versionados para despliegue.
- No hay Dockerfile.
- No hay configuración Firebase o Cloud Run.

### Inferencia De Alta Confianza

El backend está diseñado para un despliegue HTTP simple, compatible con Cloud Run. Un flujo razonable sería:

1. Tener acceso al proyecto GCP correcto.
2. Desplegar el código Node.js como servicio HTTP.
3. Garantizar acceso a Firestore.
4. Configurar Google Chat para llamar a `/chat`.

### Comandos Reales Encontrados O Inferidos Con Alta Confianza

Confirmados:

```bash
npm start
node index.js
node seed-menu.js
```

Inferidos con alta confianza, pero no confirmados por archivos del repo:

```bash
gcloud run deploy ...
```

No se documenta el comando exacto porque no existe evidencia local suficiente para fijar:

- nombre del servicio
- región
- proyecto
- estrategia build vs source deploy
- cuenta de servicio

## Cómo Actualizar Frontend Si Existe

### Evidencia Local

- No hay frontend en este repositorio.

### Implicación Operativa

- Si existe app administrativa, vive en otro repo o fuera del árbol visible.
- No mezclar despliegue de backend del bot con despliegue de un frontend no confirmado.

## Cómo Validar Que El Bot Activo Sigue Apuntando A La Fuente Correcta

1. Leer `publishedMenus/main` en Firestore y verificar:
   - `status`
   - `version`
   - `rootNodeId`
   - nodos esperados
2. Enviar un mensaje real al bot y verificar:
   - selector de audiencia
   - menú principal
   - navegación a una hoja conocida
3. Confirmar en logs que el backend no responde `No encontré el menú publicado.`
4. Revisar que se escriban sesiones en `chatSessions`.
5. No asumir que otra colección o documento más “nuevo” sea el activo si el runtime sigue leyendo `publishedMenus/main`.

## Separación Operativa Recomendada

### 1. Cambio De Código

- `index.js`
- `package.json`

### 2. Cambio Editorial De Menú

- `seed-menu.js`
- ejecución de `node seed-menu.js`

### 3. Infraestructura

- despliegue del servicio HTTP
- credenciales
- configuración del bot en Google Chat

### 4. Validación En Canal Real

- pruebas manuales en Google Chat

## Qué Parte Del Despliegue Es Específica De Google Chat

- El webhook o endpoint configurado en la app de Google Chat
- El payload esperado por `index.js`
- La estrategia de session ID basada en `space.name` y `user.name`
- El manejo del evento `ADDED_TO_SPACE`

## Qué Parte Sería Reutilizable Para WhatsApp

- Servicio HTTP base
- Firestore
- documento `publishedMenus/main`
- navegación por nodos
- matching textual
- persistencia del estado de sesión, si se abstrae el identificador

## Validación Manual Mínima Después De Cualquier Cambio

1. `GET /` responde correctamente.
2. `hola` muestra selector o menú principal según estado.
3. Selección de audiencia funciona.
4. `menú`, `inicio`, `volver`, `reiniciar`, `ayuda` funcionan.
5. Una opción por número navega bien.
6. Una opción por texto parcial navega bien.
7. Una opción ambigua devuelve sugerencias.
8. La sesión persiste en `chatSessions`.

## Rollback

### Código

- Volver a la versión anterior del servicio.

### Datos

- Restaurar copia previa de `publishedMenus/main`.

### Canal

- Confirmar que Google Chat siga apuntando al servicio correcto si hubo cambio de URL o revisión.

## Qué Revisar Primero Si El Despliegue Falla

1. Credenciales de Firestore.
2. Disponibilidad del servicio HTTP.
3. URL configurada en Google Chat.
4. Existencia del documento `publishedMenus/main`.
5. Logs del backend para errores en `POST /chat`.
