"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkflowState = createWorkflowState;
exports.getWorkflowSteps = getWorkflowSteps;
exports.getNextStep = getNextStep;
exports.getStepLabel = getStepLabel;
exports.getStepPrompt = getStepPrompt;
exports.isConfirmationStep = isConfirmationStep;
exports.isCollectingStep = isCollectingStep;
exports.formatWorkflowState = formatWorkflowState;
exports.mergeWorkflowData = mergeWorkflowData;
exports.shouldPromptForField = shouldPromptForField;
const WORKFLOW_STEPS = {
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
};
function createWorkflowState(id, entityType, action) {
    return {
        id,
        status: 'collecting',
        currentStep: 'init',
        entityType,
        action,
        data: { stepData: {} },
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
    };
}
function getWorkflowSteps(entityType) {
    return WORKFLOW_STEPS[entityType] || WORKFLOW_STEPS.project;
}
function getNextStep(currentStep, entityType) {
    const steps = getWorkflowSteps(entityType);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex === -1 || currentIndex >= steps.length - 1) {
        return currentStep;
    }
    return steps[currentIndex + 1];
}
function getStepLabel(step) {
    const labels = {
        init: 'Initialize',
        collect_name: 'Enter name',
        collect_description: 'Enter description',
        collect_assignee: 'Select assignee',
        collect_date: 'Set due date',
        collect_confirmation: 'Confirm',
        executing: 'Executing',
        complete: 'Complete',
    };
    return labels[step] || step;
}
function getStepPrompt(step, entityType) {
    const prompts = {
        init: `Let me help you create a new ${entityType}. I'll need a few details.`,
        collect_name: `What would you like to name this ${entityType}?`,
        collect_description: `Please provide a description for this ${entityType}.`,
        collect_assignee: `Who should be assigned to this task?`,
        collect_date: `When is this task due?`,
        collect_confirmation: `I've collected all the information. Would you like me to proceed with creating this ${entityType}?`,
        executing: `Creating the ${entityType}...`,
        complete: `I've completed the operation.`,
    };
    return prompts[step] || step;
}
function isConfirmationStep(step) {
    return step === 'collect_confirmation';
}
function isCollectingStep(step) {
    return (step !== 'init' &&
        step !== 'collect_confirmation' &&
        step !== 'executing' &&
        step !== 'complete');
}
function formatWorkflowState(state) {
    const lines = [
        `**Workflow Status**: ${state.status}`,
        `**Step**: ${getStepLabel(state.currentStep)}`,
        `**Entity**: ${state.entityType}`,
        `**Action**: ${state.action}`,
    ];
    if (Object.keys(state.data.stepData).length > 0) {
        lines.push(`**Collected Data**: ${JSON.stringify(state.data.stepData, null, 2)}`);
    }
    return lines.join('\n');
}
function mergeWorkflowData(currentData, newData) {
    return { ...currentData, ...newData };
}
function shouldPromptForField(step, entityType, data) {
    switch (step) {
        case 'collect_name':
            return !data.name;
        case 'collect_description':
            return !data.description;
        case 'collect_assignee':
            if (entityType !== 'task')
                return false;
            return !data.assigneeId;
        case 'collect_date':
            if (entityType !== 'task')
                return false;
            return !data.dueDate;
        default:
            return false;
    }
}
