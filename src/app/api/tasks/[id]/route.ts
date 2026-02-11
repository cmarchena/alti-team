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
    
    // DEBUG: Log the incoming update data with types
    console.log('=== TASK UPDATE DEBUG ===')
    console.log('Task ID:', id, typeof id)
    console.log('Updates received:', JSON.stringify(updates, null, 2))
    Object.keys(updates).forEach(key => {
      console.log(`  ${key}: ${JSON.stringify(updates[key])} (type: ${typeof updates[key]})`)
    })
    console.log('========================')

    console.log('DEBUG: About to call taskRepository.findById...')
    const taskRepository = getTaskRepository()
    const taskResult = await taskRepository.findById(id)
    console.log('DEBUG: taskResult:', taskResult.success ? 'success' : 'failure')

    if (isFailure(taskResult) || !taskResult.success || !taskResult.data) {
      console.log('DEBUG: Task not found, returning 404')
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = taskResult.data
    console.log('DEBUG: About to call projectRepository.findById with projectId:', task.projectId)
    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(task.projectId)
    console.log('DEBUG: projectResult:', projectResult.success ? 'success' : 'failure')

    if (isFailure(projectResult) || !projectResult.success || !projectResult.data) {
      console.log('DEBUG: Project not found, returning 404')
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log('DEBUG: About to call taskRepository.update...')
    
    // Filter out fields that shouldn't be updated
    const allowedUpdates: Record<string, unknown> = {}
    const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedToId']
    for (const key of allowedFields) {
      if (key in updates) {
        allowedUpdates[key] = updates[key]
      }
    }
    console.log('DEBUG: Filtered updates:', JSON.stringify(allowedUpdates))
    
    // Build SQL query manually for debugging
    const setParts: string[] = []
    const values: unknown[] = []
    let paramIndex = 1
    
    if (allowedUpdates.title !== undefined) {
      setParts.push(`title = $${paramIndex++}`)
      values.push(allowedUpdates.title)
    }
    if (allowedUpdates.description !== undefined) {
      setParts.push(`description = $${paramIndex++}`)
      values.push(allowedUpdates.description)
    }
    if (allowedUpdates.status !== undefined) {
      setParts.push(`status = $${paramIndex++}`)
      values.push(allowedUpdates.status)
    }
    if (allowedUpdates.priority !== undefined) {
      setParts.push(`priority = $${paramIndex++}`)
      values.push(allowedUpdates.priority)
    }
    if (allowedUpdates.dueDate !== undefined) {
      setParts.push(`due_date = $${paramIndex++}`)
      values.push(allowedUpdates.dueDate)
    }
    if (allowedUpdates.assignedToId !== undefined) {
      setParts.push(`assigned_to_id = $${paramIndex++}`)
      values.push(allowedUpdates.assignedToId)
    }
    
    const numFields = setParts.length
    setParts.push(`updated_at = NOW()`)
    values.push(id)
    
    const sqlQuery = `UPDATE tasks SET ${setParts.join(', ')} WHERE id = $${numFields + 1} RETURNING *`
    console.log('=== SQL DEBUG ===')
    console.log('Query:', sqlQuery)
    console.log('Values:', values.map((v, i) => `$${i+1}: ${JSON.stringify(v)} (${typeof v})`))
    console.log('=================')
    
    const updateResult = await taskRepository.update(id, allowedUpdates)
    console.log('DEBUG: updateResult:', updateResult.success ? 'success' : 'failure')
    
    if (isFailure(updateResult)) {
      console.log('DEBUG: Error details:', JSON.stringify(updateResult.error, Object.getOwnPropertyNames(updateResult.error)))
      return NextResponse.json(
        { error: updateResult.error.message, details: String(updateResult.error) },
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
