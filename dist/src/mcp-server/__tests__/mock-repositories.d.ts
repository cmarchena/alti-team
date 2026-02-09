import { Result } from '@/lib/result';
import { User, Organization, Project, Task, Resource, Department, TeamMember, Invitation, Process, Notification, Comment, Team } from '@/lib/repositories/types';
export interface MockUser extends User {
    password?: string;
}
export type MockRepositories = {
    users: {
        findById: (id: string) => Promise<Result<MockUser | null>>;
        findByEmail: (email: string) => Promise<Result<MockUser | null>>;
        search: (query: string, organizationId?: string, limit?: number) => Promise<Result<User[]>>;
        create: (data: {
            email: string;
            name?: string;
            password?: string;
        }) => Promise<Result<User>>;
        update: (id: string, data: {
            name?: string;
            bio?: string;
        }) => Promise<Result<User>>;
        delete: (id: string) => Promise<Result<void>>;
    };
    organizations: {
        findById: (id: string) => Promise<Result<Organization | null>>;
        findByOwnerId: (ownerId: string) => Promise<Result<Organization[]>>;
        create: (data: {
            name: string;
            description?: string;
            ownerId: string;
        }) => Promise<Result<Organization>>;
        update: (id: string, data: {
            name?: string;
            description?: string;
        }) => Promise<Result<Organization>>;
        delete: (id: string) => Promise<Result<void>>;
    };
    projects: {
        findById: (id: string) => Promise<Result<Project | null>>;
        findByOrganizationId: (organizationId: string) => Promise<Result<Project[]>>;
        create: (data: {
            name: string;
            description?: string;
            status?: string;
            startDate?: Date;
            endDate?: Date;
            organizationId: string;
        }) => Promise<Result<Project>>;
        update: (id: string, data: {
            name?: string;
            description?: string;
            status?: string;
            startDate?: Date;
            endDate?: Date;
        }) => Promise<Result<Project>>;
        delete: (id: string) => Promise<Result<void>>;
    };
    tasks: {
        findById: (id: string) => Promise<Result<Task | null>>;
        findByProjectId: (projectId: string) => Promise<Result<Task[]>>;
        findByAssignedToId: (assignedToId: string) => Promise<Result<Task[]>>;
        create: (data: {
            title: string;
            description?: string;
            status?: string;
            priority?: string;
            dueDate?: Date;
            projectId: string;
            assignedToId?: string;
        }) => Promise<Result<Task>>;
        update: (id: string, data: {
            title?: string;
            description?: string;
            status?: string;
            priority?: string;
            dueDate?: Date;
            assignedToId?: string | null;
        }) => Promise<Result<Task>>;
        delete: (id: string) => Promise<Result<void>>;
    };
    resources: {
        findById: (id: string) => Promise<Result<Resource | null>>;
        findByProjectId: (projectId: string) => Promise<Result<Resource[]>>;
        create: (data: {
            name: string;
            type?: string;
            url?: string;
            projectId: string;
            uploadedById: string;
            metadata?: Record<string, unknown>;
        }) => Promise<Result<Resource>>;
        update: (id: string, data: {
            name?: string;
            type?: string;
            url?: string;
        }) => Promise<Result<Resource>>;
        delete: (id: string) => Promise<Result<void>>;
    };
    departments: {
        findById: (id: string) => Promise<Result<Department | null>>;
        findByOrganizationId: (organizationId: string) => Promise<Result<Department[]>>;
        findByParentId: (parentId: string) => Promise<Result<Department[]>>;
        create: (data: {
            name: string;
            description?: string;
            organizationId: string;
            parentId?: string;
        }) => Promise<Result<Department>>;
        update: (id: string, data: {
            name?: string;
            description?: string;
            parentId?: string | null;
        }) => Promise<Result<Department>>;
        delete: (id: string) => Promise<Result<void>>;
    };
    teamMembers: {
        findById: (id: string) => Promise<Result<TeamMember | null>>;
        findByUserId: (userId: string) => Promise<Result<TeamMember[]>>;
        findByOrganizationId: (organizationId: string) => Promise<Result<TeamMember[]>>;
        findByProjectId: (projectId: string) => Promise<Result<TeamMember[]>>;
        create: (data: {
            userId: string;
            organizationId: string;
            departmentId?: string;
            role?: string;
            position?: string;
        }) => Promise<Result<TeamMember>>;
        update: (id: string, data: {
            departmentId?: string | null;
            role?: string;
            position?: string;
        }) => Promise<Result<TeamMember>>;
        delete: (id: string) => Promise<Result<void>>;
    };
    invitations: {
        findById: (id: string) => Promise<Result<Invitation | null>>;
        findByToken: (token: string) => Promise<Result<Invitation | null>>;
        findByOrganizationId: (organizationId: string) => Promise<Result<Invitation[]>>;
        create: (data: {
            email: string;
            role?: string;
            organizationId: string;
            departmentId?: string;
        }) => Promise<Result<Invitation>>;
        update: (id: string, data: Partial<{
            status: string;
            acceptedAt: Date;
        }>) => Promise<Result<Invitation>>;
        delete: (id: string) => Promise<Result<void>>;
    };
    processes: {
        findById: (id: string) => Promise<Result<Process | null>>;
        findByOrganizationId: (organizationId: string) => Promise<Result<Process[]>>;
        findByDepartmentId: (departmentId: string) => Promise<Result<Process[]>>;
        create: (data: {
            name: string;
            description?: string;
            steps: string;
            organizationId: string;
            departmentId: string;
            createdById: string;
        }) => Promise<Result<Process>>;
        update: (id: string, data: {
            name?: string;
            description?: string;
            steps?: string;
        }) => Promise<Result<Process>>;
        delete: (id: string) => Promise<Result<void>>;
    };
    notifications: {
        findById: (id: string) => Promise<Result<Notification | null>>;
        findByUserId: (userId: string) => Promise<Result<Notification[]>>;
        create: (data: {
            userId: string;
            type: string;
            message: string;
        }) => Promise<Result<Notification>>;
        markAsRead: (id: string) => Promise<Result<Notification>>;
        markAllAsRead: (userId: string) => Promise<Result<void>>;
        delete: (id: string) => Promise<Result<void>>;
        deleteRead: (userId: string) => Promise<Result<void>>;
    };
    comments: {
        findById: (id: string) => Promise<Result<Comment | null>>;
        findByTaskId: (taskId: string) => Promise<Result<Comment[]>>;
        create: (data: {
            content: string;
            taskId: string;
            userId: string;
            parentId?: string;
        }) => Promise<Result<Comment>>;
        update: (id: string, data: {
            content?: string;
        }) => Promise<Result<Comment>>;
        delete: (id: string) => Promise<Result<void>>;
    };
    teams: {
        findById: (id: string) => Promise<Result<Team | null>>;
        findByOrganizationId: (organizationId: string) => Promise<Result<Team[]>>;
        create: (data: {
            name: string;
            description?: string;
            organizationId: string;
        }) => Promise<Result<Team>>;
        update: (id: string, data: {
            name?: string;
            description?: string;
        }) => Promise<Result<Team>>;
        delete: (id: string) => Promise<Result<void>>;
    };
};
export declare function createMockRepositories(): MockRepositories;
export declare function createTestData(repos: MockRepositories): Promise<{
    users: {
        user1: MockUser;
        user2: MockUser;
    };
    organization: Organization;
    teamMembers: {
        member1: any;
        member2: any;
    };
    project: Project;
    task: Task;
    resource: any;
    department: any;
}>;
