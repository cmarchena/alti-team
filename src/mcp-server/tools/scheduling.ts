import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'
import { isFailure, isSuccess } from '../../lib/result.js'

registerTool({
  name: 'suggest_task_schedule',
  description:
    'Get AI-powered suggestions for task scheduling based on priorities, deadlines, and team capacity',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The project ID to get schedule suggestions for',
      },
      constraints: {
        type: 'object',
        description: 'Optional scheduling constraints',
        properties: {
          deadlines: {
            type: 'array',
            description: 'Specific deadline dates to consider',
            items: { type: 'string' },
          },
          resources: {
            type: 'array',
            description: 'Specific team members to assign',
            items: { type: 'string' },
          },
          maxHoursPerDay: {
            type: 'number',
            description: 'Maximum working hours per day per person',
          },
          priorityTasks: {
            type: 'array',
            description: 'Task IDs that must be prioritized',
            items: { type: 'string' },
          },
        },
      },
    },
    required: ['projectId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    try {
      const projectResult = await context.repositories.projects.findById(
        args.projectId,
      )

      if (isFailure(projectResult) || !projectResult.data) {
        return {
          content: [{ type: 'text', text: 'Project not found' }],
          isError: true,
        }
      }

      const project = projectResult.data

      const hasAccess = await validateOrganizationAccess(
        context.userId,
        project.organizationId,
        context,
      )

      if (!hasAccess) {
        return {
          content: [{ type: 'text', text: 'Access denied to this project' }],
          isError: true,
        }
      }

      const tasksResult = await context.repositories.tasks.findByProjectId(
        args.projectId,
      )

      if (isFailure(tasksResult)) {
        return {
          content: [{ type: 'text', text: 'Failed to fetch tasks' }],
          isError: true,
        }
      }

      const tasks = tasksResult.data || []
      const pendingTasks = tasks.filter((t) => t.status !== 'done')
      const teamMembersResult =
        await context.repositories.teamMembers.findByProjectId(args.projectId)
      const teamMembers = isSuccess(teamMembersResult)
        ? teamMembersResult.data || []
        : []

      const maxHoursPerDay = args.constraints?.maxHoursPerDay || 8
      const priorityTasks = args.constraints?.priorityTasks || []

      const suggestions: any[] = []

      // Group tasks by priority
      const urgentTasks = pendingTasks.filter(
        (t) => t.priority === 'urgent',
      )
      const highPriorityTasks = pendingTasks.filter(
        (t) => t.priority === 'high',
      )
      const normalTasks = pendingTasks.filter(
        (t) => t.priority === 'normal' || !t.priority,
      )
      const lowPriorityTasks = pendingTasks.filter(
        (t) => t.priority === 'low',
      )

      // Sort each group by due date
      const sortByDueDate = (a: any, b: any) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }

      urgentTasks.sort(sortByDueDate)
      highPriorityTasks.sort(sortByDueDate)
      normalTasks.sort(sortByDueDate)
      lowPriorityTasks.sort(sortByDueDate)

      // Generate suggestions for urgent tasks
      for (const task of urgentTasks) {
        if (teamMembers.length === 0) {
          suggestions.push({
            taskId: task.id,
            taskTitle: task.title,
            priority: 'urgent',
            suggestion: 'No team members available. Consider adding team members to the project.',
            suggestedAssignee: null,
            suggestedDeadline: task.dueDate || 'Not set',
            reasoning: 'Task is urgent but no one is available',
          })
          continue
        }

        // Find team member with least tasks
        const memberWithLeastTasks = teamMembers.reduce(
          (min, member) => {
            const memberTasks = pendingTasks.filter(
              (t) => t.assignedToId === member.userId,
            )
            return memberTasks.length < min.count
              ? { member, count: memberTasks.length }
              : min
          },
          { member: teamMembers[0], count: Infinity },
        )

        suggestions.push({
          taskId: task.id,
          taskTitle: task.title,
          priority: 'urgent',
          suggestion: 'Assign to available team member immediately',
          suggestedAssignee: memberWithLeastTasks.member?.userId || null,
          suggestedDeadline: task.dueDate || 'ASAP',
          reasoning: 'Urgent priority task with closest deadline',
        })
      }

      // Generate suggestions for high priority tasks
      for (const task of highPriorityTasks.slice(0, 5)) {
        const memberWithLeastTasks = teamMembers.reduce(
          (min, member) => {
            const memberTasks = pendingTasks.filter(
              (t) => t.assignedToId === member.userId,
            )
            return memberTasks.length < min.count
              ? { member, count: memberTasks.length }
              : min
          },
          { member: teamMembers[0], count: Infinity },
        )

        suggestions.push({
          taskId: task.id,
          taskTitle: task.title,
          priority: 'high',
          suggestion: 'Schedule for next available slot',
          suggestedAssignee: memberWithLeastTasks.member?.userId || null,
          suggestedDeadline: task.dueDate || 'This week',
          reasoning: 'High priority task with upcoming deadline',
        })
      }

      // Generate suggestions for normal priority tasks
      for (const task of normalTasks.slice(0, 5)) {
        suggestions.push({
          taskId: task.id,
          taskTitle: task.title,
          priority: 'normal',
          suggestion: 'Schedule based on resource availability',
          suggestedAssignee: null,
          suggestedDeadline: task.dueDate || 'This sprint',
          reasoning: 'Normal priority, scheduled based on capacity',
        })
      }

      // Capacity overview
      const capacityOverview = teamMembers.map((member) => {
        const memberTasks = pendingTasks.filter(
          (t) => t.assignedToId === member.userId,
        )
        const totalEstimatedHours = memberTasks.reduce(
          (sum, t) => sum + ((t as any).estimatedHours || 4),
          0,
        )
        const availableHours = maxHoursPerDay * 5 - totalEstimatedHours

        return {
          memberId: member.userId,
          currentTasks: memberTasks.length,
          estimatedHours: totalEstimatedHours,
          availableHours: Math.max(0, availableHours),
          capacity: Math.round(
            (totalEstimatedHours / (maxHoursPerDay * 5)) * 100,
          ),
        }
      })

      // Calculate project timeline
      const totalTasks = pendingTasks.length
      const tasksWithDeadlines = pendingTasks.filter((t) => t.dueDate)
      const dates = tasksWithDeadlines.map((t) => new Date(t.dueDate!).getTime())
      const minDate = dates.length > 0 ? Math.min(...dates) : Date.now()
      const maxDate = dates.length > 0 ? Math.max(...dates) : Date.now()
      const dayDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24)

      const avgTasksPerDay = tasksWithDeadlines.length > 0 && dayDiff > 0
        ? tasksWithDeadlines.length / dayDiff
        : 0

      const timelineEstimate = {
        totalPendingTasks: totalTasks,
        estimatedCompletionDays: Math.ceil(totalTasks / Math.max(1, avgTasksPerDay)),
        recommendedSprintLength: Math.ceil(totalTasks / 5),
        riskFactors: [] as string[],
      }

      if (urgentTasks.length > teamMembers.length) {
        timelineEstimate.riskFactors.push(
          'More urgent tasks than available team members',
        )
      }

      if (capacityOverview.some((c) => c.capacity > 80)) {
        timelineEstimate.riskFactors.push(
          'Some team members are at or over 80% capacity',
        )
      }

      if (tasksWithDeadlines.length === 0 && totalTasks > 0) {
        timelineEstimate.riskFactors.push('No deadlines set for pending tasks')
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                projectId: args.projectId,
                totalPendingTasks: totalTasks,
                urgentCount: urgentTasks.length,
                highPriorityCount: highPriorityTasks.length,
                normalCount: normalTasks.length,
                lowCount: lowPriorityTasks.length,
                suggestions: suggestions.slice(0, 10),
                capacityOverview,
                timelineEstimate,
              },
              null,
              2,
            ),
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating schedule suggestions: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      }
    }
  },
})

registerTool({
  name: 'get_team_workload',
  description: 'Get team workload overview for a project',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The project ID to get workload for',
      },
    },
    required: ['projectId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    try {
      const teamResult = await context.repositories.teamMembers.findByProjectId(
        args.projectId,
      )
      if (isFailure(teamResult) || !teamResult.data) {
        return {
          content: [{ type: 'text', text: 'Project not found' }],
          isError: true,
        }
      }

      const team = teamResult.data

      const hasAccess = await validateOrganizationAccess(
        context.userId,
        team[0]?.organizationId || '',
        context,
      )

      if (!hasAccess) {
        return {
          content: [{ type: 'text', text: 'Access denied to this project' }],
          isError: true,
        }
      }

      const allTasksResult = await context.repositories.tasks.findByAssignedToId('')
      const allTasks = isSuccess(allTasksResult) ? allTasksResult.data || [] : []

      const workloadData = team.map((member) => {
        const memberTasks = allTasks.filter(
          (t) => t.assignedToId === member.userId && t.status !== 'done',
        )

        const overdueTasks = memberTasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < new Date(),
        )

        return {
          memberId: member.userId,
          role: member.role,
          position: member.position,
          activeTasks: memberTasks.length,
          overdueTasks: overdueTasks.length,
          upcomingDeadlines: memberTasks
            .filter((t) => t.dueDate)
            .sort(
              (a, b) =>
                new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
            )
            .slice(0, 3)
            .map((t) => ({
              taskId: t.id,
              title: t.title,
              dueDate: t.dueDate,
              priority: t.priority,
            })),
        }
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                projectId: args.projectId,
                teamSize: team.length,
                workload: workloadData,
                summary: {
                  totalActiveTasks: workloadData.reduce((sum, m) => sum + m.activeTasks, 0),
                  totalOverdue: workloadData.reduce((sum, m) => sum + m.overdueTasks, 0),
                  avgTasksPerMember: Math.round(
                    workloadData.reduce((sum, m) => sum + m.activeTasks, 0) /
                      Math.max(1, workloadData.length),
                  ),
                },
              },
              null,
              2,
            ),
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching team workload: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      }
    }
  },
})
