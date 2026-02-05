import { Result } from '../result'

export interface Organization {
  id: string
  name: string
  description?: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateOrganizationInput {
  name: string
  description?: string
  ownerId: string
}

export interface UpdateOrganizationInput {
  name?: string
  description?: string
}

export interface OrganizationRepository {
  findById(id: string): Promise<Result<Organization | null>>
  findByOwnerId(ownerId: string): Promise<Result<Organization[]>>
  create(data: CreateOrganizationInput): Promise<Result<Organization>>
  update(
    id: string,
    data: UpdateOrganizationInput,
  ): Promise<Result<Organization>>
  delete(id: string): Promise<Result<void>>
}

export interface User {
  id: string
  email: string
  name?: string
  password?: string
  bio?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  email: string
  name?: string
  password?: string
}

export interface UpdateUserInput {
  name?: string
  password?: string
  bio?: string
}

export interface UserRepository {
  findById(id: string): Promise<Result<User | null>>
  findByEmail(email: string): Promise<Result<User | null>>
  search(
    query: string,
    organizationId?: string,
    limit?: number,
  ): Promise<Result<User[]>>
  create(data: CreateUserInput): Promise<Result<User>>
  update(id: string, data: UpdateUserInput): Promise<Result<User>>
  delete(id: string): Promise<Result<void>>
}

export interface Department {
  id: string
  name: string
  description?: string
  organizationId: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateDepartmentInput {
  name: string
  description?: string
  organizationId: string
  parentId?: string
}

export interface UpdateDepartmentInput {
  name?: string
  description?: string
  parentId?: string | null
}

export interface DepartmentRepository {
  findById(id: string): Promise<Result<Department | null>>
  findByOrganizationId(organizationId: string): Promise<Result<Department[]>>
  findByParentId(parentId: string): Promise<Result<Department[]>>
  create(data: CreateDepartmentInput): Promise<Result<Department>>
  update(id: string, data: UpdateDepartmentInput): Promise<Result<Department>>
  delete(id: string): Promise<Result<void>>
}

export interface Project {
  id: string
  name: string
  description?: string
  status: string
  startDate?: Date
  endDate?: Date
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectInput {
  name: string
  description?: string
  status?: string
  startDate?: Date
  endDate?: Date
  organizationId: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  status?: string
  startDate?: Date
  endDate?: Date
}

export interface ProjectRepository {
  findById(id: string): Promise<Result<Project | null>>
  findByOrganizationId(organizationId: string): Promise<Result<Project[]>>
  create(data: CreateProjectInput): Promise<Result<Project>>
  update(id: string, data: UpdateProjectInput): Promise<Result<Project>>
  delete(id: string): Promise<Result<void>>
}

export interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: Date
  projectId: string
  assignedToId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: string
  priority?: string
  dueDate?: Date
  projectId: string
  assignedToId?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: string
  priority?: string
  dueDate?: Date
  assignedToId?: string
}

export interface TaskRepository {
  findById(id: string): Promise<Result<Task | null>>
  findByProjectId(projectId: string): Promise<Result<Task[]>>
  findByAssignedToId(assignedToId: string): Promise<Result<Task[]>>
  create(data: CreateTaskInput): Promise<Result<Task>>
  update(id: string, data: UpdateTaskInput): Promise<Result<Task>>
  delete(id: string): Promise<Result<void>>
}

export interface Resource {
  id: string
  name: string
  type: string
  url?: string
  projectId: string
  uploadedById: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface CreateResourceInput {
  name: string
  type?: string
  url?: string
  projectId: string
  uploadedById: string
  metadata?: Record<string, unknown>
}

export interface UpdateResourceInput {
  name?: string
  type?: string
  url?: string
}

export interface ResourceRepository {
  findById(id: string): Promise<Result<Resource | null>>
  findByProjectId(projectId: string): Promise<Result<Resource[]>>
  create(data: CreateResourceInput): Promise<Result<Resource>>
  update(id: string, data: UpdateResourceInput): Promise<Result<Resource>>
  delete(id: string): Promise<Result<void>>
}

export interface TeamMember {
  id: string
  userId: string
  organizationId: string
  departmentId?: string
  role: string
  position?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateTeamMemberInput {
  userId: string
  organizationId: string
  departmentId?: string
  role?: string
  position?: string
}

export interface UpdateTeamMemberInput {
  departmentId?: string | null
  role?: string
  position?: string
}

export interface TeamMemberRepository {
  findById(id: string): Promise<Result<TeamMember | null>>
  findByUserId(userId: string): Promise<Result<TeamMember[]>>
  findByOrganizationId(organizationId: string): Promise<Result<TeamMember[]>>
  findByProjectId(projectId: string): Promise<Result<TeamMember[]>>
  create(data: CreateTeamMemberInput): Promise<Result<TeamMember>>
  update(id: string, data: UpdateTeamMemberInput): Promise<Result<TeamMember>>
  delete(id: string): Promise<Result<void>>
}

export interface Invitation {
  id: string
  email: string
  role: string
  organizationId: string
  departmentId?: string
  token: string
  status: string
  expiresAt: Date
  createdAt: Date
  acceptedAt?: Date
}

export interface CreateInvitationInput {
  email: string
  role?: string
  organizationId: string
  departmentId?: string
}

export interface InvitationRepository {
  findById(id: string): Promise<Result<Invitation | null>>
  findByToken(token: string): Promise<Result<Invitation | null>>
  findByOrganizationId(organizationId: string): Promise<Result<Invitation[]>>
  create(data: CreateInvitationInput): Promise<Result<Invitation>>
  update(
    id: string,
    data: Partial<CreateInvitationInput> & {
      status?: string
      acceptedAt?: Date
    },
  ): Promise<Result<Invitation>>
  delete(id: string): Promise<Result<void>>
}

export interface Process {
  id: string
  name: string
  description?: string
  steps: string
  organizationId: string
  departmentId: string
  createdById: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateProcessInput {
  name: string
  description?: string
  steps: string
  organizationId: string
  departmentId: string
  createdById: string
}

export interface UpdateProcessInput {
  name?: string
  description?: string
  steps?: string
}

export interface ProcessRepository {
  findById(id: string): Promise<Result<Process | null>>
  findByOrganizationId(organizationId: string): Promise<Result<Process[]>>
  findByDepartmentId(departmentId: string): Promise<Result<Process[]>>
  create(data: CreateProcessInput): Promise<Result<Process>>
  update(id: string, data: UpdateProcessInput): Promise<Result<Process>>
  delete(id: string): Promise<Result<void>>
}

export interface Notification {
  id: string
  userId: string
  type: string
  message: string
  read: boolean
  createdAt: Date
}

export interface CreateNotificationInput {
  userId: string
  type: string
  message: string
}

export interface NotificationRepository {
  findById(id: string): Promise<Result<Notification | null>>
  findByUserId(userId: string): Promise<Result<Notification[]>>
  create(data: CreateNotificationInput): Promise<Result<Notification>>
  markAsRead(id: string): Promise<Result<Notification>>
  markAllAsRead(userId: string): Promise<Result<void>>
  delete(id: string): Promise<Result<void>>
  deleteRead(userId: string): Promise<Result<void>>
}

export interface Comment {
  id: string
  content: string
  taskId: string
  userId: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Team {
  id: string
  name: string
  description?: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateTeamInput {
  name: string
  description?: string
  organizationId: string
}

export interface UpdateTeamInput {
  name?: string
  description?: string
}

export interface TeamRepository {
  findById(id: string): Promise<Result<Team | null>>
  findByOrganizationId(organizationId: string): Promise<Result<Team[]>>
  create(data: CreateTeamInput): Promise<Result<Team>>
  update(id: string, data: UpdateTeamInput): Promise<Result<Team>>
  delete(id: string): Promise<Result<void>>
}

export interface CreateCommentInput {
  content: string
  taskId: string
  userId: string
  parentId?: string
}

export interface UpdateCommentInput {
  content?: string
}

export interface CommentRepository {
  findById(id: string): Promise<Result<Comment | null>>
  findByTaskId(taskId: string): Promise<Result<Comment[]>>
  create(data: CreateCommentInput): Promise<Result<Comment>>
  update(id: string, data: UpdateCommentInput): Promise<Result<Comment>>
  delete(id: string): Promise<Result<void>>
}

export interface Repositories {
  organizations: OrganizationRepository
  users: UserRepository
  departments: DepartmentRepository
  projects: ProjectRepository
  tasks: TaskRepository
  resources: ResourceRepository
  teamMembers: TeamMemberRepository
  invitations: InvitationRepository
  processes: ProcessRepository
  notifications: NotificationRepository
  comments: CommentRepository
  teams: TeamRepository
}
