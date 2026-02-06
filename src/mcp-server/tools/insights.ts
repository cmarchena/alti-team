import { registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'
import { MCPServerContext } from '../index.js'

registerTool({
  name: 'generate_ai_insights',
  description:
    'Generate AI-powered insights about projects, tasks, and team performance. Identifies blockers, risks, and optimization opportunities.',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: {
        type: 'string',
        description: 'The organization ID to analyze',
      },
      focus: {
        type: 'string',
        enum: ['all', 'projects', 'tasks', 'team'],
        description: 'What to focus the analysis on',
      },
      timePeriod: {
        type: 'string',
        enum: ['week', 'month', 'quarter'],
        description: 'Time period for analysis',
      },
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

    try {
      const hasAccess = await validateOrganizationAccess(
        context.userId,
        args.organizationId,
        context,
      )

      if (!hasAccess) {
        return {
          content: [
            { type: 'text', text: 'Access denied to this organization' },
          ],
          isError: true,
        }
      }

      const orgResult = await context.repositories.organizations.findById(
        args.organizationId,
      )
      if (orgResult.isErr() || !orgResult.value) {
        return {
          content: [{ type: 'text', text: 'Organization not found' }],
          isError: true,
        }
      }

      const organization = orgResult.value
      const projectsResult =
        await context.repositories.projects.findByOrganizationId(
          args.organizationId,
        )
      const projects = projectsResult.isOk() ? projectsResult.value || [] : []

      const teamMembersResult =
        await context.repositories.teamMembers.findByOrganizationId(
          args.organizationId,
        )
      const teamMembers = teamMembersResult.isOk()
        ? teamMembersResult.value || []
        : []

      const insights: {
        category: string
        severity: 'info' | 'warning' | 'critical'
        title: string
        description: string
        suggestion: string
        relatedEntity?: string
      }[] = []

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      for (const project of projects) {
        const tasksResult = await context.repositories.tasks.findByProjectId(
          project.id,
        )
        const tasks = tasksResult.isOk() ? tasksResult.value || [] : []

        const overdueTasks = tasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done',
        )
        const blockedTasks = tasks.filter(
          (t) => t.status === 'in-progress' && t.priority === 'urgent',
        )

        if (overdueTasks.length > 0) {
          insights.push({
            category: 'deadline',
            severity: overdueTasks.length > 3 ? 'critical' : 'warning',
            title: `Overdue Tasks in "${project.name}"`,
            description: `There ${overdueTasks.length === 1 ? 'is' : 'are'} ${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'} in this project.`,
            suggestion:
              'Review and reassess priorities for overdue tasks. Consider extending deadlines or redistributing workload.',
            relatedEntity: project.name,
          })
        }

        const highPriorityActive = tasks.filter(
          (t) =>
            t.status === 'in-progress' &&
            (t.priority === 'high' || t.priority === 'urgent'),
        )
        if (highPriorityActive.length > 2) {
          insights.push({
            category: 'workload',
            severity: 'warning',
            title: `High Priority Task Overload in "${project.name}"`,
            description: `${highPriorityActive.length} high-priority tasks are currently in progress, which may impact delivery.`,
            suggestion:
              'Consider queuing tasks or adding resources to maintain quality and meet deadlines.',
            relatedEntity: project.name,
          })
        }

        const stalledTasks = tasks.filter((t) => {
          if (t.status !== 'in-progress') return false
          const daysSinceUpdate = t.updatedAt
            ? (now.getTime() - new Date(t.updatedAt).getTime()) /
              (1000 * 60 * 60 * 24)
            : 0
          return daysSinceUpdate > 7
        })
        if (stalledTasks.length > 0) {
          insights.push({
            category: 'progress',
            severity: 'warning',
            title: `Stalled Progress in "${project.name}"`,
            description: `${stalledTasks.length} task${stalledTasks.length === 1 ? '' : 's'} haven't been updated in over a week.`,
            suggestion:
              'Follow up with assignees to unblock progress or identify obstacles.',
            relatedEntity: project.name,
          })
        }

        const completedTasks = tasks.filter((t) => {
          const completedAt = t.updatedAt
          return (
            t.status === 'done' &&
            completedAt &&
            new Date(completedAt) > weekAgo
          )
        })
        const totalTasks = tasks.length
        const completionRate =
          totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0

        if (totalTasks > 5 && completionRate < 20) {
          insights.push({
            category: 'velocity',
            severity: 'info',
            title: `Slow Start in "${project.name}"`,
            description: `Only ${Math.round(completionRate)}% of tasks completed this week.`,
            suggestion:
              'Consider daily standups or sprint reviews to accelerate progress.',
            relatedEntity: project.name,
          })
        }
      }

      const userTasksResult =
        await context.repositories.tasks.findByAssignedToId(context.userId)
      const userTasks = userTasksResult.isOk()
        ? userTasksResult.value || []
        : []

      const myOverdue = userTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done',
      )
      const myDueToday = userTasks.filter((t) => {
        if (!t.dueDate || t.status === 'done') return false
        const dueDate = new Date(t.dueDate)
        const today = new Date()
        return dueDate.toDateString() === today.toDateString()
      })
      const myHighPriority = userTasks.filter(
        (t) =>
          (t.priority === 'high' || t.priority === 'urgent') &&
          t.status !== 'done',
      )

      if (myOverdue.length > 0) {
        insights.push({
          category: 'personal',
          severity: 'critical',
          title: 'You Have Overdue Tasks',
          description: `You have ${myOverdue.length} overdue task${myOverdue.length === 1 ? '' : 's'} that need attention.`,
          suggestion: 'Review overdue items and update statuses or deadlines.',
        })
      }

      if (myDueToday.length > 0) {
        insights.push({
          category: 'personal',
          severity: 'warning',
          title: 'Tasks Due Today',
          description: `You have ${myDueToday.length} task${myDueToday.length === 1 ? '' : 's'} due today.`,
          suggestion: 'Prioritize these tasks to meet your commitments.',
        })
      }

      if (myHighPriority.length > 5) {
        insights.push({
          category: 'personal',
          severity: 'info',
          title: 'High Priority Task Load',
          description: `You have ${myHighPriority.length} high-priority tasks. Consider if any can be delegated.`,
          suggestion:
            'Review your task list and consider requesting help or adjusting priorities.',
        })
      }

      const teamWorkload: {
        name: string
        taskCount: number
        overloaded: boolean
      }[] = []
      for (const member of teamMembers) {
        const memberTasks = await context.repositories.tasks.findByAssignedToId(
          member.userId,
        )
        const count = memberTasks.isOk() ? (memberTasks.value || []).length : 0
        teamWorkload.push({
          name: member.position || member.role,
          taskCount: count,
          overloaded: count > 10,
        })
      }

      const overloadedMembers = teamWorkload.filter((m) => m.overloaded)
      if (overloadedMembers.length > 0) {
        insights.push({
          category: 'team',
          severity: 'warning',
          title: 'Team Member Workload Imbalance',
          description: `${overloadedMembers.length} team member${overloadedMembers.length === 1 ? '' : 's'} have more than 10 active tasks.`,
          suggestion:
            'Consider redistributing tasks to prevent burnout and maintain quality.',
        })
      }

      const riskProjects = projects.filter((p) => {
        const daysToDeadline = p.endDate
          ? (new Date(p.endDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
          : Infinity
        const completionRate = 0.5
        return daysToDeadline < 14 && daysToDeadline > 0 && completionRate < 0.7
      })

      if (riskProjects.length > 0) {
        insights.push({
          category: 'risk',
          severity: 'critical',
          title: 'Projects at Risk',
          description: `${riskProjects.length} project${riskProjects.length === 1 ? '' : 's'} have upcoming deadlines with low completion rates.`,
          suggestion:
            'Review project status, assess blockers, and consider scope reduction or deadline extension.',
          relatedEntity: riskProjects.map((p) => p.name).join(', '),
        })
      }

      const sortedInsights = insights.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })

      const summary = {
        totalInsights: sortedInsights.length,
        bySeverity: {
          critical: sortedInsights.filter((i) => i.severity === 'critical')
            .length,
          warning: sortedInsights.filter((i) => i.severity === 'warning')
            .length,
          info: sortedInsights.filter((i) => i.severity === 'info').length,
        },
        byCategory: {
          deadline: sortedInsights.filter((i) => i.category === 'deadline')
            .length,
          workload: sortedInsights.filter((i) => i.category === 'workload')
            .length,
          progress: sortedInsights.filter((i) => i.category === 'progress')
            .length,
          velocity: sortedInsights.filter((i) => i.category === 'velocity')
            .length,
          personal: sortedInsights.filter((i) => i.category === 'personal')
            .length,
          team: sortedInsights.filter((i) => i.category === 'team').length,
          risk: sortedInsights.filter((i) => i.category === 'risk').length,
        },
      }

      const severityIcons = {
        critical: '🔴',
        warning: '🟡',
        info: '🔵',
      }

      const categoryLabels = {
        deadline: '📅 Deadlines',
        workload: '⚖️ Workload',
        progress: '📈 Progress',
        velocity: '🚀 Velocity',
        personal: '👤 Personal',
        team: '👥 Team',
        risk: '⚠️ Risk',
      }

      const insightsByCategory = sortedInsights.reduce(
        (acc, insight) => {
          if (!acc[insight.category]) {
            acc[insight.category] = []
          }
          acc[insight.category].push(insight)
          return acc
        },
        {} as Record<string, typeof insights>,
      )

      let output = `# AI Insights for "${organization.name}"\n\n`

      output += `## Summary\n`
      output += `- **Total Insights**: ${summary.totalInsights}\n`
      output += `- 🔴 Critical: ${summary.bySeverity.critical}\n`
      output += `- 🟡 Warnings: ${summary.bySeverity.warning}\n`
      output += `- 🔵 Info: ${summary.bySeverity.info}\n\n`

      output += `---\n\n`

      for (const [category, categoryInsights] of Object.entries(
        insightsByCategory,
      )) {
        output += `### ${categoryLabels[category as keyof typeof categoryLabels] || category}\n\n`

        for (const insight of categoryInsights) {
          output += `${severityIcons[insight.severity]} **${insight.title}**\n`
          output += `> ${insight.description}\n\n`
          output += `💡 *${insight.suggestion}*\n\n`
          if (insight.relatedEntity) {
            output += `📌 Related: ${insight.relatedEntity}\n\n`
          }
          output += `---\n\n`
        }
      }

      output += `\n**Tip**: Ask me to help with any of these insights, and I can assist with creating action plans.\n`

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating insights: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      }
    }
  },
})

registerTool({
  name: 'get_proactive_suggestion',
  description:
    'Get a single proactive suggestion based on current context. Useful for surfacing one relevant insight at a time.',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: {
        type: 'string',
        description: 'The organization ID to analyze',
      },
      type: {
        type: 'string',
        enum: ['urgent', 'deadline', 'workload', 'positive'],
        description: 'Type of suggestion to prioritize',
      },
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

    try {
      const hasAccess = await validateOrganizationAccess(
        context.userId,
        args.organizationId,
        context,
      )

      if (!hasAccess) {
        return {
          content: [
            { type: 'text', text: 'Access denied to this organization' },
          ],
          isError: true,
        }
      }

      const projectsResult =
        await context.repositories.projects.findByOrganizationId(
          args.organizationId,
        )
      const projects = projectsResult.isOk() ? projectsResult.value || [] : []

      const urgentItems: {
        type: string
        project: string
        title: string
        urgency: number
      }[] = []

      for (const project of projects) {
        const tasksResult = await context.repositories.tasks.findByProjectId(
          project.id,
        )
        const tasks = tasksResult.isOk() ? tasksResult.value || [] : []

        const overdueTasks = tasks.filter(
          (t) =>
            t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            t.status !== 'done',
        )
        for (const task of overdueTasks) {
          urgentItems.push({
            type: 'deadline',
            project: project.name,
            title: task.title,
            urgency: 100,
          })
        }

        const blockedTasks = tasks.filter(
          (t) => t.priority === 'urgent' && t.status === 'in-progress',
        )
        for (const task of blockedTasks) {
          urgentItems.push({
            type: 'workload',
            project: project.name,
            title: task.title,
            urgency: 80,
          })
        }
      }

      const userTasksResult =
        await context.repositories.tasks.findByAssignedToId(context.userId)
      const userTasks = userTasksResult.isOk()
        ? userTasksResult.value || []
        : []

      for (const task of userTasks) {
        if (task.status === 'in-progress') {
          urgentItems.push({
            type: 'progress',
            project: 'Your Tasks',
            title: task.title,
            urgency: 50,
          })
        }
      }

      urgentItems.sort((a, b) => b.urgency - a.urgency)

      const topItem = urgentItems[0]

      if (topItem) {
        let suggestion = ''
        let action = ''

        if (topItem.type === 'deadline') {
          suggestion = `The task "${topItem.title}" in ${topItem.project} is overdue.`
          action =
            'Would you like me to help you update its status or extend the deadline?'
        } else if (topItem.type === 'workload') {
          suggestion = `You're working on an urgent task "${topItem.title}" in ${topItem.project}.`
          action = 'Is there anything blocking this task that I can help with?'
        } else {
          suggestion = `Consider checking in on "${topItem.title}" in ${topItem.project}.`
          action = 'Would you like me to show you the task details?'
        }

        return {
          content: [
            {
              type: 'text',
              text: `💡 **Proactive Suggestion**\n\n${suggestion}\n\n${action}`,
            },
          ],
        }
      }

      const completedTasks = userTasks.filter((t) => t.status === 'done')
      if (completedTasks.length > 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🎉 **Great progress!** You've completed ${completedTasks.length} tasks recently. Keep up the excellent work!\n\nIs there anything else I can help you with?`,
            },
          ],
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `No urgent items at the moment. Your task list looks healthy!\n\nWould you like me to analyze your projects for optimization opportunities?`,
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating suggestion: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      }
    }
  },
})
