---
name: result-type
description: Use Result<T, E> for error handling instead of exceptions. Use when the user asks about error handling patterns or needs to handle failures in a type-safe way.
---

# Result Type Pattern

Use `Result<T, E>` for error handling instead of exceptions.

## Import

```typescript
import { success, failure, isSuccess, isFailure } from '@/lib/result'
```

## Basic Usage

```typescript
function findUser(id: string): Result<User, 'not_found'> {
  const user = users.find((u) => u.id === id)
  if (!user) return failure('not_found')
  return success(user)
}
```

## Handling Results

```typescript
const result = findUser('123')

if (isSuccess(result)) {
  console.log(result.data) // TypeScript knows result.data is User
}

if (isFailure(result)) {
  console.log(result.error) // TypeScript knows result.error is 'not_found'
}
```

## Error Unions

```typescript
type UserError = 'not_found' | 'unauthorized' | 'database_error'

function getUser(id: string): Result<User, UserError> {
  if (!id) return failure('not_found')
  const user = users.find((u) => u.id === id)
  if (!user) return failure('not_found')
  return success(user)
}
```

## Chaining Operations

```typescript
function getUserWithDepartment(userId: string): Result<UserWithDept, UserError> {
  const userResult = findUser(userId)
  
  if (isFailure(userResult)) {
    return failure(userResult.error)
  }
  
  const deptResult = findDepartment(userResult.data.departmentId)
  if (isFailure(deptResult)) {
    return failure(deptResult.error)
  }
  
  return success({
    ...userResult.data,
    department: deptResult.data
  })
}
```

## Never Throw Exceptions

- All errors should be returned as `Result<T, E>`
- Never use `throw` in application code
- Use `failure()` for both custom error codes and caught exceptions
