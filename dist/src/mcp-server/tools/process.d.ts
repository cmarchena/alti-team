export interface ProcessExecution {
    id: string;
    processId: string;
    status: string;
    currentStep: number;
    context: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
