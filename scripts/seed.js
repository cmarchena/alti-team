const { PrismaClient } = require('../src/generated')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  // Create test user with hashed password
  const hashedPassword = await bcrypt.hash('password123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
    },
  })
  console.log('Created user:', { id: user.id, email: user.email, name: user.name })

  // Create organization
  const organization = await prisma.organization.upsert({
    where: { name: 'Test Organization' },
    update: {},
    create: {
      name: 'Test Organization',
      ownerId: user.id,
    },
  })
  console.log('Created organization:', { id: organization.id, name: organization.name })

  // Add user as team member
  const teamMember = await prisma.teamMember.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: 'ADMIN',
      position: 'Project Manager',
    },
  })
  console.log('Created team member:', { id: teamMember.id, role: teamMember.role })

  // Create a department
  const department = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: {
      name: 'Engineering',
      organizationId: organization.id,
    },
  })
  console.log('Created department:', { id: department.id, name: department.name })

  // Create a project
  const project = await prisma.project.upsert({
    where: { name: 'Sample Project' },
    update: {},
    create: {
      name: 'Sample Project',
      description: 'A sample project to demonstrate the platform',
      organizationId: organization.id,
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    },
  })
  console.log('Created project:', { id: project.id, name: project.name })

  // Add user to project
  const projectMember = await prisma.projectMember.upsert({
    where: {
      teamMemberId_projectId: {
        teamMemberId: teamMember.id,
        projectId: project.id,
      },
    },
    update: {},
    create: {
      teamMemberId: teamMember.id,
      projectId: project.id,
    },
  })
  console.log('Added user to project')

  // Create some sample tasks
  const tasks = [
    {
      title: 'Set up development environment',
      description: 'Install all necessary tools and dependencies',
      status: 'DONE',
      priority: 'HIGH',
      projectId: project.id,
      assignedToId: teamMember.id,
    },
    {
      title: 'Design database schema',
      description: 'Create the initial database schema for the application',
      status: 'DONE',
      priority: 'HIGH',
      projectId: project.id,
      assignedToId: teamMember.id,
    },
    {
      title: 'Implement user authentication',
      description: 'Set up login and registration functionality',
      status: 'DONE',
      priority: 'HIGH',
      projectId: project.id,
      assignedToId: teamMember.id,
    },
    {
      title: 'Create project dashboard',
      description: 'Build the main project overview page',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      projectId: project.id,
      assignedToId: teamMember.id,
      dueDate: new Date('2024-02-15'),
    },
    {
      title: 'Add task management features',
      description: 'Implement create, edit, and delete tasks functionality',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project.id,
      assignedToId: teamMember.id,
      dueDate: new Date('2024-03-01'),
    },
  ]

  for (const taskData of tasks) {
    const task = await prisma.task.upsert({
      where: { title: taskData.title },
      update: {},
      create: taskData,
    })
    console.log('Created task:', { id: task.id, title: task.title, status: task.status })
  }

  // Create a sample resource
  const resource = await prisma.resource.upsert({
    where: { title: 'Project Requirements Document' },
    update: {},
    create: {
      title: 'Project Requirements Document',
      description: 'Detailed requirements for the project',
      type: 'DOCUMENT',
      url: 'https://example.com/requirements.pdf',
      projectId: project.id,
    },
  })
  console.log('Created resource:', { id: resource.id, title: resource.title })

  console.log('\n✅ Seed data created successfully!')
  console.log('\n📋 Test Account Details:')
  console.log('Email: test@example.com')
  console.log('Password: password123')
  console.log('\n🔗 Quick Access URLs:')
  console.log('Sign In: http://localhost:3000/auth/signin')
  console.log('Dashboard: http://localhost:3000/dashboard')
  console.log('Projects: http://localhost:3000/projects')
  console.log('Organization: http://localhost:3000/organizations')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })