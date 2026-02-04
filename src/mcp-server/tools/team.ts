import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

// Team CRUD Tools

const createTeamTool = {
  name: 'create_team',
  description: 'Create a new team',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Organization ID' },
      name: { type: 'string', description: 'Team name' },
      description: { type: 'string', description: 'Team description' },
    },
    required: ['organizationId', 'name'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Validate user has access to organization
    const hasAccess = await validateOrganizationAccess(
      context.userId,
      args.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this organization' }],
        isError: true,
      }
    }

    // Note: Current implementation uses departments as teams
    // In a real implementation, we might have a separate teams table
    const result = await context.repositories.departments.create({
      name: args.name,
      description: args.description || '',
      organizationId: args.organizationId,
    })

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const team = result.value

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: team.id,
            name: team.name,
            description: team.description,
            organizationId: team.organizationId,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
          }, null, 2),
        },
      ],
    }
  },
}

const getTeamTool = {
  name: 'get_team',
  description: 'Get team details',
  inputSchema: {
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID' },
    },
    required: ['teamId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get team (using departments as teams)
    const result = await context.repositories.departments.findById(args.teamId)

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const team = result.value

    if (!team) {
      return {
        content: [{ type: 'text', text: 'Team not found' }],
        isError: true,
      }
    }

    // Validate user has access to the team's organization
    const hasAccess = await validateOrganizationAccess(
      context.userId,
      team.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this team' }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: team.id,
            name: team.name,
            description: team.description,
            organizationId: team.organizationId,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
          }, null, 2),
        },
      ],
    }
  },
}

const listTeamsTool = {
  name: 'list_teams',
  description: 'List teams in organization',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Organization ID' },
    },
    required: ['organizationId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Validate user has access to organization
    const hasAccess = await validateOrganizationAccess(
      context.userId,
      args.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this organization' }],
        isError: true,
      }
    }

    // Get all teams (departments) for the organization
    const result = await context.repositories.departments.findByOrganizationId(args.organizationId)

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const teams = result.value

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(teams.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            organizationId: t.organizationId,
            createdAt: t.createdAt,
          })), null, 2),
        },
      ],
    }
  },
}

// Add Team Member Tool
const addTeamMemberTool = {
  name: 'add_team_member',
  description: 'Add a member to a team',
  inputSchema: {
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID' },
      userId: { type: 'string', description: 'User ID' },
      role: { 
        type: 'string', 
        description: 'Member role',
        enum: ['member', 'lead'] 
      },
    },
    required: ['teamId', 'userId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Validate user has access to the team's organization
    const teamResult = await context.repositories.departments.findById(args.teamId)

    if (teamResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${teamResult.error.message}` }],
        isError: true,
      }
    }

    const team = teamResult.value

    if (!team) {
      return {
        content: [{ type: 'text', text: 'Team not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      team.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this team' }],
        isError: true,
      }
    }

    // Create team member
    const result = await context.repositories.teamMembers.create({
      userId: args.userId,
      organizationId: team.organizationId,
      departmentId: args.teamId, // Using departmentId to represent team membership
      role: args.role || 'member',
    })

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const member = result.value

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: member.id,
            userId: member.userId,
            teamId: args.teamId,
            role: member.role,
            createdAt: member.createdAt,
            message: 'Member added to team successfully',
          }, null, 2),
        },
      ],
    }
  },
}

// Remove Team Member Tool
const removeTeamMemberTool = {
  name: 'remove_team_member',
  description: 'Remove a member from a team',
  inputSchema: {
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID' },
      userId: { type: 'string', description: 'User ID' },
    },
    required: ['teamId', 'userId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Validate user has access to the team's organization
    const teamResult = await context.repositories.departments.findById(args.teamId)

    if (teamResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${teamResult.error.message}` }],
        isError: true,
      }
    }

    const team = teamResult.value

    if (!team) {
      return {
        content: [{ type: 'text', text: 'Team not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      team.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this team' }],
        isError: true,
      }
    }

    // Find and remove team member
    const membersResult = await context.repositories.teamMembers.findByOrganizationId(team.organizationId)

    if (membersResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${membersResult.error.message}` }],
        isError: true,
      }
    }

    const members = membersResult.value
    const memberToRemove = members.find(m => m.userId === args.userId && m.departmentId === args.teamId)

    if (!memberToRemove) {
      return {
        content: [{ type: 'text', text: 'Member not found in this team' }],
        isError: true,
      }
    }

    const result = await context.repositories.teamMembers.delete(memberToRemove.id)

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Member removed from team successfully',
        },
      ],
    }
  },
}

// List Team Members Tool
const listTeamMembersTool = {
  name: 'list_team_members',
  description: 'List all members of a team',
  inputSchema: {
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID' },
    },
    required: ['teamId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Validate user has access to the team's organization
    const teamResult = await context.repositories.departments.findById(args.teamId)

    if (teamResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${teamResult.error.message}` }],
        isError: true,
      }
    }

    const team = teamResult.value

    if (!team) {
      return {
        content: [{ type: 'text', text: 'Team not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      team.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this team' }],
        isError: true,
      }
    }

    // Get team members
    const membersResult = await context.repositories.teamMembers.findByOrganizationId(team.organizationId)

    if (membersResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${membersResult.error.message}` }],
        isError: true,
      }
    }

    const members = membersResult.value.filter(m => m.departmentId === args.teamId)

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const userResult = await context.repositories.users.findById(member.userId)
        const user = userResult.isOk() ? userResult.value : null
        
        return {
          id: member.id,
          userId: member.userId,
          userName: user ? user.name : 'Unknown',
          userEmail: user ? user.email : 'Unknown',
          role: member.role,
          position: member.position,
          createdAt: member.createdAt,
        }
      })
    )

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(membersWithDetails, null, 2),
        },
      ],
    }
  },
}

// Register team tools
registerTool(createTeamTool)
registerTool(getTeamTool)
registerTool(listTeamsTool)
registerTool(addTeamMemberTool)
registerTool(removeTeamMemberTool)
registerTool(listTeamMembersTool)