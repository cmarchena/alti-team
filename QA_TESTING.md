# AltiTeam QA Testing Guide

## Quick Start

```bash
# Terminal 1: Start dev server (uses in-memory repo by default)
pnpm dev

# Terminal 2: Run E2E tests
pnpm test:e2e

# Run unit tests
pnpm test
```

---

## Test Structure

| Type            | Location                       | Tool                | Purpose             |
| --------------- | ------------------------------ | ------------------- | ------------------- |
| **Backend API** | `tests/api/backend-tests.http` | VS Code REST Client | Test REST endpoints |
| **MCP Chat**    | `tests/mcp-server/`            | MCP Inspector / CLI | Test MCP tools      |
| **GUI E2E**     | `tests/e2e/`                   | Playwright          | Test UI workflows   |

---

## 1. Backend API Tests (REST)

Use `tests/api/backend-tests.http` with the **REST Client** VS Code extension.

### Setup

```bash
# 1. Start server (uses in-memory repository)
pnpm dev

# 2. Install "REST Client" extension in VS Code

# 3. Open tests/api/backend-tests.http

# 4. Sign up/in via browser, then copy session cookie from DevTools
```

### Test Flow

```
AUTH-001 (register) → Get session cookie
     ↓
ORG-001 (create org) → ORG-002 (list)
     ↓
PROJ-001 (create project) → PROJ-002 (list)
     ↓
TASK-001 (create task) → TASK-002 (list)
```

### Getting Session Cookie

1. Open `http://localhost:3000/auth/signin`
2. Sign in with test credentials
3. Open DevTools (F12) → Application → Cookies
4. Copy value of `next-auth.session-token`
5. Replace `YOUR_SESSION_TOKEN` in the `.http` file

---

## 2. MCP Chat Tests

Test MCP server tools directly.

### Start MCP Server

```bash
# Terminal 1: Next.js dev server
pnpm dev

# Terminal 2: MCP server
pnpm mcp:server
```

### Available MCP Tools

| Category          | Tool                        | Description              |
| ----------------- | --------------------------- | ------------------------ |
| **User**          | `get_my_profile`            | Get current user profile |
|                   | `update_my_profile`         | Update user profile      |
|                   | `search_users`              | Search users             |
| **Organization**  | `create_organization`       | Create organization      |
|                   | `get_organization`          | Get organization details |
|                   | `list_my_organizations`     | List user organizations  |
| **Project**       | `create_project`            | Create project           |
|                   | `get_project`               | Get project details      |
|                   | `list_projects`             | List projects            |
|                   | `get_project_analytics`     | Get project analytics    |
| **Task**          | `create_task`               | Create task              |
|                   | `get_task`                  | Get task details         |
|                   | `list_tasks`                | List tasks               |
|                   | `search_tasks`              | Search tasks             |
|                   | `add_task_comment`          | Add comment to task      |
| **Team**          | `create_team`               | Create team              |
|                   | `add_team_member`           | Add member to team       |
|                   | `list_team_members`         | List team members        |
| **Department**    | `create_department`         | Create department        |
|                   | `get_department_hierarchy`  | Get org hierarchy        |
| **Resource**      | `create_resource`           | Create resource          |
|                   | `list_resources`            | List resources           |
| **Process**       | `create_process`            | Create process           |
|                   | `start_process`             | Start process execution  |
| **Member**        | `invite_member`             | Invite new member        |
|                   | `list_organization_members` | List members             |
| **Search**        | `global_search`             | Search across entities   |
| **Notifications** | `get_my_notifications`      | Get notifications        |

### Example Conversation

```
User: "Create a new organization called Acme Corp"
Claude → create_organization → {name: "Acme Corp"}
Result: Organization created successfully

User: "Show me my organizations"
Claude → list_my_organizations
Result: [{"id":"...","name":"Acme Corp",...}]

User: "Create a project called Website Redesign"
Claude → create_project → {name: "Website Redesign", organizationId: "..."}
Result: Project created successfully

User: "Create a task to design the homepage"
Claude → create_task → {title: "Design homepage", projectId: "..."}
Result: Task created successfully
```

---

## 3. GUI E2E Tests (Playwright)

Automated tests of the graphical interface.

### Setup

```bash
# Install Playwright browsers
npx playwright install

# Start dev server
pnpm dev
```

### Run E2E Tests

```bash
# All tests
pnpm test:e2e

# Specific file
pnpm test:e2e -- tests/e2e/chat.spec.ts

# Show report
pnpm test:e2e:report

# Headed mode (see browser)
pnpm test:e2e -- --headed
```

### E2E Test Coverage

| File                         | Coverage                     |
| ---------------------------- | ---------------------------- |
| `tests/auth.spec.ts`         | Sign up, sign in, sign out   |
| `tests/e2e/chat.spec.ts`     | Chat UI, messages, MCP tools |
| `tests/e2e/projects.spec.ts` | Project CRUD                 |
| `tests/e2e/tasks.spec.ts`    | Task CRUD                    |

---

## Verification Commands

```bash
# TypeScript check
npx tsc --noEmit

# Lint
pnpm lint

# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Production build
pnpm build
```

---

## Troubleshooting

### Tests fail with session errors

- Sign in via browser first
- Copy fresh session cookie

### MCP server won't start

- Ensure `pnpm dev` is running first
- Check port 3000 is available

### Playwright timeouts

- Increase timeout in `playwright.config.ts`
- Ensure dev server is responsive
