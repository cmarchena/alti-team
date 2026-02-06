# AGENTS.md

This document provides guidelines for AI coding agents working on this project.

## Project Overview

Team and project management application built with Next.js 14 (App Router), PostgreSQL, NextAuth.js, and shadcn/ui.

## Build/Lint/Test Commands

```bash
pnpm install          # Install dependencies (pnpm is preferred)
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm lint             # Run ESLint
pnpm test             # Run Jest unit/integration tests
pnpm test -- <file>   # Run single Jest test file
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:e2e:report  # Show E2E test report
npx tsc --noEmit      # Check TypeScript errors
```

## Code Style Guidelines

### TypeScript

- Strict mode enabled in `tsconfig.json`
- Use `@/*` path aliases for imports (`import X from "@/lib/x"`)
- Enable `noImplicitAny: true` - avoid implicit `any` types

### Formatting & Linting

- **Prettier**: `semi: false`, `singleQuote: true` (see `package.json`)
- **ESLint**: Extends `next/core-web-vitals`
- Run linting before committing

### Naming Conventions

- **Files**: kebab-case for components (`user-profile.tsx`), camelCase for utilities (`auth.ts`)
- **Variables/Functions**: camelCase (`userId`, `getUserById`)
- **Types/Interfaces**: PascalCase (`User`, `IUserRepository`)
- **Constants**: UPPER_SNAKE_CASE for config values

### Error Handling

Use `Result<T, E>` type from `@/lib/result` instead of exceptions:

```typescript
import { success, failure, isSuccess } from '@/lib/result'

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

Abstract data access with repositories. Use `getRepositories()` factory:

```typescript
import { getRepositories } from '@/lib/repositories'

const repos = getRepositories()
const users = await repos.users.findById(id)
```

| Environment | Data Layer | Configuration                |
| ----------- | ---------- | ---------------------------- |
| Development | In-memory  | No DB required (default)     |
| Staging     | PostgreSQL | `USE_POSTGRES=true pnpm dev` |
| Production  | PostgreSQL | `pnpm build && pnpm start`   |

### React Components

- Use functional components with TypeScript interfaces for props
- Prefer composition over complex prop drilling
- Use shadcn/ui components from `@/components/ui/...`

## Testing Strategy

**Before marking tasks as done:**

1. `npx tsc --noEmit` passes
2. `pnpm lint` passes
3. `pnpm test` passes
4. `pnpm test:e2e` passes (write tests in `tests/**/*.spec.ts` according to PRD)
5. `pnpm build` succeeds

### Test Locations

- Jest: `src/**/__tests__/**/*.test.ts`
- Playwright: `tests/**/*.spec.ts`

## Ralph Workflow (Autonomous Task Mode)

### File Structure

```
plans/
├── prd.json          # Tasks (status: "pending" or "done")
├── progress.txt      # Memory between iterations (append, don't overwrite)
├── ralph.sh          # AFK mode
└── ralph-once.sh     # Human-in-the-loop mode
```

### Task Format

```json
{
  "features": [
    {
      "id": "feat-001",
      "title": "Add login form",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

**Important**: Ralph processes features where `status != "done"`.

### Progress Tracking

- Use `progress.txt` to leave notes for the next iteration
- **Append mode** - don't overwrite, keep historical log

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (dev: in-memory)
- **Auth**: NextAuth.js with JWT
- **UI**: shadcn/ui + Tailwind CSS
- **Testing**: Jest + Playwright
- **Package Manager**: pnpm

## File Structure

```
src/
├── app/api/         # API routes
├── components/      # React components
├── lib/            # Utilities, repositories, Result<T,E>
├── mcp-server/     # MCP server tools
└── types/          # TypeScript definitions
tests/              # E2E tests
plans/             # Ralph task management
```
