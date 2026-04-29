import { getDb } from '$lib/server/index-db.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => {
  const db = getDb()

  const contributions = db
    .prepare('SELECT * FROM vf_agent_contributions ORDER BY event_count DESC')
    .all() as VfContribution[]

  const claims = db
    .prepare('SELECT * FROM vf_claim_status ORDER BY settlement_status ASC')
    .all() as VfClaim[]

  const recentEvents = db
    .prepare(`
      SELECT e.id, e.type, e.action, e.provider, e.qty_value, e.qty_unit,
             e.resource_spec, e.point_in_time, e.input_of,
             json_extract(p.data, '$.title') AS process_title
      FROM vf_economic_events e
      LEFT JOIN entities p ON p.id = e.input_of AND p.type = 'project'
      ORDER BY e.point_in_time DESC
      LIMIT 20
    `)
    .all() as VfRecentEvent[]

  const outstanding = claims
    .filter((c) => c.settlement_status === 'outstanding')
    .reduce((sum, c) => sum + (c.claimed_amount ?? 0), 0)

  return { contributions, claims, recentEvents, outstanding }
}

interface VfContribution {
  agent_id: string
  resource_spec: string | null
  qty_unit: string | null
  total_qty: number | null
  event_count: number
}

interface VfClaim {
  id: string
  title: string | null
  claimed_amount: number | null
  currency: string | null
  client: string | null
  settlement_status: 'settled' | 'outstanding'
}

interface VfRecentEvent {
  id: string
  type: string
  action: string
  provider: string | null
  qty_value: number | null
  qty_unit: string | null
  resource_spec: string | null
  point_in_time: string | null
  input_of: string | null
  process_title: string | null
}
