"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPostgresRepositories = void 0;
const pg_1 = require("pg");
const result_1 = require("../result");
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'alti_team',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'alti_team',
});
const toCamelCase = (row) => {
    const result = {};
    for (const [key, value] of Object.entries(row)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = value;
    }
    return result;
};
const toCamelCaseArray = (rows) => {
    return rows.map(toCamelCase);
};
// Organization Repository
class PostgresOrganizationRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM organizations WHERE id = $1', [id]);
            if (result.rows.length === 0)
                return (0, result_1.success)(null);
            return (0, result_1.success)(toCamelCase(result.rows[0]));
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOwnerId(ownerId) {
        try {
            const result = await pool.query('SELECT * FROM organizations WHERE owner_id = $1', [ownerId]);
            return (0, result_1.success)(result.rows.map(toCamelCase));
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO organizations (name, description, owner_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`, [data.name, data.description, data.ownerId]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            if (data.name !== undefined) {
                setParts.push(`name = $${paramIndex++}`);
                values.push(data.name);
            }
            if (data.description !== undefined) {
                setParts.push(`description = $${paramIndex++}`);
                values.push(data.description);
            }
            setParts.push(`updated_at = NOW()`);
            values.push(id);
            const result = await pool.query(`UPDATE organizations SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`Organization with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM organizations WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// User Repository
class PostgresUserRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByEmail(email) {
        try {
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [
                email,
            ]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async search(query, organizationId, limit) {
        try {
            let sql = `
        SELECT DISTINCT u.* FROM users u
        INNER JOIN team_members tm ON u.id = tm.user_id
        WHERE (u.name ILIKE $1 OR u.email ILIKE $1)
      `;
            const params = [`%${query}%`];
            let paramIndex = 2;
            if (organizationId) {
                sql += ` AND tm.organization_id = $${paramIndex++}`;
                params.push(organizationId);
            }
            sql += ` ORDER BY u.name LIMIT $${paramIndex}`;
            params.push(limit || 50);
            const result = await pool.query(sql, params);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO users (name, email, password, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`, [data.name, data.email, data.password]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            if (data.name !== undefined) {
                setParts.push(`name = $${paramIndex++}`);
                values.push(data.name);
            }
            if (data.password !== undefined) {
                setParts.push(`password = $${paramIndex++}`);
                values.push(data.password);
            }
            setParts.push(`updated_at = NOW()`);
            values.push(id);
            const result = await pool.query(`UPDATE users SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`User with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM users WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Department Repository
class PostgresDepartmentRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const result = await pool.query('SELECT * FROM departments WHERE organization_id = $1', [organizationId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByParentId(parentId) {
        try {
            const result = await pool.query('SELECT * FROM departments WHERE parent_id = $1', [parentId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO departments (name, description, organization_id, parent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`, [data.name, data.description, data.organizationId, data.parentId]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            if (data.name !== undefined) {
                setParts.push(`name = $${paramIndex++}`);
                values.push(data.name);
            }
            if (data.description !== undefined) {
                setParts.push(`description = $${paramIndex++}`);
                values.push(data.description);
            }
            if (data.parentId !== undefined) {
                setParts.push(`parent_id = $${paramIndex++}`);
                values.push(data.parentId);
            }
            setParts.push(`updated_at = NOW()`);
            values.push(id);
            const result = await pool.query(`UPDATE departments SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`Department with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM departments WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Project Repository
class PostgresProjectRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM projects WHERE id = $1', [
                id,
            ]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const result = await pool.query('SELECT * FROM projects WHERE organization_id = $1', [organizationId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO projects (name, description, status, start_date, end_date, organization_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`, [
                data.name,
                data.description,
                data.status || 'active',
                data.startDate,
                data.endDate,
                data.organizationId,
            ]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            if (data.name !== undefined) {
                setParts.push(`name = $${paramIndex++}`);
                values.push(data.name);
            }
            if (data.description !== undefined) {
                setParts.push(`description = $${paramIndex++}`);
                values.push(data.description);
            }
            if (data.status !== undefined) {
                setParts.push(`status = $${paramIndex++}`);
                values.push(data.status);
            }
            if (data.startDate !== undefined) {
                setParts.push(`start_date = $${paramIndex++}`);
                values.push(data.startDate);
            }
            if (data.endDate !== undefined) {
                setParts.push(`end_date = $${paramIndex++}`);
                values.push(data.endDate);
            }
            setParts.push(`updated_at = NOW()`);
            values.push(id);
            const result = await pool.query(`UPDATE projects SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`Project with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM projects WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Task Repository
class PostgresTaskRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByProjectId(projectId) {
        try {
            const result = await pool.query('SELECT * FROM tasks WHERE project_id = $1', [projectId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByAssignedToId(assignedToId) {
        try {
            const result = await pool.query('SELECT * FROM tasks WHERE assigned_to_id = $1', [assignedToId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`, [
                data.title,
                data.description,
                data.status || 'todo',
                data.priority || 'medium',
                data.dueDate,
                data.projectId,
                data.assignedToId,
            ]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            if (data.title !== undefined) {
                setParts.push(`title = $${paramIndex++}`);
                values.push(data.title);
            }
            if (data.description !== undefined) {
                setParts.push(`description = $${paramIndex++}`);
                values.push(data.description);
            }
            if (data.status !== undefined) {
                setParts.push(`status = $${paramIndex++}`);
                values.push(data.status);
            }
            if (data.priority !== undefined) {
                setParts.push(`priority = $${paramIndex++}`);
                values.push(data.priority);
            }
            if (data.dueDate !== undefined) {
                setParts.push(`due_date = $${paramIndex++}`);
                values.push(data.dueDate);
            }
            if (data.assignedToId !== undefined) {
                setParts.push(`assigned_to_id = $${paramIndex++}`);
                values.push(data.assignedToId);
            }
            setParts.push(`updated_at = NOW()`);
            values.push(id);
            const result = await pool.query(`UPDATE tasks SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`Task with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Resource Repository
class PostgresResourceRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM resources WHERE id = $1', [
                id,
            ]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByProjectId(projectId) {
        try {
            const result = await pool.query('SELECT * FROM resources WHERE project_id = $1', [projectId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO resources (name, type, url, project_id, uploaded_by_id, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`, [
                data.name,
                data.type || 'OTHER',
                data.url,
                data.projectId,
                data.uploadedById,
            ]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            if (data.name !== undefined) {
                setParts.push(`name = ${paramIndex++}`);
                values.push(data.name);
            }
            if (data.type !== undefined) {
                setParts.push(`type = ${paramIndex++}`);
                values.push(data.type);
            }
            if (data.url !== undefined) {
                setParts.push(`url = ${paramIndex++}`);
                values.push(data.url);
            }
            values.push(id);
            const result = await pool.query(`UPDATE resources SET ${setParts.join(', ')} WHERE id = ${paramIndex} RETURNING *`, values);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`Resource with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM resources WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// TeamMember Repository
class PostgresTeamMemberRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM team_members WHERE id = $1', [id]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByUserId(userId) {
        try {
            const result = await pool.query('SELECT * FROM team_members WHERE user_id = $1', [userId]);
            return (0, result_1.success)(result.rows.map(toCamelCase));
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const result = await pool.query('SELECT * FROM team_members WHERE organization_id = $1', [organizationId]);
            return (0, result_1.success)(result.rows.map(toCamelCase));
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByProjectId(projectId) {
        try {
            const result = await pool.query(`SELECT tm.* FROM team_members tm
         JOIN projects p ON p.organization_id = tm.organization_id
         WHERE p.id = $1`, [projectId]);
            return (0, result_1.success)(result.rows.map(toCamelCase));
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO team_members (user_id, organization_id, department_id, role, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`, [
                data.userId,
                data.organizationId,
                data.departmentId,
                data.role || 'MEMBER',
                data.position,
            ]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            if (data.departmentId !== undefined) {
                setParts.push(`department_id = ${paramIndex++}`);
                values.push(data.departmentId);
            }
            if (data.role !== undefined) {
                setParts.push(`role = ${paramIndex++}`);
                values.push(data.role);
            }
            if (data.position !== undefined) {
                setParts.push(`position = ${paramIndex++}`);
                values.push(data.position);
            }
            setParts.push(`updated_at = NOW()`);
            values.push(id);
            const result = await pool.query(`UPDATE team_members SET ${setParts.join(', ')} WHERE id = ${paramIndex} RETURNING *`, values);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`TeamMember with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM team_members WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Invitation Repository
class PostgresInvitationRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM invitations WHERE id = $1', [id]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByToken(token) {
        try {
            const result = await pool.query('SELECT * FROM invitations WHERE token = $1', [token]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const result = await pool.query('SELECT * FROM invitations WHERE organization_id = $1', [organizationId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO invitations (email, role, organization_id, department_id, token, status, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`, [
                data.email,
                data.role || 'MEMBER',
                data.organizationId,
                data.departmentId,
                require('crypto').randomBytes(16).toString('hex'),
                'PENDING',
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            if (data.status !== undefined) {
                setParts.push(`status = ${paramIndex++}`);
                values.push(data.status);
            }
            if (data.acceptedAt !== undefined) {
                setParts.push(`accepted_at = ${paramIndex++}`);
                values.push(data.acceptedAt);
            }
            values.push(id);
            const result = await pool.query(`UPDATE invitations SET ${setParts.join(', ')} WHERE id = ${paramIndex} RETURNING *`, values);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`Invitation with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM invitations WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Process Repository
class PostgresProcessRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM processes WHERE id = $1', [
                id,
            ]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const result = await pool.query('SELECT * FROM processes WHERE organization_id = $1', [organizationId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByDepartmentId(departmentId) {
        try {
            const result = await pool.query('SELECT * FROM processes WHERE department_id = $1', [departmentId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO processes (name, description, steps, organization_id, department_id, created_by_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`, [
                data.name,
                data.description,
                data.steps,
                data.organizationId,
                data.departmentId,
                data.createdById,
            ]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            if (data.name !== undefined) {
                setParts.push(`name = ${paramIndex++}`);
                values.push(data.name);
            }
            if (data.description !== undefined) {
                setParts.push(`description = ${paramIndex++}`);
                values.push(data.description);
            }
            if (data.steps !== undefined) {
                setParts.push(`steps = ${paramIndex++}`);
                values.push(data.steps);
            }
            setParts.push(`updated_at = NOW()`);
            values.push(id);
            const result = await pool.query(`UPDATE processes SET ${setParts.join(', ')} WHERE id = ${paramIndex} RETURNING *`, values);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`Process with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM processes WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Notification Repository
class PostgresNotificationRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByUserId(userId) {
        try {
            const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO notifications (user_id, type, message, read, created_at)
         VALUES ($1, $2, $3, false, NOW()) RETURNING *`, [data.userId, data.type, data.message]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async markAsRead(id) {
        try {
            const result = await pool.query('UPDATE notifications SET read = true WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`Notification with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async markAllAsRead(userId) {
        try {
            await pool.query('UPDATE notifications SET read = true WHERE user_id = $1', [userId]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async deleteRead(userId) {
        try {
            await pool.query('DELETE FROM notifications WHERE user_id = $1 AND read = true', [userId]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Comment Repository
class PostgresCommentRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM comments WHERE id = $1', [
                id,
            ]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByTaskId(taskId) {
        try {
            const result = await pool.query('SELECT * FROM comments WHERE task_id = $1 ORDER BY created_at DESC', [taskId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO comments (content, task_id, user_id, parent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`, [data.content, data.taskId, data.userId, data.parentId || null]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            if (data.content !== undefined) {
                setParts.push(`content = ${paramIndex++}`);
                values.push(data.content);
            }
            setParts.push(`updated_at = NOW()`);
            values.push(id);
            const result = await pool.query(`UPDATE comments SET ${setParts.join(', ')} WHERE id = ${paramIndex} RETURNING *`, values);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`Comment with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM comments WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Team Repository
class PostgresTeamRepository {
    async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM teams WHERE id = $1', [id]);
            return (0, result_1.success)(result.rows[0] || null);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const result = await pool.query('SELECT * FROM teams WHERE organization_id = $1 ORDER BY created_at DESC', [organizationId]);
            return (0, result_1.success)(result.rows);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const result = await pool.query(`INSERT INTO teams (name, description, organization_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`, [data.name, data.description || null, data.organizationId]);
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            if (data.name !== undefined) {
                setParts.push(`name = $${paramIndex++}`);
                values.push(data.name);
            }
            if (data.description !== undefined) {
                setParts.push(`description = $${paramIndex++}`);
                values.push(data.description);
            }
            setParts.push(`updated_at = NOW()`);
            values.push(id);
            const result = await pool.query(`UPDATE teams SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
            if (result.rows.length === 0) {
                return (0, result_1.failure)(new Error(`Team with id ${id} not found`));
            }
            return (0, result_1.success)(result.rows[0]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            await pool.query('DELETE FROM teams WHERE id = $1', [id]);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Postgres Conversation Repository (placeholder for future implementation)
class PostgresConversationRepository {
    async findById(id) {
        return Promise.resolve((0, result_1.success)(null));
    }
    async findByUserId(userId) {
        return Promise.resolve((0, result_1.success)([]));
    }
    async create(data) {
        return Promise.resolve((0, result_1.success)({
            id: '',
            userId: data.userId,
            title: data.title || 'New Conversation',
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
    }
    async delete(id) {
        return Promise.resolve((0, result_1.success)(undefined));
    }
    async addMessage(data) {
        return Promise.resolve((0, result_1.success)({
            id: '',
            conversationId: data.conversationId,
            role: data.role,
            content: data.content,
            createdAt: new Date(),
        }));
    }
    async getMessages(conversationId) {
        return Promise.resolve((0, result_1.success)([]));
    }
}
// Create and export repositories
const createPostgresRepositories = () => {
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
        teams: new PostgresTeamRepository(),
        conversations: new PostgresConversationRepository(),
    };
};
exports.createPostgresRepositories = createPostgresRepositories;
