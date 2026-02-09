import { NextResponse } from "next/server";
export declare function GET(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    processes: any;
}>>;
export declare function POST(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    message: string;
    process: any;
}>>;
