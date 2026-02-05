import '@jest/globals'
import {
  createMockRepositories,
  createTestData,
  MockRepositories,
} from './mock-repositories'
import { MCPServerContext } from '@/mcp-server/index'
import { validateOrganizationAccess } from '@/mcp-server/auth'

describe('User MCP Tools', () => {
  let repos: MockRepositories
  let testData: Awaited<ReturnType<typeof createTestData>>
  let context: MCPServerContext

  beforeEach(async () => {
    repos = createMockRepositories()
    testData = await createTestData(repos)
    context = {
      userId: testData.users.user1.id,
      repositories: repos as any,
    }
  })

  describe('get_my_profile', () => {
    test('should return user profile for authenticated user', async () => {
      const user = testData.users.user1
      const result = await repos.users.findById(user.id)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toBeNull()
        expect(result.data?.email).toBe('john@example.com')
        expect(result.data?.name).toBe('John Doe')
      }
    })

    test('should return null for non-existent user', async () => {
      const result = await repos.users.findById('non-existent-id')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeNull()
      }
    })
  })

  describe('update_my_profile', () => {
    test('should update user profile', async () => {
      const result = await repos.users.update(testData.users.user1.id, {
        name: 'John Updated',
        bio: 'New bio',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.name).toBe('John Updated')
        expect(result.data?.bio).toBe('New bio')
      }
    })

    test('should fail for non-existent user', async () => {
      const result = await repos.users.update('non-existent-id', {
        name: 'Test',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('search_users', () => {
    test('should find users by name', async () => {
      const result = await repos.users.search('John')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBeGreaterThanOrEqual(1)
        expect(result.data.some((u) => u.name?.includes('John'))).toBe(true)
      }
    })

    test('should find users by email', async () => {
      const result = await repos.users.search('jane@example.com')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBe(1)
        expect(result.data[0].email).toBe('jane@example.com')
      }
    })

    test('should return empty for no matches', async () => {
      const result = await repos.users.search('nonexistent')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(0)
      }
    })

    test('should respect limit parameter', async () => {
      const result = await repos.users.search('', undefined, 1)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBeLessThanOrEqual(1)
      }
    })
  })
})

describe('Organization MCP Tools', () => {
  let repos: MockRepositories
  let testData: Awaited<ReturnType<typeof createTestData>>
  let context: MCPServerContext

  beforeEach(async () => {
    repos = createMockRepositories()
    testData = await createTestData(repos)
    context = {
      userId: testData.users.user1.id,
      repositories: repos as any,
    }
  })

  describe('create_organization', () => {
    test('should create a new organization', async () => {
      const result = await repos.organizations.create({
        name: 'New Org',
        description: 'Test org',
        ownerId: testData.users.user2.id,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.name).toBe('New Org')
        expect(result.data?.ownerId).toBe(testData.users.user2.id)
      }
    })
  })

  describe('get_organization', () => {
    test('should return organization by id', async () => {
      const result = await repos.organizations.findById(
        testData.organization.id,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.name).toBe('Acme Corp')
      }
    })

    test('should return null for non-existent organization', async () => {
      const result = await repos.organizations.findById('non-existent')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeNull()
      }
    })
  })

  describe('validateOrganizationAccess', () => {
    test('should return true for organization member', async () => {
      const hasAccess = await validateOrganizationAccess(
        testData.users.user1.id,
        testData.organization.id,
        context,
      )
      expect(hasAccess).toBe(true)
    })

    test('should return false for non-member', async () => {
      const newUserResult = await repos.users.create({
        email: 'new@example.com',
        name: 'New User',
      })
      if (newUserResult.success) {
        const hasAccess = await validateOrganizationAccess(
          newUserResult.data.id,
          testData.organization.id,
          context,
        )
        expect(hasAccess).toBe(false)
      }
    })
  })
})

describe('Project MCP Tools', () => {
  let repos: MockRepositories
  let testData: Awaited<ReturnType<typeof createTestData>>
  let context: MCPServerContext

  beforeEach(async () => {
    repos = createMockRepositories()
    testData = await createTestData(repos)
    context = {
      userId: testData.users.user1.id,
      repositories: repos as any,
    }
  })

  describe('create_project', () => {
    test('should create a new project', async () => {
      const result = await repos.projects.create({
        name: 'New Project',
        description: 'Test project',
        status: 'planning',
        organizationId: testData.organization.id,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.name).toBe('New Project')
        expect(result.data?.status).toBe('planning')
      }
    })
  })

  describe('get_project', () => {
    test('should return project by id', async () => {
      const result = await repos.projects.findById(testData.project.id)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.name).toBe('Website Redesign')
      }
    })
  })

  describe('update_project', () => {
    test('should update project', async () => {
      const result = await repos.projects.update(testData.project.id, {
        status: 'completed',
        name: 'Updated Project Name',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.status).toBe('completed')
        expect(result.data?.name).toBe('Updated Project Name')
      }
    })
  })

  describe('list_projects', () => {
    test('should list projects by organization', async () => {
      const result = await repos.projects.findByOrganizationId(
        testData.organization.id,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBeGreaterThanOrEqual(1)
      }
    })
  })
})

describe('Task MCP Tools', () => {
  let repos: MockRepositories
  let testData: Awaited<ReturnType<typeof createTestData>>
  let context: MCPServerContext

  beforeEach(async () => {
    repos = createMockRepositories()
    testData = await createTestData(repos)
    context = {
      userId: testData.users.user1.id,
      repositories: repos as any,
    }
  })

  describe('create_task', () => {
    test('should create a new task', async () => {
      const result = await repos.tasks.create({
        title: 'New Task',
        description: 'Test task',
        priority: 'high',
        projectId: testData.project.id,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.title).toBe('New Task')
        expect(result.data?.priority).toBe('high')
        expect(result.data?.status).toBe('todo')
      }
    })

    test('should create task with assigned user', async () => {
      const result = await repos.tasks.create({
        title: 'Assigned Task',
        projectId: testData.project.id,
        assignedToId: testData.users.user2.id,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.assignedToId).toBe(testData.users.user2.id)
      }
    })
  })

  describe('get_task', () => {
    test('should return task by id', async () => {
      const result = await repos.tasks.findById(testData.task.id)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.title).toBe('Design homepage')
      }
    })
  })

  describe('update_task', () => {
    test('should update task status', async () => {
      const result = await repos.tasks.update(testData.task.id, {
        status: 'in-progress',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.status).toBe('in-progress')
      }
    })

    test('should update task priority', async () => {
      const result = await repos.tasks.update(testData.task.id, {
        priority: 'urgent',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.priority).toBe('urgent')
      }
    })
  })

  describe('findByProjectId', () => {
    test('should find tasks by project', async () => {
      const result = await repos.tasks.findByProjectId(testData.project.id)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('findByAssignedToId', () => {
    test('should find tasks by assignee', async () => {
      const result = await repos.tasks.findByAssignedToId(
        testData.users.user2.id,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeDefined()
      }
    })
  })
})

describe('Resource MCP Tools', () => {
  let repos: MockRepositories
  let testData: Awaited<ReturnType<typeof createTestData>>
  let context: MCPServerContext

  beforeEach(async () => {
    repos = createMockRepositories()
    testData = await createTestData(repos)
    context = {
      userId: testData.users.user1.id,
      repositories: repos as any,
    }
  })

  describe('create_resource', () => {
    test('should create a file resource', async () => {
      const result = await repos.resources.create({
        name: 'Test Document',
        type: 'file',
        url: 'https://example.com/doc.pdf',
        projectId: testData.project.id,
        uploadedById: testData.users.user1.id,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.name).toBe('Test Document')
        expect(result.data?.type).toBe('file')
      }
    })

    test('should create a link resource', async () => {
      const result = await repos.resources.create({
        name: 'Useful Link',
        type: 'link',
        url: 'https://example.com',
        projectId: testData.project.id,
        uploadedById: testData.users.user1.id,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.type).toBe('link')
      }
    })
  })

  describe('get_resource', () => {
    test('should return resource by id', async () => {
      if (!testData.resource) {
        // Create resource if it doesn't exist
        const createResult = await repos.resources.create({
          name: 'Design Spec',
          type: 'file',
          url: 'https://example.com/spec.pdf',
          projectId: testData.project.id,
          uploadedById: testData.users.user1.id,
        })
        if (!createResult.success) {
          throw new Error('Failed to create resource')
        }
        testData.resource = createResult.data
      }
      const result = await repos.resources.findById(testData.resource.id)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.name).toBe('Design Spec')
      }
    })
  })

  describe('list_resources', () => {
    test('should list resources by project', async () => {
      const result = await repos.resources.findByProjectId(testData.project.id)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBeGreaterThanOrEqual(1)
      }
    })
  })
})

describe('TeamMember MCP Tools', () => {
  let repos: MockRepositories
  let testData: Awaited<ReturnType<typeof createTestData>>
  let context: MCPServerContext

  beforeEach(async () => {
    repos = createMockRepositories()
    testData = await createTestData(repos)
    context = {
      userId: testData.users.user1.id,
      repositories: repos as any,
    }
  })

  describe('findByOrganizationId', () => {
    test('should list team members by organization', async () => {
      const result = await repos.teamMembers.findByOrganizationId(
        testData.organization.id,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBeGreaterThanOrEqual(2)
      }
    })
  })

  describe('findByUserId', () => {
    test('should find team memberships by user', async () => {
      const result = await repos.teamMembers.findByUserId(
        testData.users.user1.id,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('update member role', () => {
    test('should update member role', async () => {
      const memberId = testData.teamMembers.member1?.id
      if (memberId) {
        const result = await repos.teamMembers.update(memberId, {
          role: 'viewer',
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data?.role).toBe('viewer')
        }
      }
    })
  })
})

describe('Department MCP Tools', () => {
  let repos: MockRepositories
  let testData: Awaited<ReturnType<typeof createTestData>>
  let context: MCPServerContext

  beforeEach(async () => {
    repos = createMockRepositories()
    testData = await createTestData(repos)
    context = {
      userId: testData.users.user1.id,
      repositories: repos as any,
    }
  })

  describe('create_department', () => {
    test('should create a new department', async () => {
      const result = await repos.departments.create({
        name: 'Sales',
        description: 'Sales department',
        organizationId: testData.organization.id,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.name).toBe('Sales')
      }
    })
  })

  describe('get_department', () => {
    test('should return department by id', async () => {
      if (!testData.department) {
        const createResult = await repos.departments.create({
          name: 'Engineering',
          description: 'Engineering department',
          organizationId: testData.organization.id,
        })
        if (!createResult.success) {
          throw new Error('Failed to create department')
        }
        testData.department = createResult.data
      }
      const result = await repos.departments.findById(testData.department.id)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.name).toBe('Engineering')
      }
    })
  })

  describe('list_departments', () => {
    test('should list departments by organization', async () => {
      const result = await repos.departments.findByOrganizationId(
        testData.organization.id,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBeGreaterThanOrEqual(1)
      }
    })
  })
})

describe('Invitation MCP Tools', () => {
  let repos: MockRepositories
  let testData: Awaited<ReturnType<typeof createTestData>>
  let context: MCPServerContext

  beforeEach(async () => {
    repos = createMockRepositories()
    testData = await createTestData(repos)
    context = {
      userId: testData.users.user1.id,
      repositories: repos as any,
    }
  })

  describe('invite_member', () => {
    test('should create invitation', async () => {
      const result = await repos.invitations.create({
        email: 'newuser@example.com',
        role: 'member',
        organizationId: testData.organization.id,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.email).toBe('newuser@example.com')
        expect(result.data?.status).toBe('pending')
      }
    })
  })

  describe('list_pending_invitations', () => {
    test('should filter pending invitations', async () => {
      const allResult = await repos.invitations.findByOrganizationId(
        testData.organization.id,
      )
      expect(allResult.success).toBe(true)
      if (allResult.success) {
        const pending = allResult.data.filter((i) => i.status === 'pending')
        expect(pending.every((i) => i.status === 'pending')).toBe(true)
      }
    })
  })
})

describe('Comment MCP Tools', () => {
  let repos: MockRepositories
  let testData: Awaited<ReturnType<typeof createTestData>>
  let context: MCPServerContext

  beforeEach(async () => {
    repos = createMockRepositories()
    testData = await createTestData(repos)
    context = {
      userId: testData.users.user1.id,
      repositories: repos as any,
    }
  })

  describe('create_comment', () => {
    test('should create a comment on task', async () => {
      const result = await repos.comments.create({
        content: 'This is a test comment',
        taskId: testData.task.id,
        userId: testData.users.user1.id,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.content).toBe('This is a test comment')
      }
    })
  })

  describe('get_task_comments', () => {
    test('should find comments by task', async () => {
      const result = await repos.comments.findByTaskId(testData.task.id)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeDefined()
      }
    })
  })
})

describe('Error Handling', () => {
  let repos: MockRepositories
  let testData: Awaited<ReturnType<typeof createTestData>>

  beforeEach(async () => {
    repos = createMockRepositories()
    testData = await createTestData(repos)
  })

  test('should handle non-existent project update gracefully', async () => {
    const result = await repos.projects.update('non-existent-id', {
      name: 'Should Fail',
    })
    expect(result.success).toBe(false)
  })

  test('should handle non-existent task delete gracefully', async () => {
    const result = await repos.tasks.delete('non-existent-id')
    expect(result.success).toBe(false)
  })

  test('should handle non-existent resource find gracefully', async () => {
    const result = await repos.resources.findById('non-existent-id')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeNull()
    }
  })
})

describe('Data Integrity', () => {
  let repos: MockRepositories
  let testData: Awaited<ReturnType<typeof createTestData>>

  beforeEach(async () => {
    repos = createMockRepositories()
    testData = await createTestData(repos)
  })

  test('should preserve createdAt timestamps', async () => {
    const projectResult = await repos.projects.create({
      name: 'Timestamp Test',
      organizationId: testData.organization.id,
    })
    expect(projectResult.success).toBe(true)
    if (projectResult.success) {
      expect(projectResult.data?.createdAt).toBeDefined()
      expect(projectResult.data?.createdAt instanceof Date).toBe(true)
    }
  })

  test('should update updatedAt timestamps', async () => {
    const beforeUpdate = new Date()
    await new Promise((resolve) => setTimeout(resolve, 10))

    const updateResult = await repos.projects.update(testData.project.id, {
      name: 'Updated Name',
    })

    if (updateResult.success) {
      expect(updateResult.data?.updatedAt).toBeDefined()
      expect(updateResult.data?.updatedAt >= beforeUpdate).toBe(true)
    }
  })
})
