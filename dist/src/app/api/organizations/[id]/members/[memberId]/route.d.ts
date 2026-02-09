import { NextResponse } from "next/server";
export declare function GET(request: Request, { params }: {
    params: Promise<{
        id: string;
        memberId: string;
    }>;
}): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    member: any;
}>>;
export declare function PATCH(request: Request, { params }: {
    params: Promise<{
        id: string;
        memberId: string;
    }>;
}): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    member: any;
}>>;
export declare function DELETE(request: Request, { params }: {
    params: Promise<{
        id: string;
        memberId: string;
    }>;
}): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    message: string;
}>>;
