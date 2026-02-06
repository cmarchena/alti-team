# AltiTeam Developer Guide

This guide provides comprehensive documentation for developers who want to extend, modify, or contribute to the AltiTeam project.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [MCP Server Development](#mcp-server-development)
- [Adding New MCP Tools](#adding-new-mcp-tools)
- [Chat Client Development](#chat-client-development)
- [Repository Layer](#repository-layer)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing Guidelines](#contributing-guidelines)

---

## Architecture Overview

AltiTeam follows a three-layer architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chat UI Layer                            │
│  Next.js 14 App Router + React + Tailwind + Anthropic SDK       │
│  Responsibilities:                                              │
│  - User interface rendering                                      │
│  - Message handling and streaming                                │
│  - MCP client integration                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Claude AI Layer                             │
│  Anthropic API with MCP Client enabled                          │
│  Responsibilities:                                              │
│  - Natural language understanding                                │
│  - Tool selection and orchestration                              │
│  - Response generation                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MCP Server Layer                           │
│  Node.js + TypeScript + MCP SDK                                 │
│  Responsibilities:                                              │
│  - Tool registration and exposure                                │
│  - Tool call handling                                            │
│  - Authentication and authorization                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Repository Layer                             │
│  Repository Pattern + PostgreSQL/In-Memory                       │
│  Responsibilities:                                              │
│  - Data access abstraction                                       │
│  - Database operations                                          │
│  - Business logic encapsulation                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                │
│  PostgreSQL Database                                            │
│  (In-memory for development)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User sends message in Chat UI
2. Chat UI calls Anthropic API with MCP client enabled
3. Claude decides which MCP tools to use
4. MCP Server receives tool calls and executes them
5. MCP Server queries/updates data via repositories
6. Results flow back through Claude to Chat UI
7. Chat UI renders formatted response with tool results

---

## Project Structure

```
alti-team/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── chat/          # Chat API with MCP integration
│   │   │   ├── dashboard/     # Dashboard metrics
│   │   │   ├── organizations/ # Organization CRUD
│   │   │   ├── projects/      # Project management
│   │   │   ├── tasks/         # Task management
│   │   │   └── ...            # Other API routes
│   │   ├── chat/              # Chat UI page
│   │   ├── organizations/     # Organization pages
│   │   └── ...                # Other pages
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── chat/             # Chat-specific components
│   ├── lib/                   # Utilities and core logic
│   │   ├── repositories/     # Repository pattern implementations
│   │   ├── mcp/              # MCP client
│   │   ├── chat/             # Chat workflow types
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── result.ts         # Result<T, E> type
│   │   └── notifications.ts  # Notification utilities
│   ├── mcp-server/           # MCP Server
│   │   ├── tools/            # MCP tool implementations
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── health.ts         # Health check system
│   │   ├── logger.ts         # Structured logging
│   │   └── index.ts          # Server entry point
│   └── types/                # TypeScript type definitions
├── tests/
│   ├── e2e/                  # Playwright E2E tests
│   └── mcp-server/           # Jest MCP server tests
├── docs/                      # Documentation
├── plans/                     # Ralph task management
└── prisma/                   # Prisma schema and migrations
```

---

## Technology Stack

### MCP Server

- **Runtime**: Node.js
- **Language**: TypeScript (strict mode)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Data Access**: Repository pattern
- **Storage**: PostgreSQL (production) / In-memory (development)

### Chat Client

- **Framework**: Next.js 14 (App Router)
- **UI**: React + Tailwind CSS + shadcn/ui
- **AI**: `@anthropic-ai/sdk`
- **Auth**: NextAuth.js

### Testing

- **Unit/Integration**: Jest
- **E2E**: Playwright

### Deployment

- **Chat UI**: Vercel / Docker
- **MCP Server**: PM2 process manager
- **CI/CD**: GitHub Actions

---

## MCP Server Development

### Server Architecture

The MCP server (`src/mcp-server/index.ts`) is built using the Model Context Protocol SDK:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

function createServer() {
  const server = new Server(
    { name: 'alti-team-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } },
  )

  // Tool listing handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = Array.from(toolRegistry.values()).map(({ tool }) => tool)
    return { tools }
  })

  // Tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    const toolEntry = toolRegistry.get(name)
    if (!toolEntry) {
      return {
        content: [{ type: 'text', text: 'Tool not found' }],
        isError: true,
      }
    }
    return await toolEntry.handler(args, context)
  })

  return server
}
```

### Authentication Middleware

The server uses JWT-based authentication with support for API keys:

```typescript
// src/mcp-server/auth.ts
export function createAuthMiddleware() {
  return async function authMiddleware(request: Request) {
    const authHeader = request.headers.get('Authorization')
    const apiKey = request.headers.get('x-api-key')

    if (apiKey) {
      const userId = await validateAPIKey(apiKey)
      if (!userId) throw new Error('Invalid API key')
      return { userId, method: 'api-key' }
    }

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET!)
      return { userId: payload.sub, method: 'jwt' }
    }

    throw new Error('No valid authentication provided')
  }
}
```

### Health Checks

The server includes a health check system for production monitoring:

```typescript
// src/mcp-server/health.ts
export function performHealthCheck(): HealthCheckResult {
  const repos = getRepositories()
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: repos.users ? 'connected' : 'disconnected',
    },
  }
}
```

### Structured Logging

Production logging uses a structured format:

```typescript
// src/mcp-server/logger.ts
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', message, timestamp, ...meta }))
  },
  error: (message: string, error: unknown) => {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        error: String(error),
        timestamp,
      }),
    )
  },
}
```

---

## Adding New MCP Tools

### Step 1: Define the Tool Schema

Create a new file in `src/mcp-server/tools/`:

```typescript
// src/mcp-server/tools/example.ts
import { registerTool } from '../index.js'

interface ExampleArgs {
  name: string
  count?: number
}

registerTool({
  name: 'example_action',
  description: 'Performs an example action with the given parameters',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The name parameter' },
      count: { type: 'number', description: 'Optional count' },
    },
    required: ['name'],
  },
  handler: async (args: ExampleArgs, context) => {
    const { repositories, userId } = context

    // Validate authentication
    if (!userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    try {
      // Business logic
      const result = await repositories.example.create({
        ...args,
        createdBy: userId,
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      }
    }
  },
})
```

### Step 2: Import in Main Server

Add the import to `src/mcp-server/index.ts`:

```typescript
import './tools/example.js'
```

### Step 3: Add Repository Methods

Add corresponding methods in `src/lib/repositories/types.ts`:

```typescript
// src/lib/repositories/types.ts
interface ExampleRepository {
  create(data: {
    name: string
    count?: number
    createdBy: string
  }): Promise<Example>
  findById(id: string): Promise<Example | null>
  findByUserId(userId: string): Promise<Example[]>
}
```

### Step 4: Implement Repository

Add implementation in `src/lib/repositories/in-memory.ts` and `postgres.ts`:

```typescript
// In-memory implementation (development)
class InMemoryExampleRepository implements ExampleRepository {
  private examples = new Map<string, Example>()

  async create(data: {
    name: string
    count?: number
    createdBy: string
  }): Promise<Example> {
    const example = { id: generateId(), ...data }
    this.examples.set(example.id, example)
    return example
  }

  async findById(id: string): Promise<Example | null> {
    return this.examples.get(id) ?? null
  }

  async findByUserId(userId: string): Promise<Example[]> {
    return Array.from(this.examples.values()).filter(
      (e) => e.createdBy === userId,
    )
  }
}
```

### Step 5: Register in Factory

Add to `src/lib/repositories/index.ts`:

```typescript
export function getRepositories() {
  const usePostgres = process.env.USE_POSTGRES === 'true'

  return {
    example: usePostgres
      ? new PostgresExampleRepository()
      : new InMemoryExampleRepository(),
    // ... other repositories
  }
}
```

### Tool Best Practices

1. **Always validate authentication**: Check `userId` in context
2. **Use Result type**: Return structured results with `isError: true` for errors
3. **Include descriptions**: Provide clear parameter descriptions for Claude
4. **Handle errors gracefully**: Return user-friendly error messages
5. **Use transactions**: For PostgreSQL, wrap related operations in transactions

---

## Chat Client Development

### Chat Page Structure

The main chat page (`src/app/chat/page.tsx`) handles:

- **Message state**: User/assistant messages with timestamps
- **Input handling**: Text input with slash command support
- **Streaming**: Real-time response streaming from API
- **Workflow state**: Multi-turn workflow tracking

### MCP Client Integration

The chat API (`src/app/api/chat/route.ts`) integrates with MCP:

```typescript
// src/app/api/chat/route.ts
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const { messages, conversationId } = await request.json()

  // Get available MCP tools
  const mcpTools = await mcpClient.listTools()

  // Call Anthropic with tools enabled
  const response = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    tools: mcpTools,
    messages: messages.map((m: Message) => ({
      role: m.role,
      content: m.content,
    })),
  })

  // Handle tool calls from Claude
  for await (const event of response) {
    if (event.type === 'tool_use') {
      const toolResult = await mcpClient.callTool(
        event.tool_use.name,
        event.tool_use.input,
      )
      // Send result back to Claude
    }
  }

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
```

### Message Rendering

Rich message rendering is handled by `src/components/chat/MessageRenderer.tsx`:

```typescript
// Renders different content types
export default function MessageRenderer({ content }: { content: string }) {
  // Parse and render task cards, project cards, tables, markdown, etc.
  return <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
}
```

### Workflow System

Multi-turn workflows use the state machine in `src/lib/chat/workflow-types.ts`:

```typescript
export type WorkflowState = {
  id: string
  entityType: 'project' | 'task' | 'team' | 'organization'
  data: Record<string, unknown>
  isActive: boolean
  currentStep: number
  steps: WorkflowStep[]
}
```

### Slash Commands

Commands are defined in `src/app/chat/page.tsx`:

```typescript
const slashCommands = [
  { command: '/help', description: 'Show available commands', action: 'help' },
  { command: '/new', description: 'Start a new conversation', action: 'new' },
  { command: '/tasks', description: 'Show my tasks', action: 'tasks' },
  // ... more commands
]
```

---

## Repository Layer

### Architecture

The repository layer provides a clean abstraction over data access:

```
┌─────────────────────────────────────────┐
│           MCP Tools / API Routes        │
│         (Use repository interface)      │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           Repository Factory            │
│      (getRepositories function)         │
└─────────────────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    ▼                           ▼
┌─────────────────┐    ┌─────────────────┐
│   In-Memory     │    │   PostgreSQL    │
│   Repository    │    │   Repository    │
│ (Development)   │    │  (Production)  │
└─────────────────┘    └─────────────────┘
```

### Using Repositories

```typescript
// In any tool or API route
import { getRepositories } from '@/lib/repositories'

export async function handler(args, context) {
  const { repositories } = context

  // Find operations
  const user = await repositories.users.findById(args.userId)

  // Create operations
  const project = await repositories.projects.create({
    name: args.name,
    organizationId: args.organizationId,
  })

  // List operations with filters
  const tasks = await repositories.tasks.findByProjectId(args.projectId)
}
```

### Result Type Pattern

The codebase uses `Result<T, E>` for error handling:

```typescript
// src/lib/result.ts
type Result<T, E = Error> = { ok: true; data: T } | { ok: false; error: E }

function findUser(id: string): Result<User, 'not_found'> {
  const user = users.find((u) => u.id === id)
  if (!user) return { ok: false, error: 'not_found' }
  return { ok: true, data: user }
}

const result = findUser('123')
if (result.ok) {
  console.log(result.data)
}
```

### Repository Interface

All repositories implement a common interface:

```typescript
interface Repository<T, CreateInput, UpdateInput> {
  create(input: CreateInput): Promise<T>
  findById(id: string): Promise<T | null>
  update(id: string, input: UpdateInput): Promise<T | null>
  delete(id: string): Promise<boolean>
  findByOrganizationId(orgId: string): Promise<T[]>
}
```

---

## Testing

### Unit Tests (Jest)

Tests are located in `tests/mcp-server/`:

```typescript
// tests/mcp-server/tools.test.ts
describe('User MCP Tools', () => {
  let mockRepos: MockRepositories
  let context: MCPServerContext

  beforeEach(() => {
    mockRepos = createTestData()
    context = { repositories: mockRepos, userId: 'user-1' }
  })

  test('get_my_profile returns current user', async () => {
    const result = await get_my_profile({}, context)
    expect(result.content[0].text).toContain('John Doe')
  })

  test('search_users finds users by name', async () => {
    const result = await search_users({ query: 'Sarah' }, context)
    expect(result.content[0].text).toContain('Sarah')
  })
})
```

### E2E Tests (Playwright)

E2E tests are in `tests/e2e/`:

```typescript
// tests/e2e/chat.spec.ts
test.describe('Chat Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat')
  })

  test('redirects to signin when unauthenticated', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('shows welcome message', async ({ page }) => {
    await expect(page.locator('text=AltiTeam assistant')).toBeVisible()
  })

  test('sends message and receives response', async ({ page }) => {
    await page.fill('textarea', 'Show me my tasks')
    await page.click('button:has-text("Send")')
    await expect(page.locator('text=Your tasks')).toBeVisible({
      timeout: 10000,
    })
  })
})
```

### Running Tests

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run single test file
pnpm test -- tests/mcp-server/tools.test.ts

# View E2E test report
pnpm test:e2e:report
```

---

## Deployment

### Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/alti-team

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Anthropic API
ANTHROPIC_API_KEY=your-anthropic-key

# MCP Server
LOG_LEVEL=info
USE_POSTGRES=true
```

### Chat Client Deployment (Vercel)

The Next.js app deploys automatically via Vercel:

```bash
# Build for production
pnpm build

# Run production server
pnpm start
```

### MCP Server Deployment (PM2)

```bash
# Start MCP server
pnpm mcp:start

# View logs
pnpm mcp:logs

# Restart
pnpm mcp:restart

# Check status
pnpm mcp:status
```

### Docker Deployment

```bash
# Build image
docker build -t alti-team .

# Run container
docker run -p 3000:3000 alti-team
```

### Health Checks

The server exposes a health check endpoint:

```bash
# Check server health
curl http://localhost:3000/api/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-06T10:00:00Z",
  "checks": {
    "database": "connected"
  }
}
```

---

## Contributing Guidelines

### Code Style

- **TypeScript**: Strict mode enabled, no implicit `any`
- **Formatting**: Prettier with `semi: false`, `singleQuote: true`
- **Naming**: camelCase for variables/functions, PascalCase for types
- **Comments**: Avoid unless necessary for complex logic

### Git Workflow

1. Create feature branch from `main`
2. Make changes with tests
3. Run lint and typecheck:
   ```bash
   pnpm lint
   npx tsc --noEmit
   ```
4. Commit with clear message
5. Create pull request

### Commit Message Format

```
type(scope): description

feat(auth): add password reset functionality
fix(api): handle null user in dashboard
docs(readme): update installation instructions
test(tasks): add unit tests for task creation
```

### Pull Request Checklist

- [ ] Tests pass
- [ ] Lint passes
- [ ] TypeScript compiles without errors
- [ ] Documentation updated
- [ ] Code follows project conventions

### Code Review Guidelines

- Review for correctness, not just style
- Check for edge cases and error handling
- Verify test coverage
- Ensure documentation is clear

---

## Common Patterns

### Error Handling Pattern

```typescript
async function exampleTool(args: ExampleArgs, context: MCPServerContext) {
  try {
    // Business logic
    return { content: [{ type: 'text', text: 'Success' }] }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    }
  }
}
```

### Validation Pattern

```typescript
function validateInput(input: unknown): input is ValidInput {
  if (!input || typeof input !== 'object') return false
  const { name } = input as any
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('Name is required')
  }
  return true
}
```

### Repository Pattern with Result

```typescript
async function findUser(id: string): Promise<Result<User, 'not_found'>> {
  const user = await db.user.findUnique({ where: { id } })
  if (!user) return { ok: false, error: 'not_found' as const }
  return { ok: true, data: user }
}
```

---

## Troubleshooting

### Common Issues

**TypeScript errors about `nextauth`**

- Ensure `@types/next-auth` is installed
- Check `tsconfig.json` paths include `@/*`

**MCP server not connecting**

- Verify stdio transport is configured correctly
- Check authentication headers

**Database connection failures**

- Verify `DATABASE_URL` environment variable
- Ensure PostgreSQL is running

**Tests failing**

- Check mock repository setup
- Verify test data is properly initialized

### Debugging Tips

1. Enable verbose logging with `LOG_LEVEL=debug`
2. Use `console.log` in development for quick debugging
3. Check server logs: `pnpm mcp:logs`
4. Use Jest's `--verbose` flag for detailed test output

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Playwright Documentation](https://playwright.dev/docs/)

---

**Happy coding!** For questions, open an issue on GitHub.
