import { isSuccess, isFailure } from '../../lib/result'
import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

interface ProjectReportInput {
  projectId: string
  format?: 'summary' | 'detailed' | 'executive'
  period?: string
}

interface TeamReportInput {
  teamId: string
  metrics?: string[]
  period: string
}

const generateProjectReportTool = {
  name: 'generate_project_report',
  description: 'Generate a project status report',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
      format: {
        type: 'string',
        enum: ['summary', 'detailed', 'executive'],
        description: 'Report format',
      },
      period: {
        type: 'string',
        description: 'Optional time period (e.g., week, month, quarter)',
      },
    },
    required: ['projectId'],
  },
  handler: async (args: ProjectReportInput, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const projectResult = await context.repositories.projects.findById(
      args.projectId,
    )

    if (isFailure(projectResult)) {
      return {
        content: [
          { type: 'text', text: `Error: ${projectResult.error.message}` },
        ],
        isError: true,
      }
    }

    const project = projectResult.data

    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      project.organizationId,
      context,
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied' }],
        isError: true,
      }
    }

    const tasksResult = await context.repositories.tasks.findByProjectId(
      args.projectId,
    )
    const tasks = isSuccess(tasksResult) ? tasksResult.data : []

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === 'done').length
    const inProgressTasks = tasks.filter(
      (t) => t.status === 'in-progress',
    ).length
    const reviewTasks = tasks.filter((t) => t.status === 'review').length
    const todoTasks = tasks.filter((t) => t.status === 'todo').length
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const overdueTasks = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'done') return false
      return new Date(t.dueDate) < new Date()
    }).length

    const highPriorityTasks = tasks.filter(
      (t) => t.priority === 'high' || t.priority === 'urgent',
    ).length
    const urgentTasks = tasks.filter((t) => t.priority === 'urgent').length

    const report: any = {
      projectId: project.id,
      projectName: project.name,
      generatedAt: new Date().toISOString(),
      format: args.format || 'summary',
    }

    if (args.format === 'summary') {
      report.summary = {
        status: project.status,
        overallProgress: completionRate.toFixed(1) + '%',
        taskCounts: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          review: reviewTasks,
          todo: todoTasks,
        },
        healthIndicators: {
          overdueTasks,
          highPriorityPending: highPriorityTasks,
        },
        keyDates: {
          startDate: project.startDate,
          endDate: project.endDate,
        },
      }
    } else if (args.format === 'detailed') {
      report.summary = {
        status: project.status,
        overallProgress: completionRate.toFixed(1) + '%',
        taskCounts: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          review: reviewTasks,
          todo: todoTasks,
        },
        healthIndicators: {
          overdueTasks,
          highPriorityPending: highPriorityTasks,
          urgentTasks,
        },
        keyDates: {
          startDate: project.startDate,
          endDate: project.endDate,
        },
      }

      report.tasksBreakdown = {
        byStatus: {
          todo: tasks
            .filter((t) => t.status === 'todo')
            .map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              dueDate: t.dueDate,
            })),
          'in-progress': tasks
            .filter((t) => t.status === 'in-progress')
            .map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              assigneeId: t.assignedToId,
              dueDate: t.dueDate,
            })),
          review: tasks
            .filter((t) => t.status === 'review')
            .map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              assigneeId: t.assignedToId,
            })),
          done: tasks
            .filter((t) => t.status === 'done')
            .map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
            })),
        },
        byPriority: {
          urgent: tasks.filter((t) => t.priority === 'urgent'),
          high: tasks.filter((t) => t.priority === 'high'),
          medium: tasks.filter((t) => t.priority === 'medium'),
          low: tasks.filter((t) => t.priority === 'low'),
        },
      }

      report.riskIndicators = []

      if (overdueTasks > 0) {
        report.riskIndicators.push({
          type: 'overdue',
          count: overdueTasks,
          severity: overdueTasks > 3 ? 'high' : 'medium',
          message: `${overdueTasks} task(s) overdue`,
        })
      }

      if (urgentTasks > 0) {
        report.riskIndicators.push({
          type: 'urgent',
          count: urgentTasks,
          severity: 'high',
          message: `${urgentTasks} urgent task(s) pending`,
        })
      }

      if (completionRate < 25 && project.endDate) {
        const daysUntilDeadline = Math.floor(
          (new Date(project.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        )
        if (daysUntilDeadline < 14) {
          report.riskIndicators.push({
            type: 'deadline',
            severity: 'high',
            message: `Low progress with ${daysUntilDeadline} days until deadline`,
          })
        }
      }

      report.riskIndicators.push({
        type: 'velocity',
        severity: completionRate > 0 ? 'low' : 'info',
        message:
          completionRate === 0
            ? 'No tasks completed yet'
            : `${completionRate.toFixed(1)}% completion rate`,
      })
    } else if (args.format === 'executive') {
      report.executiveSummary = {
        status: project.status,
        overallHealth:
          overdueTasks > 0 || urgentTasks > 0 ? 'at_risk' : 'on_track',
        overallProgress: completionRate.toFixed(1) + '%',
        keyMetrics: {
          totalTasks,
          completedTasks,
          overdueTasks,
          highPriorityPending: highPriorityTasks,
        },
        timeline: {
          startDate: project.startDate,
          endDate: project.endDate,
          daysRemaining: project.endDate
            ? Math.max(
                0,
                Math.floor(
                  (new Date(project.endDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                ),
              )
            : null,
        },
        criticalItems: overdueTasks + urgentTasks,
        recommendations: [] as string[],
      }

      if (overdueTasks > 0) {
        report.executiveSummary.recommendations.push(
          `Address ${overdueTasks} overdue task(s) to get back on schedule`,
        )
      }

      if (urgentTasks > 0) {
        report.executiveSummary.recommendations.push(
          `Escalate ${urgentTasks} urgent task(s) for immediate attention`,
        )
      }

      if (completionRate < 50 && project.endDate) {
        const daysRemaining = Math.floor(
          (new Date(project.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        )
        if (daysRemaining > 0) {
          report.executiveSummary.recommendations.push(
            `Accelerate delivery pace to meet ${daysRemaining} day deadline`,
          )
        }
      }

      if (report.executiveSummary.recommendations.length === 0) {
        report.executiveSummary.recommendations.push(
          'Project is progressing well',
        )
      }
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
    }
  },
}

const generateTeamReportTool = {
  name: 'generate_team_report',
  description: 'Generate team performance report',
  inputSchema: {
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID' },
      metrics: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific metrics to include',
      },
      period: {
        type: 'string',
        description: 'Report period (week, sprint, month)',
      },
    },
    required: ['teamId', 'period'],
  },
  handler: async (args: TeamReportInput, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const teamMembersResult =
      await context.repositories.teamMembers.findByOrganizationId(
        context.userId,
      )

    if (isFailure(teamMembersResult)) {
      return {
        content: [
          { type: 'text', text: `Error: ${teamMembersResult.error.message}` },
        ],
        isError: true,
      }
    }

    const teamMembers = teamMembersResult.data.filter(
      (m) => m.id === args.teamId,
    )
    const teamMember = teamMembers[0]

    if (!teamMember) {
      return {
        content: [{ type: 'text', text: 'Team not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      teamMember.organizationId,
      context,
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied' }],
        isError: true,
      }
    }

    const teamMembersListResult =
      await context.repositories.teamMembers.findByOrganizationId(
        teamMember.organizationId,
      )
    const teamMembersList = isSuccess(teamMembersListResult)
      ? teamMembersListResult.data.filter(
          (m) => m.organizationId === teamMember.organizationId,
        )
      : []

    const memberStats = await Promise.all(
      teamMembersList.map(async (member) => {
        const tasksResult = await context.repositories.tasks.findByAssignedToId(
          member.id,
        )
        const tasks = isSuccess(tasksResult) ? tasksResult.data : []

        const completedTasks = tasks.filter((t) => t.status === 'done').length
        const inProgressTasks = tasks.filter(
          (t) => t.status === 'in-progress',
        ).length
        const overdueTasks = tasks.filter((t) => {
          if (!t.dueDate || t.status === 'done') return false
          return new Date(t.dueDate) < new Date()
        }).length

        return {
          memberId: member.id,
          role: member.role,
          taskCounts: {
            total: tasks.length,
            completed: completedTasks,
            inProgress: inProgressTasks,
            overdue: overdueTasks,
          },
          completionRate:
            tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
        }
      }),
    )

    const totalTasks = memberStats.reduce(
      (sum, m) => sum + m.taskCounts.total,
      0,
    )
    const completedTasks = memberStats.reduce(
      (sum, m) => sum + m.taskCounts.completed,
      0,
    )
    const overdueTasks = memberStats.reduce(
      (sum, m) => sum + m.taskCounts.overdue,
      0,
    )
    const overallCompletionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const topPerformers = [...memberStats]
      .filter((m) => m.completionRate > 0)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3)

    const report: any = {
      teamId: args.teamId,
      period: args.period,
      generatedAt: new Date().toISOString(),
    }

    const requestedMetrics = args.metrics || [
      'completion_rate',
      'task_distribution',
      'member_performance',
    ]

    if (requestedMetrics.includes('completion_rate')) {
      report.completionRate = {
        overall: overallCompletionRate.toFixed(1) + '%',
        totalTasks,
        completedTasks,
        overdueTasks,
      }
    }

    if (requestedMetrics.includes('task_distribution')) {
      const statusDistribution = {
        todo: memberStats.reduce(
          (sum, m) =>
            sum +
            m.taskCounts.total -
            m.taskCounts.completed -
            m.taskCounts.inProgress,
          0,
        ),
        'in-progress': memberStats.reduce(
          (sum, m) => sum + m.taskCounts.inProgress,
          0,
        ),
        done: completedTasks,
        overdue: overdueTasks,
      }
      report.taskDistribution = statusDistribution
    }

    if (requestedMetrics.includes('member_performance')) {
      report.memberPerformance = memberStats
    }

    report.summary = {
      teamSize: teamMembersList.length,
      overallHealth:
        overdueTasks > teamMembersList.length * 0.3
          ? 'needs_attention'
          : 'healthy',
      topPerformers: topPerformers.map((p) => ({
        memberId: p.memberId,
        role: p.role,
        completionRate: p.completionRate.toFixed(1) + '%',
      })),
      attentionRequired: memberStats
        .filter((m) => m.completionRate < 50 && m.taskCounts.total > 0)
        .map((m) => ({
          memberId: m.memberId,
          role: m.role,
          completionRate: m.completionRate.toFixed(1) + '%',
          issues: [
            ...(m.taskCounts.overdue > 0
              ? [`${m.taskCounts.overdue} overdue tasks`]
              : []),
          ],
        })),
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
    }
  },
}

registerTool(generateProjectReportTool)
registerTool(generateTeamReportTool)
