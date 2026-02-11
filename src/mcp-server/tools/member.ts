import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'
import { isFailure, isSuccess } from '../../lib/result.js'

// List Organization Members Tool
const listOrganizationMembersTool = {
  name: 'list_organization_members',
  description: 'List all members in organization',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Organization ID' },
      role: { type: 'string', description: 'Filter by role (optional)', enum: ['admin', 'member', 'viewer'] },
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

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, args.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    // Get members from teamMembers repository
    const membersResult = await context.repositories.teamMembers.findByOrganizationId(args.organizationId)

    if (isFailure(membersResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${membersResult.error.message}` }],
        isError: true,
      }
    }

    let members = membersResult.data

    // Filter by role if specified
    if (args.role) {
      members = members.filter(m => m.role === args.role)
    }

    // Get user details for each member
    const membersWithDetails = []
    for (const member of members) {
      const userResult = await context.repositories.users.findById(member.userId)
      if (isSuccess(userResult) && userResult.data) {
        membersWithDetails.push({
          id: member.id,
          userId: member.userId,
          name: userResult.data.name,
          email: userResult.data.email,
          role: member.role,
          position: member.position,
          departmentId: member.departmentId,
          createdAt: member.createdAt,
        })
      }
    }

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

// Get Member Tool
const getMemberTool = {
  name: 'get_member',
  description: 'Get member details',
  inputSchema: {
    type: 'object',
    properties: {
      memberId: { type: 'string', description: 'Member ID' },
    },
    required: ['memberId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const memberResult = await context.repositories.teamMembers.findById(args.memberId)

    if (isFailure(memberResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${memberResult.error.message}` }],
        isError: true,
      }
    }

    const member = memberResult.data
    if (!member) {
      return {
        content: [{ type: 'text', text: 'Member not found' }],
        isError: true,
      }
    }

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, member.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    // Get user details
    const userResult = await context.repositories.users.findById(member.userId)
    if (isFailure(userResult) || !userResult.data) {
      return {
        content: [{ type: 'text', text: 'User details not found' }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: member.id,
            userId: member.userId,
            name: userResult.data.name,
            email: userResult.data.email,
            role: member.role,
            position: member.position,
            departmentId: member.departmentId,
            organizationId: member.organizationId,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
          }, null, 2),
        },
      ],
    }
  },
}

// Invite Member Tool
const inviteMemberTool = {
  name: 'invite_member',
  description: 'Invite a new member to organization',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Organization ID' },
      email: { type: 'string', description: 'Email address to invite' },
      role: { type: 'string', description: 'Role for the new member', enum: ['admin', 'member', 'viewer'] },
      departmentId: { type: 'string', description: 'Department ID (optional)' },
    },
    required: ['organizationId', 'email', 'role'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, args.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    // Check if user is an admin (only admins can invite members)
    const membersResult = await context.repositories.teamMembers.findByUserId(context.userId)
    if (isFailure(membersResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${membersResult.error.message}` }],
        isError: true,
      }
    }

    const userMembership = membersResult.data.find(m => m.organizationId === args.organizationId)
    if (!userMembership || userMembership.role !== 'admin') {
      return {
        content: [{ type: 'text', text: 'Only organization admins can invite new members' }],
        isError: true,
      }
    }

    // Create invitation
    const result = await context.repositories.invitations.create({
      email: args.email,
      role: args.role,
      organizationId: args.organizationId,
      departmentId: args.departmentId,
    })

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const invitation = result.data
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            organizationId: invitation.organizationId,
            departmentId: invitation.departmentId,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
            message: 'Invitation created successfully',
          }, null, 2),
        },
      ],
    }
  },
}

// List Pending Invitations Tool
const listPendingInvitationsTool = {
  name: 'list_pending_invitations',
  description: 'List pending invitations',
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

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, args.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    // Check if user is an admin (only admins can view invitations)
    const membersResult = await context.repositories.teamMembers.findByUserId(context.userId)
    if (isFailure(membersResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${membersResult.error.message}` }],
        isError: true,
      }
    }

    const userMembership = membersResult.data.find(m => m.organizationId === args.organizationId)
    if (!userMembership || userMembership.role !== 'admin') {
      return {
        content: [{ type: 'text', text: 'Only organization admins can view invitations' }],
        isError: true,
      }
    }

    const invitationsResult = await context.repositories.invitations.findByOrganizationId(args.organizationId)

    if (isFailure(invitationsResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${invitationsResult.error.message}` }],
        isError: true,
      }
    }

    // Filter pending invitations
    const pendingInvitations = invitationsResult.data.filter(i => i.status === 'pending')

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(pendingInvitations.map(i => ({
            id: i.id,
            email: i.email,
            role: i.role,
            departmentId: i.departmentId,
            status: i.status,
            expiresAt: i.expiresAt,
            createdAt: i.createdAt,
          })), null, 2),
        },
      ],
    }
  },
}

// Cancel Invitation Tool
const cancelInvitationTool = {
  name: 'cancel_invitation',
  description: 'Cancel a pending invitation',
  inputSchema: {
    type: 'object',
    properties: {
      invitationId: { type: 'string', description: 'Invitation ID' },
    },
    required: ['invitationId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get the invitation first
    const invitationResult = await context.repositories.invitations.findById(args.invitationId)

    if (isFailure(invitationResult) || !invitationResult.data) {
      return {
        content: [{ type: 'text', text: 'Invitation not found' }],
        isError: true,
      }
    }

    const invitation = invitationResult.data

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, invitation.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    // Check if user is an admin
    const membersResult = await context.repositories.teamMembers.findByUserId(context.userId)
    if (isFailure(membersResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${membersResult.error.message}` }],
        isError: true,
      }
    }

    const userMembership = membersResult.data.find(m => m.organizationId === invitation.organizationId)
    if (!userMembership || userMembership.role !== 'admin') {
      return {
        content: [{ type: 'text', text: 'Only organization admins can cancel invitations' }],
        isError: true,
      }
    }

    // Update invitation status to cancelled
    const result = await context.repositories.invitations.update(args.invitationId, {
      status: 'cancelled',
    })

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
          text: 'Invitation cancelled successfully',
        },
      ],
    }
  },
}

// Update Member Role Tool
const updateMemberRoleTool = {
  name: 'update_member_role',
  description: "Update a member's role",
  inputSchema: {
    type: 'object',
    properties: {
      memberId: { type: 'string', description: 'Member ID' },
      role: { type: 'string', description: 'New role', enum: ['admin', 'member', 'viewer'] },
    },
    required: ['memberId', 'role'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get the member
    const memberResult = await context.repositories.teamMembers.findById(args.memberId)

    if (isFailure(memberResult) || !memberResult.data) {
      return {
        content: [{ type: 'text', text: 'Member not found' }],
        isError: true,
      }
    }

    const member = memberResult.data

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, member.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    // Check if user is an admin
    const membersResult = await context.repositories.teamMembers.findByUserId(context.userId)
    if (isFailure(membersResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${membersResult.error.message}` }],
        isError: true,
      }
    }

    const userMembership = membersResult.data.find(m => m.organizationId === member.organizationId)
    if (!userMembership || userMembership.role !== 'admin') {
      return {
        content: [{ type: 'text', text: 'Only organization admins can update member roles' }],
        isError: true,
      }
    }

    // Update member role
    const result = await context.repositories.teamMembers.update(args.memberId, {
      role: args.role,
    })

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
          text: `Member role updated to ${args.role} successfully`,
        },
      ],
    }
  },
}

// Register tools
registerTool(listOrganizationMembersTool)
registerTool(getMemberTool)
registerTool(inviteMemberTool)
registerTool(listPendingInvitationsTool)
registerTool(cancelInvitationTool)
registerTool(updateMemberRoleTool)
