import { Pool } from 'pg'
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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Organization Repository
class PostgresOrganizationRepository implements OrganizationRepository {
  async findById(id: string): Promise<Result<Organization | null>> {
    try {
      const result = await pool.query(
        'SELECT * FROM organizations WHERE id = $1',
        [id]
      )
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOwnerId(ownerId: string): Promise<Result<Organization[]>> {
    try {
      const result = await pool.query(
        'SELECT * FROM organizations WHERE owner_id = $1',
        [ownerId]
      )
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateOrganizationInput): Promise<Result<Organization>> {
    try {
      const result = await pool.query(
        `INSERT INTO organizations (name, description, owner_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [data.name, data.description, data.ownerId]
      )
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateOrganizationInput): Promise<Result<Organization>> {
    try {
      const setParts = []
      const values = []
      let paramIndex = 1

      if (data.name !== undefined) {
        setParts.push(`name = $${paramIndex++}`)
        values.push(data.name)
      }
      if (data.description !== undefined) {
        setParts.push(`description = $${paramIndex++}`)
        values.push(data.description)
      }

      setParts.push(`updated_at = NOW()`)
      values.push(id)

      const result = await pool.query(
        `UPDATE organizations SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return failure(new Error(`Organization with id ${id} not found`))
      }

      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM organizations WHERE id = $1', [id])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// User Repository
class PostgresUserRepository implements UserRepository {
  async findById(id: string): Promise<Result<User | null>> {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      )
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByEmail(email: string): Promise<Result<User | null>> {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateUserInput): Promise<Result<User>> {
    try {
      const result = await pool.query(
        `INSERT INTO users (name, email, password, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [data.name, data.email, data.password]
      )
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateUserInput): Promise<Result<User>> {
    try {
      const setParts = []
      const values = []
      let paramIndex = 1

      if (data.name !== undefined) {
        setParts.push(`name = $${paramIndex++}`)
        values.push(data.name)
      }
      if (data.password !== undefined) {
        setParts.push(`password = $${paramIndex++}`)
        values.push(data.password)
      }

      setParts.push(`updated_at = NOW()`)
      values.push(id)

      const result = await pool.query(
        `UPDATE users SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return failure(new Error(`User with id ${id} not found`))
      }

      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [id])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Department Repository
class PostgresDepartmentRepository implements DepartmentRepository {
  async findById(id: string): Promise<Result<Department | null>> {
    try {
      const result = await pool.query(
        'SELECT * FROM departments WHERE id = $1',
        [id]
      )
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Result<Department[]>> {
    try {
      const result = await pool.query(
        'SELECT * FROM departments WHERE organization_id = $1',
        [organizationId]
      )
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByParentId(parentId: string): Promise<Result<Department[]>> {
    try {
      const result = await pool.query(
        'SELECT * FROM departments WHERE parent_id = $1',
        [parentId]
      )
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateDepartmentInput): Promise<Result<Department>> {
    try {
      const result = await pool.query(
        `INSERT INTO departments (name, description, organization_id, parent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [data.name, data.description, data.organizationId, data.parentId]
      )
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateDepartmentInput): Promise<Result<Department>> {
    try {
      const setParts = []
      const values = []
      let paramIndex = 1

      if (data.name !== undefined) {
        setParts.push(`name = $${paramIndex++}`)
        values.push(data.name)
      }
      if (data.description !== undefined) {
        setParts.push(`description = $${paramIndex++}`)
        values.push(data.description)
      }
      if (data.parentId !== undefined) {
        setParts.push(`parent_id = $${paramIndex++}`)
        values.push(data.parentId)
      }

      setParts.push(`updated_at = NOW()`)
      values.push(id)

      const result = await pool.query(
        `UPDATE departments SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return failure(new Error(`Department with id ${id} not found`))
      }

      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM departments WHERE id = $1', [id])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Project Repository
class PostgresProjectRepository implements ProjectRepository {
  async findById(id: string): Promise<Result<Project | null>> {
    try {
      const result = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [id]
      )
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Result<Project[]>> {
    try {
      const result = await pool.query(
        'SELECT * FROM projects WHERE organization_id = $1',
        [organizationId]
      )
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateProjectInput): Promise<Result<Project>> {
    try {
      const result = await pool.query(
        `INSERT INTO projects (name, description, status, start_date, end_date, organization_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [data.name, data.description, data.status || 'active', data.startDate, data.endDate, data.organizationId]
      )
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateProjectInput): Promise<Result<Project>> {
    try {
      const setParts = []
      const values = []
      let paramIndex = 1

      if (data.name !== undefined) {
        setParts.push(`name = $${paramIndex++}`)
        values.push(data.name)
      }
      if (data.description !== undefined) {
        setParts.push(`description = $${paramIndex++}`)
        values.push(data.description)
      }
      if (data.status !== undefined) {
        setParts.push(`status = $${paramIndex++}`)
        values.push(data.status)
      }
      if (data.startDate !== undefined) {
        setParts.push(`start_date = $${paramIndex++}`)
        values.push(data.startDate)
      }
      if (data.endDate !== undefined) {
        setParts.push(`end_date = $${paramIndex++}`)
        values.push(data.endDate)
      }

      setParts.push(`updated_at = NOW()`)
      values.push(id)

      const result = await pool.query(
        `UPDATE projects SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return failure(new Error(`Project with id ${id} not found`))
      }

      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM projects WHERE id = $1', [id])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Task Repository
class PostgresTaskRepository implements TaskRepository {
  async findById(id: string): Promise<Result<Task | null>> {
    try {
      const result = await pool.query(
        'SELECT * FROM tasks WHERE id = $1',
        [id]
      )
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByProjectId(projectId: string): Promise<Result<Task[]>> {
    try {
      const result = await pool.query(
        'SELECT * FROM tasks WHERE project_id = $1',
        [projectId]
      )
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByAssignedToId(assignedToId: string): Promise<Result<Task[]>> {
    try {
      const result = await pool.query(
        'SELECT * FROM tasks WHERE assigned_to_id = $1',
        [assignedToId]
      )
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateTaskInput): Promise<Result<Task>> {
    try {
      const result = await pool.query(
        `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [data.title, data.description, data.status || 'todo', data.priority || 'medium', data.dueDate, data.projectId, data.assignedToId]
      )
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateTaskInput): Promise<Result<Task>> {
    try {
      const setParts = []
      const values = []
      let paramIndex = 1

      if (data.title !== undefined) {
        setParts.push(`title = $${paramIndex++}`)
        values.push(data.title)
      }
      if (data.description !== undefined) {
        setParts.push(`description = $${paramIndex++}`)
        values.push(data.description)
      }
      if (data.status !== undefined) {
        setParts.push(`status = $${paramIndex++}`)
        values.push(data.status)
      }
      if (data.priority !== undefined) {
        setParts.push(`priority = $${paramIndex++}`)
        values.push(data.priority)
      }
      if (data.dueDate !== undefined) {
        setParts.push(`due_date = $${paramIndex++}`)
        values.push(data.dueDate)
      }
      if (data.assignedToId !== undefined) {
        setParts.push(`assigned_to_id = $${paramIndex++}`)
        values.push(data.assignedToId)
      }

      setParts.push(`updated_at = NOW()`)
      values.push(id)

      const result = await pool.query(
        `UPDATE tasks SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return failure(new Error(`Task with id ${id} not found`))
      }

      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM tasks WHERE id = $1', [id])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Resource Repository
class PostgresResourceRepository implements ResourceRepository {
  async findById(id: string): Promise<Result<Resource | null>> {
    try {
      const result = await pool.query('SELECT * FROM resources WHERE id = $1', [id])
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByProjectId(projectId: string): Promise<Result<Resource[]>> {
    try {
      const result = await pool.query('SELECT * FROM resources WHERE project_id = $1', [projectId])
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateResourceInput): Promise<Result<Resource>> {
    try {
      const result = await pool.query(
        `INSERT INTO resources (name, type, url, project_id, uploaded_by_id, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
        [data.name, data.type || 'OTHER', data.url, data.projectId, data.uploadedById]
      )
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateResourceInput): Promise<Result<Resource>> {
    try {
      const setParts = []
      const values = []
      let paramIndex = 1

      if (data.name !== undefined) {
        setParts.push(`name = ${paramIndex++}`)
        values.push(data.name)
      }
      if (data.type !== undefined) {
        setParts.push(`type = ${paramIndex++}`)
        values.push(data.type)
      }
      if (data.url !== undefined) {
        setParts.push(`url = ${paramIndex++}`)
        values.push(data.url)
      }

      values.push(id)
      const result = await pool.query(
        `UPDATE resources SET ${setParts.join(', ')} WHERE id = ${paramIndex} RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return failure(new Error(`Resource with id ${id} not found`))
      }
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM resources WHERE id = $1', [id])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// TeamMember Repository
class PostgresTeamMemberRepository implements TeamMemberRepository {
  async findById(id: string): Promise<Result<TeamMember | null>> {
    try {
      const result = await pool.query('SELECT * FROM team_members WHERE id = $1', [id])
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByUserId(userId: string): Promise<Result<TeamMember[]>> {
    try {
      const result = await pool.query('SELECT * FROM team_members WHERE user_id = $1', [userId])
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Result<TeamMember[]>> {
    try {
      const result = await pool.query('SELECT * FROM team_members WHERE organization_id = $1', [organizationId])
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateTeamMemberInput): Promise<Result<TeamMember>> {
    try {
      const result = await pool.query(
        `INSERT INTO team_members (user_id, organization_id, department_id, role, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
        [data.userId, data.organizationId, data.departmentId, data.role || 'MEMBER', data.position]
      )
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateTeamMemberInput): Promise<Result<TeamMember>> {
    try {
      const setParts = []
      const values = []
      let paramIndex = 1

      if (data.departmentId !== undefined) {
        setParts.push(`department_id = ${paramIndex++}`)
        values.push(data.departmentId)
      }
      if (data.role !== undefined) {
        setParts.push(`role = ${paramIndex++}`)
        values.push(data.role)
      }
      if (data.position !== undefined) {
        setParts.push(`position = ${paramIndex++}`)
        values.push(data.position)
      }

      setParts.push(`updated_at = NOW()`)
      values.push(id)

      const result = await pool.query(
        `UPDATE team_members SET ${setParts.join(', ')} WHERE id = ${paramIndex} RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return failure(new Error(`TeamMember with id ${id} not found`))
      }
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM team_members WHERE id = $1', [id])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Invitation Repository
class PostgresInvitationRepository implements InvitationRepository {
  async findById(id: string): Promise<Result<Invitation | null>> {
    try {
      const result = await pool.query('SELECT * FROM invitations WHERE id = $1', [id])
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByToken(token: string): Promise<Result<Invitation | null>> {
    try {
      const result = await pool.query('SELECT * FROM invitations WHERE token = $1', [token])
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Result<Invitation[]>> {
    try {
      const result = await pool.query('SELECT * FROM invitations WHERE organization_id = $1', [organizationId])
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateInvitationInput): Promise<Result<Invitation>> {
    try {
      const result = await pool.query(
        `INSERT INTO invitations (email, role, organization_id, department_id, token, status, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
        [data.email, data.role || 'MEMBER', data.organizationId, data.departmentId, 
         require('crypto').randomBytes(16).toString('hex'), 'PENDING', 
         new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      )
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: Partial<CreateInvitationInput> & { status?: string; acceptedAt?: Date }): Promise<Result<Invitation>> {
    try {
      const setParts = []
      const values = []
      let paramIndex = 1

      if (data.status !== undefined) {
        setParts.push(`status = ${paramIndex++}`)
        values.push(data.status)
      }
      if (data.acceptedAt !== undefined) {
        setParts.push(`accepted_at = ${paramIndex++}`)
        values.push(data.acceptedAt)
      }

      values.push(id)
      const result = await pool.query(
        `UPDATE invitations SET ${setParts.join(', ')} WHERE id = ${paramIndex} RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return failure(new Error(`Invitation with id ${id} not found`))
      }
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM invitations WHERE id = $1', [id])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Process Repository
class PostgresProcessRepository implements ProcessRepository {
  async findById(id: string): Promise<Result<Process | null>> {
    try {
      const result = await pool.query('SELECT * FROM processes WHERE id = $1', [id])
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Result<Process[]>> {
    try {
      const result = await pool.query('SELECT * FROM processes WHERE organization_id = $1', [organizationId])
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByDepartmentId(departmentId: string): Promise<Result<Process[]>> {
    try {
      const result = await pool.query('SELECT * FROM processes WHERE department_id = $1', [departmentId])
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateProcessInput): Promise<Result<Process>> {
    try {
      const result = await pool.query(
        `INSERT INTO processes (name, description, steps, organization_id, department_id, created_by_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
        [data.name, data.description, data.steps, data.organizationId, data.departmentId, data.createdById]
      )
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateProcessInput): Promise<Result<Process>> {
    try {
      const setParts = []
      const values = []
      let paramIndex = 1

      if (data.name !== undefined) {
        setParts.push(`name = ${paramIndex++}`)
        values.push(data.name)
      }
      if (data.description !== undefined) {
        setParts.push(`description = ${paramIndex++}`)
        values.push(data.description)
      }
      if (data.steps !== undefined) {
        setParts.push(`steps = ${paramIndex++}`)
        values.push(data.steps)
      }

      setParts.push(`updated_at = NOW()`)
      values.push(id)

      const result = await pool.query(
        `UPDATE processes SET ${setParts.join(', ')} WHERE id = ${paramIndex} RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return failure(new Error(`Process with id ${id} not found`))
      }
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM processes WHERE id = $1', [id])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Notification Repository
class PostgresNotificationRepository implements NotificationRepository {
  async findById(id: string): Promise<Result<Notification | null>> {
    try {
      const result = await pool.query('SELECT * FROM notifications WHERE id = $1', [id])
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByUserId(userId: string): Promise<Result<Notification[]>> {
    try {
      const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId])
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateNotificationInput): Promise<Result<Notification>> {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, message, read, created_at)
         VALUES ($1, $2, $3, false, NOW()) RETURNING *`,
        [data.userId, data.type, data.message]
      )
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async markAsRead(id: string): Promise<Result<Notification>> {
    try {
      const result = await pool.query(
        'UPDATE notifications SET read = true WHERE id = $1 RETURNING *',
        [id]
      )

      if (result.rows.length === 0) {
        return failure(new Error(`Notification with id ${id} not found`))
      }
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async markAllAsRead(userId: string): Promise<Result<void>> {
    try {
      await pool.query('UPDATE notifications SET read = true WHERE user_id = $1', [userId])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM notifications WHERE id = $1', [id])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async deleteRead(userId: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM notifications WHERE user_id = $1 AND read = true', [userId])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Comment Repository
class PostgresCommentRepository implements CommentRepository {
  async findById(id: string): Promise<Result<Comment | null>> {
    try {
      const result = await pool.query('SELECT * FROM comments WHERE id = $1', [id])
      return success(result.rows[0] || null)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async findByTaskId(taskId: string): Promise<Result<Comment[]>> {
    try {
      const result = await pool.query('SELECT * FROM comments WHERE task_id = $1 ORDER BY created_at DESC', [taskId])
      return success(result.rows)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async create(data: CreateCommentInput): Promise<Result<Comment>> {
    try {
      const result = await pool.query(
        `INSERT INTO comments (content, task_id, user_id, parent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [data.content, data.taskId, data.userId, data.parentId || null]
      )
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async update(id: string, data: UpdateCommentInput): Promise<Result<Comment>> {
    try {
      const setParts = []
      const values = []
      let paramIndex = 1

      if (data.content !== undefined) {
        setParts.push(`content = ${paramIndex++}`)
        values.push(data.content)
      }
      setParts.push(`updated_at = NOW()`)
      values.push(id)

      const result = await pool.query(
        `UPDATE comments SET ${setParts.join(', ')} WHERE id = ${paramIndex} RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return failure(new Error(`Comment with id ${id} not found`))
      }
      return success(result.rows[0])
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await pool.query('DELETE FROM comments WHERE id = $1', [id])
      return success()
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}

// Create and export repositories
export const createPostgresRepositories = (): Repositories => {
  return {
    organizations: new PostgresOrganizationRepository(),
    users: new PostgresUserRepository(),
    departments: new PostgresDepartmentRepository(),
    projects: new PostgresProjectRepository(),
    tasks: new PostgresTaskRepository(),
    resources: new PostgresResourceRepository(),
    teamMembers: new PostgresTeamMemberRepository(),
    invitations: new PostgresInvitationRepository(),
    processes: new PostgresProcessRepository(),
    notifications: new PostgresNotificationRepository(),
    comments: new PostgresCommentRepository(),
  }
}