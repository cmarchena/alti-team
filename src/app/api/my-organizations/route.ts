import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrganizationRepository } from '@/lib/repositories'
import { isSuccess } from '@/lib/result'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgRepo = getOrganizationRepository()
    const orgsResult = await orgRepo.findByOwnerId(session.user.id)

    if (!isSuccess(orgsResult)) {
      return NextResponse.json({ organizations: [] })
    }

    const organizations = orgsResult.data.map((org) => ({
      id: org.id,
      name: org.name,
    }))

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
