"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommentRepository = exports.getNotificationRepository = exports.getProcessRepository = exports.getInvitationRepository = exports.getTeamMemberRepository = exports.getResourceRepository = exports.getTaskRepository = exports.getProjectRepository = exports.getDepartmentRepository = exports.getUserRepository = exports.getOrganizationRepository = exports.getRepositories = void 0;
const in_memory_1 = require("./in-memory");
const postgres_1 = require("./postgres");
// Factory function that switches between in-memory and PostgreSQL based on environment
let repositories = null;
const getRepositories = () => {
    if (!repositories) {
        const usePostgres = process.env.USE_POSTGRES === 'true' || process.env.DATABASE_URL;
        if (usePostgres) {
            console.log('Using PostgreSQL repositories');
            repositories = (0, postgres_1.createPostgresRepositories)();
        }
        else {
            console.log('Using in-memory repositories');
            repositories = (0, in_memory_1.createInMemoryRepositories)();
        }
    }
    return repositories;
};
exports.getRepositories = getRepositories;
// Expose individual repository getters for convenience
const getOrganizationRepository = () => (0, exports.getRepositories)().organizations;
exports.getOrganizationRepository = getOrganizationRepository;
const getUserRepository = () => (0, exports.getRepositories)().users;
exports.getUserRepository = getUserRepository;
const getDepartmentRepository = () => (0, exports.getRepositories)().departments;
exports.getDepartmentRepository = getDepartmentRepository;
const getProjectRepository = () => (0, exports.getRepositories)().projects;
exports.getProjectRepository = getProjectRepository;
const getTaskRepository = () => (0, exports.getRepositories)().tasks;
exports.getTaskRepository = getTaskRepository;
const getResourceRepository = () => (0, exports.getRepositories)().resources;
exports.getResourceRepository = getResourceRepository;
const getTeamMemberRepository = () => (0, exports.getRepositories)().teamMembers;
exports.getTeamMemberRepository = getTeamMemberRepository;
const getInvitationRepository = () => (0, exports.getRepositories)().invitations;
exports.getInvitationRepository = getInvitationRepository;
const getProcessRepository = () => (0, exports.getRepositories)().processes;
exports.getProcessRepository = getProcessRepository;
const getNotificationRepository = () => (0, exports.getRepositories)().notifications;
exports.getNotificationRepository = getNotificationRepository;
const getCommentRepository = () => (0, exports.getRepositories)().comments;
exports.getCommentRepository = getCommentRepository;
