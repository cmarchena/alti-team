import { NextResponse } from "next/server";
export declare function GET(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    user: {
        id: any;
        name: any;
        email: any;
        createdAt: any;
    };
}>>;
export declare function PATCH(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    message: string;
    user: {
        id: any;
        name: any;
        email: any;
    };
}>>;
