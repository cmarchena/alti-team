---
name: api-to-mcp
description: Wrap API endpoints as MCP server tools. Use when creating MCP servers that expose existing APIs as AI-callable functions.
---

# API to MCP Tool Wrapper

Transform existing API endpoints into MCP server tools that can be invoked by LLMs.

## Quick Start

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "api-wrapper",
  version: "1.0.0",
});

// Wrap an API endpoint as a tool
server.tool(
  "tool-name",
  "Human-readable description for the LLM",
  {
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional().describe("Optional parameter"),
  },
  async ({ param1, param2 }) => {
    const response = await fetch(`https://api.example.com/endpoint?param=${param1}`);
    const data = await response.json();
    
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main();
```

## Pattern: API Wrapper Template

```typescript
// 1. Define input schema with Zod
const GetUserSchema = {
  userId: z.string().describe("The unique user identifier"),
  includeDeleted: z.boolean().optional().describe("Include soft-deleted users"),
};

// 2. Create the tool wrapper
server.tool(
  "get_user",                           // Tool name (snake_case)
  "Fetch user details by ID",            // Description for LLM
  GetUserSchema,                         // Input schema
  async ({ userId, includeDeleted }) => {
    // 3. Call the API
    const response = await fetch(
      `https://api.example.com/users/${userId}`,
      {
        headers: { "Authorization": `Bearer ${process.env.API_KEY}` },
      }
    );

    // 4. Handle errors
    if (!response.ok) {
      return {
        content: [{
          type: "text",
          text: `Error: ${response.status} - ${response.statusText}`,
        }],
        isError: true,
      };
    }

    // 5. Return formatted response
    const user = await response.json();
    return {
      content: [{
        type: "text",
        text: JSON.stringify(user, null, 2),
      }],
    };
  }
);
```

## HTTP Methods

### GET Request
```typescript
server.tool(
  "list_items",
  "List all items with optional filtering",
  {
    category: z.string().optional(),
    limit: z.number().max(100).optional(),
  },
  async ({ category, limit }) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (limit) params.set("limit", String(limit));

    const response = await fetch(`https://api.example.com/items?${params}`);
    const items = await response.json();

    return {
      content: [{ type: "text", text: JSON.stringify(items) }],
    };
  }
);
```

### POST Request
```typescript
server.tool(
  "create_item",
  "Create a new item",
  {
    name: z.string().min(1),
    description: z.string().optional(),
  },
  async ({ name, description }) => {
    const response = await fetch("https://api.example.com/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });

    const item = await response.json();
    return {
      content: [{ type: "text", text: JSON.stringify(item) }],
    };
  }
);
```

### PUT/PATCH/DELETE
```typescript
server.tool(
  "update_item",
  "Update an existing item",
  {
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
  },
  async ({ id, ...updates }) => {
    const response = await fetch(`https://api.example.com/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    return {
      content: [{ type: "text", text: JSON.stringify(await response.json()) }],
    };
  }
);

server.tool(
  "delete_item",
  "Delete an item by ID",
  { id: z.string() },
  async ({ id }) => {
    const response = await fetch(`https://api.example.com/items/${id}`, {
      method: "DELETE",
    });

    return {
      content: [{
        type: "text",
        text: response.ok ? "Deleted successfully" : "Delete failed",
      }],
    };
  }
);
```

## Error Handling

```typescript
server.tool(
  "safe_api_call",
  "Call API with proper error handling",
  { input: z.string() },
  async ({ input }) => {
    try {
      const response = await fetch("https://api.example.com/endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          content: [{ type: "text", text: `API Error (${response.status}): ${error}` }],
          isError: true,
        };
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        }],
        isError: true,
      };
    }
  }
);
```

## Authentication Patterns

### Bearer Token
```typescript
const apiCall = async (endpoint: string, options?: RequestInit) => {
  return fetch(endpoint, {
    ...options,
    headers: {
      ...options?.headers,
      "Authorization": `Bearer ${process.env.API_TOKEN}`,
    },
  });
};
```

### API Key Header
```typescript
const apiCall = async (endpoint: string, options?: RequestInit) => {
  return fetch(endpoint, {
    ...options,
    headers: {
      ...options?.headers,
      "X-API-Key": process.env.API_KEY!,
    },
  });
};
```

## Response Formatting

### Text Response
```typescript
return {
  content: [{ type: "text", text: "Simple text response" }],
};
```

### JSON Response
```typescript
return {
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
};
```

### Formatted Summary
```typescript
server.tool(
  "get_user_summary",
  "Get a formatted user summary",
  { userId: z.string() },
  async ({ userId }) => {
    const response = await fetch(`https://api.example.com/users/${userId}`);
    const user = await response.json();

    // Format for LLM readability
    const summary = `
User: ${user.name} (${user.email})
Status: ${user.active ? "Active" : "Inactive"}
Created: ${new Date(user.createdAt).toLocaleDateString()}
    `.trim();

    return {
      content: [{ type: "text", text: summary }],
    };
  }
);
```

## Common Input Schemas

```typescript
// Pagination
{
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
}

// Date range
{
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}

// IDs
{
  id: z.string().uuid(),
  ids: z.array(z.string()).max(50),
}

// Search/filter
{
  query: z.string().min(1),
  filters: z.record(z.string()).optional(),
}
```

## Project Setup

```bash
# Initialize project
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk zod

# Dev dependencies
npm install -D typescript @types/node

# Build
npx tsc
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "build",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

## Checklist

- [ ] Tool name is snake_case and descriptive
- [ ] Description explains what the tool does for LLM
- [ ] Input schema uses Zod with `.describe()` for each field
- [ ] Error responses include `isError: true`
- [ ] API credentials loaded from environment variables
- [ ] Response formatted for LLM consumption (JSON or readable text)
- [ ] Handles network errors gracefully
