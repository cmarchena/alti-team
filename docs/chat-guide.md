# AltiTeam Chat User Guide

Welcome to the AltiTeam Chat interface! This guide will help you get the most out of your AI-powered project management assistant.

## Table of Contents

- [Getting Started](#getting-started)
- [Sending Messages](#sending-messages)
- [Slash Commands](#slash-commands)
- [Quick Prompts](#quick-prompts)
- [Managing Tasks via Chat](#managing-tasks-via-chat)
- [Managing Projects via Chat](#managing-projects-via-chat)
- [Managing Teams and Organizations](#managing-teams-and-organizations)
- [Multi-turn Workflows](#multi-turn-workflows)
- [Rich Results Display](#rich-results-display)
- [Tips and Best Practices](#tips-and-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Chat

1. Navigate to `/chat` in your browser
2. If you're not logged in, you'll be redirected to the sign-in page
3. Once authenticated, you'll see the chat interface with a welcome message

### Interface Overview

The chat interface consists of:

- **Header**: Shows your account information and sign-out button
- **Message Area**: Displays your conversation with the AI assistant
- **Quick Prompts**: Suggested actions when starting a new conversation
- **Input Area**: Type your messages here; press Enter to send, Shift+Enter for new lines

---

## Sending Messages

### Basic Usage

1. Type your message in the text area at the bottom
2. Press **Enter** to send (or click the send button)
3. Press **Shift+Enter** for a new line within your message

### What You Can Ask

The chat assistant understands natural language for project management tasks:

```
"Show me my tasks for today"
"Create a new project called Website Redesign"
"What's the status of the Q1 Marketing project?"
"Assign the API integration task to Sarah"
"Show me all high priority tasks"
"Create a task to design the homepage"
```

### Conversation History

- Messages are displayed in chronological order
- Your messages appear on the right (indigo)
- Assistant responses appear on the left (gray)
- Timestamps show when each message was sent
- Conversation context is maintained across messages

---

## Slash Commands

Slash commands provide quick access to common actions. Type `/` to see available commands.

### Available Commands

| Command           | Description                | Usage                               |
| ----------------- | -------------------------- | ----------------------------------- |
| `/help`           | Show available commands    | Type `/help`                        |
| `/new`            | Start a new conversation   | Type `/new`                         |
| `/clear`          | Clear current conversation | Type `/clear`                       |
| `/tasks`          | Show your tasks            | Type `/tasks` or customize          |
| `/projects`       | Show your projects         | Type `/projects` or customize       |
| `/organizations`  | Show your organizations    | Type `/organizations`               |
| `/create-task`    | Create a new task          | Type `/create-task` or customize    |
| `/create-project` | Create a new project       | Type `/create-project` or customize |
| `/search`         | Search across all items    | Type `/search` or customize         |
| `/invite`         | Invite a team member       | Type `/invite` or customize         |

### Using Slash Commands

1. Start typing `/` in the input field
2. A menu appears showing matching commands
3. Use **Arrow Up/Down** to navigate
4. Press **Enter** to select
5. Press **Escape** to close the menu

### Command Expansion

Commands expand into descriptive prompts you can edit:

```
/tasks → "Show me my tasks"
/create-project → "Create a new project"
/search → "Search for "
```

---

## Quick Prompts

When you start a new conversation, quick prompts appear to help you get started:

- "Show me my tasks"
- "Create a new project"
- "What tasks are due today?"
- "List my organizations"

Click any prompt to populate the input field and start that conversation.

---

## Managing Tasks via Chat

### Creating Tasks

```
"Create a task to design the homepage"
"Create a task called API integration with high priority"
"Add a task to review the design mockups, assign it to Sarah"
```

### Viewing Tasks

```
"Show me my tasks"
"What tasks are due today?"
"List all my overdue tasks"
"Show me high priority tasks"
"What tasks are assigned to me?"
"Show me tasks in the Website Redesign project"
```

### Updating Tasks

```
"Mark task xyz-123 as done"
"Update the database migration task priority to urgent"
"Assign the API integration task to Sarah"
"Change the homepage design task status to in-progress"
```

### Task Details

Each task displays with:

- Title and description
- Priority (low, medium, high, urgent)
- Status (todo, in-progress, review, done)
- Due date
- Assignee
- Expandable details

### Task Comments

```
"Add a comment to task xyz-123: 'This is blocked by the API work'"
"What are the comments on the design task?"
"Leave a note on the homepage task about the new requirements"
```

---

## Managing Projects via Chat

### Creating Projects

```
"Create a new project called Website Redesign"
"Create a project for Q1 Marketing campaign"
"Start a new software development project"
```

### Viewing Projects

```
"Show me all active projects"
"What projects am I working on?"
"List all projects in Acme Corp"
"Show me completed projects"
```

### Updating Projects

```
"Update the Q1 Marketing project status to completed"
"Change the Website Redesign project end date to March 15th"
"Rename the prototype project to MVP"
```

### Project Analytics

```
"How's the Website Redesign project progressing?"
"Show me analytics for the Q1 project"
"What's the completion rate for project xyz?"
"Generate a project report for the Q1 Marketing project"
```

---

## Managing Teams and Organizations

### Organizations

```
"Show me my organizations"
"Create an organization called Acme Corp"
"What's the dashboard for Acme Corp?"
"List my organizations"
```

### Teams

```
"Create a team called Engineering"
"Show me all teams in Acme Corp"
"Who's on the Marketing team?"
"Add Sarah to the Engineering team"
"Remove John from the Design team"
```

### Members and Invitations

```
"Who are the admins in Acme Corp?"
"Invite john@example.com as an admin"
"What invitations are pending?"
"Make Sarah an admin"
"Cancel the invitation for sarah@example.com"
```

### Departments

```
"Create a department called Sales"
"Show me the org chart"
"What departments are under Engineering?"
"Create a sub-department called Frontend under Engineering"
```

---

## Multi-turn Workflows

When you ask to create something complex, the assistant guides you through a multi-step workflow:

### Example Workflow: Creating a Project

1. **You**: "Create a new project"
2. **Assistant**: "I'd be happy to help you create a project. What name would you like to give it?"
3. **You**: "Website Redesign"
4. **Assistant**: "Got it. Would you like to add a description?"
5. **You**: "Redesign our company website with new branding"
6. **Assistant**: "Understood. What status should the project have? Options: planning, active, on-hold, completed"
7. **You**: "planning"
8. **Assistant**: shows confirmation dialog with all collected information
9. **You**: "yes" to confirm or "back" to change something

### Workflow Commands

| Command  | Action                       |
| -------- | ---------------------------- |
| `yes`    | Confirm and create the item  |
| `no`     | Cancel the workflow          |
| `back`   | Go back to the previous step |
| `skip`   | Skip an optional field       |
| `cancel` | Cancel the entire workflow   |

---

## Rich Results Display

The assistant displays information in rich, easy-to-read formats:

### Task Cards

Tasks appear as expandable cards showing:

- Title and description
- Priority badge (color-coded)
- Status badge (color-coded)
- Due date
- Assignee
- Expandable for more details

### Project Cards

Projects display with:

- Name and status
- Progress indicators
- Creation date
- Task counts

### User Lists

User information shows:

- Avatar with initial
- Name and email
- Role in the organization

### Tables

Structured data like search results appears in formatted tables with:

- Clear column headers
- Status indicators
- Clickable links where applicable

### Notifications

Notifications display with:

- Read/unread status
- Type indicator
- Related entity links

---

## Tips and Best Practices

### Be Specific

**Good**: "Show me all high priority tasks due this week in the Website Redesign project"

**Vague**: "Show me stuff"

### Use Natural Language

The assistant understands conversational requests:

```
✓ "What are my tasks for today?"
✓ "Show me everything due soon"
✓ "Create a task to update the homepage"
✓ "Who is on the engineering team?"
```

### Break Complex Requests

For complex operations, let the workflow guide you:

```
"Create a new project" → assistant asks for details
"Add team members" → assistant guides you through it
```

### Use Slash Commands for Speed

- `/tasks` for quick task views
- `/projects` for project listings
- `/clear` to start fresh

### Review Confirmations

Multi-step workflows show a confirmation screen before execution. Review all details before confirming.

### Keep Conversations Focused

Start new conversations for unrelated topics to keep context clear.

---

## Troubleshooting

### Session Expired

If you see "Your session has expired":

1. Click Sign Out in the header
2. Sign in again
3. Your conversation history is preserved

### Messages Not Sending

- Check your internet connection
- Ensure you're signed in (look for your avatar in the header)
- Try refreshing the page

### Slow Responses

- Large queries may take longer
- Complex searches across many items
- Server may be processing multiple requests

### Errors and Retries

If you see an error message:

1. Read the error description
2. Try rephrasing your request
3. Start a new conversation if the error persists

### Clearing Conversation

To start fresh:

1. Type `/clear` or click the clear option
2. Confirm the action
3. New conversation begins with welcome message

---

## Keyboard Shortcuts

| Key           | Action                   |
| ------------- | ------------------------ |
| Enter         | Send message             |
| Shift+Enter   | New line                 |
| /             | Open slash command menu  |
| Arrow Up/Down | Navigate slash commands  |
| Escape        | Close slash command menu |

---

## Privacy and Security

- All conversations are associated with your authenticated session
- Your data is only accessible to you and users with appropriate permissions
- Messages are stored securely in your conversation history
- Sign out when using shared computers

---

## Getting More Help

- Type `/help` in the chat for a quick command reference
- Ask the assistant: "What can you help me with?"
- Check the [Developer Guide](./developer-guide.md) for technical documentation
- Review the [MCP Server Documentation](./mcp-server.md) for available tools

---

**Happy chatting!** The AltiTeam assistant is here to help you manage your projects and teams efficiently through natural conversation.
