import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

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

      if (projectResult.isErr() || !projectResult.value) {
        return {
          content: [{ type: 'text', text: 'Project not found' }],
          isError: true,
        }
      }

      const project = projectResult.value

      const orgAccessResult = await validateOrganizationAccess(
        context.userId,
        project.organizationId,
        context,
      )

      if (orgAccessResult.isErr()) {
        return {
          content: [{ type: 'text', text: 'Access denied to this project' }],
          isError: true,
        }
      }

      const tasksResult = await context.repositories.tasks.findByProjectId(
        args.projectId,
      )

      if (tasksResult.isErr()) {
        return {
          content: [{ type: 'text', text: 'Failed to fetch tasks' }],
          isError: true,
        }
      }

      const tasks = tasksResult.value || []
      const pendingTasks = tasks.filter((t) => t.status !== 'done')
      const teamMembersResult =
        await context.repositories.teamMembers.findByProjectId(args.projectId)
      const teamMembers = teamMembersResult.isOk()
        ? teamMembersResult.value || []
        : []

      const maxHoursPerDay = args.constraints?.maxHoursPerDay || 8
      const priorityTasks = args.constraints?.priorityTasks || []

      const suggestions: any[] = []

      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const sortedByPriority = pendingTasks.sort((a, b) => {
        const aPriority = priorityTasks.includes(a.id)
          ? -1
          : (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2)
        const bPriority = priorityTasks.includes(b.id)
          ? -1
          : (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2)
        return aPriority - bPriority
      })

      const assigneeWorkload = new Map<string, number>()
      for (const task of sortedByPriority) {
        if (task.assignedToId) {
          const current = assigneeWorkload.get(task.assignedToId) || 0
          assigneeWorkload.set(task.assignedToId, current + 4)
        }
      }

      let dayOffset = 0
      for (const task of sortedByPriority) {
        let suggestedAssignee: string | null = null
        let minLoad = Infinity

        for (const member of teamMembers) {
          const load = assigneeWorkload.get(member.userId) || 0
          if (load < minLoad) {
            minLoad = load
            suggestedAssignee = member.userId
          }
        }

        if (task.assignedToId) {
          suggestedAssignee = task.assignedToId
        }

        const estimatedHours = 4
        const daysNeeded = Math.ceil(estimatedHours / maxHoursPerDay)

        const startDate = new Date()
        startDate.setDate(startDate.getDate() + dayOffset)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + daysNeeded)

        const hasDeadline = task.dueDate && new Date(task.dueDate) < endDate
        const deadlineWarning = hasDeadline
          ? ' ⚠️ Task deadline may be at risk - consider starting earlier'
          : ''

        const memberName =
          teamMembers.find((m) => m.userId === suggestedAssignee)?.position ||
          'unassigned'
        const reasoning =
          task.priority === 'urgent'
            ? 'Urgent priority - scheduled immediately'
            : task.priority === 'high'
              ? 'High priority - scheduled after urgent tasks'
              : `Balanced workload - ${memberName} has lowest current load`

        suggestions.push({
          taskId: task.id,
          title: task.title,
          suggestedAssignee,
          suggestedStartDate: startDate.toISOString().split('T')[0],
          suggestedEndDate: endDate.toISOString().split('T')[0],
          priority: task.priority,
          reasoning: reasoning + deadlineWarning,
          estimatedHours,
        })

        if (suggestedAssignee) {
          const current = assigneeWorkload.get(suggestedAssignee) || 0
          assigneeWorkload.set(suggestedAssignee, current + estimatedHours)
        }

        if (task.priority === 'urgent' || task.priority === 'high') {
          dayOffset += Math.ceil(daysNeeded / teamMembers.length) || 1
        }
      }

      const teamCapacity = teamMembers.length * maxHoursPerDay * 7
      const totalEstimatedHours = suggestions.reduce(
        (sum, s) => sum + s.estimatedHours,
        0,
      )
      const projectedWeeks = Math.ceil(totalEstimatedHours / teamCapacity) || 1

      const output = {
        project: project.name,
        scheduleSuggestions: suggestions,
        summary: {
          totalTasks: suggestions.length,
          estimatedHours: totalEstimatedHours,
          projectedWeeks,
          teamCapacity: teamCapacity,
          recommendation:
            suggestions.length > teamMembers.length
              ? 'Consider breaking high-effort tasks into smaller subtasks'
              : 'Schedule appears balanced across team',
        },
      }

      return {
        content: [
          {
            type: 'text',
            text:
              `# Schedule Suggestions for "${output.project}"\n\n` +
              `## Summary\n` +
              `- **Total Tasks**: ${output.summary.totalTasks}\n` +
              `- **Estimated Hours**: ${output.summary.estimatedHours}h\n` +
              `- **Projected Duration**: ${output.summary.projectedWeeks} week(s)\n` +
              `- **Recommendation**: ${output.summary.recommendation}\n\n` +
              `## Schedule\n\n` +
              suggestions
                .map(
                  (s, i) =>
                    `${i + 1}. **${s.title}**\n` +
                    `   - Priority: ${s.priority}\n` +
                    `   - Assignee: ${teamMembers.find((m) => m.userId === s.suggestedAssignee)?.position || 'Unassigned'}\n` +
                    `   - Start: ${s.suggestedStartDate}\n` +
                    `   - End: ${s.suggestedEndDate}\n` +
                    `   - Est. Hours: ${s.estimatedHours}h\n` +
                    `   - Reasoning: ${s.reasoning}`,
                )
                .join('\n\n'),
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating schedule suggestions: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      }
    }
  },
})

registerTool({
  name: 'optimize_team_workload',
  description:
    'Optimize task distribution across team members to balance workload and meet deadlines',
  inputSchema: {
    type: 'object',
    properties: {
      teamId: {
        type: 'string',
        description: 'The team ID to optimize workload for',
      },
      period: {
        type: 'string',
        enum: ['week', 'sprint', 'month'],
        description: 'The time period to optimize for',
      },
      optimizeFor: {
        type: 'string',
        enum: ['deadlines', 'balance', 'efficiency'],
        description: 'What to prioritize in optimization',
      },
    },
    required: ['teamId', 'period'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    try {
      const teamResult = await context.repositories.teams.findById(args.teamId)

      if (teamResult.isErr() || !teamResult.value) {
        return {
          content: [{ type: 'text', text: 'Team not found' }],
          isError: true,
        }
      }

      const team = teamResult.value

      const orgAccessResult = await validateOrganizationAccess(
        context.userId,
        team.organizationId,
        context,
      )

      if (orgAccessResult.isErr()) {
        return {
          content: [{ type: 'text', text: 'Access denied to this team' }],
          isError: true,
        }
      }

      const teamMembersResult =
        await context.repositories.teamMembers.findByOrganizationId(
          team.organizationId,
        )
      const teamMembers = teamMembersResult.isOk()
        ? teamMembersResult.value?.filter(
            (m) => m.role === 'member' || m.role === 'lead',
          ) || []
        : []

      const teamUserIds = teamMembers.map((m) => m.userId)

      const allTasksResult =
        await context.repositories.tasks.findByAssignedToId('')
      const allTasks = allTasksResult.isOk() ? allTasksResult.value || [] : []

      const periodDays = { week: 7, sprint: 14, month: 30 }
      const days = periodDays[args.period as keyof typeof periodDays]
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + days)

      const relevantTasks = allTasks.filter((task) => {
        const assigned =
          task.assignedToId && teamUserIds.includes(task.assignedToId)
        const inPeriod = task.dueDate && new Date(task.dueDate) <= periodEnd
        return assigned && inPeriod && task.status !== 'done'
      })

      const memberWorkloads: any[] = []

      for (const member of teamMembers) {
        const memberTasks = relevantTasks.filter(
          (t) => t.assignedToId === member.userId,
        )
        const totalHours = memberTasks.reduce((sum, t) => sum + 4, 0)

        memberWorkloads.push({
          memberId: member.userId,
          name: member.position || member.role,
          currentHours: totalHours,
          taskCount: memberTasks.length,
          tasks: memberTasks.map((t) => ({
            id: t.id,
            title: t.title,
            hours: 4,
            dueDate: t.dueDate?.toString() || 'No deadline',
          })),
        })
      }

      const totalHours = memberWorkloads.reduce(
        (sum, m) => sum + m.currentHours,
        0,
      )
      const targetHours = totalHours / memberWorkloads.length || 0
      const maxAllowed = targetHours * 1.2
      const overloaded = memberWorkloads.filter(
        (m) => m.currentHours > maxAllowed,
      )
      const underloaded = memberWorkloads.filter(
        (m) => m.currentHours < targetHours * 0.8,
      )

      const suggestions: any[] = []

      if (
        overloaded.length > 0 &&
        underloaded.length > 0 &&
        args.optimizeFor !== 'efficiency'
      ) {
        const sortedOverloaded = [...overloaded].sort(
          (a, b) => b.currentHours - a.currentHours,
        )
        const sortedUnderloaded = [...underloaded].sort(
          (a, b) => a.currentHours - b.currentHours,
        )

        for (const overloadedMember of sortedOverloaded) {
          for (const task of overloadedMember.tasks) {
            if (overloadedMember.currentHours - task.hours >= targetHours) {
              const underloadedMember = sortedUnderloaded.find(
                (m) => m.memberId !== overloadedMember.memberId,
              )
              if (underloadedMember) {
                suggestions.push({
                  fromMember: overloadedMember.name,
                  toMember: underloadedMember.name,
                  taskId: task.id,
                  taskTitle: task.title,
                  reason: 'Rebalance workload to meet deadlines',
                })

                overloadedMember.currentHours -= task.hours
                underloadedMember.currentHours += task.hours
                underloadedMember.tasks.push(task)
                overloadedMember.tasks = overloadedMember.tasks.filter(
                  (t: any) => t.id !== task.id,
                )

                if (
                  overloadedMember.currentHours <= maxAllowed ||
                  suggestions.length >= 3
                )
                  break
              }
            }
          }
          if (suggestions.length >= 3) break
        }
      }

      const bottlenecks = relevantTasks
        .filter((t) => {
          const daysUntilDue = Math.ceil(
            (new Date(t.dueDate!).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
          return daysUntilDue < 1 || (daysUntilDue < 2 && 4 > 8)
        })
        .map((t) => ({
          taskId: t.id,
          title: t.title,
          dueDate: t.dueDate?.toString(),
          assignee:
            teamMembers.find((m) => m.userId === t.assignedToId)?.position ||
            'Unknown',
        }))

      const output = {
        team: team.name,
        period: args.period,
        workloads: memberWorkloads.map((m: any) => ({
          member: m.name,
          hours: m.currentHours,
          tasks: m.taskCount,
          status:
            m.currentHours > maxAllowed
              ? 'Overloaded'
              : m.currentHours < targetHours * 0.5
                ? 'Underutilized'
                : 'Balanced',
        })),
        optimization: {
          totalHours,
          targetPerMember: Math.round(targetHours * 10) / 10,
          overloaded: overloaded.map((m: any) => m.name),
          underloaded: underloaded.map((m: any) => m.name),
          suggestions,
        },
        risks: {
          bottlenecks,
          recommendation:
            bottlenecks.length > 0
              ? 'Consider reassigning bottleneck tasks or extending deadlines'
              : 'No immediate risks detected',
        },
      }

      const workloadsTable = output.workloads
        .map(
          (w: any) =>
            `| ${w.member} | ${w.hours}h | ${w.tasks} tasks | ${w.status} |`,
        )
        .join('\n')

      return {
        content: [
          {
            type: 'text',
            text:
              `# Team Workload Analysis: "${output.team}"\n` +
              `**Period**: ${output.period}\n\n` +
              `## Current Workloads\n\n` +
              `| Member | Hours | Tasks | Status |\n` +
              `|--------|-------|-------|--------|\n` +
              `${workloadsTable}\n\n` +
              `## Optimization\n\n` +
              `- **Total Hours**: ${output.optimization.totalHours}h\n` +
              `- **Target per Member**: ${output.optimization.targetPerMember}h\n` +
              `- **Overloaded**: ${output.optimization.overloaded.join(', ') || 'None'}\n` +
              `- **Underutilized**: ${output.optimization.underloaded.join(', ') || 'None'}\n\n` +
              `### Suggestions\n\n` +
              (suggestions.length > 0
                ? suggestions
                    .map(
                      (s: any) =>
                        `- Move "${s.taskTitle}" from ${s.fromMember} → ${s.toMember}\n  Reason: ${s.reason}`,
                    )
                    .join('\n\n')
                : '- No rebalancing suggestions at this time\n\n') +
              `## Risks & Recommendations\n\n` +
              `- **Bottlenecks**: ${bottlenecks.length} tasks at risk\n` +
              `- **Recommendation**: ${output.risks.recommendation}\n\n` +
              (bottlenecks.length > 0
                ? `### Critical Tasks\n\n` +
                  bottlenecks
                    .map(
                      (b: any) =>
                        `- "${b.title}" (Due: ${b.dueDate}, Assigned: ${b.assignee})`,
                    )
                    .join('\n')
                : ''),
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error optimizing workload: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      }
    }
  },
})
