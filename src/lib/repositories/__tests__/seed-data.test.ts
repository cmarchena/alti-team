import { describe, it, expect } from '@jest/globals'
import { getRepositories } from '@/lib/repositories'
import { isSuccess } from '@/lib/result'

describe('Organizations Seed Data', () => {
  it('should have initial organizations data', async () => {
    const repos = getRepositories()

    const organizationsResult =
      await repos.organizations.findByOwnerId('user-1')
    expect(organizationsResult).toBeDefined()
    expect(isSuccess(organizationsResult)).toBe(true)
    if (isSuccess(organizationsResult)) {
      expect(organizationsResult.data.length).toBeGreaterThan(0)
    }
  })

  it('should have initial users data', async () => {
    const repos = getRepositories()

    const usersResult = await repos.users.findById('user-1')
    expect(usersResult).toBeDefined()
    expect(isSuccess(usersResult)).toBe(true)
    if (isSuccess(usersResult)) {
      expect(usersResult.data).not.toBeNull()
      expect(usersResult.data?.email).toBe('admin@example.com')
    }
  })

  it('should have initial team members data', async () => {
    const repos = getRepositories()

    const teamMembersResult = await repos.teamMembers.findByUserId('user-1')
    expect(teamMembersResult).toBeDefined()
    expect(isSuccess(teamMembersResult)).toBe(true)
    if (isSuccess(teamMembersResult)) {
      expect(teamMembersResult.data.length).toBeGreaterThan(0)
    }
  })

  it('should have initial projects data', async () => {
    const repos = getRepositories()

    const projectsResult = await repos.projects.findByOrganizationId('org-1')
    expect(projectsResult).toBeDefined()
    expect(isSuccess(projectsResult)).toBe(true)
    if (isSuccess(projectsResult)) {
      expect(projectsResult.data.length).toBeGreaterThan(0)
    }
  })

  it('should have initial departments data', async () => {
    const repos = getRepositories()

    const departmentsResult =
      await repos.departments.findByOrganizationId('org-1')
    expect(departmentsResult).toBeDefined()
    expect(isSuccess(departmentsResult)).toBe(true)
    if (isSuccess(departmentsResult)) {
      expect(departmentsResult.data.length).toBeGreaterThan(0)
    }
  })
})
