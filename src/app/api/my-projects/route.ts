import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getProjectRepository,
  getOrganizationRepository,
} from '@/lib/repositories'
import { isSuccess } from '@/lib/result'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgRepo = getOrganizationRepository()
    const projectRepo = getProjectRepository()

    const orgsResult = await orgRepo.findByOwnerId(session.user.id)
    if (!isSuccess(orgsResult)) {
      return NextResponse.json({ projects: [] })
    }

    const projects: Array<{ id: string; name: string }> = []

    for (const org of orgsResult.data) {
      const projectsResult = await projectRepo.findByOrganizationId(org.id)
      if (!isSuccess(projectsResult)) continue

      for (const project of projectsResult.data) {
        projects.push({
          id: project.id,
          name: project.name,
        })
      }
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
