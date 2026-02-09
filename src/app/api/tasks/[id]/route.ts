import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getTaskRepository,
  getProjectRepository,
  getTeamMemberRepository,
  getUserRepository,
} from '@/lib/repositories'
import { isSuccess, isFailure } from '@/lib/result'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const taskRepository = getTaskRepository()
    const taskResult = await taskRepository.findById(id)

    if (isFailure(taskResult) || !taskResult.data) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = taskResult.data

    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(task.projectId)

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = projectResult.data

    let assignedTo = null
    if (task.assignedToId) {
      const teamMemberRepository = getTeamMemberRepository()
      const tmResult = await teamMemberRepository.findById(task.assignedToId)
      if (isSuccess(tmResult) && tmResult.data) {
        assignedTo = tmResult.data
      }
    }

    return NextResponse.json({
      task: {
        ...task,
        project: {
          id: project.id,
          name: project.name,
        },
        assignedTo: assignedTo
          ? {
              id: assignedTo.id,
              role: assignedTo.role,
              position: assignedTo.position,
              user: assignedTo.user
                ? {
                    id: assignedTo.user.id,
                    name: assignedTo.user.name || '',
                    email: assignedTo.user.email || '',
                  }
                : {
                    id: '',
                    name: '',
                    email: '',
                  },
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const updates = await request.json()

    const taskRepository = getTaskRepository()
    const taskResult = await taskRepository.findById(id)

    if (isFailure(taskResult) || !taskResult.data) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(
      taskResult.data.projectId,
    )

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const updateResult = await taskRepository.update(id, updates)

    if (isFailure(updateResult)) {
      return NextResponse.json(
        { error: updateResult.error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ task: updateResult.data })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const taskRepository = getTaskRepository()
    const taskResult = await taskRepository.findById(id)

    if (isFailure(taskResult) || !taskResult.data) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(
      taskResult.data.projectId,
    )

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const deleteResult = await taskRepository.delete(id)

    if (isFailure(deleteResult)) {
      return NextResponse.json(
        { error: deleteResult.error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
