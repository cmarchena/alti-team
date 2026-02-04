# RALPH - dev

> **Ralph Wiggum**: Un método simple pero efectivo para hacer que AI coding agents trabajen en tu backlog mientras duermes.
> Basado en: https://ghuntley.com/ralph/ y https://youtu.be/_IK18goX4X8

## 🎯 Qué es Ralph

Ralph es un **bash loop** que permite que un coding agent (Kilo Code, Claude Code, Cursor, etc.) trabaje a través de un backlog de tareas de forma autónoma.

**Descripción del proyecto**: POC gestión de equipos y proyectos con Next.js 14, Prisma, NextAuth.js y shadcn/ui

### Por qué Ralph funciona

En lugar de crear planes multi-fase complejos, Ralph funciona como un ingeniero real:

1. Mira el backlog (prd.json)
2. Elige la tarea de mayor prioridad
3. La completa
4. Commitea
5. Vuelve al paso 1

**Es literalmente un for loop.**

## 🚀 Setup Rápido

### Estructura de archivos

```
plans/
├── prd.json          # Tus user stories / tareas
├── progress.txt      # Memoria del LLM entre iteraciones
├── ralph.sh          # Loop principal (AFK mode)
└── ralph-once.sh     # Una iteración (human-in-the-loop)
```

### Ejecutar Ralph

```bash
# Modo AFK (automático, máximo 10 iteraciones)
./plans/ralph.sh 10

# Modo Human-in-the-loop (una iteración a la vez)
./plans/ralph-once.sh
```

## 📋 Cómo usar Ralph

### 1. Define tus tareas en prd.json

Edita `plans/prd.json` con tus user stories. El formato actual usa:

```json
{
  "features": [
    {
      "id": "feat-001",
      "title": "Add user authentication",
      "description": "Users should be able to log in with email/password",
      "acceptanceCriteria": [
        "Login form is displayed",
        "Users can submit credentials",
        "Successful login redirects to dashboard",
        "Failed login shows error message"
      ],
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

**Nota**: El campo `status` puede ser `"pending"` o `"done"`. Ralph busca features con `status != "done"`.

### 2. Ejecuta Ralph

```bash
# Deja que trabaje solo
./plans/ralph.sh 20

# O ve paso a paso
./plans/ralph-once.sh
```

### 3. Revisa el código

Cada iteración crea un git commit. Revisa:
- Los commits en git log
- El archivo progress.txt para ver qué hizo
- El prd.json para ver qué marcó como completo

## 🎯 Principios de Ralph

### 1. Tareas Pequeñas

**Malo:**
```json
{
  "title": "Build entire authentication system",
  "status": "pending"
}
```

**Bueno:**
```json
[
  { "title": "Add login form UI", "status": "pending" },
  { "title": "Connect login to API", "status": "pending" },
  { "title": "Add error handling", "status": "pending" },
  { "title": "Add session management", "status": "pending" }
]
```

**Por qué**: El LLM funciona mejor con contextos pequeños. Una tarea grande = contexto inflado = código peor.

### 2. Feedback Loops Robustos

Ralph funciona mejor cuando tiene formas de verificar que el código funciona:

- ✅ TypeScript type-checking (`npx tsc --noEmit`)
- ✅ Linting (`pnpm lint`)
- ✅ Backend tests con Jest (`pnpm test`)
- ✅ E2E tests con Playwright (`pnpm test:e2e`)
- ✅ Build check (`pnpm build`)
- ✅ CI que debe mantenerse verde

**Regla de oro**: Si Ralph commitea código roto, no sabrá de dónde vino porque perdió el contexto.

**Checklist antes de marcar como "done":**
1. `npx tsc --noEmit` pasa sin errores
2. `pnpm lint` pasa sin errores
3. `pnpm test` pasa (Jest - tests de backend/API)
4. `pnpm test:e2e` pasa (Playwright - tests E2E de frontend)
5. Feature probada manualmente en el navegador
6. Resultados documentados en progress.txt

### 3. Commits Frecuentes

Cada iteración = 1 git commit.

Esto permite:
- Ver exactamente qué hizo en cada paso
- Revertir fácilmente si algo sale mal
- Que el LLM vea el historial git para contexto

### 4. progress.txt es la memoria

El LLM **debe** usar progress.txt para:
- Recordar decisiones arquitectónicas
- Dejar notas para la siguiente iteración
- Documentar blockers o cosas que aprendió

**Importante**: Usa "append", no "update". Queremos un log histórico.

### 5. Testing Before Completion

Ralph debe probar exhaustivamente cada feature antes de marcarla como "done" en prd.json:

- Ejecutar pruebas unitarias si existen

- Probar manualmente la funcionalidad en el navegador/desarrollo

- Verificar que no haya errores en consola

- Probar casos edge y errores

- Documentar resultados en progress.txt

- Solo marcar como "done" cuando todas las pruebas pasen exitosamente

## 🎨 Configuración del Proyecto

### Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Data Layer**: Repository Pattern (in-memory storage)
- **Database**: In-Memory (single implementation)
- **Auth**: NextAuth.js con JWT strategy
- **UI**: shadcn/ui + Tailwind CSS
- **Testing**: Jest (backend/API) + Playwright (E2E frontend)
- **Package Manager**: pnpm (preferido sobre npm/yarn)

### Principios de Código

Este proyecto promueve los siguientes principios de desarrollo:

#### 🧹 Clean Code
- Código legible y auto-documentado
- Nombres descriptivos para variables, funciones y archivos
- Funciones pequeñas con una sola responsabilidad
- Evitar comentarios innecesarios - el código debe ser claro por sí mismo

#### 💉 Dependency Injection
- Pasar dependencias como parámetros en lugar de importarlas directamente
- Facilita el testing y la reutilización
- Ejemplo:
```typescript
// ✅ Bueno: Dependencia inyectada
async function getUser(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({ where: { id: userId } })
}

// ❌ Malo: Dependencia hardcodeada
async function getUser(userId: string) {
  const prisma = new PrismaClient()
  return prisma.user.findUnique({ where: { id: userId } })
}
```

#### 🎯 Error Handling with Result Type

Este proyecto usa un tipo `Result<T, E>` para manejar errores de forma explícita y type-safe en lugar de exceptions:

```typescript
// src/lib/result.ts
export type Result<T, E = Error> = Success<T> | Failure<E>

export interface Success<T> {
  success: true
  data: T
}

export interface Failure<E> {
  success: false
  error: E
}

export function success<T>(data: T): Success<T> {
  return { success: true, data }
}

export function failure<E = Error>(error: E): Failure<E> {
  return { success: false, error }
}

// Helper type guards
export function isSuccess<T>(result: Result<T>): result is Success<T> {
  return result.success === true
}

export function isFailure<E>(result: Result<unknown, E>): result is Failure<E> {
  return result.success === false
}
```

**Uso en repositorios:**
```typescript
// src/lib/repositories/in-memory.ts
async create(data: CreateUserInput): Promise<Result<User>> {
  try {
    const user: User = {
      id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    users.push(user)
    return success(user)
  } catch (error) {
    return failure(error instanceof Error ? error : new Error("Unknown error"))
  }
}
```

**Uso en API routes:**
```typescript
// src/app/api/auth/register/route.ts
const createResult = await userRepository.create(data)
if (isFailure(createResult)) {
  return NextResponse.json(
    { error: createResult.error.message },
    { status: 500 }
  )
}
return NextResponse.json({ user: createResult.data })
```

#### 🏗️ Repository Pattern (In-Memory Only)

Este proyecto usa el **Repository Pattern** para abstraer el acceso a datos y permitir cambiar entre implementaciones según el entorno:

- **dev**: In-memory repositories (rápido, sin base de datos)
- **stage/prod**: Prisma repositories (base de datos real)

**1. Definir interfaces de repositorio:**

```typescript
// src/lib/repositories/types.ts
export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>
  findByOwnerId(ownerId: string): Promise<Organization[]>
  create(data: CreateOrganizationInput): Promise<Organization>
  update(id: string, data: UpdateOrganizationInput): Promise<Organization>
  delete(id: string): Promise<void>
}

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(data: CreateUserInput): Promise<User>
  update(id: string, data: UpdateUserInput): Promise<User>
}

// Agregar más interfaces según las entidades del proyecto
```

**2. Implementación In-Memory (para dev):**

```typescript
// src/lib/repositories/in-memory/organization.repository.ts
import { OrganizationRepository } from "../types"

export const createInMemoryOrganizationRepository = (): OrganizationRepository => {
  const organizations: Map<string, Organization> = new Map()

  return {
    findById: async (id) => organizations.get(id) ?? null,
    
    findByOwnerId: async (ownerId) =>
      Array.from(organizations.values()).filter(org => org.ownerId === ownerId),
    
    create: async (data) => {
      const org = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      organizations.set(org.id, org)
      return org
    },
    
    update: async (id, data) => {
      const existing = organizations.get(id)
      if (!existing) throw new Error("Organization not found")
      const updated = { ...existing, ...data, updatedAt: new Date() }
      organizations.set(id, updated)
      return updated
    },
    
    delete: async (id) => {
      organizations.delete(id)
    }
  }
}
```

**3. Implementación Prisma (para stage/prod):**

```typescript
// src/lib/repositories/prisma/organization.repository.ts
import { PrismaClient } from "@/generated"
import { OrganizationRepository } from "../types"

export const createPrismaOrganizationRepository = (
  prisma: PrismaClient
): OrganizationRepository => ({
  findById: (id) => prisma.organization.findUnique({ where: { id } }),
  
  findByOwnerId: (ownerId) => prisma.organization.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" }
  }),
  
  create: (data) => prisma.organization.create({ data }),
  
  update: (id, data) => prisma.organization.update({
    where: { id },
    data
  }),
  
  delete: async (id) => {
    await prisma.organization.delete({ where: { id } })
  }
})
```

**4. Factory con selección por entorno:**

```typescript
// src/lib/repositories/index.ts
import { PrismaClient } from "@/generated"
import { createInMemoryOrganizationRepository } from "./in-memory/organization.repository"
import { createPrismaOrganizationRepository } from "./prisma/organization.repository"
import { OrganizationRepository, UserRepository } from "./types"

export interface Repositories {
  organizations: OrganizationRepository
  users: UserRepository
  // Agregar más repositorios según sea necesario
}

// Singleton para in-memory (mantiene estado entre requests en dev)
let inMemoryRepos: Repositories | null = null

const createInMemoryRepositories = (): Repositories => {
  if (!inMemoryRepos) {
    inMemoryRepos = {
      organizations: createInMemoryOrganizationRepository(),
      users: createInMemoryUserRepository(),
    }
  }
  return inMemoryRepos
}

const createPrismaRepositories = (prisma: PrismaClient): Repositories => ({
  organizations: createPrismaOrganizationRepository(prisma),
  users: createPrismaUserRepository(prisma),
})

// Factory principal - selecciona implementación según NODE_ENV
export const getRepositories = (): Repositories => {
  const env = process.env.NODE_ENV

  if (env === "development") {
    return createInMemoryRepositories()
  }

  // stage y production usan Prisma
  const prisma = new PrismaClient()
  return createPrismaRepositories(prisma)
}

// Para testing - permite inyectar mocks
export const createTestRepositories = (
  overrides: Partial<Repositories> = {}
): Repositories => ({
  organizations: overrides.organizations ?? createInMemoryOrganizationRepository(),
  users: overrides.users ?? createInMemoryUserRepository(),
})
```

**5. Uso en API routes:**

```typescript
// src/app/api/organizations/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRepositories } from "@/lib/repositories"

// ✅ Bueno: Obtiene repositorios según el entorno
const repos = getRepositories()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const organizations = await repos.organizations.findByOwnerId(session.user.id)
  return NextResponse.json({ organizations })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, description } = await request.json()
  const organization = await repos.organizations.create({
    name,
    description,
    ownerId: session.user.id,
  })

  return NextResponse.json({ organization }, { status: 201 })
}
```

**6. Configuración de entorno:**

```bash
# .env.development
NODE_ENV=development
# No necesita DATABASE_URL - usa in-memory

# .env.staging
NODE_ENV=staging
DATABASE_URL="postgresql://..."

# .env.production
NODE_ENV=production
DATABASE_URL="postgresql://..."
```

**Beneficios de este patrón:**
- ✅ **Dev rápido**: Sin necesidad de base de datos local
- ✅ **Testing fácil**: Inyecta mocks o usa in-memory
- ✅ **Cambio transparente**: Mismo código, diferente implementación
- ✅ **Type-safe**: TypeScript garantiza que las implementaciones cumplan el contrato

#### 🧪 Testing

**CRÍTICO**: Ralph DEBE probar cada feature antes de marcarla como "done" en prd.json

##### Testing Strategy

Este proyecto usa una estrategia de testing dual:
- **Jest** para backend/API testing (unit & integration tests)
- **Playwright** para frontend E2E testing

##### Jest Setup (Backend/API Testing)

**Instalación:**
```bash
# Instalar Jest y dependencias
pnpm add -D jest @types/jest ts-jest @testing-library/jest-dom
pnpm add -D @testing-library/react @testing-library/react-hooks

# Ejecutar tests
pnpm test
pnpm test:watch
pnpm test:coverage
```

**Configuración jest.config.js:**
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    'src/lib/**/*.ts',
    '!src/**/*.d.ts',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

**Estructura de tests backend:**
```
src/
├── app/
│   └── api/
│       ├── organizations/
│       │   ├── route.ts
│       │   └── __tests__/
│       │       └── route.test.ts
│       └── tasks/
│           ├── route.ts
│           └── __tests__/
│               └── route.test.ts
└── lib/
    ├── auth.ts
    └── __tests__/
        └── auth.test.ts
```

**Ejemplo de test de API:**
```typescript
// src/app/api/organizations/route.test.ts
import { GET, POST } from '../route'
import { getServerSession } from 'next-auth'
import { getRepositories } from '@/lib/repositories'
import { createTestRepositories } from '@/lib/repositories'

jest.mock('next-auth')
jest.mock('@/lib/repositories')

describe('/api/organizations', () => {
  let mockOrgRepo: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock repository methods
    mockOrgRepo = {
      findByOwnerId: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }
    
    ;(getRepositories as jest.Mock).mockReturnValue({
      organizations: mockOrgRepo,
      users: {},
      // ... other repos
    })
  })

  describe('GET', () => {
    it('returns 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null)
      
      const request = new Request('http://localhost:3000/api/organizations')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
    })

    it('returns organizations for authenticated user', async () => {
      const mockSession = { user: { id: 'user-1', email: 'test@example.com' } }
      const mockOrgs = [
        { id: 'org-1', name: 'Test Org', ownerId: 'user-1' }
      ]
      
      (getServerSession as jest.Mock).mockResolvedValue(mockSession)
      mockOrgRepo.findByOwnerId.mockResolvedValue(mockOrgs)
      
      const request = new Request('http://localhost:3000/api/organizations')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.organizations).toEqual(mockOrgs)
      expect(mockOrgRepo.findByOwnerId).toHaveBeenCalledWith('user-1')
    })
  })

  describe('POST', () => {
    it('creates organization for authenticated user', async () => {
      const mockSession = { user: { id: 'user-1', email: 'test@example.com' } }
      const mockOrg = { id: 'org-1', name: 'New Org', ownerId: 'user-1' }
      
      (getServerSession as jest.Mock).mockResolvedValue(mockSession)
      mockOrgRepo.create.mockResolvedValue(mockOrg)
      
      const request = new Request('http://localhost:3000/api/organizations', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Org', description: 'Test' }),
      })
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.organization).toEqual(mockOrg)
      expect(mockOrgRepo.create).toHaveBeenCalledWith({
        name: 'New Org',
        description: 'Test',
        ownerId: 'user-1'
      })
    })
  })
})
```

**Scripts en package.json:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

##### Playwright Setup (Frontend E2E Testing)

**Setup de Playwright:**
```bash
# Instalar Playwright
pnpm add -D @playwright/test

# Instalar browsers
npx playwright install

# Ejecutar tests
pnpm test:e2e

# Ejecutar tests en modo UI (debugging)
pnpm test:e2e:ui

# Ejecutar tests en modo headed (ver el browser)
pnpm test:e2e:headed
```

**Estructura de tests:**
```
tests/
├── e2e/
│   ├── auth.spec.ts           # Tests de autenticación
│   ├── organizations.spec.ts  # Tests de organizaciones
│   ├── projects.spec.ts       # Tests de proyectos
│   ├── tasks.spec.ts          # Tests de tareas
│   └── ...
└── fixtures/
    └── test-helpers.ts         # Helpers y fixtures reutilizables
```

**Ejemplo de test E2E:**
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('user can sign up and sign in', async ({ page }) => {
    // Sign up
    await page.goto('/auth/signup')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="name"]', 'Test User')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('text=Test User')).toBeVisible()
  })
  
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpass')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })
})
```

**Reglas de Testing:**
1. **Ejecutar TypeScript check**: `npx tsc --noEmit` antes de cada commit
2. **Ejecutar Jest tests**: `pnpm test` para tests de backend/API
3. **Ejecutar Playwright tests**: `pnpm test:e2e` para tests E2E de frontend
4. **Documentar pruebas**: En progress.txt, describir qué se probó y resultados
5. **NO marcar como "done"**: Si los tests fallan, dejar como "pending" y documentar
6. **Tests para cada feature**: 
   - APIs: Al menos un test Jest por endpoint
   - UI: Al menos un test E2E Playwright por flujo de usuario
7. **Usar mocks**: En Jest, mockear Prisma y NextAuth para tests aislados
8. **Usar fixtures**: En Playwright, crear helpers reutilizables para login, crear datos, etc.

**Cuándo usar cada tipo de test:**
- **Jest**: Para lógica de negocio, validaciones, API endpoints, funciones helper
- **Playwright**: Para flujos de usuario completos, navegación, interacciones UI

**Configuración en package.json:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

**playwright.config.ts básico:**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### 🔧 Functional, No-Class Approach
- **Preferir funciones sobre clases**
- Usar composición de funciones en lugar de herencia
- Evitar `this` y estado mutable cuando sea posible
- Usar React hooks y functional components (no class components)

**Ejemplo de estilo funcional:**
```typescript
// ✅ Bueno: Enfoque funcional
const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0]

const calculateTotal = (items: Item[]): number =>
  items.reduce((sum, item) => sum + item.price, 0)

// Composición de funciones
const processOrder = (order: Order) =>
  pipe(
    validateOrder,
    calculateTotal,
    applyDiscount,
    formatReceipt
  )(order)

// ❌ Malo: Enfoque con clases
class OrderProcessor {
  private order: Order
  
  constructor(order: Order) {
    this.order = order
  }
  
  process() {
    this.validate()
    this.calculateTotal()
    // ...
  }
}
```

**Para React components:**
```tsx
// ✅ Bueno: Functional component con hooks
export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])
  
  return user ? <div>{user.name}</div> : <Loading />
}

// ❌ Malo: Class component
class UserProfile extends React.Component {
  state = { user: null }
  
  componentDidMount() {
    // ...
  }
  
  render() {
    // ...
  }
}
```

### Estilo UI: shadcn/ui

**Este proyecto DEBE usar shadcn/ui para todos los componentes de interfaz.**

- Instalación: `npx shadcn-ui@latest init`
- Componentes disponibles: `npx shadcn-ui@latest add [component]`
- Documentación: https://ui.shadcn.com

**Reglas de uso:**
1. Usar componentes de shadcn en lugar de HTML básico o Tailwind raw
2. Los componentes principales incluyen: Button, Input, Card, Dialog, Select, Table, etc.
3. Usar el sistema de temas de shadcn (variables CSS en globals.css)
4. Los icons deben ser de Lucide React (incluido con shadcn)
5. Para formularios, usar react-hook-form + zod validation

**Ejemplo de uso correcto:**
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

### Data Access Configuration

Este proyecto usa el **Repository Pattern** para abstraer el acceso a datos:

**En desarrollo (NODE_ENV=development):**
- Usa repositorios in-memory (sin base de datos)
- Rápido, sin configuración
- Datos se pierden al reiniciar

**En stage/production:**
- Usa repositorios Prisma (base de datos real)
- El cliente Prisma se genera en `src/generated/`
- Importar así: `import { PrismaClient } from "@/generated"`

**Uso en API routes:**
```typescript
import { getRepositories } from "@/lib/repositories"

const repos = getRepositories() // Automáticamente selecciona implementación según NODE_ENV

export async function GET(request: Request) {
  const organizations = await repos.organizations.findByOwnerId(userId)
  return NextResponse.json({ organizations })
}
```

**No usar** imports directos de Prisma en routes. Siempre usar repositorios.

### Auth Configuration

El `authOptions` está en `src/lib/auth.ts`. Importar así:

```typescript
import { authOptions } from "@/lib/auth"
```

**No exportar** `authOptions` desde archivos de ruta de Next.js (causa errores de tipo).

## 🛠️ Trabajando con Kilo Code

### Prompt Inicial

Cuando inicies una sesión, dale este contexto a Kilo Code:

```
Este proyecto usa Ralph para AI coding agents.

Lee estos archivos para entender el contexto:
1. RALPH.md - Este archivo
2. plans/prd.json - Las tareas pendientes
3. plans/progress.txt - Lo que se ha hecho

Estoy ejecutando ralph.sh que te llamará en un loop.
Tu trabajo es:
1. Elegir la tarea de mayor prioridad del prd.json (status != "done")
2. Implementarla completamente
3. Marcarla como status: "done"
4. Append tus learnings a progress.txt
5. Hacer un git commit
```

### Prompts Comunes

**Agregar nueva feature al backlog:**
```
Agrega esta user story al prd.json:

Título: [FEATURE_NAME]
Descripción: [DESCRIPCIÓN]
Acceptance Criteria:
- [Criterio 1]
- [Criterio 2]

Asegúrate de que sea una tarea pequeña y atómica.
```

**Dividir tarea grande:**
```
La tarea [TASK_ID] en prd.json es muy grande.
Divídela en 3-5 subtareas más pequeñas.
Reemplaza esa tarea con las subtareas en el prd.json.
```

**Review de progreso:**
```
Resume lo que se ha logrado hasta ahora:
1. Lee progress.txt
2. Cuenta cuántas tareas están status: "done"
3. Identifica blockers o problemas recurrentes
```

## 🚨 Troubleshooting

### Ralph se queda en un loop infinito

**Síntomas:**
- Hace commits pero no marca tareas como completas
- Trabaja en la misma tarea repetidamente

**Solución:**
1. Para el loop (Ctrl+C)
2. Revisa progress.txt - ¿hay algún error?
3. Revisa los últimos commits - ¿qué intentó hacer?
4. Simplifica la tarea en prd.json o divídela en partes más pequeñas
5. Ejecuta ralph-once.sh para ir paso a paso

### TypeScript errors en .next/types

**Síntomas:**
- Errores sobre exports no permitidos en route files
- "Property 'X' is incompatible with index signature"

**Solución:**
- No exportar funciones helper desde archivos `route.ts`
- Mover helpers a archivos en `src/lib/`
- Solo exportar HTTP handlers (GET, POST, etc.) desde routes

### Los tests fallan en CI

**Síntomas:**
- Ralph commitea código
- CI se pone rojo
- Ralph no se da cuenta

**Solución:**
1. Agrega verificación explícita en el prompt de ralph.sh
2. Considera ejecutar tests localmente antes de cada commit
3. Usa git hooks para prevenir commits rotos

### El código es de baja calidad

**Síntomas:**
- Funciona pero es difícil de mantener
- Muchos code smells

**Solución:**
1. Haz las tareas más pequeñas
2. Agrega más feedback loops (linting, formatting)
3. Considera human-in-the-loop para features complejas
4. Agrega code review guidelines al prompt

## 📚 Recursos

- [Ralph original](https://ghuntley.com/ralph/)
- [Video explicativo](https://youtu.be/_IK18goX4X8)
- [Anthropic: Effective Harnesses for Long-running Agents](https://www.anthropic.com/research/effective-harnesses)

## 💡 Tips Pro

1. **Usa ralph-once.sh al principio** - Aprende qué hace Ralph antes de dejarlo solo
2. **Invierte en tests** - Más tests = más confianza en modo AFK
3. **Tareas pequeñas siempre** - Una tarea compleja = múltiples tareas pequeñas
4. **Lee progress.txt regularmente** - Es tu ventana a lo que piensa el LLM
5. **Commitea el prd.json** - Para que el LLM vea su evolución en git history
6. **Corre type-checking** - `npx tsc --noEmit` antes de cada commit
7. **Usa path aliases** - `@/lib/auth` en lugar de rutas relativas

## 🎓 Filosofía

> "El dev branch es siempre más loco que el main branch. Estamos experimentando aquí."

Ralph no es magia. Es simplemente una forma más intuitiva de trabajar con coding agents que refleja cómo los ingenieros reales trabajan con un kanban board.

En lugar de ser un "planner anal retentivo", con Ralph eres un **product designer** enfocado en QUÉ necesita hacerse, no CÓMO.

---

**Última actualización**: 2026-02-01
**Herramienta AI**: Kilo Code (Claude)
