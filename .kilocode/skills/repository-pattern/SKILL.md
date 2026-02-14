---
name: repository-pattern
description: Abstract data access using repositories from a centralized factory. Use when the user needs to perform CRUD operations on database entities.
---

# Repository Pattern

Abstract data access using repositories from a centralized factory.

## Import

```typescript
import { getRepositories } from '@/lib/repositories'
```

## Usage

```typescript
const repos = getRepositories()

// Find by ID
const user = await repos.users.findById(id)

// Find many
const users = await repos.users.findAll()

// Create
const newUser = await repos.users.create({ name: 'John' })

// Update
const updated = await repos.users.update(id, { name: 'Jane' })

// Delete
await repos.users.delete(id)
```

## Available Repositories

- `users` - User management
- `organizations` - Organization CRUD
- `departments` - Department management
- `processes` - Process management
- `tasks` - Task management
- `teams` - Team management

## Environment Behavior

| Environment | Data Layer |
|-------------|------------|
| Development | In-memory (no DB required) |
| Staging | PostgreSQL |
| Production | PostgreSQL |

Enable PostgreSQL in staging: `USE_POSTGRES=true pnpm dev`
