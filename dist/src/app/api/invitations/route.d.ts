import { NextResponse } from "next/server";
export declare function GET(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    invitations: any;
}>>;
export declare function POST(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    message: string;
    invitation: any;
}>>;
