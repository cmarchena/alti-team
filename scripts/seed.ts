import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Client } = pg

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

    // Create demo users
    const users = [
      {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        password,
      },
      {
        id: 'user-2',
        email: 'john@example.com',
        name: 'John Developer',
        password,
      },
      {
        id: 'user-3',
        email: 'jane@example.com',
        name: 'Jane Designer',
        password,
      },
      { id: 'user-4', email: 'bob@example.com', name: 'Bob Manager', password },
    ]

    for (const user of users) {
      await client.query(
        `INSERT INTO users (id, email, name, password) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [user.id, user.email, user.name, user.password],
      )
    }

    // Create organization
    await client.query(
      `INSERT INTO organizations (id, name, description, owner_id)
       VALUES ('org-1', 'Acme Corp', 'A sample organization for testing', 'user-1')
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
    )

    // Create departments
    await client.query(
      `INSERT INTO departments (id, name, description, organization_id)
       VALUES ('dept-1', 'Engineering', 'Software Engineering Team', 'org-1'),
              ('dept-2', 'Design', 'Product Design Team', 'org-1'),
              ('dept-3', 'Frontend', 'Frontend Development', 'org-1')
       ON CONFLICT (id) DO NOTHING`,
    )

    // Create team members
    const teamMembers = [
      {
        id: 'tm-1',
        user_id: 'user-1',
        org_id: 'org-1',
        dept_id: 'dept-1',
        role: 'ADMIN',
        position: 'CTO',
      },
      {
        id: 'tm-2',
        user_id: 'user-2',
        org_id: 'org-1',
        dept_id: 'dept-1',
        role: 'MEMBER',
        position: 'Senior Developer',
      },
      {
        id: 'tm-3',
        user_id: 'user-3',
        org_id: 'org-1',
        dept_id: 'dept-2',
        role: 'MEMBER',
        position: 'UX Designer',
      },
      {
        id: 'tm-4',
        user_id: 'user-4',
        org_id: 'org-1',
        dept_id: 'dept-3',
        role: 'VIEWER',
        position: 'Project Manager',
      },
    ]

    for (const tm of teamMembers) {
      await client.query(
        `INSERT INTO team_members (id, user_id, organization_id, department_id, role, position)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role`,
        [tm.id, tm.user_id, tm.org_id, tm.dept_id, tm.role, tm.position],
      )
    }

    // Create projects
    const projects = [
      {
        id: 'proj-1',
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        status: 'IN_PROGRESS',
        org_id: 'org-1',
      },
      {
        id: 'proj-2',
        name: 'Mobile App',
        description: 'New mobile application for customers',
        status: 'PLANNING',
        org_id: 'org-1',
      },
      {
        id: 'proj-3',
        name: 'API Integration',
        description: 'Third-party API integrations',
        status: 'DONE',
        org_id: 'org-1',
      },
    ]

    for (const proj of projects) {
      await client.query(
        `INSERT INTO projects (id, name, description, status, organization_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [proj.id, proj.name, proj.description, proj.status, proj.org_id],
      )
    }

    // Create tasks
    const tasks = [
      {
        id: 'task-1',
        title: 'Design homepage mockup',
        description: 'Create high-fidelity mockup for homepage',
        status: 'DONE',
        priority: 'HIGH',
        project_id: 'proj-1',
        assigned_to_id: 'tm-3',
      },
      {
        id: 'task-2',
        title: 'Implement responsive layout',
        description: 'Make homepage responsive',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        project_id: 'proj-1',
        assigned_to_id: 'tm-2',
      },
      {
        id: 'task-3',
        title: 'Add navigation menu',
        description: 'Implement navigation with dropdowns',
        status: 'TODO',
        priority: 'MEDIUM',
        project_id: 'proj-1',
        assigned_to_id: 'tm-2',
      },
      {
        id: 'task-4',
        title: 'Write API documentation',
        description: 'Document all API endpoints',
        status: 'TODO',
        priority: 'LOW',
        project_id: 'proj-3',
        assigned_to_id: 'tm-2',
      },
      {
        id: 'task-5',
        title: 'User research interviews',
        description: 'Conduct 10 user interviews',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        project_id: 'proj-2',
        assigned_to_id: 'tm-4',
      },
      {
        id: 'task-6',
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for deployment',
        status: 'DONE',
        priority: 'HIGH',
        project_id: 'proj-3',
        assigned_to_id: 'tm-2',
      },
    ]

    for (const task of tasks) {
      await client.query(
        `INSERT INTO tasks (id, title, description, status, priority, project_id, assigned_to_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title`,
        [
          task.id,
          task.title,
          task.description,
          task.status,
          task.priority,
          task.project_id,
          task.assigned_to_id,
        ],
      )
    }

    // Create processes
    await client.query(
      `INSERT INTO processes (id, name, description, steps, department_id, organization_id, created_by_id)
       VALUES ('proc-1', 'Code Review', 'Standard code review process',
               '[{"name": "Submit PR", "description": "Create pull request"}, {"name": "Review", "description": "Team review"}, {"name": "Approve", "description": "Lead approval"}, {"name": "Merge", "description": "Merge to main"}]',
               'dept-1', 'org-1', 'user-1')
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
    )

    // Create notifications
    await client.query(
      `INSERT INTO notifications (id, type, message, user_id)
       VALUES ('notif-1', 'TASK_ASSIGNED', 'You have been assigned to "Implement responsive layout"', 'user-2'),
              ('notif-2', 'TASK_UPDATED', 'Task "Design homepage mockup" status changed to DONE', 'user-3'),
              ('notif-3', 'PROJECT_CREATED', 'New project "Mobile App" created', 'user-1')
       ON CONFLICT (id) DO NOTHING`,
    )

    // Create resources
    await client.query(
      `INSERT INTO resources (id, name, type, url, project_id, uploaded_by_id)
       VALUES ('res-1', 'Design Guidelines', 'LINK', 'https://example.com/design', 'proj-1', 'user-3'),
              ('res-2', 'API Spec', 'LINK', 'https://example.com/api', 'proj-3', 'user-1')
       ON CONFLICT (id) DO NOTHING`,
    )

    // Create comments
    await client.query(
      `INSERT INTO comments (id, content, task_id, user_id)
       VALUES ('comment-1', 'Looks great! Minor changes needed.', 'task-1', 'user-1'),
              ('comment-2', 'Thanks! I will address the comments.', 'task-1', 'user-3')
       ON CONFLICT (id) DO NOTHING`,
    )

    console.log('Database seeded successfully!')
    console.log('\nDemo accounts:')
    console.log('  admin@example.com / password123 (Admin)')
    console.log('  john@example.com / password123 (Developer)')
    console.log('  jane@example.com / password123 (Designer)')
    console.log('  bob@example.com / password123 (Manager)')
  } finally {
    await client.end()
  }
}

seed().catch(console.error)
