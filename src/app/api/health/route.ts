import { NextResponse } from 'next/server'

export async function GET() {
  const status = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  }
  return NextResponse.json(status, { status: 200 })
}
