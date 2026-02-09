export type WorkflowStatus = 'pending' | 'collecting' | 'confirming' | 'executing' | 'completed' | 'cancelled';
export type WorkflowStep = 'init' | 'collect_name' | 'collect_description' | 'collect_assignee' | 'collect_date' | 'collect_confirmation' | 'executing' | 'complete';
export interface WorkflowData {
    entityType?: 'project' | 'task' | 'team' | 'organization' | 'department';
    action?: 'create' | 'update' | 'delete';
    stepData: Record<string, unknown>;
    suggestedValues?: Record<string, unknown>;
}
export interface WorkflowState {
    id: string;
    status: WorkflowStatus;
    currentStep: WorkflowStep;
    entityType: string;
    action: string;
    data: WorkflowData;
    startedAt: Date;
    lastUpdatedAt: Date;
    confirmationMessage?: string;
}
export interface WorkflowAction {
    type: 'collect' | 'confirm' | 'execute' | 'cancel' | 'complete' | 'update_data';
    payload?: Record<string, unknown>;
}
export declare function createWorkflowState(id: string, entityType: string, action: string): WorkflowState;
export declare function getWorkflowSteps(entityType: string): WorkflowStep[];
export declare function getNextStep(currentStep: WorkflowStep, entityType: string): WorkflowStep;
export declare function getStepLabel(step: WorkflowStep): string;
export declare function getStepPrompt(step: WorkflowStep, entityType: string): string;
export declare function isConfirmationStep(step: WorkflowStep): boolean;
export declare function isCollectingStep(step: WorkflowStep): boolean;
export declare function formatWorkflowState(state: WorkflowState): string;
export declare function mergeWorkflowData(currentData: Record<string, unknown>, newData: Record<string, unknown>): Record<string, unknown>;
export declare function shouldPromptForField(step: WorkflowStep, entityType: string, data: Record<string, unknown>): boolean;
