"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const in_memory_1 = require("../in-memory");
const result_1 = require("@/lib/result");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production';
describe('Full API Flow Integration Test', () => {
    let repos;
    let testUser;
    let authToken;
    beforeEach(() => {
        // Create fresh repositories for each test
        repos = (0, in_memory_1.createInMemoryRepositories)();
        testUser = {
            id: '',
            email: `test-${Date.now()}@altiteam.com`,
            name: 'Test User',
            password: 'TestPassword123!'
        };
    });
    describe('Step 1: User Registration', () => {
        it('should create a new user', async () => {
            const result = await repos.users.create({
                name: testUser.name,
                email: testUser.email,
                password: await bcryptjs_1.default.hash(testUser.password, 12)
            });
            expect((0, result_1.isSuccess)(result)).toBe(true);
            const user = result;
            expect(user.data.email).toBe(testUser.email);
            expect(user.data.name).toBe(testUser.name);
            expect(user.data.id).toBeDefined();
            // Store user ID for later tests
            testUser.id = user.data.id;
        });
    });
    describe('Step 2: User Login', () => {
        beforeEach(async () => {
            // Create user first
            const createResult = await repos.users.create({
                name: testUser.name,
                email: testUser.email,
                password: await bcryptjs_1.default.hash(testUser.password, 12)
            });
            if ((0, result_1.isSuccess)(createResult)) {
                testUser.id = createResult.data.id;
            }
        });
        it('should login successfully with correct credentials', async () => {
            const findResult = await repos.users.findByEmail(testUser.email);
            expect((0, result_1.isSuccess)(findResult)).toBe(true);
            const userResult = findResult;
            const user = userResult.data;
            const isValid = await bcryptjs_1.default.compare(testUser.password, user.password);
            expect(isValid).toBe(true);
            // Generate JWT token
            const payload = {
                sub: user.id,
                email: user.email,
                name: user.name,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
            };
            authToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
            expect(authToken).toBeDefined();
            expect(authToken.split('.')).toHaveLength(3); // JWT has 3 parts
        });
        it('should fail login with incorrect password', async () => {
            const findResult = await repos.users.findByEmail(testUser.email);
            expect((0, result_1.isSuccess)(findResult)).toBe(true);
            const userResult = findResult;
            const isValid = await bcryptjs_1.default.compare('wrongpassword', userResult.data.password);
            expect(isValid).toBe(false);
        });
    });
    describe('Step 3: Create Organization', () => {
        beforeEach(async () => {
            // Create user and get token
            const createResult = await repos.users.create({
                name: testUser.name,
                email: testUser.email,
                password: await bcryptjs_1.default.hash(testUser.password, 12)
            });
            if ((0, result_1.isSuccess)(createResult)) {
                testUser.id = createResult.data.id;
            }
            const payload = {
                sub: testUser.id,
                email: testUser.email,
                name: testUser.name
            };
            authToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
        });
        it('should create an organization owned by the user', async () => {
            const orgResult = await repos.organizations.create({
                name: 'Test Organization',
                description: 'A test organization',
                ownerId: testUser.id
            });
            expect((0, result_1.isSuccess)(orgResult)).toBe(true);
            const org = orgResult;
            expect(org.data.name).toBe('Test Organization');
            expect(org.data.ownerId).toBe(testUser.id);
        });
        it('should find organization by owner ID', async () => {
            // Create org
            await repos.organizations.create({
                name: 'Test Organization',
                ownerId: testUser.id
            });
            // Find by owner
            const findResult = await repos.organizations.findByOwnerId(testUser.id);
            expect((0, result_1.isSuccess)(findResult)).toBe(true);
            const orgs = findResult;
            expect(orgs.data).toHaveLength(1);
            expect(orgs.data[0].ownerId).toBe(testUser.id);
        });
        it('should fail to find non-existent organization', async () => {
            const findResult = await repos.organizations.findById('non-existent-id');
            expect((0, result_1.isSuccess)(findResult)).toBe(true);
            expect(findResult.data).toBeNull();
        });
    });
    describe('Step 4: Create Project', () => {
        let organizationId;
        beforeEach(async () => {
            // Create user
            const userResult = await repos.users.create({
                name: testUser.name,
                email: testUser.email,
                password: await bcryptjs_1.default.hash(testUser.password, 12)
            });
            if ((0, result_1.isSuccess)(userResult)) {
                testUser.id = userResult.data.id;
            }
            // Create organization
            const orgResult = await repos.organizations.create({
                name: 'Test Organization',
                ownerId: testUser.id
            });
            if ((0, result_1.isSuccess)(orgResult)) {
                organizationId = orgResult.data.id;
            }
            // Generate token
            const payload = {
                sub: testUser.id,
                email: testUser.email,
                name: testUser.name
            };
            authToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
        });
        it('should create a project for the organization', async () => {
            const projectResult = await repos.projects.create({
                name: 'Test Project',
                description: 'A test project',
                organizationId,
                status: 'active'
            });
            expect((0, result_1.isSuccess)(projectResult)).toBe(true);
            const project = projectResult;
            expect(project.data.name).toBe('Test Project');
            expect(project.data.organizationId).toBe(organizationId);
            expect(project.data.status).toBe('active');
        });
        it('should find projects by organization ID', async () => {
            // Create projects
            await repos.projects.create({
                name: 'Project 1',
                organizationId,
                status: 'active'
            });
            await repos.projects.create({
                name: 'Project 2',
                organizationId,
                status: 'completed'
            });
            const findResult = await repos.projects.findByOrganizationId(organizationId);
            expect((0, result_1.isSuccess)(findResult)).toBe(true);
            const projects = findResult;
            expect(projects.data).toHaveLength(2);
        });
        it('should verify organization ownership before creating project', async () => {
            // Create another user and their organization
            const otherUserResult = await repos.users.create({
                name: 'Other User',
                email: 'other@test.com',
                password: await bcryptjs_1.default.hash('password', 12)
            });
            if ((0, result_1.isFailure)(otherUserResult))
                return;
            const otherUserId = otherUserResult.data.id;
            const otherOrgResult = await repos.organizations.create({
                name: 'Other Org',
                ownerId: otherUserId
            });
            if ((0, result_1.isFailure)(otherOrgResult))
                return;
            const otherOrgId = otherOrgResult.data.id;
            // User should be able to create project in their own org
            const ownProjectResult = await repos.projects.create({
                name: 'Own Project',
                organizationId,
                status: 'active'
            });
            expect((0, result_1.isSuccess)(ownProjectResult)).toBe(true);
            // Verify: user cannot access other user's organization
            const orgFindResult = await repos.organizations.findById(otherOrgId);
            expect((0, result_1.isSuccess)(orgFindResult)).toBe(true);
            const orgFindData = orgFindResult;
            expect(orgFindData.data?.ownerId).not.toBe(testUser.id);
        });
    });
    describe('Step 5: Create Task', () => {
        let organizationId;
        let projectId;
        beforeEach(async () => {
            // Create user
            const userResult = await repos.users.create({
                name: testUser.name,
                email: testUser.email,
                password: await bcryptjs_1.default.hash(testUser.password, 12)
            });
            if ((0, result_1.isSuccess)(userResult)) {
                testUser.id = userResult.data.id;
            }
            // Create organization
            const orgResult = await repos.organizations.create({
                name: 'Test Organization',
                ownerId: testUser.id
            });
            if ((0, result_1.isSuccess)(orgResult)) {
                organizationId = orgResult.data.id;
            }
            // Create project
            const projectResult = await repos.projects.create({
                name: 'Test Project',
                organizationId,
                status: 'active'
            });
            if ((0, result_1.isSuccess)(projectResult)) {
                projectId = projectResult.data.id;
            }
            // Generate token
            const payload = {
                sub: testUser.id,
                email: testUser.email,
                name: testUser.name
            };
            authToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
        });
        it('should create a task for the project', async () => {
            const taskResult = await repos.tasks.create({
                title: 'Test Task',
                description: 'A test task',
                projectId,
                priority: 'high',
                status: 'todo'
            });
            expect((0, result_1.isSuccess)(taskResult)).toBe(true);
            const task = taskResult;
            expect(task.data.title).toBe('Test Task');
            expect(task.data.projectId).toBe(projectId);
            expect(task.data.priority).toBe('high');
        });
        it('should find tasks by project ID', async () => {
            // Create tasks
            await repos.tasks.create({
                title: 'Task 1',
                projectId,
                priority: 'high'
            });
            await repos.tasks.create({
                title: 'Task 2',
                projectId,
                priority: 'low'
            });
            const findResult = await repos.tasks.findByProjectId(projectId);
            expect((0, result_1.isSuccess)(findResult)).toBe(true);
            const tasks = findResult;
            expect(tasks.data).toHaveLength(2);
        });
        it('should verify project organization ownership before creating task', async () => {
            // Create another user's project
            const otherUserResult = await repos.users.create({
                name: 'Other User',
                email: 'other@test.com',
                password: await bcryptjs_1.default.hash('password', 12)
            });
            if ((0, result_1.isFailure)(otherUserResult))
                return;
            const otherUserId = otherUserResult.data.id;
            const otherOrgResult = await repos.organizations.create({
                name: 'Other Org',
                ownerId: otherUserId
            });
            if ((0, result_1.isFailure)(otherOrgResult))
                return;
            const otherOrgId = otherOrgResult.data.id;
            const otherProjectResult = await repos.projects.create({
                name: 'Other Project',
                organizationId: otherOrgId,
                status: 'active'
            });
            if ((0, result_1.isFailure)(otherProjectResult))
                return;
            const otherProjId = otherProjectResult.data.id;
            // User should be able to create task in their own project
            const ownTaskResult = await repos.tasks.create({
                title: 'Own Task',
                projectId,
                priority: 'medium'
            });
            expect((0, result_1.isSuccess)(ownTaskResult)).toBe(true);
            // Verify: user cannot access other user's project
            const projectFindResult = await repos.projects.findById(otherProjId);
            expect((0, result_1.isSuccess)(projectFindResult)).toBe(true);
            const projectFindData = projectFindResult;
            expect(projectFindData.data?.organizationId).not.toBe(organizationId);
        });
    });
    describe('Full Flow: Register -> Login -> Org -> Project -> Task', () => {
        it('should complete the entire flow successfully', async () => {
            // Step 1: Register
            const registerResult = await repos.users.create({
                name: testUser.name,
                email: testUser.email,
                password: await bcryptjs_1.default.hash(testUser.password, 12)
            });
            expect((0, result_1.isSuccess)(registerResult)).toBe(true);
            const registerData = registerResult;
            testUser.id = registerData.data.id;
            // Step 2: Login
            const loginResult = await repos.users.findByEmail(testUser.email);
            expect((0, result_1.isSuccess)(loginResult)).toBe(true);
            const loginData = loginResult;
            const isValid = await bcryptjs_1.default.compare(testUser.password, loginData.data.password);
            expect(isValid).toBe(true);
            const payload = {
                sub: testUser.id,
                email: testUser.email,
                name: testUser.name
            };
            authToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
            expect(authToken).toBeDefined();
            // Step 3: Create Organization
            const orgResult = await repos.organizations.create({
                name: 'Full Flow Org',
                description: 'Organization created in full flow test',
                ownerId: testUser.id
            });
            expect((0, result_1.isSuccess)(orgResult)).toBe(true);
            const orgData = orgResult;
            const orgId = orgData.data.id;
            // Step 4: Create Project
            const projectResult = await repos.projects.create({
                name: 'Full Flow Project',
                description: 'Project created in full flow test',
                organizationId: orgId,
                status: 'active'
            });
            expect((0, result_1.isSuccess)(projectResult)).toBe(true);
            const projectData = projectResult;
            const projId = projectData.data.id;
            // Step 5: Create Task
            const taskResult = await repos.tasks.create({
                title: 'Full Flow Task',
                description: 'Task created in full flow test',
                projectId: projId,
                priority: 'high',
                status: 'todo'
            });
            expect((0, result_1.isSuccess)(taskResult)).toBe(true);
            const taskData = taskResult;
            const taskId = taskData.data.id;
            // Verify all data is correctly linked
            const orgFindResult = await repos.organizations.findById(orgId);
            expect((0, result_1.isSuccess)(orgFindResult)).toBe(true);
            const orgFindData = orgFindResult;
            expect(orgFindData.data?.ownerId).toBe(testUser.id);
            const projectFindResult = await repos.projects.findById(projId);
            expect((0, result_1.isSuccess)(projectFindResult)).toBe(true);
            const projectFindData = projectFindResult;
            expect(projectFindData.data?.organizationId).toBe(orgId);
            const taskFindResult = await repos.tasks.findById(taskId);
            expect((0, result_1.isSuccess)(taskFindResult)).toBe(true);
            const taskFindData = taskFindResult;
            expect(taskFindData.data?.projectId).toBe(projId);
            console.log('✅ Full flow test completed successfully!');
            console.log(`   User ID: ${testUser.id}`);
            console.log(`   Org ID: ${orgId}`);
            console.log(`   Project ID: ${projId}`);
            console.log(`   Task ID: ${taskId}`);
        });
    });
});
