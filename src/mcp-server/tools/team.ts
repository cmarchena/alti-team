import { isSuccess, isFailure } from '../../lib/result'
import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

// Create Team Tool
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

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      args.organizationId,
      context,
    )
    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied. You are not a member of this organization.',
          },
        ],
        isError: true,
      }
    }

    const result = await context.repositories.teams.create({
      name: args.name,
      description: args.description || '',
      organizationId: args.organizationId,
    })

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const team = result.data
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: team.id,
              name: team.name,
              description: team.description,
              organizationId: team.organizationId,
              createdAt: team.createdAt,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
}

// Get Team Tool
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

    const teamResult = await context.repositories.teams.findById(args.teamId)

    if (isFailure(teamResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${teamResult.error.message}` }],
        isError: true,
      }
    }

    const team = teamResult.data
    if (!team) {
      return {
        content: [{ type: 'text', text: 'Team not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      team.organizationId,
      context,
    )
    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied. You are not a member of this organization.',
          },
        ],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: team.id,
              name: team.name,
              description: team.description,
              organizationId: team.organizationId,
              createdAt: team.createdAt,
              updatedAt: team.updatedAt,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
}

// List Teams Tool
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

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      args.organizationId,
      context,
    )
    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied. You are not a member of this organization.',
          },
        ],
        isError: true,
      }
    }

    const result = await context.repositories.teams.findByOrganizationId(
      args.organizationId,
    )

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            result.data.map((team) => ({
              id: team.id,
              name: team.name,
              description: team.description,
              organizationId: team.organizationId,
              createdAt: team.createdAt,
            })),
            null,
            2,
          ),
        },
      ],
    }
  },
}

// Update Team Tool
const updateTeamTool = {
  name: 'update_team',
  description: 'Update team information',
  inputSchema: {
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID' },
      name: { type: 'string', description: 'New team name' },
      description: { type: 'string', description: 'New team description' },
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

    const teamResult = await context.repositories.teams.findById(args.teamId)

    if (isFailure(teamResult) || !teamResult.data) {
      return {
        content: [{ type: 'text', text: 'Team not found' }],
        isError: true,
      }
    }

    const team = teamResult.data
    const hasAccess = await validateOrganizationAccess(
      context.userId,
      team.organizationId,
      context,
    )
    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied. You are not a member of this organization.',
          },
        ],
        isError: true,
      }
    }

    const updateData: any = {}
    if (args.name !== undefined) updateData.name = args.name
    if (args.description !== undefined)
      updateData.description = args.description

    const result = await context.repositories.teams.update(
      args.teamId,
      updateData,
    )

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Team updated successfully',
        },
      ],
    }
  },
}

// Delete Team Tool
const deleteTeamTool = {
  name: 'delete_team',
  description: 'Delete a team',
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

    const teamResult = await context.repositories.teams.findById(args.teamId)

    if (isFailure(teamResult) || !teamResult.data) {
      return {
        content: [{ type: 'text', text: 'Team not found' }],
        isError: true,
      }
    }

    const team = teamResult.data
    const hasAccess = await validateOrganizationAccess(
      context.userId,
      team.organizationId,
      context,
    )
    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied. You are not a member of this organization.',
          },
        ],
        isError: true,
      }
    }

    const result = await context.repositories.teams.delete(args.teamId)

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Team deleted successfully',
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
        enum: ['member', 'lead'],
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

    const teamResult = await context.repositories.teams.findById(args.teamId)

    if (isFailure(teamResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${teamResult.error.message}` }],
        isError: true,
      }
    }

    const team = teamResult.data
    if (!team) {
      return {
        content: [{ type: 'text', text: 'Team not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      team.organizationId,
      context,
    )
    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied. You are not a member of this organization.',
          },
        ],
        isError: true,
      }
    }

    const result = await context.repositories.teamMembers.create({
      userId: args.userId,
      organizationId: team.organizationId,
      departmentId: args.teamId,
      role: args.role || 'member',
    })

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const member = result.data
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: member.id,
              userId: member.userId,
              teamId: args.teamId,
              role: member.role,
              createdAt: member.createdAt,
            },
            null,
            2,
          ),
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

    const teamResult = await context.repositories.teams.findById(args.teamId)

    if (isFailure(teamResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${teamResult.error.message}` }],
        isError: true,
      }
    }

    const team = teamResult.data
    if (!team) {
      return {
        content: [{ type: 'text', text: 'Team not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      team.organizationId,
      context,
    )
    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied. You are not a member of this organization.',
          },
        ],
        isError: true,
      }
    }

    const membersResult =
      await context.repositories.teamMembers.findByOrganizationId(
        team.organizationId,
      )

    if (isFailure(membersResult)) {
      return {
        content: [
          { type: 'text', text: `Error: ${membersResult.error.message}` },
        ],
        isError: true,
      }
    }

    const members = membersResult.data
    const memberToRemove = members.find(
      (m) => m.userId === args.userId && m.departmentId === args.teamId,
    )

    if (!memberToRemove) {
      return {
        content: [{ type: 'text', text: 'Member not found in this team' }],
        isError: true,
      }
    }

    const result = await context.repositories.teamMembers.delete(
      memberToRemove.id,
    )

    if (isFailure(result)) {
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

    const teamResult = await context.repositories.teams.findById(args.teamId)

    if (isFailure(teamResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${teamResult.error.message}` }],
        isError: true,
      }
    }

    const team = teamResult.data
    if (!team) {
      return {
        content: [{ type: 'text', text: 'Team not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      team.organizationId,
      context,
    )
    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied. You are not a member of this organization.',
          },
        ],
        isError: true,
      }
    }

    const membersResult =
      await context.repositories.teamMembers.findByOrganizationId(
        team.organizationId,
      )

    if (isFailure(membersResult)) {
      return {
        content: [
          { type: 'text', text: `Error: ${membersResult.error.message}` },
        ],
        isError: true,
      }
    }

    const members = membersResult.data.filter(
      (m) => m.departmentId === args.teamId,
    )

    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const userResult = await context.repositories.users.findById(
          member.userId,
        )
        const user = isSuccess(userResult) ? userResult.data : null

        return {
          id: member.id,
          userId: member.userId,
          userName: user ? user.name : 'Unknown',
          userEmail: user ? user.email : 'Unknown',
          role: member.role,
          position: member.position,
          createdAt: member.createdAt,
        }
      }),
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

// Register tools
registerTool(createTeamTool)
registerTool(getTeamTool)
registerTool(listTeamsTool)
registerTool(updateTeamTool)
registerTool(deleteTeamTool)
registerTool(addTeamMemberTool)
registerTool(removeTeamMemberTool)
registerTool(listTeamMembersTool)
