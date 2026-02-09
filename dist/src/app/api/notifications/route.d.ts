import { NextResponse } from "next/server";
export declare function GET(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    notifications: any;
    unreadCount: any;
}>>;
export declare function PATCH(request: Request): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    message: string;
}>>;
export declare function POST(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    notification: any;
}>>;
export declare function DELETE(request: Request): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    message: string;
}>>;
