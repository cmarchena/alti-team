# Process Management System

The Process Management System allows users to create, execute, and track business processes using pre-built templates or custom workflows. It provides visibility into process performance through analytics and bottleneck detection.

## Overview

Processes are multi-step workflows that help teams systematically complete recurring business tasks. Each process belongs to an organization and department, and tracks progress through individual step completion.

## Pages and Routes

| Route | Description |
|-------|-------------|
| `/processes` | Lists all processes with organization filter |
| `/processes/templates` | Browse and create processes from templates |
| `/processes/[id]` | View process details and all steps |
| `/processes/[id]/execute` | Execute process - mark steps complete |
| `/processes/[id]/analytics` | View performance metrics and insights |

## Process Templates

Five pre-built templates are available:

| Template | Category | Steps |
|----------|----------|-------|
| Software Development Process | Development | 8 |
| Marketing Campaign Process | Marketing | 7 |
| Product Launch Process | Product | 10 |
| Employee Onboarding Process | HR | 6 |
| Event Planning Process | Events | 9 |

### Software Development Process Steps
1. Requirements Gathering
2. System Design
3. Development Setup
4. Implementation
5. Code Review
6. Testing
7. Deployment
8. Post-Launch Support

### Marketing Campaign Process Steps
1. Market Research
2. Campaign Strategy
3. Content Creation
4. Channel Setup
5. Campaign Launch
6. Performance Monitoring
7. Analysis & Optimization

### Product Launch Process Steps
1. Product Finalization
2. Launch Planning
3. Marketing Preparation
4. Sales Training
5. Beta Testing
6. Pre-Launch Checklist
7. Launch Day Execution
8. Initial Monitoring
9. Customer Feedback
10. Post-Launch Review

### Employee Onboarding Process Steps
1. Pre-Start Preparation
2. First Day Orientation
3. HR Paperwork
4. Team Introductions
5. Training & Development
6. 30-Day Check-in

### Event Planning Process Steps
1. Event Concept Development
2. Budget Planning
3. Venue Selection
4. Vendor Coordination
5. Marketing & Promotion
6. Logistics Planning
7. Day-of-Event Management
8. Post-Event Follow-up
9. Event Analysis

## Features

### Process Creation
1. Navigate to `/processes/templates`
2. Select a template or choose "Create from Scratch"
3. Fill in process name, description, organization, and department
4. Click "Create Process" to instantiate

### Execution
1. Go to `/processes/[id]/execute`
2. Click checkboxes to mark steps as complete
3. Progress auto-saves
4. Use "Reset Progress" to start over
5. Visual indicators show completion percentage and next step

### Analytics
The analytics page provides:

- **Completion Percentage** - Overall progress
- **Steps Completed** - Count of finished steps
- **Average Time/Step** - Mean time per completed step
- **Total Time** - Total duration from start to current state
- **Bottleneck Detection** - Steps taking >1.5x average time
- **Step Performance Table** - Detailed breakdown with time spent

### Process List
- Filter by organization
- View all processes at a glance
- Quick links to View, Execute, Analytics, and Delete

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/processes` | List processes (requires organizationId) |
| POST | `/api/processes` | Create a new process |
| GET | `/api/processes/[id]` | Get process details |
| PATCH | `/api/processes/[id]` | Update process steps |
| DELETE | `/api/processes/[id]` | Delete a process |

### List Processes
```bash
GET /api/processes?organizationId=<id>&departmentId=<optional>
```

### Create Process
```bash
POST /api/processes
Content-Type: application/json

{
  "name": "Process Name",
  "description": "Optional description",
  "steps": [
    { "id": "step-1", "name": "Step 1", "completed": false }
  ],
  "organizationId": "<id>",
  "departmentId": "<id>"
}
```

### Update Process Steps
```bash
PATCH /api/processes/[id]
Content-Type: application/json

{
  "steps": "[{\"id\":\"step-1\",\"name\":\"Step 1\",\"completed\":true,\"completedAt\":\"2024-01-15T10:00:00Z\"}]"
}
```

## Data Model

### Process
```typescript
{
  id: string
  name: string
  description: string | null
  steps: string  // JSON array of ProcessStep
  organizationId: string
  departmentId: string
  createdById: string
  createdAt: string
}
```

### ProcessStep
```typescript
{
  id: string
  name: string
  description?: string
  completed: boolean
  completedAt?: string
  completedBy?: string
}
```

## User Flow

1. **Create Process**: `/processes/templates` -> Select Template -> Fill Details -> Create
2. **Execute Process**: `/processes` -> Click Execute -> Mark Steps Complete
3. **View Progress**: `/processes/[id]` -> View all steps and status
4. **Analyze Performance**: `/processes/[id]/analytics` -> Review metrics and bottlenecks

## Permissions

- Only organization owners can create processes
- Users must belong to an organization to view its processes
- Processes are filtered by the user's organization access
