"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mock_repositories_1 = require("./mock-repositories");
const auth_1 = require("../auth");
(0, globals_1.describe)('User MCP Tools', () => {
    let repos;
    let testData;
    let context;
    (0, globals_1.beforeEach)(async () => {
        repos = (0, mock_repositories_1.createMockRepositories)();
        testData = await (0, mock_repositories_1.createTestData)(repos);
        context = {
            userId: testData.users.user1.id,
            repositories: repos,
        };
    });
    (0, globals_1.describe)('get_my_profile', () => {
        (0, globals_1.test)('should return user profile for authenticated user', async () => {
            const user = testData.users.user1;
            const result = await repos.users.findById(user.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data).not.toBeNull();
                (0, globals_1.expect)(result.data?.email).toBe('john@example.com');
                (0, globals_1.expect)(result.data?.name).toBe('John Doe');
            }
        });
        (0, globals_1.test)('should return null for non-existent user', async () => {
            const result = await repos.users.findById('non-existent-id');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data).toBeNull();
            }
        });
    });
    (0, globals_1.describe)('update_my_profile', () => {
        (0, globals_1.test)('should update user profile', async () => {
            const result = await repos.users.update(testData.users.user1.id, {
                name: 'John Updated',
                bio: 'New bio',
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.name).toBe('John Updated');
                (0, globals_1.expect)(result.data?.bio).toBe('New bio');
            }
        });
        (0, globals_1.test)('should fail for non-existent user', async () => {
            const result = await repos.users.update('non-existent-id', {
                name: 'Test',
            });
            (0, globals_1.expect)(result.success).toBe(false);
        });
    });
    (0, globals_1.describe)('search_users', () => {
        (0, globals_1.test)('should find users by name', async () => {
            const result = await repos.users.search('John');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.length).toBeGreaterThanOrEqual(1);
                (0, globals_1.expect)(result.data.some((u) => u.name?.includes('John'))).toBe(true);
            }
        });
        (0, globals_1.test)('should find users by email', async () => {
            const result = await repos.users.search('jane@example.com');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.length).toBe(1);
                (0, globals_1.expect)(result.data[0].email).toBe('jane@example.com');
            }
        });
        (0, globals_1.test)('should return empty for no matches', async () => {
            const result = await repos.users.search('nonexistent');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data).toHaveLength(0);
            }
        });
        (0, globals_1.test)('should respect limit parameter', async () => {
            const result = await repos.users.search('', undefined, 1);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.length).toBeLessThanOrEqual(1);
            }
        });
    });
});
(0, globals_1.describe)('Organization MCP Tools', () => {
    let repos;
    let testData;
    let context;
    (0, globals_1.beforeEach)(async () => {
        repos = (0, mock_repositories_1.createMockRepositories)();
        testData = await (0, mock_repositories_1.createTestData)(repos);
        context = {
            userId: testData.users.user1.id,
            repositories: repos,
        };
    });
    (0, globals_1.describe)('create_organization', () => {
        (0, globals_1.test)('should create a new organization', async () => {
            const result = await repos.organizations.create({
                name: 'New Org',
                description: 'Test org',
                ownerId: testData.users.user2.id,
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.name).toBe('New Org');
                (0, globals_1.expect)(result.data?.ownerId).toBe(testData.users.user2.id);
            }
        });
    });
    (0, globals_1.describe)('get_organization', () => {
        (0, globals_1.test)('should return organization by id', async () => {
            const result = await repos.organizations.findById(testData.organization.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.name).toBe('Acme Corp');
            }
        });
        (0, globals_1.test)('should return null for non-existent organization', async () => {
            const result = await repos.organizations.findById('non-existent');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data).toBeNull();
            }
        });
    });
    (0, globals_1.describe)('validateOrganizationAccess', () => {
        (0, globals_1.test)('should return true for organization member', async () => {
            const hasAccess = await (0, auth_1.validateOrganizationAccess)(testData.users.user1.id, testData.organization.id, context);
            (0, globals_1.expect)(hasAccess).toBe(true);
        });
        (0, globals_1.test)('should return false for non-member', async () => {
            const newUserResult = await repos.users.create({
                email: 'new@example.com',
                name: 'New User',
            });
            if (newUserResult.success) {
                const hasAccess = await (0, auth_1.validateOrganizationAccess)(newUserResult.data.id, testData.organization.id, context);
                (0, globals_1.expect)(hasAccess).toBe(false);
            }
        });
    });
});
(0, globals_1.describe)('Project MCP Tools', () => {
    let repos;
    let testData;
    let context;
    (0, globals_1.beforeEach)(async () => {
        repos = (0, mock_repositories_1.createMockRepositories)();
        testData = await (0, mock_repositories_1.createTestData)(repos);
        context = {
            userId: testData.users.user1.id,
            repositories: repos,
        };
    });
    (0, globals_1.describe)('create_project', () => {
        (0, globals_1.test)('should create a new project', async () => {
            const result = await repos.projects.create({
                name: 'New Project',
                description: 'Test project',
                status: 'planning',
                organizationId: testData.organization.id,
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.name).toBe('New Project');
                (0, globals_1.expect)(result.data?.status).toBe('planning');
            }
        });
    });
    (0, globals_1.describe)('get_project', () => {
        (0, globals_1.test)('should return project by id', async () => {
            const result = await repos.projects.findById(testData.project.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.name).toBe('Website Redesign');
            }
        });
    });
    (0, globals_1.describe)('update_project', () => {
        (0, globals_1.test)('should update project', async () => {
            const result = await repos.projects.update(testData.project.id, {
                status: 'completed',
                name: 'Updated Project Name',
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.status).toBe('completed');
                (0, globals_1.expect)(result.data?.name).toBe('Updated Project Name');
            }
        });
    });
    (0, globals_1.describe)('list_projects', () => {
        (0, globals_1.test)('should list projects by organization', async () => {
            const result = await repos.projects.findByOrganizationId(testData.organization.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.length).toBeGreaterThanOrEqual(1);
            }
        });
    });
});
(0, globals_1.describe)('Task MCP Tools', () => {
    let repos;
    let testData;
    let context;
    (0, globals_1.beforeEach)(async () => {
        repos = (0, mock_repositories_1.createMockRepositories)();
        testData = await (0, mock_repositories_1.createTestData)(repos);
        context = {
            userId: testData.users.user1.id,
            repositories: repos,
        };
    });
    (0, globals_1.describe)('create_task', () => {
        (0, globals_1.test)('should create a new task', async () => {
            const result = await repos.tasks.create({
                title: 'New Task',
                description: 'Test task',
                priority: 'high',
                projectId: testData.project.id,
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.title).toBe('New Task');
                (0, globals_1.expect)(result.data?.priority).toBe('high');
                (0, globals_1.expect)(result.data?.status).toBe('todo');
            }
        });
        (0, globals_1.test)('should create task with assigned user', async () => {
            const result = await repos.tasks.create({
                title: 'Assigned Task',
                projectId: testData.project.id,
                assignedToId: testData.users.user2.id,
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.assignedToId).toBe(testData.users.user2.id);
            }
        });
    });
    (0, globals_1.describe)('get_task', () => {
        (0, globals_1.test)('should return task by id', async () => {
            const result = await repos.tasks.findById(testData.task.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.title).toBe('Design homepage');
            }
        });
    });
    (0, globals_1.describe)('update_task', () => {
        (0, globals_1.test)('should update task status', async () => {
            const result = await repos.tasks.update(testData.task.id, {
                status: 'in-progress',
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.status).toBe('in-progress');
            }
        });
        (0, globals_1.test)('should update task priority', async () => {
            const result = await repos.tasks.update(testData.task.id, {
                priority: 'urgent',
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.priority).toBe('urgent');
            }
        });
    });
    (0, globals_1.describe)('findByProjectId', () => {
        (0, globals_1.test)('should find tasks by project', async () => {
            const result = await repos.tasks.findByProjectId(testData.project.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.length).toBeGreaterThanOrEqual(1);
            }
        });
    });
    (0, globals_1.describe)('findByAssignedToId', () => {
        (0, globals_1.test)('should find tasks by assignee', async () => {
            const result = await repos.tasks.findByAssignedToId(testData.users.user2.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data).toBeDefined();
            }
        });
    });
});
(0, globals_1.describe)('Resource MCP Tools', () => {
    let repos;
    let testData;
    let context;
    (0, globals_1.beforeEach)(async () => {
        repos = (0, mock_repositories_1.createMockRepositories)();
        testData = await (0, mock_repositories_1.createTestData)(repos);
        context = {
            userId: testData.users.user1.id,
            repositories: repos,
        };
    });
    (0, globals_1.describe)('create_resource', () => {
        (0, globals_1.test)('should create a file resource', async () => {
            const result = await repos.resources.create({
                name: 'Test Document',
                type: 'file',
                url: 'https://example.com/doc.pdf',
                projectId: testData.project.id,
                uploadedById: testData.users.user1.id,
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.name).toBe('Test Document');
                (0, globals_1.expect)(result.data?.type).toBe('file');
            }
        });
        (0, globals_1.test)('should create a link resource', async () => {
            const result = await repos.resources.create({
                name: 'Useful Link',
                type: 'link',
                url: 'https://example.com',
                projectId: testData.project.id,
                uploadedById: testData.users.user1.id,
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.type).toBe('link');
            }
        });
    });
    (0, globals_1.describe)('get_resource', () => {
        (0, globals_1.test)('should return resource by id', async () => {
            if (!testData.resource) {
                // Create resource if it doesn't exist
                const createResult = await repos.resources.create({
                    name: 'Design Spec',
                    type: 'file',
                    url: 'https://example.com/spec.pdf',
                    projectId: testData.project.id,
                    uploadedById: testData.users.user1.id,
                });
                if (!createResult.success) {
                    throw new Error('Failed to create resource');
                }
                testData.resource = createResult.data;
            }
            const result = await repos.resources.findById(testData.resource.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.name).toBe('Design Spec');
            }
        });
    });
    (0, globals_1.describe)('list_resources', () => {
        (0, globals_1.test)('should list resources by project', async () => {
            const result = await repos.resources.findByProjectId(testData.project.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.length).toBeGreaterThanOrEqual(1);
            }
        });
    });
});
(0, globals_1.describe)('TeamMember MCP Tools', () => {
    let repos;
    let testData;
    let context;
    (0, globals_1.beforeEach)(async () => {
        repos = (0, mock_repositories_1.createMockRepositories)();
        testData = await (0, mock_repositories_1.createTestData)(repos);
        context = {
            userId: testData.users.user1.id,
            repositories: repos,
        };
    });
    (0, globals_1.describe)('findByOrganizationId', () => {
        (0, globals_1.test)('should list team members by organization', async () => {
            const result = await repos.teamMembers.findByOrganizationId(testData.organization.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.length).toBeGreaterThanOrEqual(2);
            }
        });
    });
    (0, globals_1.describe)('findByUserId', () => {
        (0, globals_1.test)('should find team memberships by user', async () => {
            const result = await repos.teamMembers.findByUserId(testData.users.user1.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.length).toBeGreaterThanOrEqual(1);
            }
        });
    });
    (0, globals_1.describe)('update member role', () => {
        (0, globals_1.test)('should update member role', async () => {
            const memberId = testData.teamMembers.member1?.id;
            if (memberId) {
                const result = await repos.teamMembers.update(memberId, {
                    role: 'viewer',
                });
                (0, globals_1.expect)(result.success).toBe(true);
                if (result.success) {
                    (0, globals_1.expect)(result.data?.role).toBe('viewer');
                }
            }
        });
    });
});
(0, globals_1.describe)('Department MCP Tools', () => {
    let repos;
    let testData;
    let context;
    (0, globals_1.beforeEach)(async () => {
        repos = (0, mock_repositories_1.createMockRepositories)();
        testData = await (0, mock_repositories_1.createTestData)(repos);
        context = {
            userId: testData.users.user1.id,
            repositories: repos,
        };
    });
    (0, globals_1.describe)('create_department', () => {
        (0, globals_1.test)('should create a new department', async () => {
            const result = await repos.departments.create({
                name: 'Sales',
                description: 'Sales department',
                organizationId: testData.organization.id,
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.name).toBe('Sales');
            }
        });
    });
    (0, globals_1.describe)('get_department', () => {
        (0, globals_1.test)('should return department by id', async () => {
            if (!testData.department) {
                const createResult = await repos.departments.create({
                    name: 'Engineering',
                    description: 'Engineering department',
                    organizationId: testData.organization.id,
                });
                if (!createResult.success) {
                    throw new Error('Failed to create department');
                }
                testData.department = createResult.data;
            }
            const result = await repos.departments.findById(testData.department.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.name).toBe('Engineering');
            }
        });
    });
    (0, globals_1.describe)('list_departments', () => {
        (0, globals_1.test)('should list departments by organization', async () => {
            const result = await repos.departments.findByOrganizationId(testData.organization.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.length).toBeGreaterThanOrEqual(1);
            }
        });
    });
});
(0, globals_1.describe)('Invitation MCP Tools', () => {
    let repos;
    let testData;
    let context;
    (0, globals_1.beforeEach)(async () => {
        repos = (0, mock_repositories_1.createMockRepositories)();
        testData = await (0, mock_repositories_1.createTestData)(repos);
        context = {
            userId: testData.users.user1.id,
            repositories: repos,
        };
    });
    (0, globals_1.describe)('invite_member', () => {
        (0, globals_1.test)('should create invitation', async () => {
            const result = await repos.invitations.create({
                email: 'newuser@example.com',
                role: 'member',
                organizationId: testData.organization.id,
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.email).toBe('newuser@example.com');
                (0, globals_1.expect)(result.data?.status).toBe('pending');
            }
        });
    });
    (0, globals_1.describe)('list_pending_invitations', () => {
        (0, globals_1.test)('should filter pending invitations', async () => {
            const allResult = await repos.invitations.findByOrganizationId(testData.organization.id);
            (0, globals_1.expect)(allResult.success).toBe(true);
            if (allResult.success) {
                const pending = allResult.data.filter((i) => i.status === 'pending');
                (0, globals_1.expect)(pending.every((i) => i.status === 'pending')).toBe(true);
            }
        });
    });
});
(0, globals_1.describe)('Comment MCP Tools', () => {
    let repos;
    let testData;
    let context;
    (0, globals_1.beforeEach)(async () => {
        repos = (0, mock_repositories_1.createMockRepositories)();
        testData = await (0, mock_repositories_1.createTestData)(repos);
        context = {
            userId: testData.users.user1.id,
            repositories: repos,
        };
    });
    (0, globals_1.describe)('create_comment', () => {
        (0, globals_1.test)('should create a comment on task', async () => {
            const result = await repos.comments.create({
                content: 'This is a test comment',
                taskId: testData.task.id,
                userId: testData.users.user1.id,
            });
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data?.content).toBe('This is a test comment');
            }
        });
    });
    (0, globals_1.describe)('get_task_comments', () => {
        (0, globals_1.test)('should find comments by task', async () => {
            const result = await repos.comments.findByTaskId(testData.task.id);
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data).toBeDefined();
            }
        });
    });
});
(0, globals_1.describe)('Error Handling', () => {
    let repos;
    let testData;
    (0, globals_1.beforeEach)(async () => {
        repos = (0, mock_repositories_1.createMockRepositories)();
        testData = await (0, mock_repositories_1.createTestData)(repos);
    });
    (0, globals_1.test)('should handle non-existent project update gracefully', async () => {
        const result = await repos.projects.update('non-existent-id', {
            name: 'Should Fail',
        });
        (0, globals_1.expect)(result.success).toBe(false);
    });
    (0, globals_1.test)('should handle non-existent task delete gracefully', async () => {
        const result = await repos.tasks.delete('non-existent-id');
        (0, globals_1.expect)(result.success).toBe(false);
    });
    (0, globals_1.test)('should handle non-existent resource find gracefully', async () => {
        const result = await repos.resources.findById('non-existent-id');
        (0, globals_1.expect)(result.success).toBe(true);
        if (result.success) {
            (0, globals_1.expect)(result.data).toBeNull();
        }
    });
});
(0, globals_1.describe)('Data Integrity', () => {
    let repos;
    let testData;
    (0, globals_1.beforeEach)(async () => {
        repos = (0, mock_repositories_1.createMockRepositories)();
        testData = await (0, mock_repositories_1.createTestData)(repos);
    });
    (0, globals_1.test)('should preserve createdAt timestamps', async () => {
        const projectResult = await repos.projects.create({
            name: 'Timestamp Test',
            organizationId: testData.organization.id,
        });
        (0, globals_1.expect)(projectResult.success).toBe(true);
        if (projectResult.success) {
            (0, globals_1.expect)(projectResult.data?.createdAt).toBeDefined();
            (0, globals_1.expect)(projectResult.data?.createdAt instanceof Date).toBe(true);
        }
    });
    (0, globals_1.test)('should update updatedAt timestamps', async () => {
        const beforeUpdate = new Date();
        await new Promise((resolve) => setTimeout(resolve, 10));
        const updateResult = await repos.projects.update(testData.project.id, {
            name: 'Updated Name',
        });
        if (updateResult.success) {
            (0, globals_1.expect)(updateResult.data?.updatedAt).toBeDefined();
            (0, globals_1.expect)(updateResult.data?.updatedAt >= beforeUpdate).toBe(true);
        }
    });
});
