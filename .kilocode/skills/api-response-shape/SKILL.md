---
name: api-response-shape
description: Return nested objects instead of IDs when frontend needs related data. Use when designing or reviewing API endpoints.
---

# API Response Shape

Return nested objects instead of IDs when frontend needs related data.

## Good Example

```typescript
return NextResponse.json({
  process: {
    ...process,
    department: { id: dept.id, name: dept.name },
    organization: { id: org.id, name: org.name },
  }
})
```

Frontend can then access:
```typescript
process.department.name
process.organization.name
```

## Bad Example (Avoid)

```typescript
return NextResponse.json({
  process: {
    ...process,
    departmentId: dept.id,
    organizationId: org.id,
  }
})
```

This forces frontend to make additional API calls or maintain a lookup cache.

## Guidelines

- Nest related entities when frontend needs their properties
- Include `id` and `name` at minimum for related objects
- Only return IDs when frontend doesn't need the full object
- Consider what the UI component needs before deciding response shape
