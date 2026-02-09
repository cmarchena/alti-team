# QA Testing Instructions for AltiTeam

This document provides comprehensive testing instructions for validating the AltiTeam application.

## Prerequisites

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server (runs on http://localhost:3000)
```

## Test Accounts

Create test accounts for different roles:

- **Admin User**: full access to organization settings
- **Member User**: can work on tasks and projects
- **Viewer User**: read-only access to assigned resources

## 1. Authentication Testing

### 1.1 Sign Up Flow

| Step | Action                                            | Expected Result                                       |
| ---- | ------------------------------------------------- | ----------------------------------------------------- |
| 1    | Navigate to `/auth/signup`                        | Sign up page loads correctly                          |
| 2    | Enter valid email (e.g., `testuser1@example.com`) | Email field accepts input                             |
| 3    | Enter password (min 8 chars)                      | Password field accepts input                          |
| 4    | Click "Sign Up" button                            | Redirects to dashboard or requires email verification |
| 5    | Try duplicate email                               | Error message displayed                               |

### 1.2 Sign In Flow

| Step | Action                                   | Expected Result              |
| ---- | ---------------------------------------- | ---------------------------- |
| 1    | Navigate to `/auth/signin`               | Sign in page loads           |
| 2    | Enter valid credentials                  | Fields accept input          |
| 3    | Enter incorrect password                 | Error: "Invalid credentials" |
| 4    | Enter non-existent email                 | Error: "User not found"      |
| 5    | Click "Sign In" with correct credentials | Redirects to dashboard `/`   |
| 6    | Click "Sign Out"                         | Redirects to sign in page    |

### 1.3 Session Persistence

| Step | Action                                     | Expected Result         |
| ---- | ------------------------------------------ | ----------------------- |
| 1    | Sign in successfully                       | Session created         |
| 2    | Close browser tab                          | -                       |
| 3    | Reopen and navigate to any protected page  | Automatically signed in |
| 4    | Navigate to `/auth/signin` while logged in | Redirects to dashboard  |

---

## 2. Dashboard Testing

### 2.1 Dashboard Load

| Step | Action                     | Expected Result                     |
| ---- | -------------------------- | ----------------------------------- |
| 1    | Sign in as any user        | Redirects to `/`                    |
| 2    | Check page title           | Shows "AltiTeam" or dashboard title |
| 3    | Verify navigation elements | Sidebar/header visible              |
| 4    | Check for welcome message  | Shows user name                     |

### 2.2 Dashboard Content

| Step | Action                  | Expected Result                           |
| ---- | ----------------------- | ----------------------------------------- |
| 1    | View dashboard          | Shows user's organizations/projects/tasks |
| 2    | Click on a project card | Navigates to project details              |
| 3    | Click on a task         | Opens task details modal/page             |

---

## 3. Chat Interface Testing (`/chat`)

### 3.1 Chat Page Load

| Step | Action                               | Expected Result                  |
| ---- | ------------------------------------ | -------------------------------- |
| 1    | Navigate to `/chat` while logged out | Redirects to `/auth/signin`      |
| 2    | Sign in, navigate to `/chat`         | Chat interface loads             |
| 3    | Check for welcome message            | "How can I help you today?"      |
| 4    | Verify input field                   | Textarea visible and focused     |
| 5    | Check quick prompts                  | 3-4 quick action buttons visible |

### 3.2 Basic Chat Functionality

| Step | Action                 | Expected Result                    |
| ---- | ---------------------- | ---------------------------------- |
| 1    | Type "Hello" and send  | Message appears in chat            |
| 2    | Wait for AI response   | Streaming response appears         |
| 3    | Verify message avatars | User and assistant avatars visible |
| 4    | Check timestamps       | Messages show time                 |
| 5    | Scroll up in chat      | Older messages load                |

### 3.3 Slash Commands

| Command           | Action        | Expected Result              |
| ----------------- | ------------- | ---------------------------- |
| `/help`           | Type and send | Shows available commands     |
| `/new`            | Type and send | Initiates new conversation   |
| `/clear`          | Type and send | Clears chat history          |
| `/tasks`          | Type and send | Lists recent tasks           |
| `/projects`       | Type and send | Lists projects               |
| `/organizations`  | Type and send | Lists organizations          |
| `/create-task`    | Type and send | Prompts for task creation    |
| `/create-project` | Type and send | Prompts for project creation |
| `/search`         | Type and send | Opens search mode            |
| `/invite`         | Type and send | Prompts for invitation       |

### 3.4 Quick Prompts

| Step | Action                     | Expected Result             |
| ---- | -------------------------- | --------------------------- |
| 1    | Click "Show my tasks"      | Lists assigned tasks        |
| 2    | Click "Create new project" | Prompts for project details |
| 3    | Click "List projects"      | Shows project list          |
| 4    | Click "Search"             | Focuses search input        |

### 3.5 Chat Behaviors

| Step | Action                               | Expected Result            |
| ---- | ------------------------------------ | -------------------------- |
| 1    | Type long message with Shift+Enter   | New line created           |
| 2    | Type message and Enter without Shift | Message sends              |
| 3    | Send message during loading          | Input disables             |
| 4    | Wait for response completion         | Input re-enables           |
| 5    | Click "Clear chat"                   | All messages removed       |
| 6    | Click export button                  | Options to export/download |
| 7    | Copy message to clipboard            | Toast notification shown   |

### 3.6 Mobile Responsiveness

| Step | Action                         | Expected Result                 |
| ---- | ------------------------------ | ------------------------------- |
| 1    | Resize browser to mobile width | Chat adapts layout              |
| 2    | Verify input visibility        | Input remains accessible        |
| 3    | Check quick prompts            | Wrap to single column if needed |

---

## 4. Organization Testing

### 4.1 Create Organization (via Chat)

| Step | Action                                          | Expected Result      |
| ---- | ----------------------------------------------- | -------------------- |
| 1    | Type "Create a new organization called TestOrg" | AI acknowledges      |
| 2    | Confirm creation                                | Organization created |
| 3    | Type "Show my organizations"                    | Lists organizations  |

### 4.2 Organization Details

| Step | Action                       | Expected Result          |
| ---- | ---------------------------- | ------------------------ |
| 1    | Navigate to `/organizations` | Shows organization list  |
| 2    | Click on an organization     | Opens details page       |
| 3    | Verify organization name     | Name displayed correctly |
| 4    | Check member count           | Shows member count       |
| 5    | Check projects count         | Shows project count      |

### 4.3 Organization Settings

| Step | Action                                     | Expected Result                    |
| ---- | ------------------------------------------ | ---------------------------------- |
| 1    | Navigate to `/organizations/[id]/settings` | Settings page loads                |
| 2    | Update organization name                   | Name updates                       |
| 3    | Try invalid name                           | Error message shown                |
| 4    | Delete organization                        | Confirmation dialog, then deletion |

---

## 5. Project Testing

### 5.1 Create Project (via Chat)

| Step | Action                                         | Expected Result        |
| ---- | ---------------------------------------------- | ---------------------- |
| 1    | Type "Create a new project called TestProject" | AI prompts for details |
| 2    | Provide description and dates                  | Project created        |
| 3    | Type "List projects"                           | Shows new project      |

### 5.2 Project Details

| Step | Action                  | Expected Result      |
| ---- | ----------------------- | -------------------- |
| 1    | Navigate to `/projects` | Projects list loads  |
| 2    | Click on a project      | Project details page |
| 3    | Verify project name     | Name displayed       |
| 4    | Check description       | Description visible  |
| 5    | Check tasks count       | Shows task count     |

### 5.3 Project Analytics

| Step | Action                                 | Expected Result             |
| ---- | -------------------------------------- | --------------------------- |
| 1    | Navigate to `/projects/[id]/analytics` | Analytics page loads        |
| 2    | Check progress bar                     | Shows completion percentage |
| 3    | View task distribution                 | Chart/visualization visible |
| 4    | Check completion trends                | Timeline/graph shown        |

### 5.4 Project Settings

| Step | Action                                | Expected Result             |
| ---- | ------------------------------------- | --------------------------- |
| 1    | Navigate to `/projects/[id]/settings` | Settings page loads         |
| 2    | Update project name                   | Name updates                |
| 3    | Change description                    | Description updates         |
| 4    | Change dates                          | Dates update correctly      |
| 5    | Delete project                        | Confirmation, then deletion |

### 5.5 Project Templates

| Step | Action                              | Expected Result                  |
| ---- | ----------------------------------- | -------------------------------- |
| 1    | Type "Create project from template" | Shows template options           |
| 2    | Select a template                   | Project pre-filled with template |
| 3    | Navigate to `/templates`            | Template list visible            |

---

## 6. Task Testing

### 6.1 Create Task (via Chat)

| Step | Action                               | Expected Result        |
| ---- | ------------------------------------ | ---------------------- |
| 1    | Type "Create a task called TestTask" | AI prompts for details |
| 2    | Set priority to high                 | Priority set           |
| 3    | Set status to todo                   | Status set             |
| 4    | Assign to user                       | Assignment set         |
| 5    | Confirm creation                     | Task created           |

### 6.2 Task Details

| Step | Action                    | Expected Result          |
| ---- | ------------------------- | ------------------------ |
| 1    | Navigate to `/tasks/[id]` | Task details page loads  |
| 2    | Verify task name          | Name displayed correctly |
| 3    | Check priority badge      | Color matches priority   |
| 4    | Check status badge        | Color matches status     |
| 5    | Check assignee            | Assigned user shown      |

### 6.3 Update Task

| Step | Action                         | Expected Result    |
| ---- | ------------------------------ | ------------------ |
| 1    | Change status to "in-progress" | Status updates     |
| 2    | Change priority to "urgent"    | Priority updates   |
| 3    | Add comment                    | Comment appears    |
| 4    | Change assignee                | New assignee shown |

### 6.4 Task List (via Chat)

| Step | Action                           | Expected Result      |
| ---- | -------------------------------- | -------------------- |
| 1    | Type "Show my tasks"             | Lists assigned tasks |
| 2    | Type "Show tasks in TestProject" | Lists project tasks  |
| 3    | Type "Search tasks for bug"      | Searches task titles |

### 6.5 Batch Operations (via Chat)

| Step | Action                                   | Expected Result        |
| ---- | ---------------------------------------- | ---------------------- |
| 1    | Type "Update tasks task1, task2 to done" | Multiple tasks updated |
| 2    | Type "Assign task1 and task2 to user"    | Tasks reassigned       |

---

## 7. Team Testing

### 7.1 Create Team (via Chat)

| Step | Action                                      | Expected Result        |
| ---- | ------------------------------------------- | ---------------------- |
| 1    | Type "Create a new team called Development" | AI prompts for details |
| 2    | Confirm creation                            | Team created           |
| 3    | Type "List teams"                           | Shows team list        |

### 7.2 Team Members

| Step | Action                                          | Expected Result          |
| ---- | ----------------------------------------------- | ------------------------ |
| 1    | Type "Add user@example.com to Development"      | Member added             |
| 2    | Type "Remove user@example.com from Development" | Member removed           |
| 3    | Type "Show Development team members"            | Lists members with roles |

### 7.3 Team Roles

| Step | Action                                       | Expected Result |
| ---- | -------------------------------------------- | --------------- |
| 1    | Type "Update user@example.com role to admin" | Role updated    |
| 2    | Type "List teams"                            | Teams visible   |

---

## 8. Department Testing

### 8.1 Create Department (via Chat)

| Step | Action                                                           | Expected Result        |
| ---- | ---------------------------------------------------------------- | ---------------------- |
| 1    | Type "Create a department called Engineering"                    | Department created     |
| 2    | Type "Create a sub-department called Frontend under Engineering" | Sub-department created |

### 8.2 Department Hierarchy

| Step | Action                           | Expected Result      |
| ---- | -------------------------------- | -------------------- |
| 1    | Type "Show department hierarchy" | Tree structure shown |
| 2    | Type "List all departments"      | Flat list shown      |

---

## 9. Process Testing

### 9.1 Create Process (via Chat)

| Step | Action                                     | Expected Result      |
| ---- | ------------------------------------------ | -------------------- |
| 1    | Type "Create a process called Code Review" | AI prompts for steps |
| 2    | Add steps: Review, Approve, Merge          | Process created      |

### 9.2 Execute Process

| Step | Action                               | Expected Result    |
| ---- | ------------------------------------ | ------------------ |
| 1    | Type "Start process Code Review"     | Execution started  |
| 2    | Type "Complete first step"           | Step marked done   |
| 3    | Type "Show process execution status" | Shows current step |

### 9.3 Process Analytics

| Step | Action                                  | Expected Result      |
| ---- | --------------------------------------- | -------------------- |
| 1    | Navigate to `/processes/[id]/analytics` | Analytics page loads |
| 2    | Check completion rate                   | Percentage shown     |
| 3    | Check average duration                  | Time shown           |

---

## 10. Resource Testing

### 10.1 Create Resource (via Chat)

| Step | Action                                          | Expected Result    |
| ---- | ----------------------------------------------- | ------------------ |
| 1    | Type "Add a link resource called Documentation" | Resource created   |
| 2    | Provide URL                                     | Link saved         |
| 3    | Type "Add a file resource"                      | File upload prompt |

### 10.2 Resource List

| Step | Action                                | Expected Result     |
| ---- | ------------------------------------- | ------------------- |
| 1    | Type "List resources for TestProject" | Shows all resources |
| 2    | Click a resource link                 | Opens in new tab    |

### 10.3 Delete Resource

| Step | Action                               | Expected Result  |
| ---- | ------------------------------------ | ---------------- |
| 1    | Type "Delete resource Documentation" | Resource removed |

---

## 11. Member & Invitation Testing

### 11.1 Invite Member (via Chat)

| Step | Action                                        | Expected Result       |
| ---- | --------------------------------------------- | --------------------- |
| 1    | Type "Invite user@example.com to TestOrg"     | Invitation sent       |
| 2    | Type "List pending invitations"               | Shows pending invites |
| 3    | Type "Cancel invitation for user@example.com" | Invitation cancelled  |

### 11.2 Member Management

| Step | Action                                           | Expected Result      |
| ---- | ------------------------------------------------ | -------------------- |
| 1    | Type "Update user@example.com role to viewer"    | Role updated         |
| 2    | Type "Remove user@example.com from organization" | Member removed       |
| 3    | Navigate to `/organizations/[id]/members`        | Members list visible |

### 11.3 Accept Invitation

| Step | Action                          | Expected Result            |
| ---- | ------------------------------- | -------------------------- |
| 1    | Open invitation link from email | Acceptance page loads      |
| 2    | Click accept                    | User added to organization |

---

## 12. Notification Testing

### 12.1 View Notifications

| Step | Action                       | Expected Result     |
| ---- | ---------------------------- | ------------------- |
| 1    | Type "Show my notifications" | Lists notifications |
| 2    | Click notification           | Opens related item  |
| 3    | Mark notification as read    | Badge removed       |

### 12.2 Notification Actions

| Step | Action                                | Expected Result |
| ---- | ------------------------------------- | --------------- |
| 1    | Type "Mark notification 1 as read"    | Marked read     |
| 2    | Type "Mark all notifications as read" | All marked read |

---

## 13. Profile Testing

### 13.1 View Profile

| Step | Action                 | Expected Result     |
| ---- | ---------------------- | ------------------- |
| 1    | Navigate to `/profile` | Profile page loads  |
| 2    | Check user name        | Correctly displayed |
| 3    | Check email            | Correctly displayed |

### 13.2 Update Profile (via Chat)

| Step | Action                                    | Expected Result |
| ---- | ----------------------------------------- | --------------- |
| 1    | Type "Update my profile name to New Name" | Name updated    |
| 2    | Verify on profile page                    | New name shown  |

---

## 14. Search Testing (via Chat)

| Step | Action                         | Expected Result   |
| ---- | ------------------------------ | ----------------- |
| 1    | Type "Search for project Test" | Matches found     |
| 2    | Type "Search for task bug"     | Tasks found       |
| 3    | Type "Search for user John"    | Users found       |
| 4    | Type "Global search mytask"    | All results shown |

---

## 15. AI Features Testing

### 15.1 Scheduling Suggestions

| Step | Action                                    | Expected Result         |
| ---- | ----------------------------------------- | ----------------------- |
| 1    | Type "Suggest schedule for task TestTask" | Shows recommended dates |
| 2    | Type "Optimize team workload"             | Workload analysis shown |

### 15.2 Reports

| Step | Action                                         | Expected Result  |
| ---- | ---------------------------------------------- | ---------------- |
| 1    | Type "Generate project report for TestProject" | Report generated |
| 2    | Type "Generate team report for Development"    | Report generated |

### 15.3 Integrations

| Step | Action                         | Expected Result                   |
| ---- | ------------------------------ | --------------------------------- |
| 1    | Type "Send Slack notification" | (If configured) Notification sent |
| 2    | Type "Create calendar event"   | (If configured) Event created     |

---

## 16. Error Handling Testing

| Scenario                | Action                                | Expected Result           |
| ----------------------- | ------------------------------------- | ------------------------- |
| Invalid project ID      | Navigate to `/projects/invalid-id`    | 404 or error page         |
| Unauthorized access     | Access another user's private project | Access denied message     |
| Invalid task status     | Try to set invalid status             | Error message             |
| Missing required fields | Create task without name              | Validation error          |
| Network failure         | Send message while offline            | Error toast, retry option |
| Session expiry          | Wait for session to expire            | Redirect to sign in       |

---

## 17. Performance Testing

| Test                | Action                            | Expected Result      |
| ------------------- | --------------------------------- | -------------------- |
| Chat response time  | Send message                      | Response < 5 seconds |
| Page load time      | Load `/dashboard`                 | < 2 seconds          |
| Large lists         | Load organization with 100+ tasks | Renders efficiently  |
| Concurrent messages | Send multiple messages quickly    | All processed        |

---

## 18. Security Testing

| Test                 | Action                                   | Expected Result             |
| -------------------- | ---------------------------------------- | --------------------------- |
| XSS prevention       | Send `<script>alert(1)</script>` in chat | Script escaped/not executed |
| CSRF protection      | Try unauthorized API call                | Request rejected            |
| SQL injection        | Send `' OR '1'='1` in search             | Safe handling               |
| Privilege escalation | Viewer tries admin action                | Access denied               |
| Session hijacking    | Copy session token                       | Cannot use elsewhere        |

---

## Running Automated Tests

```bash
# Run Jest unit/integration tests
pnpm test

# Run single test file
pnpm test -- src/mcp-server/__tests__/tools.test.ts

# Run Playwright E2E tests
pnpm test:e2e

# Show E2E test report
pnpm test:e2e:report

# TypeScript type check
npx tsc --noEmit

# Run linting
pnpm lint

# Build for production
pnpm build
```

---

## Test Data Setup Script

Run this to set up test data:

```bash
# Start the dev server
pnpm dev

# Then use the chat interface to create:
# 1. One organization with admin
# 2. 2-3 projects with different statuses
# 3. 5-10 tasks with different priorities/statuses
# 4. 2 teams with 2-3 members each
# 5. 2 departments with hierarchy
# 6. 1-2 processes with steps
# 7. Resources (links and files)
# 8. Send invitations
```

---

## Bug Report Template

When filing bugs, include:

```markdown
## Description

Brief description of the issue

## Steps to Reproduce

1. Step 1
2. Step 2
3. ...

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- Browser: Chrome/Firefox/Safari
- OS: Windows/macOS/Linux
- Date: YYYY-MM-DD

## Screenshots

[Screenshots if applicable]

## Console Errors

[Any error messages from console]
```

---

## Notes

- All features are accessible via the Chat interface (`/chat`)
- Natural language commands should be flexible (e.g., "make a task" = "create a task")
- Test both happy paths and edge cases
- Report any inconsistent behavior immediately
