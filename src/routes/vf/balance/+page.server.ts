import { getDb } from '$lib/server/index-db.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => {
  const db = getDb()

  const contributions = db
    .prepare('SELECT * FROM vf_agent_contributions ORDER BY agent_id, resource_spec')
    .all() as VfContribution[]

  const claims = db
    .prepare('SELECT * FROM vf_claim_status')
    .all() as VfClaim[]

  const outstanding = claims
    .filter((c) => c.settlement_status === 'outstanding')
    .reduce((sum, c) => sum + (c.claimed_amount ?? 0), 0)

  const settled = claims
    .filter((c) => c.settlement_status === 'settled')
    .reduce((sum, c) => sum + (c.claimed_amount ?? 0), 0)

  return { contributions, claims, outstanding, settled }
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
