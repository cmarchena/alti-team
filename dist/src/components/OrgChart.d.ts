interface DepartmentChild {
    id: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
}
interface Department {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    parent?: {
        id: string;
        name: string;
    } | null;
    children?: DepartmentChild[];
    _count?: {
        teamMembers: number;
        processes: number;
    };
}
interface OrgChartProps {
    departments: Department[];
    onEdit: (department: Department) => void;
    onAddSub: (parentId: string) => void;
    onDelete: (department: Department) => void;
}
export default function OrgChart({ departments, onEdit, onAddSub, onDelete, }: OrgChartProps): import("react").JSX.Element;
export {};
