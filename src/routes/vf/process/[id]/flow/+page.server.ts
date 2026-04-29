import { error } from '@sveltejs/kit'
import { getDb } from '$lib/server/index-db.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ params }) => {
  const db = getDb()

  const process = db
    .prepare(`SELECT id, domain, json_extract(data,'$.title') AS title,
                     json_extract(data,'$.status') AS status,
                     json_extract(data,'$.vf_classified_as') AS classified_as,
                     json_extract(data,'$.vf_has_beginning') AS has_beginning
              FROM entities WHERE id = ? AND type = 'project'`)
    .get(params.id) as VfProcess | undefined

  if (!process) throw error(404, 'Process not found')

  const events = db
    .prepare('SELECT * FROM vf_process_flows WHERE process_id = ? ORDER BY point_in_time ASC')
    .all(params.id) as VfProcessEvent[]

  const inputs = events.filter((e) => e.direction === 'input')
  const outputs = events.filter((e) => e.direction === 'output')

  const totalWork = inputs
    .filter((e) => e.action === 'work' || e.action === 'deliver-service')
    .reduce((sum, e) => sum + (e.qty_value ?? 0), 0)

  return { process, inputs, outputs, totalWork }
}

interface VfProcess {
  id: string
  domain: string
  title: string | null
  status: string | null
  classified_as: string | null
  has_beginning: string | null
}

interface VfProcessEvent {
  process_id: string
  process_domain: string
  process_title: string | null
  event_id: string
  action: string
  provider: string | null
  receiver: string | null
  qty_value: number | null
  qty_unit: string | null
  resource_spec: string | null
  point_in_time: string | null
  direction: 'input' | 'output'
}
