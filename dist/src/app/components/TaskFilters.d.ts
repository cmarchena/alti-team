interface TaskFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    teamMembers?: Array<{
        id: string;
        user: {
            id: string;
            name: string | null;
            email: string;
        };
    }>;
}
export interface FilterState {
    status: string[];
    priority: string[];
    assignee: string;
    dueDateFrom: string;
    dueDateTo: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    searchQuery: string;
}
export default function TaskFilters({ onFilterChange, teamMembers }: TaskFiltersProps): import("react").JSX.Element;
export declare function filterTasks<T extends {
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate?: string | null;
    assignedTo?: {
        id: string;
    } | null;
}>(tasks: T[], filters: FilterState): T[];
export declare function sortTasks<T extends {
    title: string;
    createdAt: string;
    updatedAt?: string;
    dueDate?: string | null;
    priority: string;
}>(tasks: T[], filters: FilterState): T[];
export {};
