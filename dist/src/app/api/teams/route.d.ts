import { NextResponse } from "next/server";
export declare function GET(request: Request): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    teamMembers: any;
    organizations: any;
}>>;
export declare function PATCH(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    message: string;
    member: any;
}>>;
export declare function DELETE(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    message: string;
}>>;
