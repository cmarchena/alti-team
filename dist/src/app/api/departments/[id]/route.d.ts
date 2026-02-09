import { NextResponse } from "next/server";
export declare function GET(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    department: any;
}>>;
export declare function PATCH(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    department: any;
}>>;
export declare function DELETE(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    message: string;
}>>;
