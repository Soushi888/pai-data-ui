import { Effect } from 'effect'
import type { DataError } from './errors.js'
import { dataPath, listDir, readEntity, requireEntity, writeEntity } from './parser.js'
import type { EntityWithBody, Project } from './types.js'

const dir = () => dataPath('PM', 'projects')
const filePath = (id: string) => `${dir()}/${id}.md`

export function listProjects(): Effect.Effect<Project[], DataError> {
  return Effect.flatMap(listDir(dir()), (paths) =>
    Effect.all(
      paths.map((p) => Effect.map(readEntity<Project>(p), (e) => e.data)),
      { concurrency: 10 }
    )
  )
}

export function getProject(id: string): Effect.Effect<EntityWithBody<Project>, DataError> {
  return requireEntity<Project>(filePath(id), id)
}

export function updateProject(
  id: string,
  patch: Partial<Project>,
  body?: string
): Effect.Effect<Project, DataError> {
  return Effect.flatMap(getProject(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch, updated: new Date().toISOString().split('T')[0] }
    return Effect.map(
      writeEntity(filePath(id), updated as unknown as Record<string, unknown>, body ?? existingBody),
      () => updated
    )
  })
}

export function createProject(
  data: Omit<Project, 'id' | 'type' | 'created' | 'updated'>,
  body = ''
): Effect.Effect<Project, DataError> {
  const today = new Date().toISOString().split('T')[0]
  const id = `proj-${data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)}`
  const project: Project = { ...data, id, type: 'project', created: today, updated: today }
  return Effect.map(writeEntity(filePath(id), project as unknown as Record<string, unknown>, body), () => project)
}
