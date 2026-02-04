import {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationRepository,
  User,
  CreateUserInput,
  UpdateUserInput,
  UserRepository,
  Department,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  DepartmentRepository,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectRepository,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskRepository,
  Resource,
  CreateResourceInput,
  UpdateResourceInput,
  ResourceRepository,
  TeamMember,
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
  TeamMemberRepository,
  Invitation,
  CreateInvitationInput,
  InvitationRepository,
  Process,
  CreateProcessInput,
  UpdateProcessInput,
  ProcessRepository,
  Notification,
  CreateNotificationInput,
  NotificationRepository,
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
  CommentRepository,
  Repositories,
} from "./types"
import { Result, success, failure } from "../result"

// In-memory storage
let organizations: Organization[] = []
let users: User[] = []
let departments: Department[] = []
let projects: Project[] = []
let tasks: Task[] = []
let resources: Resource[] = []
let teamMembers: TeamMember[] = []
let invitations: Invitation[] = []
let processes: Process[] = []
let notifications: Notification[] = []
let comments: Comment[] = []

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9)

// Organization Repository
class InMemoryOrganizationRepository implements OrganizationRepository {
  async findById(id: string): Promise<Result<Organization | null>> {
    try {
      const organization = organizations.find((org) => org.id === id) || null
      return success(organization)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOwnerId(ownerId: string): Promise<Result<Organization[]>> {
    try {
      const orgs = organizations.filter((org) => org.ownerId === ownerId)
      return success(orgs)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateOrganizationInput): Promise<Result<Organization>> {
    try {
      const organization: Organization = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      organizations.push(organization)
      return success(organization)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateOrganizationInput): Promise<Result<Organization>> {
    try {
      const index = organizations.findIndex((org) => org.id === id)
      if (index === -1) {
        return failure(new Error(`Organization with id ${id} not found`))
      }
      organizations[index] = {
        ...organizations[index],
        ...data,
        updatedAt: new Date(),
      }
      return success(organizations[index])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      organizations = organizations.filter((org) => org.id !== id)
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// User Repository
class InMemoryUserRepository implements UserRepository {
  async findById(id: string): Promise<Result<User | null>> {
    try {
      const user = users.find((user) => user.id === id) || null
      return success(user)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByEmail(email: string): Promise<Result<User | null>> {
    try {
      const user = users.find((user) => user.email === email) || null
      return success(user)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateUserInput): Promise<Result<User>> {
    try {
      const user: User = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      users.push(user)
      return success(user)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateUserInput): Promise<Result<User>> {
    try {
      const index = users.findIndex((user) => user.id === id)
      if (index === -1) {
        return failure(new Error(`User with id ${id} not found`))
      }
      
      const currentUser = users[index]
      let updatedAt = new Date()
      
      // Ensure updatedAt is always after createdAt
      if (updatedAt.getTime() <= currentUser.createdAt.getTime()) {
        updatedAt = new Date(currentUser.createdAt.getTime() + 1)
      }
      
      users[index] = {
        ...currentUser,
        ...data,
        updatedAt,
      }
      
      return success(users[index])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      users = users.filter((user) => user.id !== id)
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async search(query: string, organizationId?: string, limit?: number): Promise<Result<User[]>> {
    try {
      let filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      )

      // Filter by organization if provided
      if (organizationId) {
        const orgMembers = await new InMemoryTeamMemberRepository().findByOrganizationId(organizationId)
        if (orgMembers.isOk()) {
          const memberUserIds = orgMembers.value.map(m => m.userId)
          filteredUsers = filteredUsers.filter(user => memberUserIds.includes(user.id))
        }
      }

      // Apply limit
      if (limit) {
        filteredUsers = filteredUsers.slice(0, limit)
      }

      return success(filteredUsers)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Department Repository
class InMemoryDepartmentRepository implements DepartmentRepository {
  async findById(id: string): Promise<Result<Department | null>> {
    try {
      const department = departments.find((dept) => dept.id === id) || null
      return success(department)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Result<Department[]>> {
    try {
      const depts = departments.filter((dept) => dept.organizationId === organizationId)
      return success(depts)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByParentId(parentId: string): Promise<Result<Department[]>> {
    try {
      const depts = departments.filter((dept) => dept.parentId === parentId)
      return success(depts)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateDepartmentInput): Promise<Result<Department>> {
    try {
      const department: Department = {
        id: generateId(),
        parentId: data.parentId || undefined,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      departments.push(department)
      return success(department)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateDepartmentInput): Promise<Result<Department>> {
    try {
      const index = departments.findIndex((dept) => dept.id === id)
      if (index === -1) {
        return failure(new Error(`Department with id ${id} not found`))
      }
      departments[index] = {
        ...departments[index],
        parentId: data.parentId ?? departments[index].parentId,
        ...data,
        updatedAt: new Date(),
      }
      return success(departments[index])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      departments = departments.filter((dept) => dept.id !== id)
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Project Repository
class InMemoryProjectRepository implements ProjectRepository {
  async findById(id: string): Promise<Result<Project | null>> {
    try {
      const project = projects.find((proj) => proj.id === id) || null
      return success(project)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Result<Project[]>> {
    try {
      const projs = projects.filter((proj) => proj.organizationId === organizationId)
      return success(projs)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateProjectInput): Promise<Result<Project>> {
    try {
      const project: Project = {
        id: generateId(),
        status: data.status || "active",
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      projects.push(project)
      return success(project)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateProjectInput): Promise<Result<Project>> {
    try {
      const index = projects.findIndex((proj) => proj.id === id)
      if (index === -1) {
        return failure(new Error(`Project with id ${id} not found`))
      }
      projects[index] = {
        ...projects[index],
        ...data,
        updatedAt: new Date(),
      }
      return success(projects[index])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      projects = projects.filter((proj) => proj.id !== id)
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Task Repository
class InMemoryTaskRepository implements TaskRepository {
  async findById(id: string): Promise<Result<Task | null>> {
    try {
      const task = tasks.find((task) => task.id === id) || null
      return success(task)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByProjectId(projectId: string): Promise<Result<Task[]>> {
    try {
      const taskList = tasks.filter((task) => task.projectId === projectId)
      return success(taskList)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByAssignedToId(assignedToId: string): Promise<Result<Task[]>> {
    try {
      const taskList = tasks.filter((task) => task.assignedToId === assignedToId)
      return success(taskList)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateTaskInput): Promise<Result<Task>> {
    try {
      const task: Task = {
        id: generateId(),
        status: data.status || "todo",
        priority: data.priority || "medium",
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      tasks.push(task)
      return success(task)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateTaskInput): Promise<Result<Task>> {
    try {
      const index = tasks.findIndex((task) => task.id === id)
      if (index === -1) {
        return failure(new Error(`Task with id ${id} not found`))
      }
      tasks[index] = {
        ...tasks[index],
        ...data,
        updatedAt: new Date(),
      }
      return success(tasks[index])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      tasks = tasks.filter((task) => task.id !== id)
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Resource Repository
class InMemoryResourceRepository implements ResourceRepository {
  async findById(id: string): Promise<Result<Resource | null>> {
    try {
      const resource = resources.find((r) => r.id === id) || null
      return success(resource)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByProjectId(projectId: string): Promise<Result<Resource[]>> {
    try {
      const resourceList = resources.filter((r) => r.projectId === projectId)
      return success(resourceList)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateResourceInput): Promise<Result<Resource>> {
    try {
      const resource: Resource = {
        id: generateId(),
        type: data.type || "FILE",
        ...data,
        createdAt: new Date(),
      }
      resources.push(resource)
      return success(resource)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateResourceInput): Promise<Result<Resource>> {
    try {
      const index = resources.findIndex((r) => r.id === id)
      if (index === -1) {
        return failure(new Error(`Resource with id ${id} not found`))
      }
      resources[index] = {
        ...resources[index],
        ...data,
      }
      return success(resources[index])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      resources = resources.filter((r) => r.id !== id)
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// TeamMember Repository
class InMemoryTeamMemberRepository implements TeamMemberRepository {
  async findById(id: string): Promise<Result<TeamMember | null>> {
    try {
      const member = teamMembers.find((m) => m.id === id) || null
      return success(member)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByUserId(userId: string): Promise<Result<TeamMember[]>> {
    try {
      const members = teamMembers.filter((m) => m.userId === userId)
      return success(members)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Result<TeamMember[]>> {
    try {
      const members = teamMembers.filter((m) => m.organizationId === organizationId)
      return success(members)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateTeamMemberInput): Promise<Result<TeamMember>> {
    try {
      const member: TeamMember = {
        id: generateId(),
        role: data.role || "MEMBER",
        departmentId: data.departmentId || undefined,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      teamMembers.push(member)
      return success(member)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateTeamMemberInput): Promise<Result<TeamMember>> {
    try {
      const index = teamMembers.findIndex((m) => m.id === id)
      if (index === -1) {
        return failure(new Error(`TeamMember with id ${id} not found`))
      }
      teamMembers[index] = {
        ...teamMembers[index],
        departmentId: data.departmentId ?? teamMembers[index].departmentId,
        ...data,
        updatedAt: new Date(),
      }
      return success(teamMembers[index])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      teamMembers = teamMembers.filter((m) => m.id !== id)
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Invitation Repository
class InMemoryInvitationRepository implements InvitationRepository {
  async findById(id: string): Promise<Result<Invitation | null>> {
    try {
      const invitation = invitations.find((i) => i.id === id) || null
      return success(invitation)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByToken(token: string): Promise<Result<Invitation | null>> {
    try {
      const invitation = invitations.find((i) => i.token === token) || null
      return success(invitation)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Result<Invitation[]>> {
    try {
      const invitationList = invitations.filter((i) => i.organizationId === organizationId)
      return success(invitationList)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateInvitationInput): Promise<Result<Invitation>> {
    try {
      const invitation: Invitation = {
        id: generateId(),
        token: generateId(),
        status: "PENDING",
        role: data.role || "MEMBER",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        ...data,
      }
      invitations.push(invitation)
      return success(invitation)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: Partial<CreateInvitationInput> & { status?: string; acceptedAt?: Date }): Promise<Result<Invitation>> {
    try {
      const index = invitations.findIndex((i) => i.id === id)
      if (index === -1) {
        return failure(new Error(`Invitation with id ${id} not found`))
      }
      invitations[index] = {
        ...invitations[index],
        ...data,
      }
      return success(invitations[index])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      invitations = invitations.filter((i) => i.id !== id)
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Process Repository
class InMemoryProcessRepository implements ProcessRepository {
  async findById(id: string): Promise<Result<Process | null>> {
    try {
      const process = processes.find((p) => p.id === id) || null
      return success(process)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Result<Process[]>> {
    try {
      const processList = processes.filter((p) => p.organizationId === organizationId)
      return success(processList)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByDepartmentId(departmentId: string): Promise<Result<Process[]>> {
    try {
      const processList = processes.filter((p) => p.departmentId === departmentId)
      return success(processList)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateProcessInput): Promise<Result<Process>> {
    try {
      const process: Process = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      processes.push(process)
      return success(process)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateProcessInput): Promise<Result<Process>> {
    try {
      const index = processes.findIndex((p) => p.id === id)
      if (index === -1) {
        return failure(new Error(`Process with id ${id} not found`))
      }
      processes[index] = {
        ...processes[index],
        ...data,
        updatedAt: new Date(),
      }
      return success(processes[index])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      processes = processes.filter((p) => p.id !== id)
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Notification Repository
class InMemoryNotificationRepository implements NotificationRepository {
  async findById(id: string): Promise<Result<Notification | null>> {
    try {
      const notification = notifications.find((n) => n.id === id) || null
      return success(notification)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByUserId(userId: string): Promise<Result<Notification[]>> {
    try {
      const notificationList = notifications.filter((n) => n.userId === userId)
      return success(notificationList)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateNotificationInput): Promise<Result<Notification>> {
    try {
      const notification: Notification = {
        id: generateId(),
        read: false,
        createdAt: new Date(),
        ...data,
      }
      notifications.push(notification)
      return success(notification)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async markAsRead(id: string): Promise<Result<Notification>> {
    try {
      const index = notifications.findIndex((n) => n.id === id)
      if (index === -1) {
        return failure(new Error(`Notification with id ${id} not found`))
      }
      notifications[index] = {
        ...notifications[index],
        read: true,
      }
      return success(notifications[index])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async markAllAsRead(userId: string): Promise<Result<void>> {
    try {
      notifications = notifications.map((n) =>
        n.userId === userId ? { ...n, read: true } : n
      )
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      notifications = notifications.filter((n) => n.id !== id)
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async deleteRead(userId: string): Promise<Result<void>> {
    try {
      notifications = notifications.filter((n) => !(n.userId === userId && n.read))
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Comment Repository
class InMemoryCommentRepository implements CommentRepository {
  async findById(id: string): Promise<Result<Comment | null>> {
    try {
      const comment = comments.find((c) => c.id === id) || null
      return success(comment)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByTaskId(taskId: string): Promise<Result<Comment[]>> {
    try {
      const commentList = comments.filter((c) => c.taskId === taskId)
      return success(commentList)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateCommentInput): Promise<Result<Comment>> {
    try {
      const comment: Comment = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      comments.push(comment)
      return success(comment)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateCommentInput): Promise<Result<Comment>> {
    try {
      const index = comments.findIndex((c) => c.id === id)
      if (index === -1) {
        return failure(new Error(`Comment with id ${id} not found`))
      }
      comments[index] = {
        ...comments[index],
        ...data,
        updatedAt: new Date(),
      }
      return success(comments[index])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      comments = comments.filter((c) => c.id !== id)
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Create and export repositories
export const createInMemoryRepositories = (): Repositories => {
  return {
    organizations: new InMemoryOrganizationRepository(),
    users: new InMemoryUserRepository(),
    departments: new InMemoryDepartmentRepository(),
    projects: new InMemoryProjectRepository(),
    tasks: new InMemoryTaskRepository(),
    resources: new InMemoryResourceRepository(),
    teamMembers: new InMemoryTeamMemberRepository(),
    invitations: new InMemoryInvitationRepository(),
    processes: new InMemoryProcessRepository(),
    notifications: new InMemoryNotificationRepository(),
    comments: new InMemoryCommentRepository(),
  }
}
