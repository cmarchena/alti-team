import { NextResponse } from "next/server";
export declare function GET(request: Request): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    results: Record<string, unknown[]>;
}>>;
