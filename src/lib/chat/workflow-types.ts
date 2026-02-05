export type WorkflowStatus =
  | 'pending'
  | 'collecting'
  | 'confirming'
  | 'executing'
  | 'completed'
  | 'cancelled'

export type WorkflowStep =
  | 'init'
  | 'collect_name'
  | 'collect_description'
  | 'collect_assignee'
  | 'collect_date'
  | 'collect_confirmation'
  | 'executing'
  | 'complete'

export interface WorkflowData {
  entityType?: 'project' | 'task' | 'team' | 'organization' | 'department'
  action?: 'create' | 'update' | 'delete'
  stepData: Record<string, unknown>
  suggestedValues?: Record<string, unknown>
}

export interface WorkflowState {
  id: string
  status: WorkflowStatus
  currentStep: WorkflowStep
  entityType: string
  action: string
  data: WorkflowData
  startedAt: Date
  lastUpdatedAt: Date
  confirmationMessage?: string
}

export interface WorkflowAction {
  type:
    | 'collect'
    | 'confirm'
    | 'execute'
    | 'cancel'
    | 'complete'
    | 'update_data'
  payload?: Record<string, unknown>
}

const WORKFLOW_STEPS: Record<string, WorkflowStep[]> = {
  project: [
    'init',
    'collect_name',
    'collect_description',
    'collect_confirmation',
    'executing',
    'complete',
  ],
  task: [
    'init',
    'collect_name',
    'collect_description',
    'collect_assignee',
    'collect_date',
    'collect_confirmation',
    'executing',
    'complete',
  ],
  team: [
    'init',
    'collect_name',
    'collect_description',
    'collect_confirmation',
    'executing',
    'complete',
  ],
  organization: [
    'init',
    'collect_name',
    'collect_description',
    'collect_confirmation',
    'executing',
    'complete',
  ],
  department: [
    'init',
    'collect_name',
    'collect_description',
    'collect_confirmation',
    'executing',
    'complete',
  ],
}

export function createWorkflowState(
  id: string,
  entityType: string,
  action: string,
): WorkflowState {
  return {
    id,
    status: 'collecting',
    currentStep: 'init',
    entityType,
    action,
    data: { stepData: {} },
    startedAt: new Date(),
    lastUpdatedAt: new Date(),
  }
}

export function getWorkflowSteps(entityType: string): WorkflowStep[] {
  return WORKFLOW_STEPS[entityType] || WORKFLOW_STEPS.project
}

export function getNextStep(
  currentStep: WorkflowStep,
  entityType: string,
): WorkflowStep {
  const steps = getWorkflowSteps(entityType)
  const currentIndex = steps.indexOf(currentStep)
  if (currentIndex === -1 || currentIndex >= steps.length - 1) {
    return currentStep
  }
  return steps[currentIndex + 1]
}

export function getStepLabel(step: WorkflowStep): string {
  const labels: Record<WorkflowStep, string> = {
    init: 'Initialize',
    collect_name: 'Enter name',
    collect_description: 'Enter description',
    collect_assignee: 'Select assignee',
    collect_date: 'Set due date',
    collect_confirmation: 'Confirm',
    executing: 'Executing',
    complete: 'Complete',
  }
  return labels[step] || step
}

export function getStepPrompt(step: WorkflowStep, entityType: string): string {
  const prompts: Record<WorkflowStep, string> = {
    init: `Let me help you create a new ${entityType}. I'll need a few details.`,
    collect_name: `What would you like to name this ${entityType}?`,
    collect_description: `Please provide a description for this ${entityType}.`,
    collect_assignee: `Who should be assigned to this task?`,
    collect_date: `When is this task due?`,
    collect_confirmation: `I've collected all the information. Would you like me to proceed with creating this ${entityType}?`,
    executing: `Creating the ${entityType}...`,
    complete: `I've completed the operation.`,
  }
  return prompts[step] || step
}

export function isConfirmationStep(step: WorkflowStep): boolean {
  return step === 'collect_confirmation'
}

export function isCollectingStep(step: WorkflowStep): boolean {
  return (
    step !== 'init' &&
    step !== 'collect_confirmation' &&
    step !== 'executing' &&
    step !== 'complete'
  )
}

export function formatWorkflowState(state: WorkflowState): string {
  const lines = [
    `**Workflow Status**: ${state.status}`,
    `**Step**: ${getStepLabel(state.currentStep)}`,
    `**Entity**: ${state.entityType}`,
    `**Action**: ${state.action}`,
  ]

  if (Object.keys(state.data.stepData).length > 0) {
    lines.push(
      `**Collected Data**: ${JSON.stringify(state.data.stepData, null, 2)}`,
    )
  }

  return lines.join('\n')
}

export function mergeWorkflowData(
  currentData: Record<string, unknown>,
  newData: Record<string, unknown>,
): Record<string, unknown> {
  return { ...currentData, ...newData }
}

export function shouldPromptForField(
  step: WorkflowStep,
  entityType: string,
  data: Record<string, unknown>,
): boolean {
  switch (step) {
    case 'collect_name':
      return !data.name
    case 'collect_description':
      return !data.description
    case 'collect_assignee':
      if (entityType !== 'task') return false
      return !data.assigneeId
    case 'collect_date':
      if (entityType !== 'task') return false
      return !data.dueDate
    default:
      return false
  }
}
