# AltiTeam MCP Server Documentation

## Overview

The AltiTeam MCP (Model Context Protocol) Server exposes AltiTeam project management features as tools that can be called by Claude during conversations. This enables natural language project management through the chat interface.

## Architecture

```
User Chat Message → Claude API → MCP Client → MCP Server → Repositories → Database
```

The MCP Server uses stdio transport for communication with the MCP Client integrated into the chat interface. All tools require authentication and validate organization access before executing operations.

## Quick Start

### Running the Server

```bash
# Development mode
pnpm mcp:server

# Production mode with PM2
pnpm mcp:start
```

### Server Information

- **Name**: `alti-team-mcp-server`
- **Version**: `1.0.0`
- **Transport**: Stdio (standard input/output)
- **Protocol**: JSON-RPC over MCP

## Authentication

All tool calls require authentication. The server supports three authentication methods:

### 1. JWT Bearer Token

```
Authorization: Bearer <your-jwt-token>
```

### 2. API Key

```
x-api-key: <your-api-key>
```

### 3. Session Token

```
x-session-token: <your-session-token>
```

Authentication is validated before any tool execution. Invalid or expired tokens result in `401 Unauthorized` errors.

## Tool Reference

### User Management Tools

#### get_my_profile

Get the current user's profile information.

**Parameters**: None required

**Response**:

```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

**Example**:

```
"What's my profile?"
```

#### update_my_profile

Update the current user's profile information.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | No | User's display name |
| email | string | No | User's email address |
| bio | string | No | User's bio/description |

**Example**:

```
"Update my name to John Smith"
```

#### search_users

Search for users by name or email.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | string | Yes | Search query |
| organizationId | string | No | Filter by organization |
| limit | number | No | Maximum results (default: 10) |

**Example**:

```
"Find users named Sarah"
"Search for john@example.com"
```

### Organization Management Tools

#### create_organization

Create a new organization.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Organization name |
| description | string | No | Organization description |

**Example**:

```
"Create an organization called Acme Corp"
```

#### get_organization

Get organization details.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |

**Example**:

```
"What's the description of organization xyz-123?"
```

#### update_organization

Update organization information (owner only).

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |
| name | string | No | New organization name |
| description | string | No | New organization description |

**Example**:

```
"Rename organization xyz-123 to Acme Industries"
```

#### delete_organization

Delete an organization (owner only).

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID to delete |

**Example**:

```
"Delete organization xyz-123"
```

#### list_my_organizations

List all organizations the current user belongs to.

**Parameters**: None required

**Example**:

```
"Show me my organizations"
```

#### get_organization_dashboard

Get dashboard data for an organization.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |

**Response**:

```json
{
  "organization": {
    "id": "org-123",
    "name": "Acme Corp",
    "description": "My organization"
  },
  "metrics": {
    "projects": 5,
    "members": 12,
    "departments": 3,
    "projectStatus": {
      "active": 2,
      "planning": 2,
      "completed": 1
    }
  }
}
```

**Example**:

```
"Show me the dashboard for Acme Corp"
```

#### get_organization_metrics

Get key metrics for an organization.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |
| period | string | No | Time period (week, month, quarter) |

**Example**:

```
"What are our key metrics this month?"
```

### Project Management Tools

#### create_project

Create a new project.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |
| name | string | Yes | Project name |
| description | string | No | Project description |
| startDate | string | No | Start date (ISO format) |
| endDate | string | No | End date (ISO format) |
| status | string | No | Project status (planning, active, on-hold, completed) |

**Example**:

```
"Create a project called Website Redesign"
```

#### get_project

Get project details.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| projectId | string | Yes | Project ID |

**Example**:

```
"Get details for project xyz-123"
```

#### update_project

Update project information.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| projectId | string | Yes | Project ID |
| name | string | No | Project name |
| description | string | No | Project description |
| status | string | No | Project status |
| startDate | string | No | Start date (ISO format) |
| endDate | string | No | End date (ISO format) |

**Example**:

```
"Update the Q1 Marketing project status to completed"
```

#### delete_project

Delete a project.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| projectId | string | Yes | Project ID |

**Example**:

```
"Delete the old prototype project"
```

#### list_projects

List projects with optional filters.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | No | Filter by organization ID |
| status | string | No | Filter by project status |
| limit | number | No | Maximum results |

**Example**:

```
"Show me all active projects"
"List projects in Acme Corp with status planning"
```

#### create_project_from_template

Create a project from a template.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| templateId | string | Yes | Template ID |
| organizationId | string | Yes | Organization ID |
| name | string | Yes | Project name |
| customizations | object | No | Template customizations |

**Example**:

```
"Create a new software development project from template"
```

#### list_project_templates

List available project templates.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | No | Filter by organization ID |

**Example**:

```
"What project templates are available?"
```

#### get_project_analytics

Get analytics for a project.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| projectId | string | Yes | Project ID |
| metrics | array | No | Metrics to include (completion, velocity, burndown) |

**Example**:

```
"Show me analytics for the Website Redesign project"
```

#### get_project_progress

Get current progress of a project.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| projectId | string | Yes | Project ID |

**Example**:

```
"How's the Website Redesign project progressing?"
```

### Task Management Tools

#### create_task

Create a new task.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| projectId | string | Yes | Project ID |
| title | string | Yes | Task title |
| description | string | No | Task description |
| assigneeId | string | No | User ID to assign |
| dueDate | string | No | Due date (ISO format) |
| priority | string | No | Priority (low, medium, high, urgent) |
| status | string | No | Status (todo, in-progress, review, done) |

**Example**:

```
"Create a task to design the homepage"
```

#### get_task

Get task details.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| taskId | string | Yes | Task ID |

**Example**:

```
"Get task xyz-123 details"
```

#### update_task

Update task information.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| taskId | string | Yes | Task ID |
| title | string | No | Task title |
| description | string | No | Task description |
| assigneeId | string | No | Assignee user ID |
| dueDate | string | No | Due date (ISO format) |
| priority | string | No | Priority |
| status | string | No | Status |

**Example**:

```
"Assign the API integration task to Sarah"
"Update the database migration task priority to urgent"
"Mark task xyz as done"
```

#### delete_task

Delete a task.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| taskId | string | Yes | Task ID |

**Example**:

```
"Delete task xyz-123"
```

#### list_tasks

List tasks with filters.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| projectId | string | No | Filter by project ID |
| assigneeId | string | No | Filter by assignee ID |
| status | string | No | Filter by status |
| priority | string | No | Filter by priority |
| dueBefore | string | No | Filter tasks due before date |
| dueAfter | string | No | Filter tasks due after date |
| limit | number | No | Maximum results |

**Example**:

```
"List high priority tasks in the Website Redesign project"
```

#### search_tasks

Search tasks by title or description.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | string | Yes | Search query |
| projectId | string | No | Filter by project ID |
| limit | number | No | Maximum results |

**Example**:

```
"Find tasks related to authentication"
```

#### get_my_tasks

Get tasks assigned to the current user.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filter by status |
| dueToday | boolean | No | Filter tasks due today |
| overdue | boolean | No | Filter overdue tasks |

**Example**:

```
"What are my tasks for today?"
"Show me all overdue tasks"
```

#### add_task_comment

Add a comment to a task.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| taskId | string | Yes | Task ID |
| content | string | Yes | Comment content |

**Example**:

```
"Add a comment to task xyz: 'This is blocked by the API work'"
```

#### get_task_comments

Get all comments for a task.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| taskId | string | Yes | Task ID |

**Example**:

```
"What are the comments on the design task?"
```

### Team Management Tools

#### create_team

Create a new team.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |
| name | string | Yes | Team name |
| description | string | No | Team description |

**Example**:

```
"Create a team called Engineering"
```

#### get_team

Get team details.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| teamId | string | Yes | Team ID |

**Example**:

```
"What's the Engineering team description?"
```

#### list_teams

List teams in an organization.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |

**Example**:

```
"Show me all teams in Acme Corp"
```

#### update_team

Update team information.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| teamId | string | Yes | Team ID |
| name | string | No | New team name |
| description | string | No | New description |

#### delete_team

Delete a team.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| teamId | string | Yes | Team ID |

#### add_team_member

Add a member to a team.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| teamId | string | Yes | Team ID |
| userId | string | Yes | User ID |
| role | string | No | Role (member, lead) |

**Example**:

```
"Add Sarah to the Engineering team"
```

#### remove_team_member

Remove a member from a team.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| teamId | string | Yes | Team ID |
| userId | string | Yes | User ID |

**Example**:

```
"Remove John from the Design team"
```

#### list_team_members

List all members of a team.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| teamId | string | Yes | Team ID |

**Example**:

```
"Who's on the Marketing team?"
```

### Department Management Tools

#### create_department

Create a new department.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |
| name | string | Yes | Department name |
| parentDepartmentId | string | No | Parent department ID |
| description | string | No | Department description |

**Example**:

```
"Create a department called Sales"
"Create a sub-department called Frontend under Engineering"
```

#### get_department

Get department details.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| departmentId | string | Yes | Department ID |

#### list_departments

List departments in an organization.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |

**Example**:

```
"Show me all departments in Acme Corp"
```

#### get_department_hierarchy

Get organizational hierarchy.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |

**Example**:

```
"Show me the org chart"
"What departments are under Engineering?"
```

#### update_department

Update department information.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| departmentId | string | Yes | Department ID |
| name | string | No | Department name |
| description | string | No | Description |
| parentDepartmentId | string | No | Parent department ID |

**Example**:

```
"Update the Sales department description"
```

#### delete_department

Delete a department.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| departmentId | string | Yes | Department ID |

**Note**: Cannot delete departments with child departments or members.

### Process Management Tools

#### create_process

Create a new business process.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |
| name | string | Yes | Process name |
| description | string | No | Process description |
| steps | array | Yes | Array of step objects |
| departmentId | string | No | Department ID |

**Example**:

```
"Create an onboarding process"
```

#### get_process

Get process details.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| processId | string | Yes | Process ID |

**Example**:

```
"Show me the employee onboarding process"
```

#### list_processes

List processes in an organization.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |
| departmentId | string | No | Filter by department |

**Example**:

```
"What processes do we have?"
```

#### start_process

Start a process execution.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| processId | string | Yes | Process ID |
| context | object | No | Process execution context variables |

**Example**:

```
"Start the onboarding process for John"
```

#### get_process_execution

Get process execution status.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| executionId | string | Yes | Execution ID |

**Example**:

```
"What's the status of the onboarding for Sarah?"
```

#### complete_process_step

Mark a process step as complete.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| executionId | string | Yes | Execution ID |
| stepId | string | Yes | Step ID or index |
| output | object | No | Step output data |

**Example**:

```
"Complete the 'Setup laptop' step for execution xyz"
```

#### get_process_analytics

Get analytics for a process.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| processId | string | Yes | Process ID |
| period | string | No | Time period (week, month, quarter) |

**Example**:

```
"How long does onboarding usually take?"
"What's the bottleneck in our review process?"
```

### Resource Management Tools

#### create_resource

Create a new resource (file, link, note).

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| projectId | string | No* | Project ID |
| taskId | string | No* | Task ID |
| type | string | Yes | Resource type (file, link, note) |
| name | string | Yes | Resource name |
| content | string | No | Content for notes/links |
| fileUrl | string | No | File URL for files |

\*Either projectId or taskId is required

**Example**:

```
"Add a link to the design mockups"
"Create a note with meeting minutes"
```

#### get_resource

Get resource details.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| resourceId | string | Yes | Resource ID |

#### list_resources

List resources.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| projectId | string | No* | Filter by project ID |
| taskId | string | No* | Filter by task ID |
| type | string | No | Filter by resource type |

\*Either projectId or taskId is required

**Example**:

```
"What resources are attached to the Website Redesign project?"
```

#### delete_resource

Delete a resource.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| resourceId | string | Yes | Resource ID |

**Example**:

```
"Delete the old wireframe file"
```

### Member Management Tools

#### list_organization_members

List all members in an organization.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |
| role | string | No | Filter by role (admin, member, viewer) |

**Example**:

```
"Who are the admins in Acme Corp?"
"List all members"
```

#### get_member

Get member details.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| memberId | string | Yes | Member ID |

**Example**:

```
"Show me Sarah's role and permissions"
```

#### invite_member

Invite a new member to an organization (admin only).

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |
| email | string | Yes | Email address |
| role | string | Yes | Role (admin, member, viewer) |
| departmentId | string | No | Department ID |

**Example**:

```
"Invite john@example.com as an admin"
```

#### list_pending_invitations

List pending invitations.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |

**Example**:

```
"What invitations are pending?"
```

#### cancel_invitation

Cancel a pending invitation (admin only).

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| invitationId | string | Yes | Invitation ID |

**Example**:

```
"Cancel the invitation for sarah@example.com"
```

#### update_member_role

Update a member's role (admin only).

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| memberId | string | Yes | Member ID |
| role | string | Yes | New role (admin, member, viewer) |

**Example**:

```
"Make Sarah an admin"
"Change John's role to viewer"
```

### Search and Notification Tools

#### global_search

Search across projects, tasks, resources, and users.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | string | Yes | Search query |
| entityTypes | array | No | Entity types to search (project, task, resource, user) |
| organizationId | string | No | Search within organization |
| limit | number | No | Maximum results per type |

**Example**:

```
"Search for anything related to 'authentication'"
"Find all items mentioning 'Q1 goals'"
```

#### get_my_notifications

Get user's notifications.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| unreadOnly | boolean | No | Show only unread |
| limit | number | No | Maximum results |

**Example**:

```
"What are my unread notifications?"
```

#### mark_notification_read

Mark a notification as read.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| notificationId | string | Yes | Notification ID |

#### mark_all_notifications_read

Mark all notifications as read.

**Parameters**: None required

### Advanced Tools

#### batch_update_tasks

Update multiple tasks at once.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| taskIds | array | Yes | Array of task IDs |
| updates | object | Yes | Fields to update |
| - status | string | No | New status |
| - priority | string | No | New priority |
| - assigneeId | string | No | New assignee ID |

**Example**:

```
"Mark all completed tasks as archived"
"Update all urgent tasks to status in-progress"
```

#### batch_assign_tasks

Assign multiple tasks to a user.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| taskIds | array | Yes | Array of task IDs |
| assigneeId | string | Yes | User ID to assign |

**Example**:

```
"Assign all high priority tasks to Sarah"
```

#### generate_project_report

Generate a project status report.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| projectId | string | Yes | Project ID |
| format | string | No | Report format (summary, detailed, executive) |
| period | string | No | Time period |

**Example**:

```
"Generate a status report for the Q1 Marketing project"
"Create an executive summary of all active projects"
```

#### generate_team_report

Generate team performance report.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| teamId | string | Yes | Team ID |
| metrics | array | No | Metrics to include |
| period | string | Yes | Report period (week, sprint, month) |

**Example**:

```
"Show me this week's team performance report"
```

## Integration Guide

### Connecting to the MCP Server

1. **Start the MCP Server**:

   ```bash
   pnpm mcp:server
   ```

2. **Configure MCP Client**: The client connects via stdio using JSON-RPC protocol.

3. **Authentication**: Pass authentication tokens via environment variables or headers.

### Environment Variables

| Variable          | Description                              |
| ----------------- | ---------------------------------------- |
| `DATABASE_URL`    | Database connection string               |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js                   |
| `LOG_LEVEL`       | Logging level (debug, info, warn, error) |

### Error Handling

All tools return consistent error responses:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error description"
    }
  ],
  "isError": true
}
```

Common error codes:

- `401`: Authentication required or invalid
- `403`: Access denied
- `404`: Resource not found
- `400`: Invalid parameters

### Health Checks

The server exposes a health check endpoint for monitoring:

```bash
curl http://localhost:3000/api/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

## Troubleshooting

### Common Issues

#### 1. Authentication Failures

**Symptoms**: `401 Unauthorized` errors

**Solutions**:

- Verify JWT token is valid and not expired
- Check API key is correctly formatted
- Ensure session token is current

#### 2. Access Denied Errors

**Symptoms**: `403 Forbidden` errors when accessing resources

**Solutions**:

- Verify user is a member of the organization
- Check if admin role is required for the operation
- Ensure resource belongs to accessible organization

#### 3. Server Won't Start

**Symptoms**: Server crashes or won't connect

**Solutions**:

- Check database connection (`DATABASE_URL`)
- Verify environment variables are set
- Check logs in `logs/mcp-server.log`
- Ensure no port conflicts

#### 4. Slow Responses

**Symptoms**: Timeouts or slow tool execution

**Solutions**:

- Check database performance
- Review logs for query bottlenecks
- Consider adding database indexes
- Monitor server resource usage

#### 5. Missing Tools

**Symptoms**: Tools not appearing in list

**Solutions**:

- Restart the MCP server after code changes
- Check tool registration logs
- Verify all dependencies are installed (`pnpm install`)

### Log Files

Log files are stored in `logs/` directory:

- `combined.log`: All logs
- `error.log`: Error-level logs only

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug pnpm mcp:server
```

### Getting Help

If you encounter issues not covered here:

1. Check the logs in `logs/`
2. Review the troubleshooting steps above
3. Search existing issues in the repository
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Log excerpts

## Best Practices

1. **Rate Limiting**: Implement client-side rate limiting for high-volume operations
2. **Error Handling**: Always handle tool errors gracefully in the chat UI
3. **Pagination**: Use `limit` parameter for list operations
4. **Caching**: Cache frequently accessed data client-side
5. **Validation**: Validate all user inputs before sending to tools
6. **Security**: Never expose API keys in client-side code

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial MCP Server release
- Core project management tools
- User and organization management
- Task and resource management
- Process execution tools
- Team and department management
- Search and notification tools
- Batch operations and reporting

## License

See LICENSE file in the repository root.
