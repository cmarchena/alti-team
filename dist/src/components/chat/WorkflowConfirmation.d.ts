interface WorkflowData {
    name?: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    [key: string]: unknown;
}
interface WorkflowConfirmationProps {
    entityType: string;
    data: WorkflowData;
    onConfirm: () => void;
    onCancel: () => void;
    onBack: () => void;
    isLoading?: boolean;
}
export default function WorkflowConfirmation({ entityType, data, onConfirm, onCancel, onBack, isLoading, }: WorkflowConfirmationProps): import("react").JSX.Element;
export {};
