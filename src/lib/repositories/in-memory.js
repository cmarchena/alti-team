"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInMemoryRepositories = void 0;
const result_1 = require("../result");
// Use globalThis to persist data across Next.js hot-reloads
const globalObj = globalThis;
const getGlobalArray = (key) => {
    const globalKey = `altiteam:${key}`;
    if (!globalObj[globalKey]) {
        globalObj[globalKey] = [];
    }
    return globalObj[globalKey];
};
// In-memory storage (persisted in globalThis to survive hot-reloads)
let organizations = getGlobalArray('organizations');
let users = getGlobalArray('users');
let departments = getGlobalArray('departments');
let projects = getGlobalArray('projects');
let tasks = getGlobalArray('tasks');
let resources = getGlobalArray('resources');
let teamMembers = getGlobalArray('teamMembers');
let invitations = getGlobalArray('invitations');
let processes = getGlobalArray('processes');
let notifications = getGlobalArray('notifications');
let comments = getGlobalArray('comments');
let teams = getGlobalArray('teams');
let conversations = getGlobalArray('conversations');
let conversationMessages = getGlobalArray('conversationMessages');
const MAX_MESSAGES_PER_CONVERSATION = 50;
// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);
// Organization Repository
class InMemoryOrganizationRepository {
    async findById(id) {
        try {
            const organization = organizations.find((org) => org.id === id) || null;
            return (0, result_1.success)(organization);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOwnerId(ownerId) {
        try {
            const orgs = organizations.filter((org) => org.ownerId === ownerId);
            return (0, result_1.success)(orgs);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const organization = {
                id: generateId(),
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            organizations.push(organization);
            return (0, result_1.success)(organization);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const index = organizations.findIndex((org) => org.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`Organization with id ${id} not found`));
            }
            organizations[index] = {
                ...organizations[index],
                ...data,
                updatedAt: new Date(),
            };
            return (0, result_1.success)(organizations[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            organizations = organizations.filter((org) => org.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// User Repository
class InMemoryUserRepository {
    async findById(id) {
        try {
            const user = users.find((user) => user.id === id) || null;
            return (0, result_1.success)(user);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByEmail(email) {
        try {
            const user = users.find((user) => user.email === email) || null;
            return (0, result_1.success)(user);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const user = {
                id: generateId(),
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            users.push(user);
            return (0, result_1.success)(user);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const index = users.findIndex((user) => user.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`User with id ${id} not found`));
            }
            const currentUser = users[index];
            let updatedAt = new Date();
            // Ensure updatedAt is always after createdAt
            if (updatedAt.getTime() <= currentUser.createdAt.getTime()) {
                updatedAt = new Date(currentUser.createdAt.getTime() + 1);
            }
            users[index] = {
                ...currentUser,
                ...data,
                updatedAt,
            };
            return (0, result_1.success)(users[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            users = users.filter((user) => user.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async search(query, organizationId, limit) {
        try {
            let filteredUsers = users.filter((user) => user.name?.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase()));
            // Filter by organization if provided
            if (organizationId) {
                const orgMembers = await new InMemoryTeamMemberRepository().findByOrganizationId(organizationId);
                if ((0, result_1.isSuccess)(orgMembers)) {
                    const memberUserIds = orgMembers.data.map((m) => m.userId);
                    filteredUsers = filteredUsers.filter((user) => memberUserIds.includes(user.id));
                }
            }
            // Apply limit
            if (limit) {
                filteredUsers = filteredUsers.slice(0, limit);
            }
            return (0, result_1.success)(filteredUsers);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Department Repository
class InMemoryDepartmentRepository {
    async findById(id) {
        try {
            const department = departments.find((dept) => dept.id === id) || null;
            return (0, result_1.success)(department);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const depts = departments.filter((dept) => dept.organizationId === organizationId);
            return (0, result_1.success)(depts);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByParentId(parentId) {
        try {
            const depts = departments.filter((dept) => dept.parentId === parentId);
            return (0, result_1.success)(depts);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const department = {
                id: generateId(),
                parentId: data.parentId || undefined,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            departments.push(department);
            return (0, result_1.success)(department);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const index = departments.findIndex((dept) => dept.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`Department with id ${id} not found`));
            }
            const updated = {
                ...departments[index],
                ...data,
                updatedAt: new Date(),
            };
            if (updated.parentId === null) {
                delete updated.parentId;
            }
            departments[index] = updated;
            return (0, result_1.success)(departments[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            departments = departments.filter((dept) => dept.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Project Repository
class InMemoryProjectRepository {
    async findById(id) {
        try {
            const project = projects.find((proj) => proj.id === id) || null;
            return (0, result_1.success)(project);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const projs = projects.filter((proj) => proj.organizationId === organizationId);
            return (0, result_1.success)(projs);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const project = {
                id: generateId(),
                status: data.status || 'active',
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            projects.push(project);
            return (0, result_1.success)(project);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const index = projects.findIndex((proj) => proj.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`Project with id ${id} not found`));
            }
            projects[index] = {
                ...projects[index],
                ...data,
                updatedAt: new Date(),
            };
            return (0, result_1.success)(projects[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            projects = projects.filter((proj) => proj.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Task Repository
class InMemoryTaskRepository {
    async findById(id) {
        try {
            const task = tasks.find((task) => task.id === id) || null;
            return (0, result_1.success)(task);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByProjectId(projectId) {
        try {
            const taskList = tasks.filter((task) => task.projectId === projectId);
            return (0, result_1.success)(taskList);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByAssignedToId(assignedToId) {
        try {
            const taskList = tasks.filter((task) => task.assignedToId === assignedToId);
            return (0, result_1.success)(taskList);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const task = {
                id: generateId(),
                status: data.status || 'todo',
                priority: data.priority || 'medium',
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            tasks.push(task);
            return (0, result_1.success)(task);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const index = tasks.findIndex((task) => task.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`Task with id ${id} not found`));
            }
            tasks[index] = {
                ...tasks[index],
                ...data,
                updatedAt: new Date(),
            };
            return (0, result_1.success)(tasks[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            tasks = tasks.filter((task) => task.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Resource Repository
class InMemoryResourceRepository {
    async findById(id) {
        try {
            const resource = resources.find((r) => r.id === id) || null;
            return (0, result_1.success)(resource);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByProjectId(projectId) {
        try {
            const resourceList = resources.filter((r) => r.projectId === projectId);
            return (0, result_1.success)(resourceList);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const resource = {
                id: generateId(),
                type: data.type || 'FILE',
                ...data,
                createdAt: new Date(),
            };
            resources.push(resource);
            return (0, result_1.success)(resource);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const index = resources.findIndex((r) => r.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`Resource with id ${id} not found`));
            }
            resources[index] = {
                ...resources[index],
                ...data,
            };
            return (0, result_1.success)(resources[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            resources = resources.filter((r) => r.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// TeamMember Repository
class InMemoryTeamMemberRepository {
    async findById(id) {
        try {
            const member = teamMembers.find((m) => m.id === id) || null;
            return (0, result_1.success)(member);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByUserId(userId) {
        try {
            const members = teamMembers.filter((m) => m.userId === userId);
            return (0, result_1.success)(members);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const members = teamMembers.filter((m) => m.organizationId === organizationId);
            return (0, result_1.success)(members);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByProjectId(projectId) {
        try {
            const project = projects.find((p) => p.id === projectId);
            if (!project)
                return (0, result_1.success)([]);
            const members = teamMembers.filter((m) => m.organizationId === project.organizationId);
            return (0, result_1.success)(members);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const member = {
                id: generateId(),
                role: data.role || 'MEMBER',
                departmentId: data.departmentId || undefined,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            teamMembers.push(member);
            return (0, result_1.success)(member);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const index = teamMembers.findIndex((m) => m.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`TeamMember with id ${id} not found`));
            }
            const updated = {
                ...teamMembers[index],
                ...data,
                updatedAt: new Date(),
            };
            if (updated.departmentId === null) {
                delete updated.departmentId;
            }
            teamMembers[index] = updated;
            return (0, result_1.success)(teamMembers[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            teamMembers = teamMembers.filter((m) => m.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Invitation Repository
class InMemoryInvitationRepository {
    async findById(id) {
        try {
            const invitation = invitations.find((i) => i.id === id) || null;
            return (0, result_1.success)(invitation);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByToken(token) {
        try {
            const invitation = invitations.find((i) => i.token === token) || null;
            return (0, result_1.success)(invitation);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const invitationList = invitations.filter((i) => i.organizationId === organizationId);
            return (0, result_1.success)(invitationList);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const invitation = {
                id: generateId(),
                token: generateId(),
                status: 'PENDING',
                role: data.role || 'MEMBER',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                ...data,
            };
            invitations.push(invitation);
            return (0, result_1.success)(invitation);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const index = invitations.findIndex((i) => i.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`Invitation with id ${id} not found`));
            }
            invitations[index] = {
                ...invitations[index],
                ...data,
            };
            return (0, result_1.success)(invitations[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            invitations = invitations.filter((i) => i.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Process Repository
class InMemoryProcessRepository {
    async findById(id) {
        try {
            const process = processes.find((p) => p.id === id) || null;
            return (0, result_1.success)(process);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const processList = processes.filter((p) => p.organizationId === organizationId);
            return (0, result_1.success)(processList);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByDepartmentId(departmentId) {
        try {
            const processList = processes.filter((p) => p.departmentId === departmentId);
            return (0, result_1.success)(processList);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const process = {
                id: generateId(),
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            processes.push(process);
            return (0, result_1.success)(process);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const index = processes.findIndex((p) => p.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`Process with id ${id} not found`));
            }
            processes[index] = {
                ...processes[index],
                ...data,
                updatedAt: new Date(),
            };
            return (0, result_1.success)(processes[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            processes = processes.filter((p) => p.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Notification Repository
class InMemoryNotificationRepository {
    async findById(id) {
        try {
            const notification = notifications.find((n) => n.id === id) || null;
            return (0, result_1.success)(notification);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByUserId(userId) {
        try {
            const notificationList = notifications.filter((n) => n.userId === userId);
            return (0, result_1.success)(notificationList);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const notification = {
                id: generateId(),
                read: false,
                createdAt: new Date(),
                ...data,
            };
            notifications.push(notification);
            return (0, result_1.success)(notification);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async markAsRead(id) {
        try {
            const index = notifications.findIndex((n) => n.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`Notification with id ${id} not found`));
            }
            notifications[index] = {
                ...notifications[index],
                read: true,
            };
            return (0, result_1.success)(notifications[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async markAllAsRead(userId) {
        try {
            notifications = notifications.map((n) => n.userId === userId ? { ...n, read: true } : n);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            notifications = notifications.filter((n) => n.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async deleteRead(userId) {
        try {
            notifications = notifications.filter((n) => !(n.userId === userId && n.read));
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Comment Repository
class InMemoryCommentRepository {
    async findById(id) {
        try {
            const comment = comments.find((c) => c.id === id) || null;
            return (0, result_1.success)(comment);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByTaskId(taskId) {
        try {
            const commentList = comments.filter((c) => c.taskId === taskId);
            return (0, result_1.success)(commentList);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const comment = {
                id: generateId(),
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            comments.push(comment);
            return (0, result_1.success)(comment);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const index = comments.findIndex((c) => c.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`Comment with id ${id} not found`));
            }
            comments[index] = {
                ...comments[index],
                ...data,
                updatedAt: new Date(),
            };
            return (0, result_1.success)(comments[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            comments = comments.filter((c) => c.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Team Repository
class InMemoryTeamRepository {
    async findById(id) {
        try {
            const team = teams.find((t) => t.id === id) || null;
            return (0, result_1.success)(team);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByOrganizationId(organizationId) {
        try {
            const teamList = teams.filter((t) => t.organizationId === organizationId);
            return (0, result_1.success)(teamList);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const team = {
                id: generateId(),
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            teams.push(team);
            return (0, result_1.success)(team);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async update(id, data) {
        try {
            const index = teams.findIndex((t) => t.id === id);
            if (index === -1) {
                return (0, result_1.failure)(new Error(`Team with id ${id} not found`));
            }
            teams[index] = {
                ...teams[index],
                ...data,
                updatedAt: new Date(),
            };
            return (0, result_1.success)(teams[index]);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            teams = teams.filter((t) => t.id !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Conversation Repository
class InMemoryConversationRepository {
    async findById(id) {
        try {
            const conversation = conversations.find((c) => c.id === id) || null;
            return (0, result_1.success)(conversation);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async findByUserId(userId) {
        try {
            const userConversations = conversations
                .filter((c) => c.userId === userId)
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            return (0, result_1.success)(userConversations);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async create(data) {
        try {
            const conversation = {
                id: generateId(),
                userId: data.userId,
                title: data.title || 'New Conversation',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            conversations.push(conversation);
            return (0, result_1.success)(conversation);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async delete(id) {
        try {
            conversations = conversations.filter((c) => c.id !== id);
            conversationMessages = conversationMessages.filter((m) => m.conversationId !== id);
            return (0, result_1.success)(undefined);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async addMessage(data) {
        try {
            const conversation = conversations.find((c) => c.id === data.conversationId);
            if (!conversation) {
                return (0, result_1.failure)(new Error(`Conversation with id ${data.conversationId} not found`));
            }
            const message = {
                id: generateId(),
                conversationId: data.conversationId,
                role: data.role,
                content: data.content,
                createdAt: new Date(),
            };
            conversationMessages.push(message);
            conversation.updatedAt = new Date();
            const messages = conversationMessages.filter((m) => m.conversationId === data.conversationId);
            if (messages.length > MAX_MESSAGES_PER_CONVERSATION) {
                const oldestMessages = messages.slice(0, messages.length - MAX_MESSAGES_PER_CONVERSATION);
                for (const oldMsg of oldestMessages) {
                    conversationMessages = conversationMessages.filter((m) => m.id !== oldMsg.id);
                }
            }
            return (0, result_1.success)(message);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    async getMessages(conversationId) {
        try {
            const messages = conversationMessages
                .filter((m) => m.conversationId === conversationId)
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            return (0, result_1.success)(messages);
        }
        catch (error) {
            return (0, result_1.failure)(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
// Create and export repositories
const createInMemoryRepositories = () => {
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
        teams: new InMemoryTeamRepository(),
        conversations: new InMemoryConversationRepository(),
    };
};
exports.createInMemoryRepositories = createInMemoryRepositories;
