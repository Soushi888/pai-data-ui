export type SkillCategory =
  | 'thinking'
  | 'implementation'
  | 'content'
  | 'meta'
  | 'personal'
  | 'analysis'
  | 'domain'
  | 'utility'

export interface SkillNode {
  id: string
  name: string
  description: string
  category: SkillCategory
  argumentHint?: string
}

export interface SkillLink {
  source: string
  target: string
  type: 'feeds-into' | 'parent'
}

export interface SkillGraphData {
  nodes: SkillNode[]
  links: SkillLink[]
  skillCount: number
  categoryCount: number
}
