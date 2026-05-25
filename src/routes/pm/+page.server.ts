import { Effect as E } from 'effect'
import { listProjects } from '$lib/data/projects.js'
import { listTasks } from '$lib/data/tasks.js'
import { queryTimeEntries } from '$lib/server/index-db.js'
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
    E.runPromise(E.either(listProjects())),
    E.runPromise(E.either(listTasks()))
  ])

  const projects = projectsR._tag === 'Right' ? projectsR.right : []
  projects.sort((a, b) => b.updated.localeCompare(a.updated))
  const tasks = tasksR._tag === 'Right' ? tasksR.right : []
  const monday = getMonday()

  const tasksByProject: Record<string, Task[]> = {}
  for (const task of tasks) {
    if (!tasksByProject[task.project_id]) tasksByProject[task.project_id] = []
    tasksByProject[task.project_id].push(task)
  }

  const weekEntries = queryTimeEntries({ dateFrom: monday })
  const hoursThisWeek: Record<string, number> = {}
  for (const entry of weekEntries) {
    const e = entry as { project_id?: string; hours_rounded?: number }
    if (e.project_id) {
      hoursThisWeek[e.project_id] = (hoursThisWeek[e.project_id] ?? 0) + (e.hours_rounded ?? 0)
    }
  }

  return { projects, tasksByProject, hoursThisWeek }
}
