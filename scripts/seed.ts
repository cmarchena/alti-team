import pg from 'pg'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const { Client } = pg

function generateUUID(): string {
  return crypto.randomUUID()
}

async function seed() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'alti_team',
    password: 'password123',
    database: 'alti_team',
  })

  await client.connect()

  try {
    const password = await bcrypt.hash('password123', 10)

    const users = [
      { id: 'user-1', email: 'admin@example.com', name: 'Admin User' },
      { id: 'user-2', email: 'john@example.com', name: 'John Developer' },
      { id: 'user-3', email: 'jane@example.com', name: 'Jane Designer' },
      { id: 'user-4', email: 'bob@example.com', name: 'Bob Manager' },
    ]

    for (const user of users) {
      await client.query(
        `INSERT INTO users (id, email, name, password) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
        [user.id, user.email, user.name, password],
      )
    }

    const orgId = generateUUID()
    await client.query(
      `INSERT INTO organizations (id, name, description, owner_id)
       VALUES ($1, 'Acme Corp', 'A sample organization for testing', $2)
       ON CONFLICT (id) DO NOTHING`,
      [orgId, users[0].id],
    )

    const orgResult = await client.query(
      `SELECT id FROM organizations WHERE name = 'Acme Corp' LIMIT 1`,
    )
    const actualOrgId = orgResult.rows[0]?.id || orgId

    const deptEngineeringId = generateUUID()
    const deptDesignId = generateUUID()
    const deptFrontendId = generateUUID()

    const departments = [
      {
        id: deptEngineeringId,
        name: 'Engineering',
        description: 'Software Engineering Team',
      },
      { id: deptDesignId, name: 'Design', description: 'Product Design Team' },
      {
        id: deptFrontendId,
        name: 'Frontend',
        description: 'Frontend Development',
      },
    ]

    for (const dept of departments) {
      await client.query(
        `INSERT INTO departments (id, name, description, organization_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [dept.id, dept.name, dept.description, actualOrgId],
      )
    }

    const tmAdminId = generateUUID()
    const tmJohnId = generateUUID()
    const tmJaneId = generateUUID()
    const tmBobId = generateUUID()

    const teamMembers = [
      {
        id: tmAdminId,
        userId: users[0].id,
        deptId: deptEngineeringId,
        role: 'ADMIN',
        position: 'CTO',
      },
      {
        id: tmJohnId,
        userId: users[1].id,
        deptId: deptEngineeringId,
        role: 'MEMBER',
        position: 'Senior Developer',
      },
      {
        id: tmJaneId,
        userId: users[2].id,
        deptId: deptDesignId,
        role: 'MEMBER',
        position: 'UX Designer',
      },
      {
        id: tmBobId,
        userId: users[3].id,
        deptId: deptFrontendId,
        role: 'VIEWER',
        position: 'Project Manager',
      },
    ]

    for (const tm of teamMembers) {
      await client.query(
        `INSERT INTO team_members (id, user_id, organization_id, department_id, role, position)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role`,
        [tm.id, tm.userId, actualOrgId, tm.deptId, tm.role, tm.position],
      )
    }

    const proj1Id = generateUUID()
    const proj2Id = generateUUID()
    const proj3Id = generateUUID()

    const projects = [
      {
        id: proj1Id,
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        status: 'IN_PROGRESS',
      },
      {
        id: proj2Id,
        name: 'Mobile App',
        description: 'New mobile application for customers',
        status: 'PLANNING',
      },
      {
        id: proj3Id,
        name: 'API Integration',
        description: 'Third-party API integrations',
        status: 'COMPLETED',
      },
    ]

    for (const proj of projects) {
      await client.query(
        `INSERT INTO projects (id, name, description, status, organization_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [proj.id, proj.name, proj.description, proj.status, actualOrgId],
      )
    }

    const tasks = [
      {
        title: 'Design homepage mockup',
        description: 'Create high-fidelity mockup for homepage',
        status: 'DONE',
        priority: 'HIGH',
        projectId: proj1Id,
        assignedTo: tmJaneId,
      },
      {
        title: 'Implement responsive layout',
        description: 'Make homepage responsive',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: proj1Id,
        assignedTo: tmJohnId,
      },
      {
        title: 'Add navigation menu',
        description: 'Implement navigation with dropdowns',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: proj1Id,
        assignedTo: tmJohnId,
      },
      {
        title: 'Write API documentation',
        description: 'Document all API endpoints',
        status: 'TODO',
        priority: 'LOW',
        projectId: proj3Id,
        assignedTo: tmJohnId,
      },
      {
        title: 'User research interviews',
        description: 'Conduct 10 user interviews',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        projectId: proj2Id,
        assignedTo: tmBobId,
      },
      {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for deployment',
        status: 'DONE',
        priority: 'HIGH',
        projectId: proj3Id,
        assignedTo: tmJohnId,
      },
    ]

    for (const task of tasks) {
      await client.query(
        `INSERT INTO tasks (id, title, description, status, priority, project_id, assigned_to_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title`,
        [
          generateUUID(),
          task.title,
          task.description,
          task.status,
          task.priority,
          task.projectId,
          task.assignedTo,
        ],
      )
    }

    await client.query(
      `INSERT INTO processes (id, name, description, steps, department_id, organization_id, created_by_id)
       VALUES ($1, 'Code Review', 'Standard code review process',
               '[{"name": "Submit PR", "description": "Create pull request"}, {"name": "Review", "description": "Team review"}, {"name": "Approve", "description": "Lead approval"}, {"name": "Merge", "description": "Merge to main"}]',
               $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [generateUUID(), deptEngineeringId, actualOrgId, users[0].id],
    )

    await client.query(
      `INSERT INTO notifications (id, type, message, user_id)
       VALUES ($1, 'TASK_ASSIGNED', 'You have been assigned to "Implement responsive layout"', $2),
              ($3, 'TASK_UPDATED', 'Task "Design homepage mockup" status changed to DONE', $4),
              ($5, 'PROJECT_CREATED', 'New project "Mobile App" created', $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        generateUUID(),
        users[1].id,
        generateUUID(),
        users[2].id,
        generateUUID(),
        users[0].id,
      ],
    )

    await client.query(
      `INSERT INTO resources (id, name, type, url, project_id, uploaded_by_id)
       VALUES ($1, 'Design Guidelines', 'LINK', 'https://example.com/design', $2, $3),
              ($4, 'API Spec', 'LINK', 'https://example.com/api', $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        generateUUID(),
        proj1Id,
        users[2].id,
        generateUUID(),
        proj3Id,
        users[0].id,
      ],
    )

    await client.query(
      `INSERT INTO comments (id, content, task_id, user_id)
       VALUES ($1, 'Looks great! Minor changes needed.', (SELECT id FROM tasks WHERE title = 'Design homepage mockup' LIMIT 1), $2),
              ($3, 'Thanks! I will address the comments.', (SELECT id FROM tasks WHERE title = 'Design homepage mockup' LIMIT 1), $4)
       ON CONFLICT (id) DO NOTHING`,
      [generateUUID(), users[0].id, generateUUID(), users[2].id],
    )

    console.log('Database seeded successfully!')
    console.log('\nDemo accounts:')
    console.log('  admin@example.com / password123 (Admin - CTO)')
    console.log('  john@example.com / password123 (Developer - Senior Dev)')
    console.log('  jane@example.com / password123 (Designer - UX Designer)')
    console.log('  bob@example.com / password123 (Manager - Project Manager)')
    console.log('\nOrganization: Acme Corp with 3 departments and 3 projects')
  } finally {
    await client.end()
  }
}

seed().catch(console.error)
