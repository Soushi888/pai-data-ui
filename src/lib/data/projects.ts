import { Effect as E } from 'effect'
import type { DataError } from './errors.js'
import { ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { EntityWithBody, Project } from './types.js'

const dir = () => dataPath('PM', 'projects')
const filePath = (id: string) => `${dir()}/${id}.md`

/**
 * Lists all projects from the SQLite index.
 * @returns Effect resolving to Project[], or failing with DataError.
 */
export function listProjects(): E.Effect<Project[], DataError> {
  return E.try({
    try: () => listByType<Project>('project'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}


/**
 * Retrieves a single project by ID with markdown body.
 * @param id - Project identifier.
 * @returns Effect resolving to project data + body, or failing with DataError.
 */
export function getProject(id: string): E.Effect<EntityWithBody<Project>, DataError> {
  return requireEntity<Project>(filePath(id), id)
}

/**
 * Updates an existing project with a partial patch.
 * @param id - Identifier of the project to update.
 * @param patch - Fields to update; unspecified fields are preserved.
 * @param body - Optional replacement markdown body.
 * @returns Effect resolving to the updated Project, or failing with DataError.
 */
export function updateProject(
  id: string,
  patch: Partial<Project>,
  body?: string
): E.Effect<Project, DataError> {
  return E.flatMap(getProject(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch, updated: new Date().toISOString().split('T')[0] }
    return E.map(
      writeEntity(filePath(id), updated as unknown as Record<string, unknown>, body ?? existingBody),
      () => updated
    )
  })
}

/**
 * Creates a new project.
 * @param data - Project fields to set.
 * @param body - Optional initial markdown body.
 * @returns Effect resolving to the created Project, or failing with DataError.
 */
export function createProject(
  data: Omit<Project, 'id' | 'type' | 'created' | 'updated'>,
  body = ''
): E.Effect<Project, DataError> {
  const today = new Date().toISOString().split('T')[0]
  const id = `proj-${data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)}`
  const project: Project = { ...data, id, type: 'project', created: today, updated: today }
  return E.map(writeEntity(filePath(id), project as unknown as Record<string, unknown>, body), () => project)
}
