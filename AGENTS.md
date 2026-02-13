# AGENTS.md

This document provides guidelines for AI coding agents working on this project.

## Project Overview

AltiTeam is a team and project management application with a monorepo structure using Git submodules:

```
alti-team/           # Parent repo (E2E tests, docs, infrastructure)
├── front/           # Next.js 14 frontend (submodule)
├── back/            # Backend API (submodule)
├── tests/           # Playwright E2E tests
├── docs/            # Documentation
├── plans/           # Ralph workflow (autonomous task mode)
└── schema.sql/      # Database schema
```

## Build/Lint/Test Commands

### Root Level (Monorepo)

```bash
# Install dependencies
pnpm install

# Initialize and update submodules
git submodule update --init --recursive

# Run E2E tests
pnpm test:e2e
pnpm test:e2e -- tests/auth.spec.ts      # Run single E2E test file

# Show E2E test report
pnpm test:e2e:report
```

### Frontend (front/)

```bash
cd front

pnpm install          # Install dependencies
pnpm dev              # Start development server (http://localhost:3000)
pnpm build            # Build for production
pnpm lint             # Run ESLint
pnpm test             # Run Jest unit tests
pnpm test -- src/lib/repositories/__tests__/file.test.ts  # Run single test
npx tsc --noEmit      # Check TypeScript errors
```

### Backend (back/)

```bash
cd back

pnpm install
pnpm dev              # Start backend server
pnpm build
pnpm lint
pnpm test
npx tsc --noEmit
```

### Database

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Stop containers
docker-compose down

# View database at Adminer: http://localhost:8080
# System: PostgreSQL, Server: postgres, User: alti_team, Password: password123
```

## Code Style Guidelines

### TypeScript

- Strict mode enabled in `tsconfig.json`
- Use `@/*` path aliases for imports: `import X from "@/lib/x"`
- Avoid implicit `any` types - `noImplicitAny: true`
- Use optional chaining for nullable properties: `item?.department?.name`

### Formatting & Linting

- **Prettier**: `semi: false`, `singleQuote: true`
- **ESLint**: Extends `next/core-web-vitals`
- Run `pnpm lint` before committing

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `user-profile.tsx` |
| Utilities | camelCase | `auth.ts` |
| Variables/Functions | camelCase | `userId`, `getUserById` |
| Types/Interfaces | PascalCase | `User`, `IUserRepository` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |

### Error Handling

Use `Result<T, E>` type from `@/lib/result` instead of exceptions:

```typescript
import { success, failure, isSuccess, isFailure } from '@/lib/result'

function findUser(id: string): Result<User, 'not_found'> {
  const user = users.find((u) => u.id === id)
  if (!user) return failure('not_found')
  return success(user)
}

const result = findUser('123')
if (isSuccess(result)) {
  console.log(result.data)
}
```

### Repository Pattern

Abstract data access with repositories:

```typescript
import { getRepositories } from '@/lib/repositories'

const repos = getRepositories()
const users = await repos.users.findById(id)
```

| Environment | Data Layer | Configuration |
|-------------|------------|---------------|
| Development | In-memory | No DB required (default) |
| Staging | PostgreSQL | `USE_POSTGRES=true pnpm dev` |
| Production | PostgreSQL | `pnpm build && pnpm start` |

### API Response Shape

Return nested objects instead of IDs when frontend needs related data:

```typescript
// Good: Frontend can use department.name directly
return NextResponse.json({
  process: {
    ...process,
    department: { id: dept.id, name: dept.name },
    organization: { id: org.id, name: org.name },
  }
})
```

### React Components

- Use functional components with TypeScript interfaces
- Handle loading and error states explicitly
- Use shadcn/ui components from `@/components/ui/...`

```typescript
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
```

## Git Submodule Workflow

**Always commit submodules before the parent repo:**

```bash
# 1. Commit in submodule
cd front
git add -A
git commit -m "feat: add new feature"
git push origin main

# 2. Commit parent repo
cd ..
git add front back
git commit -m "chore: update submodule references"
git push origin main
```

Check submodule status:
```bash
git submodule status
```

## Next.js App Router Structure

Create routes in this order:

```
src/app/
├── [route]/              # Parent route (create first!)
│   ├── page.tsx          # Listing/index page
│   ├── [id]/
│   │   ├── page.tsx      # Detail page
│   │   ├── edit/page.tsx # Child routes
│   │   └── analytics/page.tsx
│   └── new/page.tsx      # Create new page
```

**Important**: Create parent routes before child routes that link to them.

## Testing Strategy

**Before marking tasks as done:**

1. `npx tsc --noEmit` passes (in front/ and back/)
2. `pnpm lint` passes
3. `pnpm test` passes
4. `pnpm test:e2e` passes
5. `pnpm build` succeeds

### Test Locations

| Type | Location |
|------|----------|
| Jest unit | `src/**/__tests__/**/*.test.ts` |
| Playwright E2E | `tests/**/*.spec.ts` |

## Ralph Workflow (Autonomous Task Mode)

```
plans/
├── prd.json          # Tasks with status: "pending" or "done"
├── progress.txt      # Memory between iterations (append mode)
├── ralph.sh          # Autonomous mode
└── ralph-once.sh     # Human-in-the-loop mode
```

Process features where `status != "done"`.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (dev: in-memory)
- **Auth**: NextAuth.js with JWT
- **UI**: shadcn/ui + Tailwind CSS
- **Testing**: Jest + Playwright
- **Package Manager**: pnpm
- **Containerization**: Docker Compose

## Verification Checklist

After implementing features:

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Linting passes: `pnpm lint`
- [ ] Unit tests pass: `pnpm test`
- [ ] E2E tests pass: `pnpm test:e2e`
- [ ] Build succeeds: `pnpm build`
- [ ] Submodules committed and pushed in correct order
- [ ] Parent routes exist before child routes
- [ ] API responses match frontend interface expectations
