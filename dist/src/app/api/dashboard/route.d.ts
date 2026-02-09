import { NextResponse } from 'next/server';
export declare function GET(): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    metrics: {
        totalProjects: number;
        totalTasks: number;
        teamMembers: any;
        pendingInvitations: any;
        projectsByStatus: Record<string, number>;
        tasksByStatus: Record<string, number>;
    };
    recentProjects: any[];
    recentTasks: any[];
    organizations: {
        id: string;
        name: string;
    }[];
}>>;
