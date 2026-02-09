import { NextResponse } from "next/server";
export declare function POST(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    message: string;
    organizationId: any;
}>>;
