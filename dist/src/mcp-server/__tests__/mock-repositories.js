"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockRepositories = createMockRepositories;
exports.createTestData = createTestData;
const result_1 = require("@/lib/result");
const generateId = () => Math.random().toString(36).substring(2, 15);
function createMockRepositories() {
    const users = new Map();
    const organizations = new Map();
    const projects = new Map();
    const tasks = new Map();
    const resources = new Map();
    const departments = new Map();
    const teamMembers = new Map();
    const invitations = new Map();
    const processes = new Map();
    const notifications = new Map();
    const comments = new Map();
    const teams = new Map();
    const now = new Date();
    return {
        users: {
            findById: async (id) => {
                const user = users.get(id);
                return (0, result_1.success)(user || null);
            },
            findByEmail: async (email) => {
                const user = Array.from(users.values()).find((u) => u.email === email);
                return (0, result_1.success)(user || null);
            },
            search: async (query, _organizationId, limit) => {
                const results = Array.from(users.values()).filter((u) => u.name?.toLowerCase().includes(query.toLowerCase()) ||
                    u.email.toLowerCase().includes(query.toLowerCase()));
                return (0, result_1.success)(limit ? results.slice(0, limit) : results);
            },
            create: async (data) => {
                const id = generateId();
                const user = {
                    id,
                    email: data.email,
                    name: data.name,
                    password: data.password,
                    createdAt: now,
                    updatedAt: now,
                };
                users.set(id, user);
                return (0, result_1.success)(user);
            },
            update: async (id, data) => {
                const user = users.get(id);
                if (!user)
                    return (0, result_1.failure)(new Error('User not found'));
                const updated = { ...user, ...data, updatedAt: new Date() };
                users.set(id, updated);
                return (0, result_1.success)(updated);
            },
            delete: async (id) => {
                users.delete(id);
                return (0, result_1.success)(undefined);
            },
        },
        organizations: {
            findById: async (id) => {
                const org = organizations.get(id);
                return (0, result_1.success)(org || null);
            },
            findByOwnerId: async (ownerId) => {
                const orgs = Array.from(organizations.values()).filter((o) => o.ownerId === ownerId);
                return (0, result_1.success)(orgs);
            },
            create: async (data) => {
                const id = generateId();
                const org = {
                    id,
                    name: data.name,
                    description: data.description,
                    ownerId: data.ownerId,
                    createdAt: now,
                    updatedAt: now,
                };
                organizations.set(id, org);
                return (0, result_1.success)(org);
            },
            update: async (id, data) => {
                const org = organizations.get(id);
                if (!org)
                    return (0, result_1.failure)(new Error('Organization not found'));
                const updated = { ...org, ...data, updatedAt: new Date() };
                organizations.set(id, updated);
                return (0, result_1.success)(updated);
            },
            delete: async (id) => {
                organizations.delete(id);
                return (0, result_1.success)(undefined);
            },
        },
        projects: {
            findById: async (id) => {
                const project = projects.get(id);
                return (0, result_1.success)(project || null);
            },
            findByOrganizationId: async (organizationId) => {
                const projs = Array.from(projects.values()).filter((p) => p.organizationId === organizationId);
                return (0, result_1.success)(projs);
            },
            create: async (data) => {
                const id = generateId();
                const project = {
                    id,
                    name: data.name,
                    description: data.description,
                    status: data.status || 'planning',
                    startDate: data.startDate,
                    endDate: data.endDate,
                    organizationId: data.organizationId,
                    createdAt: now,
                    updatedAt: now,
                };
                projects.set(id, project);
                return (0, result_1.success)(project);
            },
            update: async (id, data) => {
                const project = projects.get(id);
                if (!project)
                    return (0, result_1.failure)(new Error('Project not found'));
                const updated = { ...project, ...data, updatedAt: new Date() };
                projects.set(id, updated);
                return (0, result_1.success)(updated);
            },
            delete: async (id) => {
                projects.delete(id);
                return (0, result_1.success)(undefined);
            },
        },
        tasks: {
            findById: async (id) => {
                const task = tasks.get(id);
                return (0, result_1.success)(task || null);
            },
            findByProjectId: async (projectId) => {
                const ts = Array.from(tasks.values()).filter((t) => t.projectId === projectId);
                return (0, result_1.success)(ts);
            },
            findByAssignedToId: async (assignedToId) => {
                const ts = Array.from(tasks.values()).filter((t) => t.assignedToId === assignedToId);
                return (0, result_1.success)(ts);
            },
            create: async (data) => {
                const id = generateId();
                const task = {
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
                };
                tasks.set(id, task);
                return (0, result_1.success)(task);
            },
            update: async (id, data) => {
                const task = tasks.get(id);
                if (!task)
                    return (0, result_1.failure)(new Error('Task not found'));
                const updated = {
                    ...task,
                    ...data,
                    updatedAt: new Date(),
                    assignedToId: data.assignedToId ?? task.assignedToId,
                };
                tasks.set(id, updated);
                return (0, result_1.success)(updated);
            },
            delete: async (id) => {
                const task = tasks.get(id);
                if (!task)
                    return (0, result_1.failure)(new Error('Task not found'));
                tasks.delete(id);
                return (0, result_1.success)(undefined);
            },
        },
        resources: {
            findById: async (id) => {
                const resource = resources.get(id);
                return (0, result_1.success)(resource || null);
            },
            findByProjectId: async (projectId) => {
                const res = Array.from(resources.values()).filter((r) => r.projectId === projectId);
                return (0, result_1.success)(res);
            },
            create: async (data) => {
                const id = generateId();
                const resource = {
                    id,
                    name: data.name,
                    type: data.type || 'file',
                    url: data.url,
                    projectId: data.projectId,
                    uploadedById: data.uploadedById,
                    metadata: data.metadata,
                    createdAt: now,
                };
                resources.set(id, resource);
                return (0, result_1.success)(resource);
            },
            update: async (id, data) => {
                const resource = resources.get(id);
                if (!resource)
                    return (0, result_1.failure)(new Error('Resource not found'));
                const updated = { ...resource, ...data };
                resources.set(id, updated);
                return (0, result_1.success)(updated);
            },
            delete: async (id) => {
                resources.delete(id);
                return (0, result_1.success)(undefined);
            },
        },
        departments: {
            findById: async (id) => {
                const dept = departments.get(id);
                return (0, result_1.success)(dept || null);
            },
            findByOrganizationId: async (organizationId) => {
                const depts = Array.from(departments.values()).filter((d) => d.organizationId === organizationId);
                return (0, result_1.success)(depts);
            },
            findByParentId: async (parentId) => {
                const depts = Array.from(departments.values()).filter((d) => d.parentId === parentId);
                return (0, result_1.success)(depts);
            },
            create: async (data) => {
                const id = generateId();
                const dept = {
                    id,
                    name: data.name,
                    description: data.description,
                    organizationId: data.organizationId,
                    parentId: data.parentId,
                    createdAt: now,
                    updatedAt: now,
                };
                departments.set(id, dept);
                return (0, result_1.success)(dept);
            },
            update: async (id, data) => {
                const dept = departments.get(id);
                if (!dept)
                    return (0, result_1.failure)(new Error('Department not found'));
                const updated = {
                    ...dept,
                    ...data,
                    updatedAt: new Date(),
                    parentId: data.parentId ?? dept.parentId,
                };
                departments.set(id, updated);
                return (0, result_1.success)(updated);
            },
            delete: async (id) => {
                departments.delete(id);
                return (0, result_1.success)(undefined);
            },
        },
        teamMembers: {
            findById: async (id) => {
                const member = teamMembers.get(id);
                return (0, result_1.success)(member || null);
            },
            findByUserId: async (userId) => {
                const members = Array.from(teamMembers.values()).filter((m) => m.userId === userId);
                return (0, result_1.success)(members);
            },
            findByOrganizationId: async (organizationId) => {
                const members = Array.from(teamMembers.values()).filter((m) => m.organizationId === organizationId);
                return (0, result_1.success)(members);
            },
            findByProjectId: async (_projectId) => {
                return (0, result_1.success)([]);
            },
            create: async (data) => {
                const id = generateId();
                const member = {
                    id,
                    userId: data.userId,
                    organizationId: data.organizationId,
                    departmentId: data.departmentId,
                    role: data.role || 'member',
                    position: data.position,
                    createdAt: now,
                    updatedAt: now,
                };
                teamMembers.set(id, member);
                return (0, result_1.success)(member);
            },
            update: async (id, data) => {
                const member = teamMembers.get(id);
                if (!member)
                    return (0, result_1.failure)(new Error('TeamMember not found'));
                const updated = {
                    ...member,
                    ...data,
                    updatedAt: new Date(),
                    departmentId: data.departmentId ?? member.departmentId,
                };
                teamMembers.set(id, updated);
                return (0, result_1.success)(updated);
            },
            delete: async (id) => {
                teamMembers.delete(id);
                return (0, result_1.success)(undefined);
            },
        },
        invitations: {
            findById: async (id) => {
                const invitation = invitations.get(id);
                return (0, result_1.success)(invitation || null);
            },
            findByToken: async (token) => {
                const invitation = Array.from(invitations.values()).find((i) => i.token === token);
                return (0, result_1.success)(invitation || null);
            },
            findByOrganizationId: async (organizationId) => {
                const invs = Array.from(invitations.values()).filter((i) => i.organizationId === organizationId);
                return (0, result_1.success)(invs);
            },
            create: async (data) => {
                const id = generateId();
                const token = generateId() + generateId();
                const invitation = {
                    id,
                    email: data.email,
                    role: data.role || 'member',
                    organizationId: data.organizationId,
                    departmentId: data.departmentId,
                    token,
                    status: 'pending',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    createdAt: now,
                };
                invitations.set(id, invitation);
                return (0, result_1.success)(invitation);
            },
            update: async (id, data) => {
                const invitation = invitations.get(id);
                if (!invitation)
                    return (0, result_1.failure)(new Error('Invitation not found'));
                const updated = { ...invitation, ...data };
                invitations.set(id, updated);
                return (0, result_1.success)(updated);
            },
            delete: async (id) => {
                invitations.delete(id);
                return (0, result_1.success)(undefined);
            },
        },
        processes: {
            findById: async (id) => {
                const process = processes.get(id);
                return (0, result_1.success)(process || null);
            },
            findByOrganizationId: async (organizationId) => {
                const procs = Array.from(processes.values()).filter((p) => p.organizationId === organizationId);
                return (0, result_1.success)(procs);
            },
            findByDepartmentId: async (departmentId) => {
                const procs = Array.from(processes.values()).filter((p) => p.departmentId === departmentId);
                return (0, result_1.success)(procs);
            },
            create: async (data) => {
                const id = generateId();
                const process = {
                    id,
                    name: data.name,
                    description: data.description,
                    steps: data.steps,
                    organizationId: data.organizationId,
                    departmentId: data.departmentId,
                    createdById: data.createdById,
                    createdAt: now,
                    updatedAt: now,
                };
                processes.set(id, process);
                return (0, result_1.success)(process);
            },
            update: async (id, data) => {
                const process = processes.get(id);
                if (!process)
                    return (0, result_1.failure)(new Error('Process not found'));
                const updated = { ...process, ...data, updatedAt: new Date() };
                processes.set(id, updated);
                return (0, result_1.success)(updated);
            },
            delete: async (id) => {
                processes.delete(id);
                return (0, result_1.success)(undefined);
            },
        },
        notifications: {
            findById: async (id) => {
                const notification = notifications.get(id);
                return (0, result_1.success)(notification || null);
            },
            findByUserId: async (userId) => {
                const notifs = Array.from(notifications.values()).filter((n) => n.userId === userId);
                return (0, result_1.success)(notifs);
            },
            create: async (data) => {
                const id = generateId();
                const notification = {
                    id,
                    userId: data.userId,
                    type: data.type,
                    message: data.message,
                    read: false,
                    createdAt: now,
                };
                notifications.set(id, notification);
                return (0, result_1.success)(notification);
            },
            markAsRead: async (id) => {
                const notification = notifications.get(id);
                if (!notification)
                    return (0, result_1.failure)(new Error('Notification not found'));
                const updated = { ...notification, read: true };
                notifications.set(id, updated);
                return (0, result_1.success)(updated);
            },
            markAllAsRead: async (_userId) => {
                return (0, result_1.success)(undefined);
            },
            delete: async (id) => {
                notifications.delete(id);
                return (0, result_1.success)(undefined);
            },
            deleteRead: async (_userId) => {
                return (0, result_1.success)(undefined);
            },
        },
        comments: {
            findById: async (id) => {
                const comment = comments.get(id);
                return (0, result_1.success)(comment || null);
            },
            findByTaskId: async (taskId) => {
                const coms = Array.from(comments.values()).filter((c) => c.taskId === taskId);
                return (0, result_1.success)(coms);
            },
            create: async (data) => {
                const id = generateId();
                const comment = {
                    id,
                    content: data.content,
                    taskId: data.taskId,
                    userId: data.userId,
                    parentId: data.parentId,
                    createdAt: now,
                    updatedAt: now,
                };
                comments.set(id, comment);
                return (0, result_1.success)(comment);
            },
            update: async (id, data) => {
                const comment = comments.get(id);
                if (!comment)
                    return (0, result_1.failure)(new Error('Comment not found'));
                const updated = { ...comment, ...data, updatedAt: new Date() };
                comments.set(id, updated);
                return (0, result_1.success)(updated);
            },
            delete: async (id) => {
                comments.delete(id);
                return (0, result_1.success)(undefined);
            },
        },
        teams: {
            findById: async (id) => {
                const team = teams.get(id);
                return (0, result_1.success)(team || null);
            },
            findByOrganizationId: async (organizationId) => {
                const tms = Array.from(teams.values()).filter((t) => t.organizationId === organizationId);
                return (0, result_1.success)(tms);
            },
            create: async (data) => {
                const id = generateId();
                const team = {
                    id,
                    name: data.name,
                    description: data.description,
                    organizationId: data.organizationId,
                    createdAt: now,
                    updatedAt: now,
                };
                teams.set(id, team);
                return (0, result_1.success)(team);
            },
            update: async (id, data) => {
                const team = teams.get(id);
                if (!team)
                    return (0, result_1.failure)(new Error('Team not found'));
                const updated = { ...team, ...data, updatedAt: new Date() };
                teams.set(id, updated);
                return (0, result_1.success)(updated);
            },
            delete: async (id) => {
                teams.delete(id);
                return (0, result_1.success)(undefined);
            },
        },
    };
}
async function createTestData(repos) {
    const now = new Date();
    const user1Result = await repos.users.create({
        email: 'john@example.com',
        name: 'John Doe',
        password: 'hashedpassword',
    });
    if (!(0, result_1.isSuccess)(user1Result))
        throw new Error('Failed to create user1');
    const user1 = user1Result.data;
    const user2Result = await repos.users.create({
        email: 'jane@example.com',
        name: 'Jane Smith',
    });
    if (!(0, result_1.isSuccess)(user2Result))
        throw new Error('Failed to create user2');
    const user2 = user2Result.data;
    const orgResult = await repos.organizations.create({
        name: 'Acme Corp',
        description: 'Test organization',
        ownerId: user1.id,
    });
    if (!(0, result_1.isSuccess)(orgResult))
        throw new Error('Failed to create organization');
    const org = orgResult.data;
    const memberResult = await repos.teamMembers.create({
        userId: user1.id,
        organizationId: org.id,
        role: 'admin',
    });
    const member2Result = await repos.teamMembers.create({
        userId: user2.id,
        organizationId: org.id,
        role: 'member',
    });
    const projectResult = await repos.projects.create({
        name: 'Website Redesign',
        description: 'Redesign company website',
        status: 'active',
        organizationId: org.id,
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    });
    if (!(0, result_1.isSuccess)(projectResult))
        throw new Error('Failed to create project');
    const project = projectResult.data;
    const taskResult = await repos.tasks.create({
        title: 'Design homepage',
        description: 'Create mockups for homepage',
        status: 'todo',
        priority: 'high',
        projectId: project.id,
    });
    if (!(0, result_1.isSuccess)(taskResult))
        throw new Error('Failed to create task');
    const task = taskResult.data;
    const resourceResult = await repos.resources.create({
        name: 'Design Spec',
        type: 'file',
        url: 'https://example.com/spec.pdf',
        projectId: project.id,
        uploadedById: user1.id,
    });
    if (!(0, result_1.isSuccess)(resourceResult))
        throw new Error('Failed to create resource');
    const deptResult = await repos.departments.create({
        name: 'Engineering',
        description: 'Engineering department',
        organizationId: org.id,
    });
    if (!(0, result_1.isSuccess)(deptResult))
        throw new Error('Failed to create department');
    return {
        users: { user1, user2 },
        organization: org,
        teamMembers: {
            member1: (0, result_1.isSuccess)(memberResult)
                ? memberResult.data
                : null,
            member2: (0, result_1.isSuccess)(member2Result)
                ? member2Result.data
                : null,
        },
        project,
        task,
        resource: (0, result_1.isSuccess)(resourceResult)
            ? resourceResult.data
            : null,
        department: (0, result_1.isSuccess)(deptResult) ? deptResult.data : null,
    };
}
