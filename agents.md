# AGENTS.md

This document provides guidelines and instructions for AI coding agents working on this project.

## Project Overview

This is a team and project management application built with Next.js 14, Prisma, NextAuth.js, and shadcn/ui.

## Dev Environment Tips

- Use `pnpm install` to install dependencies (pnpm is the preferred package manager)
- Run `npx tsc --noEmit` to check for TypeScript errors before committing
- Run `pnpm lint` to check for linting issues
- Use `pnpm test` to run Jest tests (backend/API tests)
- Use `pnpm test:e2e` to run Playwright E2E tests
- Run `pnpm build` to verify the project builds successfully
- Check `plans/progress.txt` to see what was done in previous iterations
- The project uses in-memory repositories in development mode - no database setup required

## Testing Instructions

**CRITICAL**: You MUST test each feature before marking it as "done" in prd.json.

### Testing Strategy

This project uses a dual testing strategy:
- **Jest** for backend/API testing (unit & integration tests)
- **Playwright** for E2E frontend testing

### Before marking a task as "done":

1. Run `npx tsc --noEmit` - must pass without errors
2. Run `pnpm lint` - must pass without errors
3. Run `pnpm test` - all Jest tests must pass
4. Run `pnpm test:e2e` - all Playwright E2E tests must pass
5. Test the feature manually in the browser
6. Verify no errors in the browser console
7. Document results in `plans/progress.txt`
8. Only mark as "done" when all tests pass

## Code Standards

### Clean Code

- Write self-documenting code with descriptive names for variables, functions, and files
- Keep functions small with a single responsibility
- Avoid unnecessary comments - the code should be clear by itself

### Error Handling

This project uses a `Result<T, E>` type for explicit, type-safe error handling instead of exceptions:

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

### Repository Pattern

This project uses the Repository Pattern to abstract data access:

- **Development**: In-memory repositories (fast, no database required)
- **Staging/Production**: Prisma repositories (real database)

Use `getRepositories()` to get the appropriate repository implementation for the environment:

```typescript
import { getRepositories } from "@/lib/repositories"

const repos = getRepositories()
// Use repos.organizations, repos.users, etc.
```

### Dependency Injection

Pass dependencies as parameters instead of importing them directly:

```typescript
// ✅ Good: Dependency injected
async function getUser(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({ where: { id: userId } })
}

// ❌ Bad: Hardcoded dependency
async function getUser(userId: string) {
  const prisma = new PrismaClient()
  return prisma.user.findUnique({ where: { id: userId } })
}
```

## Working with Ralph (AFK Mode)

This project uses Ralph for autonomous task completion. Ralph is a bash loop that allows AI coding agents to work through a backlog of tasks.

### File Structure

```
plans/
├── prd.json          # User stories / tasks (edit this to add/manage tasks)
├── progress.txt      # Memory between iterations (append, don't overwrite)
├── ralph.sh          # Main loop (AFK mode)
└── ralph-once.sh     # One iteration (human-in-the-loop mode)
```

### Running Ralph

```bash
# AFK mode (automatic, maximum 10 iterations)
./plans/ralph.sh 10

# Human-in-the-loop mode (one iteration at a time)
./plans/ralph-once.sh
```

### Task Format

Edit `plans/prd.json` with your tasks:

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

**Important**: Set `status` to `"pending"` or `"done"`. Ralph processes features where `status != "done"`.

### Progress Tracking

- Each iteration creates a git commit
- Use `plans/progress.txt` to:
  - Remember architectural decisions
  - Leave notes for the next iteration
  - Document blockers or learned lessons
- **Use append mode** - don't overwrite, keep the historical log

### Principles for Task Definition

**Keep tasks small** - Large tasks = inflated context = worse code:

```json
// ❌ Bad
{ "title": "Build entire authentication system", "status": "pending" }

// ✅ Good
[
  { "title": "Add login form UI", "status": "pending" },
  { "title": "Connect login to API", "status": "pending" },
  { "title": "Add error handling", "status": "pending" },
  { "title": "Add session management", "status": "pending" }
]
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Data Layer**: Repository Pattern
- **Database**: In-memory (dev) / PostgreSQL (stage/prod with Prisma)
- **Auth**: NextAuth.js with JWT strategy
- **UI**: shadcn/ui + Tailwind CSS
- **Testing**: Jest (backend) + Playwright (E2E)
- **Package Manager**: pnpm

## Commit Guidelines

- Each Ralph iteration = 1 git commit
- Review commits with `git log`
- This allows easy revert if something goes wrong
- The LLM can see git history for context
