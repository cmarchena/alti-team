import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

// Process Execution interface
export interface ProcessExecution {
  id: string
  processId: string
  status: string
  currentStep: number
  context: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// Create Process Tool
const createProcessTool = {
  name: 'create_process',
  description: 'Create a new process',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Organization ID' },
      name: { type: 'string', description: 'Process name' },
      description: { type: 'string', description: 'Process description' },
      steps: {
        type: 'array',
        description: 'Array of step objects',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Step name' },
            description: { type: 'string', description: 'Step description' },
            handler: { type: 'string', description: 'Handler function/identifier' },
            inputs: { type: 'object', description: 'Required inputs for this step' },
          },
          required: ['name'],
        },
      },
      departmentId: { type: 'string', description: 'Department ID (optional)' },
    },
    required: ['organizationId', 'name', 'steps'],
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

    // Convert steps to JSON string for storage
    const stepsString = JSON.stringify(args.steps)

    const result = await context.repositories.processes.create({
      name: args.name,
      description: args.description || '',
      steps: stepsString,
      organizationId: args.organizationId,
      departmentId: args.departmentId || '',
      createdById: context.userId,
    })

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const process = result.value
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: process.id,
            name: process.name,
            description: process.description,
            organizationId: process.organizationId,
            departmentId: process.departmentId,
            createdAt: process.createdAt,
            steps: JSON.parse(process.steps),
          }, null, 2),
        },
      ],
    }
  },
}

// Get Process Tool
const getProcessTool = {
  name: 'get_process',
  description: 'Get process details',
  inputSchema: {
    type: 'object',
    properties: {
      processId: { type: 'string', description: 'Process ID' },
    },
    required: ['processId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const result = await context.repositories.processes.findById(args.processId)

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const process = result.value
    if (!process) {
      return {
        content: [{ type: 'text', text: 'Process not found' }],
        isError: true,
      }
    }

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, process.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: process.id,
            name: process.name,
            description: process.description,
            organizationId: process.organizationId,
            departmentId: process.departmentId,
            createdById: process.createdById,
            createdAt: process.createdAt,
            updatedAt: process.updatedAt,
            steps: JSON.parse(process.steps),
          }, null, 2),
        },
      ],
    }
  },
}

// List Processes Tool
const listProcessesTool = {
  name: 'list_processes',
  description: 'List processes in organization',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Organization ID' },
      departmentId: { type: 'string', description: 'Filter by department ID (optional)' },
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

    let processesResult
    if (args.departmentId) {
      processesResult = await context.repositories.processes.findByDepartmentId(args.departmentId)
    } else {
      processesResult = await context.repositories.processes.findByOrganizationId(args.organizationId)
    }

    if (processesResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${processesResult.error.message}` }],
        isError: true,
      }
    }

    const processes = processesResult.value
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(processes.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            organizationId: p.organizationId,
            departmentId: p.departmentId,
            createdAt: p.createdAt,
            steps: JSON.parse(p.steps),
          })), null, 2),
        },
      ],
    }
  },
}

// Start Process Execution Tool
const startProcessExecutionTool = {
  name: 'start_process',
  description: 'Start a process execution',
  inputSchema: {
    type: 'object',
    properties: {
      processId: { type: 'string', description: 'Process ID' },
      context: { type: 'object', description: 'Process execution context variables' },
    },
    required: ['processId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get the process
    const processResult = await context.repositories.processes.findById(args.processId)
    if (processResult.isErr() || !processResult.value) {
      return {
        content: [{ type: 'text', text: 'Process not found' }],
        isError: true,
      }
    }

    const process = processResult.value

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, process.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    // Create execution
    const executionId = generateId()
    const execution: ProcessExecution = {
      id: executionId,
      processId: args.processId,
      status: 'started',
      currentStep: 0,
      context: args.context || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Note: In a real implementation, we would store this in a database
    // For now, we'll return the execution information
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            executionId: execution.id,
            processId: execution.processId,
            status: execution.status,
            currentStep: execution.currentStep,
            context: execution.context,
            createdAt: execution.createdAt,
            message: 'Process execution started successfully',
          }, null, 2),
        },
      ],
    }
  },
}

// Get Process Execution Tool
const getProcessExecutionTool = {
  name: 'get_process_execution',
  description: 'Get process execution status',
  inputSchema: {
    type: 'object',
    properties: {
      executionId: { type: 'string', description: 'Execution ID' },
    },
    required: ['executionId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Note: In a real implementation, we would retrieve the execution from storage
    // For this example, we'll simulate a response
    const execution: ProcessExecution = {
      id: args.executionId,
      processId: 'process-' + args.executionId.split('-')[1],
      status: 'in-progress',
      currentStep: 1,
      context: { example: 'value' },
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      updatedAt: new Date(),
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: execution.id,
            processId: execution.processId,
            status: execution.status,
            currentStep: execution.currentStep,
            context: execution.context,
            createdAt: execution.createdAt,
            updatedAt: execution.updatedAt,
            completedAt: execution.completedAt,
          }, null, 2),
        },
      ],
    }
  },
}

// Complete Process Step Tool
const completeProcessStepTool = {
  name: 'complete_process_step',
  description: 'Mark a process step as complete',
  inputSchema: {
    type: 'object',
    properties: {
      executionId: { type: 'string', description: 'Execution ID' },
      stepId: { type: 'string', description: 'Step ID or index' },
      output: { type: 'object', description: 'Step output data' },
    },
    required: ['executionId', 'stepId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Note: In a real implementation, we would update the execution in storage
    // For this example, we'll simulate a successful completion
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Step ${args.stepId} marked as complete`,
            executionId: args.executionId,
            stepId: args.stepId,
            output: args.output || {},
          }, null, 2),
        },
      ],
    }
  },
}

// Get Process Analytics Tool
const getProcessAnalyticsTool = {
  name: 'get_process_analytics',
  description: 'Get analytics for a process',
  inputSchema: {
    type: 'object',
    properties: {
      processId: { type: 'string', description: 'Process ID' },
      period: { type: 'string', description: 'Time period (optional)', enum: ['week', 'month', 'quarter'] },
    },
    required: ['processId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get the process
    const processResult = await context.repositories.processes.findById(args.processId)
    if (processResult.isErr() || !processResult.value) {
      return {
        content: [{ type: 'text', text: 'Process not found' }],
        isError: true,
      }
    }

    const process = processResult.value

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, process.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    // Note: In a real implementation, we would calculate actual analytics
    // For this example, we'll return simulated data
    const period = args.period || 'month'
    const analytics = {
      totalExecutions: 42,
      averageCompletionTime: '3.5 days',
      successRate: '87.5%',
      bottleneckSteps: ['step-2', 'step-4'],
      recentActivity: {
        week: { executions: 5, averageTime: '2.8 days' },
        month: { executions: 18, averageTime: '3.2 days' },
        quarter: { executions: 42, averageTime: '3.5 days' },
      },
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            processId: args.processId,
            period: period,
            analytics: analytics[period] || analytics.month,
            overall: {
              totalExecutions: analytics.totalExecutions,
              averageCompletionTime: analytics.averageCompletionTime,
              successRate: analytics.successRate,
              bottleneckSteps: analytics.bottleneckSteps,
            },
          }, null, 2),
        },
      ],
    }
  },
}

// Helper function to generate IDs (simplified for this example)
function generateId(): string {
  return 'proc-' + Math.random().toString(36).substr(2, 9)
}

// Register tools
registerTool(createProcessTool)
registerTool(getProcessTool)
registerTool(listProcessesTool)
registerTool(startProcessExecutionTool)
registerTool(getProcessExecutionTool)
registerTool(completeProcessStepTool)
registerTool(getProcessAnalyticsTool)