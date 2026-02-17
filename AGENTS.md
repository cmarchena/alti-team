# AGENTS.md

Guidelines for AI coding agents working on this monorepo.

## Project Overview

AltiTeam is a team/project management app with Git submodules:

```
alti-team/           # Parent repo
├── front/           # Next.js 14 frontend (submodule)
├── back/            # Express backend (submodule)
├── tests/           # Playwright E2E tests
├── plans/           # Ralph autonomous task files
└── skills/          # Pattern documentation
```

## Build/Lint/Test Commands

### Frontend (front/)

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # Run ESLint
npx tsc --noEmit      # Check TypeScript errors

# Jest unit tests
pnpm test                                                # Run all tests
pnpm test -- src/lib/repositories/__tests__/file.test.ts # Single test file
pnpm test -- --testNamePattern="should create"           # Tests matching pattern

# Playwright E2E tests
pnpm test:e2e                             # Run all E2E tests
pnpm test:e2e -- --project=chromium       # Specific browser
pnpm test:e2e:report                      # Show HTML report
```

### Backend (back/)

```bash
pnpm dev              # Start dev server
pnpm build            # Compile TypeScript
pnpm test             # Run Jest tests
npx tsc --noEmit      # Check TypeScript errors
```

### Database

```bash
docker-compose up -d    # Start PostgreSQL
docker-compose down     # Stop containers
# Adminer: http://localhost:8080 (postgres/alti_team/password123)
```

## Code Style Guidelines

### TypeScript & Imports

- **Strict mode** - no implicit `any`
- **Path alias**: Use `@/*` for imports
- **Import order**: External packages → Internal aliases → Relative paths

```typescript
import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getRepositories } from '@/lib/repositories'
import { success, failure, isSuccess } from '@/lib/result'
```

### Formatting & Naming

- **Prettier**: `semi: false`, `singleQuote: true`
- **ESLint**: Extends `next/core-web-vitals`
- Components: kebab-case (`user-profile.tsx`), Variables: camelCase (`userId`)
- Types: PascalCase (`User`), Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Error Handling

Use `Result<T, E>` - never throw exceptions:

```typescript
import { success, failure, isSuccess } from '@/lib/result'

function findUser(id: string): Result<User, 'not_found'> {
  const user = users.find((u) => u.id === id)
  if (!user) return failure('not_found')
  return success(user)
}
```

### Repository Pattern

```typescript
import { getRepositories } from '@/lib/repositories'
const repos = getRepositories()
const user = await repos.users.findById(id)
```

| Environment | Data Layer | Command |
|-------------|------------|---------|
| Development | In-memory | `pnpm dev` |
| Staging | PostgreSQL | `USE_POSTGRES=true pnpm dev` |
| Production | PostgreSQL | `pnpm build && pnpm start` |

### React Best Practices

- Functional components with TypeScript interfaces
- Handle loading/error states explicitly
- Memoize values passed to context/hooks to prevent infinite loops
- Use CSS variables for theming: `bg-background`, `text-foreground`, `border-border`

### Internationalization

```typescript
import { useLanguage } from '@/components/language-provider'
const { t } = useLanguage()
return <h1>{t('navigation.dashboard')}</h1>
```

## Testing Strategy

**Before marking tasks complete:**

1. `npx tsc --noEmit` passes
2. `pnpm lint` passes
3. `pnpm test` passes
4. `pnpm test:e2e` passes (if applicable)
5. `pnpm build` succeeds

| Type | Location |
|------|----------|
| Jest unit | `src/**/__tests__/**/*.test.ts` |
| Playwright E2E | `tests/**/*.spec.ts` |

## Next.js App Router

Create routes in order (parent before children):

```
src/app/
├── [route]/
│   ├── page.tsx          # Index page
│   ├── [id]/page.tsx     # Detail page
│   └── new/page.tsx
```

## Git Submodule Workflow

**Always commit submodules before the parent repo.**

```bash
git submodule status
git submodule update --init --recursive
```

## Ralph Workflow

```
plans/
├── prd.json          # Tasks with status: "pending" or "done"
├── progress.txt      # Memory between iterations (append mode)
└── ralph.sh          # Autonomous execution
```

Process features where `status != "done"`.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (in-memory in dev)
- **Auth**: NextAuth.js with JWT
- **UI**: shadcn/ui + Tailwind CSS
- **Testing**: Jest + Playwright
- **Package Manager**: pnpm

## Verification Checklist

- [ ] TypeScript: `npx tsc --noEmit`
- [ ] Lint: `pnpm lint`
- [ ] Tests: `pnpm test`
- [ ] E2E: `pnpm test:e2e`
- [ ] Build: `pnpm build`
- [ ] Submodules committed before parent
- [ ] No hardcoded colors (use CSS variables)
- [ ] Memoized context/hook values
