import { createInMemoryRepositories } from "./in-memory"
import { createPostgresRepositories } from "./postgres"
import { Repositories } from "./types"

// Factory function that switches between in-memory and PostgreSQL based on environment
let repositories: Repositories | null = null

export const getRepositories = (): Repositories => {
  if (!repositories) {
    const usePostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production'
    
    if (usePostgres) {
      console.log('Using PostgreSQL repositories')
      repositories = createPostgresRepositories()
    } else {
      console.log('Using in-memory repositories')
      repositories = createInMemoryRepositories()
    }
  }
  return repositories
}

// Expose individual repository getters for convenience
export const getOrganizationRepository = () => getRepositories().organizations
export const getUserRepository = () => getRepositories().users
export const getDepartmentRepository = () => getRepositories().departments
export const getProjectRepository = () => getRepositories().projects
export const getTaskRepository = () => getRepositories().tasks
export const getResourceRepository = () => getRepositories().resources
export const getTeamMemberRepository = () => getRepositories().teamMembers
export const getInvitationRepository = () => getRepositories().invitations
export const getProcessRepository = () => getRepositories().processes
export const getNotificationRepository = () => getRepositories().notifications
export const getCommentRepository = () => getRepositories().comments
