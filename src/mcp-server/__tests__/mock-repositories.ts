import { Result, success, failure, isSuccess } from '@/lib/result'
import {
  User,
  Organization,
  Project,
  Task,
  Resource,
  Department,
  TeamMember,
  Invitation,
  Process,
  Notification,
  Comment,
  Team,
} from '@/lib/repositories/types'

const generateId = (): string => Math.random().toString(36).substring(2, 15)

export interface MockUser extends User {
  password?: string
}

export type MockRepositories = {
  users: {
    findById: (id: string) => Promise<Result<MockUser | null>>
    findByEmail: (email: string) => Promise<Result<MockUser | null>>
    search: (
      query: string,
      organizationId?: string,
      limit?: number,
    ) => Promise<Result<User[]>>
    create: (data: {
      email: string
      name?: string
      password?: string
    }) => Promise<Result<User>>
    update: (
      id: string,
      data: { name?: string; bio?: string },
    ) => Promise<Result<User>>
    delete: (id: string) => Promise<Result<void>>
  }
  organizations: {
    findById: (id: string) => Promise<Result<Organization | null>>
    findByOwnerId: (ownerId: string) => Promise<Result<Organization[]>>
    create: (data: {
      name: string
      description?: string
      ownerId: string
    }) => Promise<Result<Organization>>
    update: (
      id: string,
      data: { name?: string; description?: string },
    ) => Promise<Result<Organization>>
    delete: (id: string) => Promise<Result<void>>
  }
  projects: {
    findById: (id: string) => Promise<Result<Project | null>>
    findByOrganizationId: (organizationId: string) => Promise<Result<Project[]>>
    create: (data: {
      name: string
      description?: string
      status?: string
      startDate?: Date
      endDate?: Date
      organizationId: string
    }) => Promise<Result<Project>>
    update: (
      id: string,
      data: {
        name?: string
        description?: string
        status?: string
        startDate?: Date
        endDate?: Date
      },
    ) => Promise<Result<Project>>
    delete: (id: string) => Promise<Result<void>>
  }
  tasks: {
    findById: (id: string) => Promise<Result<Task | null>>
    findByProjectId: (projectId: string) => Promise<Result<Task[]>>
    findByAssignedToId: (assignedToId: string) => Promise<Result<Task[]>>
    create: (data: {
      title: string
      description?: string
      status?: string
      priority?: string
      dueDate?: Date
      projectId: string
      assignedToId?: string
    }) => Promise<Result<Task>>
    update: (
      id: string,
      data: {
        title?: string
        description?: string
        status?: string
        priority?: string
        dueDate?: Date
        assignedToId?: string | null
      },
    ) => Promise<Result<Task>>
    delete: (id: string) => Promise<Result<void>>
  }
  resources: {
    findById: (id: string) => Promise<Result<Resource | null>>
    findByProjectId: (projectId: string) => Promise<Result<Resource[]>>
    create: (data: {
      name: string
      type?: string
      url?: string
      projectId: string
      uploadedById: string
      metadata?: Record<string, unknown>
    }) => Promise<Result<Resource>>
    update: (
      id: string,
      data: { name?: string; type?: string; url?: string },
    ) => Promise<Result<Resource>>
    delete: (id: string) => Promise<Result<void>>
  }
  departments: {
    findById: (id: string) => Promise<Result<Department | null>>
    findByOrganizationId: (
      organizationId: string,
    ) => Promise<Result<Department[]>>
    findByParentId: (parentId: string) => Promise<Result<Department[]>>
    create: (data: {
      name: string
      description?: string
      organizationId: string
      parentId?: string
    }) => Promise<Result<Department>>
    update: (
      id: string,
      data: {
        name?: string
        description?: string
        parentId?: string | null
      },
    ) => Promise<Result<Department>>
    delete: (id: string) => Promise<Result<void>>
  }
  teamMembers: {
    findById: (id: string) => Promise<Result<TeamMember | null>>
    findByUserId: (userId: string) => Promise<Result<TeamMember[]>>
    findByOrganizationId: (
      organizationId: string,
    ) => Promise<Result<TeamMember[]>>
    findByProjectId: (projectId: string) => Promise<Result<TeamMember[]>>
    create: (data: {
      userId: string
      organizationId: string
      departmentId?: string
      role?: string
      position?: string
    }) => Promise<Result<TeamMember>>
    update: (
      id: string,
      data: {
        departmentId?: string | null
        role?: string
        position?: string
      },
    ) => Promise<Result<TeamMember>>
    delete: (id: string) => Promise<Result<void>>
  }
  invitations: {
    findById: (id: string) => Promise<Result<Invitation | null>>
    findByToken: (token: string) => Promise<Result<Invitation | null>>
    findByOrganizationId: (
      organizationId: string,
    ) => Promise<Result<Invitation[]>>
    create: (data: {
      email: string
      role?: string
      organizationId: string
      departmentId?: string
    }) => Promise<Result<Invitation>>
    update: (
      id: string,
      data: Partial<{ status: string; acceptedAt: Date }>,
    ) => Promise<Result<Invitation>>
    delete: (id: string) => Promise<Result<void>>
  }
  processes: {
    findById: (id: string) => Promise<Result<Process | null>>
    findByOrganizationId: (organizationId: string) => Promise<Result<Process[]>>
    findByDepartmentId: (departmentId: string) => Promise<Result<Process[]>>
    create: (data: {
      name: string
      description?: string
      steps: string
      organizationId: string
      departmentId: string
      createdById: string
    }) => Promise<Result<Process>>
    update: (
      id: string,
      data: { name?: string; description?: string; steps?: string },
    ) => Promise<Result<Process>>
    delete: (id: string) => Promise<Result<void>>
  }
  notifications: {
    findById: (id: string) => Promise<Result<Notification | null>>
    findByUserId: (userId: string) => Promise<Result<Notification[]>>
    create: (data: {
      userId: string
      type: string
      message: string
    }) => Promise<Result<Notification>>
    markAsRead: (id: string) => Promise<Result<Notification>>
    markAllAsRead: (userId: string) => Promise<Result<void>>
    delete: (id: string) => Promise<Result<void>>
    deleteRead: (userId: string) => Promise<Result<void>>
  }
  comments: {
    findById: (id: string) => Promise<Result<Comment | null>>
    findByTaskId: (taskId: string) => Promise<Result<Comment[]>>
    create: (data: {
      content: string
      taskId: string
      userId: string
      parentId?: string
    }) => Promise<Result<Comment>>
    update: (id: string, data: { content?: string }) => Promise<Result<Comment>>
    delete: (id: string) => Promise<Result<void>>
  }
  teams: {
    findById: (id: string) => Promise<Result<Team | null>>
    findByOrganizationId: (organizationId: string) => Promise<Result<Team[]>>
    create: (data: {
      name: string
      description?: string
      organizationId: string
    }) => Promise<Result<Team>>
    update: (
      id: string,
      data: { name?: string; description?: string },
    ) => Promise<Result<Team>>
    delete: (id: string) => Promise<Result<void>>
  }
}

export function createMockRepositories(): MockRepositories {
  const users: Map<string, MockUser> = new Map()
  const organizations: Map<string, Organization> = new Map()
  const projects: Map<string, Project> = new Map()
  const tasks: Map<string, Task> = new Map()
  const resources: Map<string, Resource> = new Map()
  const departments: Map<string, Department> = new Map()
  const teamMembers: Map<string, TeamMember> = new Map()
  const invitations: Map<string, Invitation> = new Map()
  const processes: Map<string, Process> = new Map()
  const notifications: Map<string, Notification> = new Map()
  const comments: Map<string, Comment> = new Map()
  const teams: Map<string, Team> = new Map()

  const now = new Date()

  return {
    users: {
      findById: async (id: string) => {
        const user = users.get(id)
        return success(user || null)
      },
      findByEmail: async (email: string) => {
        const user = Array.from(users.values()).find((u) => u.email === email)
        return success(user || null)
      },
      search: async (
        query: string,
        _organizationId?: string,
        limit?: number,
      ) => {
        const results = Array.from(users.values()).filter(
          (u) =>
            u.name?.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase()),
        )
        return success(limit ? results.slice(0, limit) : results)
      },
      create: async (data: {
        email: string
        name?: string
        password?: string
      }) => {
        const id = generateId()
        const user: MockUser = {
          id,
          email: data.email,
          name: data.name,
          password: data.password,
          createdAt: now,
          updatedAt: now,
        }
        users.set(id, user)
        return success(user)
      },
      update: async (id: string, data: { name?: string; bio?: string }) => {
        const user = users.get(id)
        if (!user) return failure(new Error('User not found'))
        const updated: MockUser = { ...user, ...data, updatedAt: new Date() }
        users.set(id, updated)
        return success(updated)
      },
      delete: async (id: string) => {
        users.delete(id)
        return success(undefined)
      },
    },
    organizations: {
      findById: async (id: string) => {
        const org = organizations.get(id)
        return success(org || null)
      },
      findByOwnerId: async (ownerId: string) => {
        const orgs = Array.from(organizations.values()).filter(
          (o) => o.ownerId === ownerId,
        )
        return success(orgs)
      },
      create: async (data: {
        name: string
        description?: string
        ownerId: string
      }) => {
        const id = generateId()
        const org: Organization = {
          id,
          name: data.name,
          description: data.description,
          ownerId: data.ownerId,
          createdAt: now,
          updatedAt: now,
        }
        organizations.set(id, org)
        return success(org)
      },
      update: async (
        id: string,
        data: { name?: string; description?: string },
      ) => {
        const org = organizations.get(id)
        if (!org) return failure(new Error('Organization not found'))
        const updated: Organization = { ...org, ...data, updatedAt: new Date() }
        organizations.set(id, updated)
        return success(updated)
      },
      delete: async (id: string) => {
        organizations.delete(id)
        return success(undefined)
      },
    },
    projects: {
      findById: async (id: string) => {
        const project = projects.get(id)
        return success(project || null)
      },
      findByOrganizationId: async (organizationId: string) => {
        const projs = Array.from(projects.values()).filter(
          (p) => p.organizationId === organizationId,
        )
        return success(projs)
      },
      create: async (data) => {
        const id = generateId()
        const project: Project = {
          id,
          name: data.name,
          description: data.description,
          status: data.status || 'planning',
          startDate: data.startDate,
          endDate: data.endDate,
          organizationId: data.organizationId,
          createdAt: now,
          updatedAt: now,
        }
        projects.set(id, project)
        return success(project)
      },
      update: async (id, data) => {
        const project = projects.get(id)
        if (!project) return failure(new Error('Project not found'))
        const updated: Project = { ...project, ...data, updatedAt: new Date() }
        projects.set(id, updated)
        return success(updated)
      },
      delete: async (id: string) => {
        projects.delete(id)
        return success(undefined)
      },
    },
    tasks: {
      findById: async (id: string) => {
        const task = tasks.get(id)
        return success(task || null)
      },
      findByProjectId: async (projectId: string) => {
        const ts = Array.from(tasks.values()).filter(
          (t) => t.projectId === projectId,
        )
        return success(ts)
      },
      findByAssignedToId: async (assignedToId: string) => {
        const ts = Array.from(tasks.values()).filter(
          (t) => t.assignedToId === assignedToId,
        )
        return success(ts)
      },
      create: async (data) => {
        const id = generateId()
        const task: Task = {
          id,
          title: data.title,
          description: data.description,
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          dueDate: data.dueDate,
          projectId: data.projectId,
          assignedToId: data.assignedToId,
          createdAt: now,
          updatedAt: now,
        }
        tasks.set(id, task)
        return success(task)
      },
      update: async (id, data) => {
        const task = tasks.get(id)
        if (!task) return failure(new Error('Task not found'))
        const updated: Task = {
          ...task,
          ...data,
          updatedAt: new Date(),
          assignedToId: data.assignedToId ?? task.assignedToId,
        }
        tasks.set(id, updated)
        return success(updated)
      },
      delete: async (id: string) => {
        const task = tasks.get(id)
        if (!task) return failure(new Error('Task not found'))
        tasks.delete(id)
        return success(undefined)
      },
    },
    resources: {
      findById: async (id: string) => {
        const resource = resources.get(id)
        return success(resource || null)
      },
      findByProjectId: async (projectId: string) => {
        const res = Array.from(resources.values()).filter(
          (r) => r.projectId === projectId,
        )
        return success(res)
      },
      create: async (data) => {
        const id = generateId()
        const resource: Resource = {
          id,
          name: data.name,
          type: data.type || 'file',
          url: data.url,
          projectId: data.projectId,
          uploadedById: data.uploadedById,
          metadata: data.metadata,
          createdAt: now,
        }
        resources.set(id, resource)
        return success(resource)
      },
      update: async (id, data) => {
        const resource = resources.get(id)
        if (!resource) return failure(new Error('Resource not found'))
        const updated: Resource = { ...resource, ...data }
        resources.set(id, updated)
        return success(updated)
      },
      delete: async (id: string) => {
        resources.delete(id)
        return success(undefined)
      },
    },
    departments: {
      findById: async (id: string) => {
        const dept = departments.get(id)
        return success(dept || null)
      },
      findByOrganizationId: async (organizationId: string) => {
        const depts = Array.from(departments.values()).filter(
          (d) => d.organizationId === organizationId,
        )
        return success(depts)
      },
      findByParentId: async (parentId: string) => {
        const depts = Array.from(departments.values()).filter(
          (d) => d.parentId === parentId,
        )
        return success(depts)
      },
      create: async (data) => {
        const id = generateId()
        const dept: Department = {
          id,
          name: data.name,
          description: data.description,
          organizationId: data.organizationId,
          parentId: data.parentId,
          createdAt: now,
          updatedAt: now,
        }
        departments.set(id, dept)
        return success(dept)
      },
      update: async (id, data) => {
        const dept = departments.get(id)
        if (!dept) return failure(new Error('Department not found'))
        const updated: Department = {
          ...dept,
          ...data,
          updatedAt: new Date(),
          parentId: data.parentId ?? dept.parentId,
        }
        departments.set(id, updated)
        return success(updated)
      },
      delete: async (id: string) => {
        departments.delete(id)
        return success(undefined)
      },
    },
    teamMembers: {
      findById: async (id: string) => {
        const member = teamMembers.get(id)
        return success(member || null)
      },
      findByUserId: async (userId: string) => {
        const members = Array.from(teamMembers.values()).filter(
          (m) => m.userId === userId,
        )
        return success(members)
      },
      findByOrganizationId: async (organizationId: string) => {
        const members = Array.from(teamMembers.values()).filter(
          (m) => m.organizationId === organizationId,
        )
        return success(members)
      },
      findByProjectId: async (_projectId: string) => {
        return success<TeamMember[]>([])
      },
      create: async (data) => {
        const id = generateId()
        const member: TeamMember = {
          id,
          userId: data.userId,
          organizationId: data.organizationId,
          departmentId: data.departmentId,
          role: data.role || 'member',
          position: data.position,
          createdAt: now,
          updatedAt: now,
        }
        teamMembers.set(id, member)
        return success(member)
      },
      update: async (id, data) => {
        const member = teamMembers.get(id)
        if (!member) return failure(new Error('TeamMember not found'))
        const updated: TeamMember = {
          ...member,
          ...data,
          updatedAt: new Date(),
          departmentId: data.departmentId ?? member.departmentId,
        }
        teamMembers.set(id, updated)
        return success(updated)
      },
      delete: async (id: string) => {
        teamMembers.delete(id)
        return success(undefined)
      },
    },
    invitations: {
      findById: async (id: string) => {
        const invitation = invitations.get(id)
        return success(invitation || null)
      },
      findByToken: async (token: string) => {
        const invitation = Array.from(invitations.values()).find(
          (i) => i.token === token,
        )
        return success(invitation || null)
      },
      findByOrganizationId: async (organizationId: string) => {
        const invs = Array.from(invitations.values()).filter(
          (i) => i.organizationId === organizationId,
        )
        return success(invs)
      },
      create: async (data) => {
        const id = generateId()
        const token = generateId() + generateId()
        const invitation: Invitation = {
          id,
          email: data.email,
          role: data.role || 'member',
          organizationId: data.organizationId,
          departmentId: data.departmentId,
          token,
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: now,
        }
        invitations.set(id, invitation)
        return success(invitation)
      },
      update: async (id, data) => {
        const invitation = invitations.get(id)
        if (!invitation) return failure(new Error('Invitation not found'))
        const updated: Invitation = { ...invitation, ...data }
        invitations.set(id, updated)
        return success(updated)
      },
      delete: async (id: string) => {
        invitations.delete(id)
        return success(undefined)
      },
    },
    processes: {
      findById: async (id: string) => {
        const process = processes.get(id)
        return success(process || null)
      },
      findByOrganizationId: async (organizationId: string) => {
        const procs = Array.from(processes.values()).filter(
          (p) => p.organizationId === organizationId,
        )
        return success(procs)
      },
      findByDepartmentId: async (departmentId: string) => {
        const procs = Array.from(processes.values()).filter(
          (p) => p.departmentId === departmentId,
        )
        return success(procs)
      },
      create: async (data) => {
        const id = generateId()
        const process: Process = {
          id,
          name: data.name,
          description: data.description,
          steps: data.steps,
          organizationId: data.organizationId,
          departmentId: data.departmentId,
          createdById: data.createdById,
          createdAt: now,
          updatedAt: now,
        }
        processes.set(id, process)
        return success(process)
      },
      update: async (id, data) => {
        const process = processes.get(id)
        if (!process) return failure(new Error('Process not found'))
        const updated: Process = { ...process, ...data, updatedAt: new Date() }
        processes.set(id, updated)
        return success(updated)
      },
      delete: async (id: string) => {
        processes.delete(id)
        return success(undefined)
      },
    },
    notifications: {
      findById: async (id: string) => {
        const notification = notifications.get(id)
        return success(notification || null)
      },
      findByUserId: async (userId: string) => {
        const notifs = Array.from(notifications.values()).filter(
          (n) => n.userId === userId,
        )
        return success(notifs)
      },
      create: async (data) => {
        const id = generateId()
        const notification: Notification = {
          id,
          userId: data.userId,
          type: data.type,
          message: data.message,
          read: false,
          createdAt: now,
        }
        notifications.set(id, notification)
        return success(notification)
      },
      markAsRead: async (id: string) => {
        const notification = notifications.get(id)
        if (!notification) return failure(new Error('Notification not found'))
        const updated: Notification = { ...notification, read: true }
        notifications.set(id, updated)
        return success(updated)
      },
      markAllAsRead: async (_userId: string) => {
        return success(undefined)
      },
      delete: async (id: string) => {
        notifications.delete(id)
        return success(undefined)
      },
      deleteRead: async (_userId: string) => {
        return success(undefined)
      },
    },
    comments: {
      findById: async (id: string) => {
        const comment = comments.get(id)
        return success(comment || null)
      },
      findByTaskId: async (taskId: string) => {
        const coms = Array.from(comments.values()).filter(
          (c) => c.taskId === taskId,
        )
        return success(coms)
      },
      create: async (data) => {
        const id = generateId()
        const comment: Comment = {
          id,
          content: data.content,
          taskId: data.taskId,
          userId: data.userId,
          parentId: data.parentId,
          createdAt: now,
          updatedAt: now,
        }
        comments.set(id, comment)
        return success(comment)
      },
      update: async (id, data) => {
        const comment = comments.get(id)
        if (!comment) return failure(new Error('Comment not found'))
        const updated: Comment = { ...comment, ...data, updatedAt: new Date() }
        comments.set(id, updated)
        return success(updated)
      },
      delete: async (id: string) => {
        comments.delete(id)
        return success(undefined)
      },
    },
    teams: {
      findById: async (id: string) => {
        const team = teams.get(id)
        return success(team || null)
      },
      findByOrganizationId: async (organizationId: string) => {
        const tms = Array.from(teams.values()).filter(
          (t) => t.organizationId === organizationId,
        )
        return success(tms)
      },
      create: async (data) => {
        const id = generateId()
        const team: Team = {
          id,
          name: data.name,
          description: data.description,
          organizationId: data.organizationId,
          createdAt: now,
          updatedAt: now,
        }
        teams.set(id, team)
        return success(team)
      },
      update: async (id, data) => {
        const team = teams.get(id)
        if (!team) return failure(new Error('Team not found'))
        const updated: Team = { ...team, ...data, updatedAt: new Date() }
        teams.set(id, updated)
        return success(updated)
      },
      delete: async (id: string) => {
        teams.delete(id)
        return success(undefined)
      },
    },
  }
}

export async function createTestData(repos: MockRepositories) {
  const now = new Date()

  const user1Result = await repos.users.create({
    email: 'john@example.com',
    name: 'John Doe',
    password: 'hashedpassword',
  })
  if (!isSuccess(user1Result)) throw new Error('Failed to create user1')
  const user1 = user1Result.data as MockUser

  const user2Result = await repos.users.create({
    email: 'jane@example.com',
    name: 'Jane Smith',
  })
  if (!isSuccess(user2Result)) throw new Error('Failed to create user2')
  const user2 = user2Result.data as MockUser

  const orgResult = await repos.organizations.create({
    name: 'Acme Corp',
    description: 'Test organization',
    ownerId: user1.id,
  })
  if (!isSuccess(orgResult)) throw new Error('Failed to create organization')
  const org = orgResult.data as Organization

  const memberResult = await repos.teamMembers.create({
    userId: user1.id,
    organizationId: org.id,
    role: 'admin',
  })

  const member2Result = await repos.teamMembers.create({
    userId: user2.id,
    organizationId: org.id,
    role: 'member',
  })

  const projectResult = await repos.projects.create({
    name: 'Website Redesign',
    description: 'Redesign company website',
    status: 'active',
    organizationId: org.id,
    startDate: now,
    endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  })
  if (!isSuccess(projectResult)) throw new Error('Failed to create project')
  const project = projectResult.data as Project

  const taskResult = await repos.tasks.create({
    title: 'Design homepage',
    description: 'Create mockups for homepage',
    status: 'todo',
    priority: 'high',
    projectId: project.id,
  })
  if (!isSuccess(taskResult)) throw new Error('Failed to create task')
  const task = taskResult.data as Task

  const resourceResult = await repos.resources.create({
    name: 'Design Spec',
    type: 'file',
    url: 'https://example.com/spec.pdf',
    projectId: project.id,
    uploadedById: user1.id,
  })
  if (!isSuccess(resourceResult)) throw new Error('Failed to create resource')

  const deptResult = await repos.departments.create({
    name: 'Engineering',
    description: 'Engineering department',
    organizationId: org.id,
  })
  if (!isSuccess(deptResult)) throw new Error('Failed to create department')

  return {
    users: { user1, user2 },
    organization: org,
    teamMembers: {
      member1: isSuccess(memberResult)
        ? (memberResult.data as TeamMember)
        : null,
      member2: isSuccess(member2Result)
        ? (member2Result.data as TeamMember)
        : null,
    },
    project,
    task,
    resource: isSuccess(resourceResult)
      ? (resourceResult.data as Resource)
      : null,
    department: isSuccess(deptResult) ? (deptResult.data as Department) : null,
  }
}
