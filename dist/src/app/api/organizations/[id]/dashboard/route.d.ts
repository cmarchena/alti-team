import { NextResponse } from "next/server";
export declare function GET(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    stats: {
        total: number;
        completed: number;
        pending: number;
        inProgress: number;
        totalProjects: any;
        totalMembers: any;
    };
    projects: any;
    recentMembers: any;
}>>;
