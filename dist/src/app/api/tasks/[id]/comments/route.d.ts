import { NextResponse } from "next/server";
export declare function GET(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    comments: any;
}>>;
export declare function POST(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    message: string;
    comment: any;
}>>;
