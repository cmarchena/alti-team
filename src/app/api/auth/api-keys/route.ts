import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateAPIKey, listAPIKeys, revokeAPIKey } from '@/mcp-server/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keys = listAPIKeys(session.user.id)
  return NextResponse.json({ keys })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, expiresInDays } = await request.json()

  if (!name || typeof name !== 'string') {
    return NextResponse.json(
      { error: 'API key name is required' },
      { status: 400 },
    )
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined

  const apiKey = generateAPIKey(session.user.id, name, expiresAt)

  return NextResponse.json({
    apiKey,
    message: 'API key generated successfully. Save this key securely.',
  })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { apiKey } = await request.json()

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 })
  }

  const revoked = revokeAPIKey(apiKey)

  if (!revoked) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  }

  return NextResponse.json({ message: 'API key revoked successfully' })
}
