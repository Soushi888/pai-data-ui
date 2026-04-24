import { Effect } from 'effect'
import { listProjects } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import type { Task } from '$lib/data/types.js'
import type { PageServerLoad } from './$types'

function getMonday(): string {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().split('T')[0]
}

export const load: PageServerLoad = async () => {
  const [projectsR, tasksR] = await Promise.all([
    Effect.runPromise(Effect.either(listProjects())),
    Effect.runPromise(Effect.either(listTasks()))
  ])

  const projects = projectsR._tag === 'Right' ? projectsR.right : []
  projects.sort((a, b) => b.updated.localeCompare(a.updated))
  const tasks = tasksR._tag === 'Right' ? tasksR.right : []
  const monday = getMonday()

  const tasksByProject: Record<string, Task[]> = {}
  const hoursThisWeek: Record<string, number> = {}

  for (const task of tasks) {
    if (!tasksByProject[task.project_id]) tasksByProject[task.project_id] = []
    tasksByProject[task.project_id].push(task)

    const weekHours = (task.time_logs ?? [])
      .filter((l) => l.date >= monday)
      .reduce((s, l) => s + l.hours, 0)
    hoursThisWeek[task.project_id] = (hoursThisWeek[task.project_id] ?? 0) + weekHours
  }

  return { projects, tasksByProject, hoursThisWeek }
}
