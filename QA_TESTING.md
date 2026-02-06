# Plan de Pruebas QA - AltiTeam

## Tabla de Contenidos

1. [Cómo Realizar las Pruebas](#cómo-realizar-las-pruebas)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Pruebas de Autenticación](#pruebas-de-autenticación)
4. [Pruebas de Gestión de Usuarios](#pruebas-de-gestión-de-usuarios)
5. [Pruebas de Organizaciones](#pruebas-de-organizaciones)
6. [Pruebas de Departamentos](#pruebas-de-departamentos)
7. [Pruebas de Proyectos](#pruebas-de-proyectos)
8. [Pruebas de Tareas](#pruebas-de-tareas)
9. [Pruebas de Equipos](#pruebas-de-equipos)
10. [Pruebas de Recursos](#pruebas-de-recursos)
11. [Pruebas de Procesos](#pruebas-de-procesos)
12. [Pruebas de Invitaciones](#pruebas-de-invitaciones)
13. [Pruebas de Notificaciones](#pruebas-de-notificaciones)
14. [Pruebas de Chat](#pruebas-de-chat)
15. [Pruebas de API](#pruebas-de-api)
16. [Pruebas E2E con Playwright](#pruebas-e2e-con-playwright)
17. [Pruebas Unitarias con Jest](#pruebas-unitarias-con-jest)

---

## Cómo Realizar las Pruebas

Esta sección explica paso a paso cómo ejecutar las pruebas de QA en el proyecto AltiTeam.

### 1. Preparación del Entorno de Pruebas

#### 1.1 Iniciar el Servidor de Desarrollo

```bash
# Terminal 1: Iniciar el servidor de desarrollo
cd /home/student/Documentos/dev/alti-team
pnpm dev
```

El servidor estará disponible en: **http://localhost:3000**

#### 1.2 Verificar que el Servidor está Corriendo

```bash
# Verificar con curl
curl -s http://localhost:3000 | head -20

# Verificar endpoint de salud
curl http://localhost:3000/api/health
```

**Resultado esperado:** Respuesta HTML de la página principal o JSON con estado de salud.

---

### 2. Pruebas Manuales con el Navegador

#### 2.1 Acceder a la Aplicación

1. Abrir navegador (Chrome, Firefox, Edge)
2. Navegar a **http://localhost:3000**
3. Verificar que la página carga correctamente

#### 2.2 Usar las Herramientas de Desarrollo del Navegador

**Abrir DevTools:**

- Windows/Linux: `F12` o `Ctrl + Shift + I`
- Mac: `Cmd + Opt + I`

**Pestañas principales para QA:**

| Pestaña         | Uso                                              |
| --------------- | ------------------------------------------------ |
| **Console**     | Ver errores JavaScript, logs de red              |
| **Network**     | Monitorear peticiones HTTP, verificar respuestas |
| **Elements**    | Inspeccionar elementos UI, verificar selectores  |
| **Application** | Ver cookies, local storage, sesiones             |

#### 2.3 Procedimiento Estándar de Prueba Manual

```
PASO 1: Limpiar Estado
├── Cerrar sesión previa
├── Limpiar cookies y cache si es necesario
└── Abrir en incognito/modo privado

PASO 2: Navegar a la Página
├── Escribir URL directamente
└── Verificar carga inicial

PASO 3: Interactuar con la UI
├── Completar formularios
├── Hacer clicks en elementos
└── Verificar respuestas visuales

PASO 4: Verificar Resultados
├── Revisar cambios en la UI
├── Verificar mensajes de éxito/error
└── Revisar Network tab para respuestas API

PASO 5: Documentar
├── Capturar screenshots si hay errores
└── Anotar observaciones
```

---

### 3. Pruebas de API con curl

#### 3.1 Configurar Variables de Entorno

```bash
# Crear archivo de variables para testing
cat > ~/.alti-team-test-env.sh << 'EOF'
export API_URL="http://localhost:3000"
export TEST_EMAIL="qa.test@altiteam.com"
export TEST_PASSWORD="TestPassword123!"
export AUTH_TOKEN="tu-token-aqui"
EOF

# Cargar variables
source ~/.alti-team-test-env.sh
```

#### 3.2 Obtener Token de Autenticación

```bash
# Login para obtener token (si el endpoint lo retorna)
curl -X POST "${API_URL}/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"${TEST_EMAIL}"'",
    "password": "'"${TEST_PASSWORD}"'"
  }' | jq .

# Guardar el token
export AUTH_TOKEN="token-recibido"
```

#### 3.3 Funciones Helper para Pruebas API

```bash
# Crear archivo de funciones helper
cat > ~/api-test-functions.sh << 'EOF'
#!/bin/bash

API_URL="http://localhost:3000"
AUTH_TOKEN=""

set_auth_token() {
  AUTH_TOKEN=$1
}

api_get() {
  local endpoint=$1
  curl -s -X GET "${API_URL}${endpoint}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json"
}

api_post() {
  local endpoint=$1
  local data=$2
  curl -s -X POST "${API_URL}${endpoint}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$data"
}

api_put() {
  local endpoint=$1
  local data=$2
  curl -s -X PUT "${API_URL}${endpoint}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$data"
}

api_delete() {
  local endpoint=$1
  curl -s -X DELETE "${API_URL}${endpoint}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json"
}

# Colorear output
green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }
EOF

# Cargar funciones
source ~/api-test-functions.sh
```

#### 3.4 Ejemplos de Pruebas API

**Registrar nuevo usuario:**

```bash
api_post "/api/auth/register" '{
  "name": "QA Test User",
  "email": "qa.test.'$(date +%s)'@altiteam.com",
  "password": "TestPassword123!"
}'
```

**Crear organización:**

```bash
api_post "/api/organizations" '{
  "name": "QA Test Organization",
  "description": "Organization for QA testing"
}'
```

**Crear proyecto:**

```bash
ORG_ID="id-de-organizacion"
api_post "/api/projects" '{
  "name": "QA Test Project",
  "description": "Project for testing",
  "organizationId": "'${ORG_ID}'"
}'
```

**Crear tarea:**

```bash
PROJECT_ID="id-de-proyecto"
api_post "/api/tasks" '{
  "title": "QA Test Task",
  "description": "Task created during QA testing",
  "projectId": "'${PROJECT_ID}'",
  "priority": "high",
  "status": "pending"
}'
```

---

### 4. Pruebas con Postman/Insomnia

#### 4.1 Importar Colección Postman

Crear archivo `alti-team-tests.postman_collection.json`:

```json
{
  "info": {
    "name": "AltiTeam QA Tests",
    "description": "Collection for QA testing of AltiTeam API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "authToken",
      "value": ""
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{authToken}}"
      }
    ]
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"QA Tester\",\n  \"email\": \"qa-{{$timestamp}}@test.com\",\n  \"password\": \"Test123!\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "register"]
            }
          },
          "response": []
        },
        {
          "name": "Sign In",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@test.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/signin",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "signin"]
            }
          },
          "response": []
        }
      ]
    },
    {
      "name": "Users",
      "item": [
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/users/me",
              "host": ["{{baseUrl}}"],
              "path": ["api", "users", "me"]
            }
          },
          "response": []
        }
      ]
    },
    {
      "name": "Organizations",
      "item": [
        {
          "name": "List Organizations",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/organizations",
              "host": ["{{baseUrl}}"],
              "path": ["api", "organizations"]
            }
          },
          "response": []
        },
        {
          "name": "Create Organization",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"QA Organization {{$timestamp}}\",\n  \"description\": \"Created by QA\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/organizations",
              "host": ["{{baseUrl}}"],
              "path": ["api", "organizations"]
            }
          },
          "response": []
        }
      ]
    },
    {
      "name": "Projects",
      "item": [
        {
          "name": "List Projects",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/projects",
              "host": ["{{baseUrl}}"],
              "path": ["api", "projects"]
            }
          },
          "response": []
        },
        {
          "name": "Create Project",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"QA Project {{$timestamp}}\",\n  \"description\": \"QA Testing\",\n  \"organizationId\": \"org-id-here\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/projects",
              "host": ["{{baseUrl}}"],
              "path": ["api", "projects"]
            }
          },
          "response": []
        }
      ]
    },
    {
      "name": "Tasks",
      "item": [
        {
          "name": "List Tasks",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/tasks",
              "host": ["{{baseUrl}}"],
              "path": ["api", "tasks"]
            }
          },
          "response": []
        },
        {
          "name": "Create Task",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"QA Task {{$timestamp}}\",\n  \"description\": \"Created during testing\",\n  \"projectId\": \"project-id-here\",\n  \"priority\": \"high\",\n  \"status\": \"pending\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/tasks",
              "host": ["{{baseUrl}}"],
              "path": ["api", "tasks"]
            }
          },
          "response": []
        }
      ]
    }
  ]
}
```

**Importar en Postman:**

1. Abrir Postman
2. Click en "Import"
3. Arrastrar archivo JSON o seleccionar
4. Configurar variable `authToken` después de login

---

### 5. Pruebas de Base de Datos (Si aplica)

#### 5.1 Conectar a PostgreSQL (Staging/Producción)

```bash
# Verificar conexión
psql -h localhost -U postgres -d alti_team

# Comandos útiles en psql
\d+                      # Listar tablas
SELECT * FROM users;     # Ver usuarios
SELECT * FROM organizations;  # Ver organizaciones
```

#### 5.2 Scripts de Limpieza de Datos de Prueba

```sql
-- Limpiar datos de prueba (solo en desarrollo/staging)
DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE title LIKE 'QA%');
DELETE FROM tasks WHERE title LIKE 'QA%';
DELETE FROM projects WHERE name LIKE 'QA%';
DELETE FROM organizations WHERE name LIKE 'QA%';
DELETE FROM users WHERE email LIKE 'qa-%@test.com';
```

---

### 6. Documentación de Resultados de Pruebas

#### 6.1 Plantilla de Documentación

```markdown
# Resultado de Sesión de QA

**Fecha:** [YYYY-MM-DD]
**Tester:** [Nombre]
**Entorno:** [Desarrollo/Staging]

## Resumen Ejecutivo

[Descripción general de la sesión]

## Pruebas Realizadas

| ID     | Módulo | Descripción | Estado    | Observaciones |
| ------ | ------ | ----------- | --------- | ------------- |
| TC-XXX | Modulo | Descripcion | PASS/FAIL | Notas         |

## Bugs Encontrados

| ID      | Severidad | Descripción | Pasos para reproducir |
| ------- | --------- | ----------- | --------------------- |
| BUG-001 | Alta      | Descripcion | Pasos...              |

## Screenshots

[Capturas de pantalla de errores]

## Recomendaciones

[Mejoras sugeridas]
```

#### 6.2 Comandos para Captura de Screenshots

```bash
# Con Playwright (script de ejemplo)
cat > ~/screenshot-test.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/auth/signin');
  await page.screenshot({ path: '/tmp/signin-page.png' });

  await page.fill('input[name="email"]', 'test@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.screenshot({ path: '/tmp/form-filled.png' });

  await browser.close();
})();
EOF

node ~/screenshot-test.js
```

---

### 7. Checklist de Verificación por Módulo

#### 7.1 Autenticación

| Verificación                     | Pass | Fail | Notas |
| -------------------------------- | ---- | ---- | ----- |
| Registro con email válido        | ☐    | ☐    |       |
| Registro con email duplicado     | ☐    | ☐    |       |
| Login con credenciales válidas   | ☐    | ☐    |       |
| Login con credenciales inválidas | ☐    | ☐    |       |
| Logout funciona                  | ☐    | ☐    |       |
| Redirección a login sin auth     | ☐    | ☐    |       |

#### 7.2 Organizaciones

| Verificación                | Pass | Fail | Notas |
| --------------------------- | ---- | ---- | ----- |
| Crear organización          | ☐    | ☐    |       |
| Editar organización         | ☐    | ☐    |       |
| Eliminar organización       | ☐    | ☐    |       |
| Ver lista de organizaciones | ☐    | ☐    |       |
| Ver miembros                | ☐    | ☐    |       |
| Asignar rol a miembro       | ☐    | ☐    |       |

#### 7.3 Proyectos

| Verificación              | Pass | Fail | Notas |
| ------------------------- | ---- | ---- | ----- |
| Crear proyecto            | ☐    | ☐    |       |
| Editar proyecto           | ☐    | ☐    |       |
| Eliminar proyecto         | ☐    | ☐    |       |
| Ver detalles de proyecto  | ☐    | ☐    |       |
| Ver tareas del proyecto   | ☐    | ☐    |       |
| Ver recursos del proyecto | ☐    | ☐    |       |
| Acceder a analytics       | ☐    | ☐    |       |

#### 7.4 Tareas

| Verificación          | Pass | Fail | Notas |
| --------------------- | ---- | ---- | ----- |
| Crear tarea           | ☐    | ☐    |       |
| Editar tarea          | ☐    | ☐    |       |
| Eliminar tarea        | ☐    | ☐    |       |
| Agregar comentario    | ☐    | ☐    |       |
| Responder comentario  | ☐    | ☐    |       |
| Filtrar por estado    | ☐    | ☐    |       |
| Filtrar por prioridad | ☐    | ☐    |       |

#### 7.5 Chat

| Verificación            | Pass | Fail | Notas |
| ----------------------- | ---- | ---- | ----- |
| Cargar interfaz de chat | ☐    | ☐    |       |
| Enviar mensaje          | ☐    | ☐    |       |
| Recibir respuesta       | ☐    | ☐    |       |
| Quick prompts visibles  | ☐    | ☐    |       |
| Quick prompts funcionan | ☐    | ☐    |       |
| Auto-scroll funciona    | ☐    | ☐    |       |

---

### 8. Ejecución Guiada de Pruebas

#### 8.1 Sesión de Prueba 1: Autenticación

```bash
# Paso 1: Abrir navegador en blanco
# Paso 2: Navegar a http://localhost:3000/auth/signup
# Paso 3: Completar formulario
# Paso 4: Verificar redirección
# Paso 5: Hacer logout
# Paso 6: Probar login con mismos datos
# Paso 7: Probar login con datos inválidos
# Paso 8: Verificar mensajes de error
```

**Datos de prueba a usar:**

```
Usuario 1: qa-test-1@test.com / TestPass123!
Usuario 2: qa-test-2@test.com / TestPass123!
```

#### 8.2 Sesión de Prueba 2: Flujo Completo de Organización

```bash
# Como Usuario 1:
# 1. Crear organización "QA Org 1"
# 2. Invitar a Usuario 2
# 3. Crear departamento "Desarrollo"
# 4. Crear sub-departamento "Frontend"
#
# Como Usuario 2:
# 1. Aceptar invitación
# 2. Verificar membresía en organización
```

#### 8.3 Sesión de Prueba 3: Proyectos y Tareas

```bash
# En "QA Org 1":
# 1. Crear proyecto "QA Project Alpha"
# 2. Crear tarea "Implementar login"
# 3. Crear tarea "Diseñar dashboard"
# 4. Crear tarea "Configurar API"
# 5. Agregar comentarios a tareas
# 6. Cambiar estados de tareas
# 7. Aplicar filtros
```

#### 8.4 Sesión de Prueba 4: Chat

```bash
# 1. Navegar a /chat
# 2. Verificar elementos de UI
# 3. Probar mensaje simple
# 4. Probar "Show me my tasks"
# 5. Probar "List my organizations"
# 6. Probar "Create a new project"
# 7. Verificar respuestas
```

---

### 9. Comandos Rápidos de Referencia

```bash
# ========================================
# VERIFICACIÓN RÁPIDA DEL ENTORNO
# ========================================

# 1. Verificar servidor
curl -s http://localhost:3000/api/health

# 2. Verificar TypeScript
npx tsc --noEmit

# 3. Verificar lint
pnpm lint

# 4. Ejecutar tests unitarios
pnpm test

# 5. Ejecutar tests E2E
pnpm test:e2e

# 6. Ver reporte E2E
pnpm test:e2e:report

# 7. Build de producción
pnpm build

# ========================================
# PRUEBAS API RÁPIDAS
# ========================================

# Health check
curl http://localhost:3000/api/health

# Register test
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test'$(date +%s)'@test.com","password":"Test123!"}'

# Listar organizaciones (requiere auth)
# Primero obtener token, luego:
curl http://localhost:3000/api/organizations \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 6. Guía Paso a Paso para Realizar Pruebas

Esta sección proporciona instrucciones detalladas para ejecutar cada tipo de prueba.

### 6.1 Pruebas Manuales en el Navegador

#### Preparación Inicial

```bash
# Terminal 1: Iniciar el servidor
cd /home/student/Documentos/dev/alti-team
pnpm dev
```

**Esperar hasta ver:** "Ready on http://localhost:3000"

#### Verificación de Salud del Servidor

```bash
# En otra terminal, verificar que el servidor responde
curl http://localhost:3000/api/health
```

**Respuesta esperada (JSON):**

```json
{ "status": "ok", "timestamp": "..." }
```

#### Prueba Manual 1: Registro de Usuario

1. **Abrir navegador** → Ir a `http://localhost:3000/auth/signup`

2. **Completar formulario:**
   - Name: `QA Tester`
   - Email: `qa.tester.$(date +%s)@test.com` (usar email único)
   - Password: `TestPassword123!`

3. **Click en "Create Account"**

4. **Verificar:**
   - URL cambia a `http://localhost:3000/` o dashboard
   - Usuario está logueado (buscar avatar o nombre en header)
   - No hay mensajes de error

5. **Documentar resultado:**
   - Si pasa: Anotar email usado
   - Si falla: Capturar screenshot, verificar Console en DevTools

#### Prueba Manual 2: Inicio de Sesión

1. **Cerrar sesión** → Click en "Sign Out"

2. **Navegar a** `http://localhost:3000/auth/signin`

3. **Probar credenciales inválidas:**
   - Email: `wrong@test.com`
   - Password: `wrongpassword`
   - Click en "Sign In"
   - Verificar mensaje de error visible

4. **Probar credenciales válidas:**
   - Email: (email del paso anterior)
   - Password: `TestPassword123!`
   - Click en "Sign In"
   - Verificar redirección exitosa

#### Prueba Manual 3: Crear Organización

1. **Estar logueado**

2. **Navegar a** `http://localhost:3000/organizations`

3. **Click en "New Organization"**

4. **Completar:**
   - Name: `QA Org $(date +%Y%m%d)`
   - Description: `Organización creada para pruebas QA`

5. **Click en "Create"**

6. **Verificar:**
   - Organización aparece en la lista
   - Click en organización para ver detalles

#### Prueba Manual 4: Crear Proyecto

1. **Navegar a** `http://localhost:3000/projects`

2. **Click en "New Project"**

3. **Completar:**
   - Name: `QA Project $(date +%Y%m%d)`
   - Description: `Proyecto para pruebas`
   - Status: `active`
   - Start Date: fecha actual
   - End Date: fecha en 1 mes

4. **Click en "Create"**

5. **Verificar:**
   - Proyecto creado exitosamente
   - Redirigido a página del proyecto

#### Prueba Manual 5: Crear Tarea

1. **Navegar a** `http://localhost:3000/tasks`

2. **Click en "New Task"**

3. **Completar:**
   - Title: `QA Task $(date +%H%M%S)`
   - Description: `Tarea de prueba`
   - Priority: `high`
   - Status: `pending`
   - Due Date: fecha actual + 1 semana

4. **Click en "Create"**

5. **Verificar:**
   - Tarea aparece en lista
   - Datos corresponden a los ingresados

#### Prueba Manual 6: Probar el Chat

1. **Navegar a** `http://localhost:3000/chat`

2. **Verificar elementos visibles:**
   - Header "AltiTeam Chat"
   - Área de mensajes
   - Input de texto
   - Quick prompts (botones)

3. **Enviar mensaje:**
   - Escribir: `Hello`
   - Presionar Enter o click en enviar

4. **Esperar respuesta** (3-5 segundos)

5. **Probar quick prompt:**
   - Click en "Show me my tasks"
   - Esperar respuesta
   - Verificar que lista tareas

6. **Probar más prompts:**
   - "List my organizations"
   - "Create a new project"
   - "What tasks are due today?"

---

### 6.2 Pruebas de API con curl

#### Configuración Inicial

```bash
# Crear script de configuración
cat > ~/qa-config.sh << 'EOF'
export API_BASE="http://localhost:3000"
export TEST_EMAIL="qa.$(date +%s)@test.com"
export TEST_PASS="TestPassword123!"
EOF

source ~/qa-config.sh
echo "Configuración cargada. Email de prueba: $TEST_EMAIL"
```

#### Prueba de API 1: Health Check

```bash
# Ejecutar
curl -s $API_BASE/api/health

# Resultado esperado: {"status":"ok","timestamp":"..."}

# Verificar con código de estado
curl -s -o /dev/null -w "%{http_code}" $API_BASE/api/health
# Esperado: 200
```

#### Prueba de API 2: Registrar Usuario

```bash
# Ejecutar registro
curl -s -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "QA Tester",
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASS'"
  }'

echo ""
echo "Código HTTP: $(curl -s -o /dev/null -w '%{http_code}' -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test2@test.com","password":"Test123!"}')"
```

**Interpretación de códigos:**

- `201`: Usuario creado exitosamente
- `400`: Datos inválidos
- `409`: Email ya existe
- `500`: Error del servidor

#### Prueba de API 3: Listar Organizaciones

```bash
# SIN autenticación (esperar 401/redirect)
curl -s -o /dev/null -w "%{http_code}" $API_BASE/api/organizations
# Esperado: 401

# CON autenticación (primero hacer login en navegador, luego copiar cookie o token)
# Opción A: Usar cookie de sesión
curl -s $API_BASE/api/organizations \
  -H "Cookie: next-auth.session-token=tu-token-aqui"

# Opción B: Obtener token si el endpoint lo provee
```

#### Prueba de API 4: Crear Organización

```bash
# Con JSON directamente
curl -s -X POST $API_BASE/api/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-token-aqui" \
  -d '{
    "name": "QA API Organization",
    "description": "Creada via API"
  }' | jq .
```

**Donde `jq` formatea la salida JSON. Si no tienes jq:**

```bash
# Sin jq
curl -s -X POST $API_BASE/api/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"QA Org","description":"Test"}'
```

#### Prueba de API 5: Crear Proyecto

```bash
# Primero obtener ID de organización de la respuesta anterior
ORG_ID="id-que-recibiste"

curl -s -X POST $API_BASE/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-token" \
  -d '{
    "name": "QA API Project",
    "description": "Proyecto creado via API",
    "organizationId": "'$ORG_ID'",
    "status": "active"
  }'
```

#### Prueba de API 6: Crear Tarea

```bash
# Obtener ID de proyecto
PROJECT_ID="id-de-proyecto"

curl -s -X POST $API_BASE/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "QA API Task",
    "description": "Tarea creada via API",
    "projectId": "'$PROJECT_ID'",
    "priority": "high",
    "status": "pending"
  }'
```

#### Prueba de API 7: Verificar Tarea Creada

```bash
# Listar tareas
curl -s $API_BASE/api/tasks?projectId=$PROJECT_ID

# Ver tarea específica
TASK_ID="id-de-tarea"
curl -s $API_BASE/api/tasks/$TASK_ID
```

#### Script de Prueba API Completo

```bash
#!/bin/bash
# Archivo: ~/run-api-tests.sh

API="http://localhost:3000"
echo "=== Pruebas API Automatizadas ==="
echo ""

echo "1. Health Check:"
curl -s $API/api/health | jq .status 2>/dev/null || curl -s $API/api/health
echo ""

echo "2. Registro de usuario:"
RESPONSE=$(curl -s -X POST $API/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test","email":"api-'$RANDOM'@test.com","password":"Test123!"}')
echo $RESPONSE | jq .message 2>/dev/null || echo $RESPONSE
echo ""

echo "3. Listar organizaciones (sin auth):"
CODE=$(curl -s -o /dev/null -w "%{http_code}" $API/api/organizations)
echo "Código HTTP: $CODE (esperado: 401)"
echo ""

echo "=== Pruebas completadas ==="
```

**Ejecutar:**

```bash
chmod +x ~/run-api-tests.sh
~/run-api-tests.sh
```

---

### 6.3 Pruebas con Playwright (Scripted)

#### Script de Prueba Completo

```bash
#!/bin/bash
# Archivo: ~/run-playwright-tests.sh

echo "=== Playwright Manual Tests ==="
echo ""

# Verificar que el servidor está corriendo
echo "1. Verificando servidor..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✓ Servidor funcionando"
else
    echo "✗ Servidor no responde. Ejecutar 'pnpm dev' primero."
    exit 1
fi

echo ""
echo "2. Abriendo navegador con Playwright..."

# Ejecutar script de prueba
node << 'NODEEOF'
const { chromium } = require('playwright');

(async () => {
  console.log('Iniciando navegador...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capturar errores
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('ERROR en consola:', msg.text());
    }
  });

  try {
    // ===== TEST 1: Homepage =====
    console.log('\n[Test 1] Abriendo homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✓ Homepage cargada');

    // ===== TEST 2: Signup =====
    console.log('\n[Test 2] Probando registro...');
    await page.goto('http://localhost:3000/auth/signup');
    const email = `qa.${Date.now()}@test.com`;
    await page.fill('input[name="name"]', 'QA Tester');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    console.log('✓ Registro exitoso, email usado:', email);

    // ===== TEST 3: Organizations =====
    console.log('\n[Test 3] Probando creación de organización...');
    await page.goto('http://localhost:3000/organizations');
    await page.waitForLoadState('networkidle');

    // Click en New Organization si existe botón
    const newOrgBtn = page.locator('text=New Organization').first();
    if (await newOrgBtn.isVisible()) {
      await newOrgBtn.click();
      await page.fill('input[name="name"]', 'QA Playwright Org');
      await page.fill('textarea[name="description"]', 'Org creada via Playwright');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);
      console.log('✓ Organización creada');
    } else {
      console.log('⚠ Botón no encontrado, saltando');
    }

    // ===== TEST 4: Projects =====
    console.log('\n[Test 4] Probando proyectos...');
    await page.goto('http://localhost:3000/projects');
    await page.waitForLoadState('networkidle');
    console.log('✓ Página de proyectos cargada');

    // ===== TEST 5: Tasks =====
    console.log('\n[Test 5] Probando tareas...');
    await page.goto('http://localhost:3000/tasks');
    await page.waitForLoadState('networkidle');
    console.log('✓ Página de tareas cargada');

    // ===== TEST 6: Chat =====
    console.log('\n[Test 6] Probando chat...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForSelector('textarea[placeholder="Type your message..."]');
    console.log('✓ Chat cargado');

    // Enviar mensaje de prueba
    await page.fill('textarea[placeholder="Type your message..."]', 'Test message from Playwright');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(2000);
    console.log('✓ Mensaje enviado');

    console.log('\n=== TODOS LOS TESTS COMPLETADOS ===');

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
NODEEOF

echo ""
echo "=== Playwright Tests Finalizado ==="
```

**Ejecutar:**

```bash
chmod +x ~/run-playwright-tests.sh
~/run-playwright-tests.sh
```

---

### 6.4 Verificación con DevTools

#### Console de Desarrollador

```bash
# Abrir DevTools en el navegador (F12) y verificar:

# 1. Pestaña Console - Buscar errores:
# - Error: "Failed to load resource"
# - Error: "TypeError: ..."
# - Error: "NetworkError"

# 2. Sin errores = PASS
# 3. Con errores = FAIL (documentar)
```

#### Network Tab

```bash
# En DevTools > Network:

# Para cada request verificar:
# 1. Status: 200 = OK, 4xx = Client Error, 5xx = Server Error
# 2. Response: JSON válido
# 3. Timing: < 1s = Bueno, > 3s = Lento
```

#### Elements Tab

```bash
# Verificar elementos esperados:

# 1. Formularios tienen inputs con name/id correcto
# 2. Buttons tienen texto visible
# 3. Links navegan a URLs correctas
# 4. No hay elementos ocultos unexpected
```

---

### 6.5 Flujo de Prueba Completo (Checklist)

```markdown
## Sesión de QA - Flujo Completo

### Pre-requisitos

- [ ] Servidor corriendo en localhost:3000
- [ ] DevTools abierto en otra ventana
- [ ] Terminal lista para comandos curl

### Fase 1: Autenticación

- [ ] TC-AUTH-001: Registro exitoso
- [ ] TC-AUTH-005: Login exitoso
- [ ] TC-AUTH-006: Login con credenciales inválidas
- [ ] TC-AUTH-008: Logout

### Fase 2: Organización

- [ ] TC-ORG-001: Crear organización
- [ ] TC-ORG-002: Editar organización
- [ ] TC-ORG-004: Ver miembros

### Fase 3: Proyectos

- [ ] TC-PROJ-001: Crear proyecto
- [ ] TC-PROJ-004: Ver tareas del proyecto
- [ ] TC-PROJ-007: Acceder a analytics

### Fase 4: Tareas

- [ ] TC-TASK-001: Crear tarea
- [ ] TC-TASK-004: Agregar comentario
- [ ] TC-TASK-008: Filtrar por estado

### Fase 5: Chat

- [ ] TC-CHAT-001: Cargar interfaz
- [ ] TC-CHAT-002: Enviar mensaje
- [ ] TC-CHAT-005: Quick prompts

### Resumen

- Tests Pasados: \_\_\_
- Tests Fallidos: \_\_\_
- Bugs Encontrados: \_\_\_
```

---

### 6.6 Interpretación de Resultados

| Código HTTP | Significado         | Acción                              |
| ----------- | ------------------- | ----------------------------------- |
| 200         | OK                  | Continuar                           |
| 201         | Created             | Guardar ID para siguientes requests |
| 400         | Bad Request         | Verificar datos enviados            |
| 401         | Unauthorized        | Verificar token/auth                |
| 403         | Forbidden           | Verificar permisos                  |
| 404         | Not Found           | Verificar endpoint/ID               |
| 409         | Conflict            | Recurso ya existe                   |
| 500         | Server Error        | Reportar bug                        |
| 502         | Bad Gateway         | Servidor caido                      |
| 503         | Service Unavailable | Servidor no disponible              |

---

## Configuración del Entorno

### Requisitos Previos

```bash
# Verificar que Node.js está instalado
node --version  # Debe ser >= 18

# Verificar que pnpm está instalado
pnpm --version

# Verificar que PostgreSQL está instalado (opcional para desarrollo)
psql --version
```

### Instalación del Proyecto

```bash
# Clonar el repositorio
git clone <repo-url>
cd alti-team

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local

# Para desarrollo (sin base de datos)
pnpm dev

# Para staging/producción (con PostgreSQL)
USE_POSTGRES=true pnpm dev
```

### Verificación de Instalación

| Verificación           | Comando            | Resultado Esperado              |
| ---------------------- | ------------------ | ------------------------------- |
| Servidor funcionando   | `pnpm dev`         | http://localhost:3000 accesible |
| TypeScript sin errores | `npx tsc --noEmit` | Sin errores                     |
| Lint pasando           | `pnpm lint`        | Sin warnings/errors             |
| Tests pasando          | `pnpm test`        | Todos los tests pasando         |

---

## Pruebas de Autenticación

### Registro de Usuario

#### TC-AUTH-001: Registro Exitoso

| Campo    | Valor               |
| -------- | ------------------- |
| Nombre   | Juan Pérez          |
| Email    | juan.perez@test.com |
| Password | Password123!        |

**Pasos:**

1. Navegar a `/auth/signup`
2. Completar formulario con datos válidos
3. Click en "Create Account"
4. Verificar redirección a página principal

**Resultado Esperado:** Usuario creado, sesión iniciada, redirigido a `/`

#### TC-AUTH-002: Registro con Email Existente

**Pasos:**

1. Navegar a `/auth/signup`
2. Usar email ya registrado: `juan.perez@test.com`
3. Completar otros campos
4. Click en "Create Account"

**Resultado Esperado:** Mensaje de error "User with this email already exists"

#### TC-AUTH-003: Registro con Campos Vacíos

**Pasos:**

1. Navegar a `/auth/signup`
2. Dejar todos los campos vacíos
3. Click en "Create Account"

**Resultado Esperado:** Validación de campos requeridos

#### TC-AUTH-004: Registro con Email Inválido

**Pasos:**

1. Navegar a `/auth/signup`
2. Ingresar email sin formato válido: `email-invalido`
3. Completar otros campos
4. Click en "Create Account"

**Resultado Esperado:** Error de validación de email

---

### Inicio de Sesión

#### TC-AUTH-005: Inicio de Sesión Exitoso

| Campo    | Valor               |
| -------- | ------------------- |
| Email    | juan.perez@test.com |
| Password | Password123!        |

**Pasos:**

1. Navegar a `/auth/signin`
2. Ingresar credenciales válidas
3. Click en "Sign In"

**Resultado Esperado:** Sesión iniciada, redirigido a `/`

#### TC-AUTH-006: Inicio de Sesión con Credenciales Inválidas

**Pasos:**

1. Navegar a `/auth/signin`
2. Ingresar email: `wrong@test.com`
3. Ingresar password: `wrongpassword`
4. Click en "Sign In"

**Resultado Esperado:** Mensaje "Invalid credentials"

#### TC-AUTH-007: Redirección a Login sin Autenticación

**Pasos:**

1. Intentar acceder a página protegida: `/dashboard`
2. Sin estar autenticado

**Resultado Esperado:** Redirigido a `/auth/signin`

---

### Cierre de Sesión

#### TC-AUTH-008: Cierre de Sesión Exitoso

**Pasos:**

1. Estar autenticado
2. Click en "Sign Out"

**Resultado Esperado:** Sesión terminada, redirigido a `/auth/signin`

---

## Pruebas de Gestión de Usuarios

### Perfil de Usuario

#### TC-USER-001: Visualizar Perfil

**Pasos:**

1. Navegar a `/profile`

**Elementos a verificar:**

- Nombre del usuario
- Email
- Bio (si existe)
- Fecha de creación de cuenta

#### TC-USER-002: Editar Perfil

**Pasos:**

1. Navegar a `/profile`
2. Modificar nombre
3. Modificar bio
4. Click en "Save"

**Resultado Esperado:** Perfil actualizado correctamente

#### TC-USER-003: Cambiar Contraseña

**Pasos:**

1. Navegar a `/settings` o `/profile`
2. Ingresar password actual
3. Ingresar nuevo password
4. Confirmar nuevo password
5. Click en "Update Password"

**Resultado Esperado:** Password actualizado exitosamente

---

## Pruebas de Organizaciones

### Crear Organización

#### TC-ORG-001: Crear Nueva Organización

| Campo       | Valor                   |
| ----------- | ----------------------- |
| Name        | Mi Empresa Test         |
| Description | Empresa para pruebas QA |

**Pasos:**

1. Navegar a `/organizations`
2. Click en "New Organization"
3. Completar formulario
4. Click en "Create"

**Resultado Esperado:** Organización creada, visible en lista

#### TC-ORG-002: Editar Organización

**Pasos:**

1. Navegar a `/organizations/[id]`
2. Click en "Settings"
3. Modificar nombre/descripción
4. Click en "Save"

**Resultado Esperado:** Organización actualizada

#### TC-ORG-003: Eliminar Organización

**Pasos:**

1. Navegar a `/organizations/[id]/settings`
2. Click en "Delete Organization"
3. Confirmar eliminación

**Resultado Esperado:** Organización eliminada

---

### Miembros de Organización

#### TC-ORG-004: Ver Miembros

**Pasos:**

1. Navegar a `/organizations/[id]/members`

**Elementos a verificar:**

- Lista de miembros
- Roles de cada miembro
- Posiciones

#### TC-ORG-005: Asignar Rol a Miembro

**Pasos:**

1. Navegar a `/organizations/[id]/members`
2. Seleccionar miembro
3. Modificar rol
4. Click en "Save"

**Resultado Esperado:** Rol actualizado

---

## Pruebas de Departamentos

### CRUD Departamentos

#### TC-DEPT-001: Crear Departamento

| Campo             | Valor                |
| ----------------- | -------------------- |
| Name              | Desarrollo           |
| Description       | Equipo de desarrollo |
| Parent Department | (Opcional)           |

**Pasos:**

1. Navegar a `/organizations/[id]`
2. Click en "Add Department"
3. Completar formulario
4. Click en "Create"

**Resultado Esperado:** Departamento creado, visible en organigrama

#### TC-DEPT-002: Editar Departamento

**Pasos:**

1. Navegar a `/organizations/[id]`
2. Seleccionar departamento
3. Modificar nombre/descripción
4. Click en "Save"

**Resultado Esperado:** Departamento actualizado

#### TC-DEPT-003: Eliminar Departamento

**Pasos:**

1. Seleccionar departamento
2. Click en "Delete"
3. Confirmar

**Resultado Esperado:** Departamento eliminado

#### TC-DEPT-004: Jerarquía de Departamentos

**Pasos:**

1. Crear sub-departamento
2. Verificar relación padre-hijo
3. Visualizar en organigrama

**Resultado Esperado:** Estructura jerárquica correcta

---

## Pruebas de Proyectos

### CRUD Proyectos

#### TC-PROJ-001: Crear Proyecto

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Name        | Proyecto Test QA         |
| Description | Descripción del proyecto |
| Status      | active                   |
| Start Date  | 2026-02-01               |
| End Date    | 2026-12-31               |

**Pasos:**

1. Navegar a `/projects`
2. Click en "New Project"
3. Completar formulario
4. Click en "Create"

**Resultado Esperado:** Proyecto creado, visible en lista

#### TC-PROJ-002: Editar Proyecto

**Pasos:**

1. Navegar a `/projects/[id]`
2. Click en "Settings"
3. Modificar campos
4. Click en "Save"

**Resultado Esperado:** Proyecto actualizado

#### TC-PROJ-003: Eliminar Proyecto

**Pasos:**

1. Navegar a `/projects/[id]/settings`
2. Click en "Delete"
3. Confirmar

**Resultado Esperado:** Proyecto eliminado

---

### Tareas de Proyecto

#### TC-PROJ-004: Ver Tareas de Proyecto

**Pasos:**

1. Navegar a `/projects/[id]`
2. Ver sección de tareas

**Elementos a verificar:**

- Lista de tareas
- Filtros disponibles
- Ordenamiento

#### TC-PROJ-005: Crear Tarea desde Proyecto

**Pasos:**

1. Navegar a `/projects/[id]`
2. Click en "Add Task"
3. Completar formulario
4. Click en "Create"

**Resultado Esperado:** Tarea creada y asociada al proyecto

---

### Recursos de Proyecto

#### TC-PROJ-006: Ver Recursos

**Pasos:**

1. Navegar a `/projects/[id]`
2. Ver sección de recursos

**Elementos a verificar:**

- Lista de recursos
- Tipos de recursos
- Metadata

---

### Analytics de Proyecto

#### TC-PROJ-007: Visualizar Analytics

**Pasos:**

1. Navegar a `/projects/[id]/analytics`

**Elementos a verificar:**

- Gráficos de progreso
- Métricas de tareas
- Timeline

---

## Pruebas de Tareas

### CRUD Tareas

#### TC-TASK-001: Crear Tarea

| Campo       | Valor                 |
| ----------- | --------------------- |
| Title       | Tarea de Prueba QA    |
| Description | Descripción detallada |
| Status      | pending               |
| Priority    | high                  |
| Due Date    | 2026-02-15            |
| Assigned To | (Opcional)            |

**Pasos:**

1. Navegar a `/tasks`
2. Click en "New Task"
3. Completar formulario
4. Click en "Create"

**Resultado Esperado:** Tarea creada

#### TC-TASK-002: Editar Tarea

**Pasos:**

1. Navegar a `/tasks/[id]`
2. Modificar campos
3. Click en "Save"

**Resultado Esperado:** Tarea actualizada

#### TC-TASK-003: Eliminar Tarea

**Pasos:**

1. Navegar a `/tasks/[id]`
2. Click en "Delete"
3. Confirmar

**Resultado Esperado:** Tarea eliminada

---

### Comentarios de Tarea

#### TC-TASK-004: Agregar Comentario

**Pasos:**

1. Navegar a `/tasks/[id]`
2. Sección de comentarios
3. Escribir comentario
4. Click en "Send"

**Resultado Esperado:** Comentario visible

#### TC-TASK-005: Responder a Comentario

**Pasos:**

1. Encontrar comentario existente
2. Click en "Reply"
3. Escribir respuesta

**Resultado Esperado:** Respuesta anidada visible

#### TC-TASK-006: Editar Comentario

**Pasos:**

1. Encontrar comentario propio
2. Click en "Edit"
3. Modificar texto
4. Click en "Save"

**Resultado Esperado:** Comentario actualizado

#### TC-TASK-007: Eliminar Comentario

**Pasos:**

1. Encontrar comentario propio
2. Click en "Delete"
3. Confirmar

**Resultado Esperado:** Comentario eliminado

---

### Filtros de Tareas

#### TC-TASK-008: Filtrar por Estado

**Pasos:**

1. Navegar a `/tasks`
2. Usar filtro de estado

**Resultado Esperado:** Lista filtrada correctamente

#### TC-TASK-009: Filtrar por Prioridad

**Pasos:**

1. Navegar a `/tasks`
2. Usar filtro de prioridad

**Resultado Esperado:** Lista filtrada correctamente

#### TC-TASK-010: Filtrar por Fecha

**Pasos:**

1. Navegar a `/tasks`
2. Usar filtro de fecha

**Resultado Esperado:** Lista filtrada correctamente

---

## Pruebas de Equipos

### CRUD Equipos

#### TC-TEAM-001: Crear Equipo

| Campo       | Valor                  |
| ----------- | ---------------------- |
| Name        | Equipo de Prueba       |
| Description | Descripción del equipo |

**Pasos:**

1. Navegar a `/teams`
2. Click en "New Team"
3. Completar formulario
4. Click en "Create"

**Resultado Esperado:** Equipo creado

#### TC-TEAM-002: Editar Equipo

**Pasos:**

1. Navegar a `/teams/[id]`
2. Modificar datos
3. Click en "Save"

**Resultado Esperado:** Equipo actualizado

#### TC-TEAM-003: Eliminar Equipo

**Pasos:**

1. Navegar a `/teams/[id]/settings`
2. Click en "Delete"
3. Confirmar

**Resultado Esperado:** Equipo eliminado

---

### Miembros de Equipo

#### TC-TEAM-004: Agregar Miembros

**Pasos:**

1. Navegar a `/teams/[id]`
2. Click en "Add Member"
3. Seleccionar usuario
4. Asignar rol
5. Click en "Add"

**Resultado Esperado:** Miembro agregado al equipo

#### TC-TEAM-005: Remover Miembro

**Pasos:**

1. Navegar a `/teams/[id]`
2. Encontrar miembro
3. Click en "Remove"
4. Confirmar

**Resultado Esperado:** Miembro removido

---

## Pruebas de Recursos

### CRUD Recursos

#### TC-RES-001: Crear Recurso

| Campo    | Valor                       |
| -------- | --------------------------- |
| Name     | Documento PDF               |
| Type     | document                    |
| URL      | https://ejemplo.com/doc.pdf |
| Metadata | { "version": "1.0" }        |

**Pasos:**

1. Navegar a `/projects/[id]`
2. Sección de recursos
3. Click en "Upload Resource"
4. Completar formulario
5. Click en "Create"

**Resultado Esperado:** Recurso creado

#### TC-RES-002: Editar Recurso

**Pasos:**

1. Navegar a `/projects/[id]`
2. Sección de recursos
3. Click en recurso
4. Modificar datos
5. Click en "Save"

**Resultado Esperado:** Recurso actualizado

#### TC-RES-003: Eliminar Recurso

**Pasos:**

1. Encontrar recurso
2. Click en "Delete"
3. Confirmar

**Resultado Esperado:** Recurso eliminado

---

## Pruebas de Procesos

### CRUD Procesos

#### TC-PROC-001: Crear Proceso

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| Name        | Proceso de Prueba              |
| Description | Descripción del proceso        |
| Steps       | ["Paso 1", "Paso 2", "Paso 3"] |
| Department  | Desarrollo                     |

**Pasos:**

1. Navegar a `/processes`
2. Click en "New Process"
3. Completar formulario
4. Click en "Create"

**Resultado Esperado:** Proceso creado

#### TC-PROC-002: Editar Proceso

**Pasos:**

1. Navegar a `/processes/[id]`
2. Modificar datos
3. Modificar pasos si es necesario
4. Click en "Save"

**Resultado Esperado:** Proceso actualizado

#### TC-PROC-003: Eliminar Proceso

**Pasos:**

1. Navegar a `/processes/[id]/settings`
2. Click en "Delete"
3. Confirmar

**Resultado Esperado:** Proceso eliminado

---

### Ejecución de Procesos

#### TC-PROC-004: Ejecutar Proceso

**Pasos:**

1. Navegar a `/processes/[id]`
2. Click en "Execute"
3. Seguir pasos
4. Completar ejecución

**Resultado Esperado:** Proceso ejecutado exitosamente

#### TC-PROC-005: Visualizar Analytics de Proceso

**Pasos:**

1. Navegar a `/processes/[id]/analytics`

**Elementos a verificar:**

- Métricas de ejecución
- Historial
- Tiempos promedio

---

### Templates de Procesos

#### TC-PROC-006: Ver Templates

**Pasos:**

1. Navegar a `/processes/templates`

**Elementos a verificar:**

- Lista de templates
- Descripciones
- Categorías

#### TC-PROC-007: Crear Proceso desde Template

**Pasos:**

1. Navegar a `/processes/templates`
2. Seleccionar template
3. Click en "Use Template"
4. Completar datos específicos
5. Click en "Create"

**Resultado Esperado:** Proceso creado desde template

---

## Pruebas de Invitaciones

### Enviar Invitación

#### TC-INV-001: Enviar Invitación

| Campo      | Valor          |
| ---------- | -------------- |
| Email      | nuevo@test.com |
| Role       | member         |
| Department | Desarrollo     |

**Pasos:**

1. Navegar a `/organizations/[id]/members`
2. Click en "Invite Member"
3. Completar formulario
4. Click en "Send Invite"

**Resultado Esperado:** Invitación enviada por email

#### TC-INV-002: Ver Invitaciones Pendientes

**Pasos:**

1. Navegar a `/invitations` o panel de administración

**Elementos a verificar:**

- Lista de invitaciones pendientes
- Estados
- Fechas de expiración

---

### Aceptar Invitación

#### TC-INV-003: Aceptar Invitación

**Pasos:**

1. Recibir email de invitación
2. Click en link de aceptación
3. Registrarse/Iniciar sesión
4. Confirmar aceptación

**Resultado Esperado:** Usuario agregado a organización

#### TC-INV-004: Rechazar Invitación

**Pasos:**

1. Encontrar invitación pendiente
2. Click en "Decline"
3. Confirmar rechazo

**Resultado Esperado:** Invitación cancelada

---

## Pruebas de Notificaciones

### Visualizar Notificaciones

#### TC-NOTIF-001: Ver Notificaciones

**Pasos:**

1. Click en icono de notificaciones
2. Ver lista de notificaciones

**Elementos a verificar:**

- Notificaciones no leídas
- Notificaciones leídas
- Tipos de notificaciones

#### TC-NOTIF-002: Marcar como Leída

**Pasos:**

1. Encontrar notificación no leída
2. Click en ella

**Resultado Esperado:** Notificación marcada como leída

#### TC-NOTIF-003: Marcar Todas como Leídas

**Pasos:**

1. Click en "Mark all as read"

**Resultado Esperado:** Todas las notificaciones marcadas como leídas

---

## Pruebas de Chat

### Interfaz de Chat

#### TC-CHAT-001: Acceder al Chat

**Pasos:**

1. Navegar a `/chat`
2. Estar autenticado

**Elementos a verificar:**

- Área de mensajes
- Input de texto
- Botón de envío
- Mensajes de bienvenida

#### TC-CHAT-002: Enviar Mensaje

**Pasos:**

1. Escribir mensaje
2. Click en enviar o presionar Enter

**Resultado Esperado:** Mensaje visible en conversación

#### TC-CHAT-003: Recepción de Respuesta

**Pasos:**

1. Enviar mensaje
2. Esperar respuesta del asistente

**Resultado Esperado:** Respuesta visible con indicadores de carga

---

### Quick Prompts

#### TC-CHAT-004: Usar Quick Prompts

**Pasos:**

1. Ver Quick Prompts iniciales
2. Click en "Show me my tasks"

**Resultado Esperado:** Prompt ejecutado correctamente

#### TC-CHAT-005: Quick Prompts Disponibles

**Verificar:**

- "Show me my tasks"
- "Create a new project"
- "What tasks are due today?"
- "List my organizations"

---

### Comandos de Chat

#### TC-CHAT-006: Listar Organizaciones

**Prompt:** "List my organizations"

**Resultado Esperado:** Lista de organizaciones visible

#### TC-CHAT-007: Ver Tareas

**Prompt:** "Show me my tasks"

**Resultado Esperado:** Lista de tareas visible

#### TC-CHAT-008: Crear Proyecto

**Prompt:** "Create a new project"

**Resultado Esperado:** Fluido de creación iniciado

---

### UX del Chat

#### TC-CHAT-009: Auto-scroll

**Pasos:**

1. Enviar múltiples mensajes
2. Verificar scroll automático

**Resultado Esperado:** Chat scrollea al último mensaje

#### TC-CHAT-010: Input Multilínea

**Pasos:**

1. Escribir texto
2. Presionar Shift+Enter

**Resultado Esperado:** Nueva línea en input

#### TC-CHAT-011: Enfoque en Input

**Pasos:**

1. Navegar a `/chat`

**Resultado Esperado:** Input enfocado automáticamente

---

## Pruebas de API

### Endpoints de Autenticación

| Endpoint             | Método | Input                     | Output Esperado   |
| -------------------- | ------ | ------------------------- | ----------------- |
| `/api/auth/register` | POST   | `{name, email, password}` | 201: User created |
| `/api/auth/register` | POST   | `{email: existente}`      | 409: Conflict     |
| `/api/users/me`      | GET    | Auth header               | 200: User data    |

### Endpoints de Usuarios

| Endpoint        | Método | Input         | Output Esperado |
| --------------- | ------ | ------------- | --------------- |
| `/api/users/me` | GET    | Auth          | 200: User data  |
| `/api/users/me` | PUT    | `{name, bio}` | 200: Updated    |

### Endpoints de Organizaciones

| Endpoint                  | Método | Input                 | Output Esperado  |
| ------------------------- | ------ | --------------------- | ---------------- |
| `/api/organizations`      | POST   | `{name, description}` | 201: Org created |
| `/api/organizations`      | GET    | -                     | 200: List        |
| `/api/organizations/[id]` | GET    | -                     | 200: Org data    |
| `/api/organizations/[id]` | PUT    | `{name}`              | 200: Updated     |
| `/api/organizations/[id]` | DELETE | -                     | 200: Deleted     |

### Endpoints de Proyectos

| Endpoint             | Método | Input           | Output Esperado      |
| -------------------- | ------ | --------------- | -------------------- |
| `/api/projects`      | POST   | `{name, orgId}` | 201: Project created |
| `/api/projects`      | GET    | -               | 200: List            |
| `/api/projects/[id]` | GET    | -               | 200: Project data    |
| `/api/projects/[id]` | PUT    | `{name}`        | 200: Updated         |
| `/api/projects/[id]` | DELETE | -               | 200: Deleted         |

### Endpoints de Tareas

| Endpoint                   | Método | Input                | Output Esperado      |
| -------------------------- | ------ | -------------------- | -------------------- |
| `/api/tasks`               | POST   | `{title, projectId}` | 201: Task created    |
| `/api/tasks`               | GET    | `?projectId=...`     | 200: List            |
| `/api/tasks/[id]`          | GET    | -                    | 200: Task data       |
| `/api/tasks/[id]`          | PUT    | `{status}`           | 200: Updated         |
| `/api/tasks/[id]`          | DELETE | -                    | 200: Deleted         |
| `/api/tasks/[id]/comments` | GET    | -                    | 200: Comments list   |
| `/api/tasks/[id]/comments` | POST   | `{content}`          | 201: Comment created |

### Endpoints de Departamentos

| Endpoint                | Método | Input           | Output Esperado |
| ----------------------- | ------ | --------------- | --------------- |
| `/api/departments`      | POST   | `{name, orgId}` | 201: Created    |
| `/api/departments`      | GET    | `?orgId=...`    | 200: List       |
| `/api/departments/[id]` | GET    | -               | 200: Data       |
| `/api/departments/[id]` | PUT    | `{name}`        | 200: Updated    |
| `/api/departments/[id]` | DELETE | -               | 200: Deleted    |

### Endpoints de Equipos

| Endpoint          | Método | Input           | Output Esperado |
| ----------------- | ------ | --------------- | --------------- |
| `/api/teams`      | POST   | `{name, orgId}` | 201: Created    |
| `/api/teams`      | GET    | -               | 200: List       |
| `/api/teams/[id]` | GET    | -               | 200: Data       |
| `/api/teams/[id]` | PUT    | `{name}`        | 200: Updated    |
| `/api/teams/[id]` | DELETE | -               | 200: Deleted    |

### Endpoints de Procesos

| Endpoint              | Método | Input                   | Output Esperado |
| --------------------- | ------ | ----------------------- | --------------- |
| `/api/processes`      | POST   | `{name, steps, deptId}` | 201: Created    |
| `/api/processes`      | GET    | -                       | 200: List       |
| `/api/processes/[id]` | GET    | -                       | 200: Data       |
| `/api/processes/[id]` | PUT    | `{name}`                | 200: Updated    |
| `/api/processes/[id]` | DELETE | -                       | 200: Deleted    |

### Endpoints de Invitaciones

| Endpoint                  | Método | Input                  | Output Esperado |
| ------------------------- | ------ | ---------------------- | --------------- |
| `/api/invitations`        | POST   | `{email, orgId, role}` | 201: Created    |
| `/api/invitations`        | GET    | -                      | 200: List       |
| `/api/invitations/accept` | POST   | `{token}`              | 200: Accepted   |

### Endpoints de Recursos

| Endpoint              | Método | Input                     | Output Esperado |
| --------------------- | ------ | ------------------------- | --------------- |
| `/api/resources`      | POST   | `{name, type, projectId}` | 201: Created    |
| `/api/resources`      | GET    | `?projectId=...`          | 200: List       |
| `/api/resources/[id]` | GET    | -                         | 200: Data       |
| `/api/resources/[id]` | PUT    | `{name}`                  | 200: Updated    |
| `/api/resources/[id]` | DELETE | -                         | 200: Deleted    |

### Endpoints de Notificaciones

| Endpoint             | Método | Input       | Output Esperado  |
| -------------------- | ------ | ----------- | ---------------- |
| `/api/notifications` | GET    | -           | 200: List        |
| `/api/notifications` | PUT    | `{ids: []}` | 200: Marked read |

### Endpoints de Chat

| Endpoint      | Método | Input        | Output Esperado |
| ------------- | ------ | ------------ | --------------- |
| `/api/chat`   | POST   | `{messages}` | 200: Response   |
| `/api/search` | GET    | `?q=...`     | 200: Results    |

---

## Pruebas E2E con Playwright

### Ejecución de Tests E2E

```bash
# Ejecutar todos los tests E2E
pnpm test:e2e

# Ver reporte de tests
pnpm test:e2e:report

# Ejecutar test específico
pnpm test:e2e -- tests/e2e/chat.spec.ts

# Ejecutar con headed mode (ver navegador)
pnpm test:e2e -- --headed

# Ejecutar con slow mo
pnpm test:e2e -- --headed --slow-mo=1000
```

### Tests de Autenticación

```bash
# Verificar tests de auth
pnpm test:e2e -- tests/auth.spec.ts
```

**Tests incluidos:**

- Navegación a página de signin
- Error con credenciales inválidas
- Navegación a página de signup
- Título correcto de página

### Tests de Chat

```bash
# Verificar tests de chat
pnpm test:e2e -- tests/e2e/chat.spec.ts
```

**Tests incluidos:**

- Redirección a signin sin autenticación
- Elementos de interfaz de chat
- Mensaje de bienvenida
- Envío de mensajes
- Quick prompts
- UX (auto-scroll, responsive, etc.)

---

## Pruebas Unitarias con Jest

### Ejecución de Tests Unitarios

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar test específico
pnpm test -- src/lib/repositories/__tests__/in-memory.user.repository.test.ts

# Modo watch
pnpm test -- --watch

# Cobertura
pnpm test -- --coverage
```

### Tests de Repositorios

**Ubicación:** `src/lib/repositories/__tests__/`

**Tests de Usuario (ejemplo):**

- Crear usuario
- Buscar por email
- Buscar por ID
- Actualizar usuario
- Eliminar usuario

---

## Pruebas del Servidor MCP

### Iniciar Servidor MCP

```bash
# Desarrollo
pnpm mcp:server

# Producción (PM2)
pnpm mcp:start
pnpm mcp:status
pnpm mcp:stop
pnpm mcp:restart
pnpm mcp:logs
```

### Herramientas MCP Disponibles

| Herramienta  | Descripción               |
| ------------ | ------------------------- |
| user         | Gestión de usuarios       |
| task         | Gestión de tareas         |
| project      | Gestión de proyectos      |
| resource     | Gestión de recursos       |
| process      | Gestión de procesos       |
| team         | Gestión de equipos        |
| member       | Gestión de miembros       |
| department   | Gestión de departamentos  |
| organization | Gestión de organizaciones |
| notification | Gestión de notificaciones |
| reports      | Reportes y analytics      |
| batch        | Operaciones en lote       |
| search       | Búsqueda global           |

---

## Checklist de Release

### Antes de Liberar

- [ ] `npx tsc --noEmit` sin errores
- [ ] `pnpm lint` sin errores
- [ ] `pnpm test` pasando
- [ ] `pnpm test:e2e` pasando
- [ ] `pnpm build` exitoso
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada (si aplica)
- [ ] Tests de smoke passing

### Smoke Tests

| Test                         | Resultado |
| ---------------------------- | --------- |
| Homepage carga correctamente | ☐         |
| Login funciona               | ☐         |
| Logout funciona              | ☐         |
| Crear usuario nuevo          | ☐         |
| Crear organización           | ☐         |
| Crear proyecto               | ☐         |
| Crear tarea                  | ☐         |
| Chat carga                   | ☐         |
| API Health check             | ☐         |

---

## Notas de Testing

### Datos de Prueba Recomendados

| Entidad        | Cantidad | Descripción           |
| -------------- | -------- | --------------------- |
| Usuarios       | 5-10     | Diversos roles        |
| Organizaciones | 2-3      | Con y sin proyectos   |
| Proyectos      | 5-10     | Estados variados      |
| Tareas         | 20-30    | Prioridades y estados |
| Equipos        | 3-5      | Con miembros          |
| Procesos       | 5        | Con templates         |
| Recursos       | 10-15    | Tipos diversos        |

### Casos Edge

- Campos vacíos opcionales
- Fechas pasadas/futuras
- Caracteres especiales en nombres
- Emails con formatos válidos
- Contraseñas largas/cortas
- Límites de caracteres
- Conexión lenta/interrumpida
- Concurrencia de usuarios

---

## Reporte de Bugs

### Formato

```markdown
## Bug: [Título corto]

**Severidad:** Alta/Media/Baja
**Prioridad:** Alta/Media/Baja
**Estado:** Abierto/Fixed

### Descripción

[Descripción clara del bug]

### Pasos para Reproducir

1. [Paso 1]
2. [Paso 2]
3. ...

### Resultado Actual

[Qué sucede actualmente]

### Resultado Esperado

[Qué debería suceder]

### Screenshots/Logs

[Adjuntar evidencia]

### Entorno

- Navegador: [Versión]
- SO: [Versión]
- URL: [Si aplica]
```

---

---

## Guía de Referencia Rápida QA

### Comandos de Uso Frecuente

```bash
# =====================================
# DÍA A DÍA DE QA
# =====================================

# 1. Iniciar día de testing
cd /home/student/Documentos/dev/alti-team
pnpm dev

# 2. Verificar que el servidor responde
curl http://localhost:3000/api/health

# 3. Verificar linting
pnpm lint

# 4. Tests unitarios rápidos
pnpm test

# 5. Tests E2E
pnpm test:e2e

# 6. Ver reporte
pnpm test:e2e:report

# =====================================
# DEBUGGING
# =====================================

# Verificar TypeScript
npx tsc --noEmit

# Ver errores en consola del navegador
# Abrir DevTools (F12) > Console

# Ver requests de red
# DevTools > Network > verificar responses

# =====================================
# LIMPIEZA
# =====================================

# Limpiar cache Next.js
rm -rf .next

# Reinstalar si hay problemas
rm -rf node_modules
pnpm install
```

---

### quick QA - Verificación de 5 Minutos

```bash
#!/bin/bash
# Verificación rápida antes de empezar testing

echo "=== Quick QA Check ==="

# 1. Servidor
echo -n "1. Servidor: "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✓ OK"
else
    echo "✗ NO RESPONDE"
fi

# 2. Health check
echo -n "2. Health API: "
STATUS=$(curl -s http://localhost:3000/api/health | jq -r .status 2>/dev/null)
if [ "$STATUS" = "ok" ]; then
    echo "✓ OK"
else
    echo "✗ ERROR"
fi

# 3. TypeScript
echo -n "3. TypeScript: "
if npx tsc --noEmit 2>&1 | grep -q "error"; then
    echo "✗ Hay errores"
else
    echo "✓ OK"
fi

echo ""
echo "Listo para testing manual"
```

**Ejecutar:**

```bash
chmod +x ~/quick-qa-check.sh
~/quick-qa-check.sh
```

---

### Captura de Bugs

```bash
#!/bin/bash
# Generar reporte de bug automáticamente

cat > ~/bug-report.md << EOF
# Reporte de Bug

**Fecha:** $(date '+%Y-%m-%d %H:%M')
**Tester:** $USER
**URL:** http://localhost:3000$(pwd)
**Navegador:** $(echo -n $(node -e "console.log(navigator.userAgent)" 2>/dev/null || echo "Unknown"))

## Descripción

[Describir el bug aquí]

## Pasos para Reproducir

1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

## Resultado Actual

[Qué está pasando]

## Resultado Esperado

[Qué debería pasar]

## Screenshots

[Adjuntar screenshots]

## Console Errors

\`\`\`
[Copiar errores de DevTools > Console]
\`\`\`

## Network Errors

\`\`\`
[Copiar errores de DevTools > Network]
\`\`\`
EOF

echo "Reporte creado en ~/bug-report.md"
echo "Edita el archivo con los detalles del bug"
```

---

## Referencias

- **Documentación del proyecto:** `/AGENTS.md`
- **Configuración Playwright:** `playwright.config.ts`
- **Configuración Jest:** `jest.config.ts`
- **Tipos de datos:** `src/lib/repositories/types.ts`
- **Patrón Result:** `src/lib/result.ts`
