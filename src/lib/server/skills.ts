import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import type { SkillCategory, SkillGraphData, SkillLink, SkillNode } from '$lib/data/skills.js'

export const SKILLS_ROOT =
  process.env.SKILLS_ROOT ?? join(process.env.HOME!, '.claude/skills')

const CATEGORY_MAP: Record<string, SkillCategory> = {
  Thinking: 'thinking',
  Challenger: 'thinking',
  Contemplate: 'thinking',
  SocraticMentor: 'thinking',
  Council: 'thinking',
  Evals: 'thinking',
  Implement: 'implementation',
  Build: 'implementation',
  Git: 'implementation',
  Worktree: 'implementation',
  SoftwareTest: 'implementation',
  CreateCLI: 'implementation',
  CreateRustCLI: 'implementation',
  CodeAnalysis: 'implementation',
  Security: 'implementation',
  SoftwareDesign: 'implementation',
  Troubleshoot: 'implementation',
  Research: 'content',
  ContentAnalysis: 'content',
  Fabric: 'content',
  Scraping: 'content',
  Media: 'content',
  WriteStory: 'content',
  CodeDocs: 'content',
  Quotes: 'content',
  CreateSkill: 'meta',
  SkillGraph: 'meta',
  SkillReflection: 'meta',
  PAIUpgrade: 'meta',
  Delegation: 'meta',
  Agents: 'meta',
  PAICron: 'meta',
  Cron: 'meta',
  'skill-creator': 'meta',
  Telos: 'personal',
  AlchemistReflection: 'personal',
  morning: 'personal',
  evening: 'personal',
  cop: 'personal',
  Focus: 'personal',
  'status-update': 'personal',
  SessionContext: 'personal',
  WorkRecall: 'personal',
  TokenAnalysis: 'analysis',
  DataLayer: 'analysis',
  USMetrics: 'analysis',
  ValueFlows: 'analysis',
  CodeExplain: 'analysis',
  Investigation: 'analysis',
  Holochain: 'domain',
  Dolibarr: 'domain',
  Tiki: 'domain',
  DigitalGardening: 'domain',
  ERP: 'domain',
  CRM: 'domain',
  Projects: 'domain',
  ReleasePlease: 'domain',
  Utilities: 'utility',
  McpSetup: 'utility',
  Vocal: 'utility',
  ManualCommits: 'utility',
  PutItDown: 'utility',
  Tips: 'utility',
}

export function loadSkillGraph(): SkillGraphData {
  const dirs = readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  const nodes: SkillNode[] = []
  const links: SkillLink[] = []

  for (const dir of dirs) {
    const skillFile = join(SKILLS_ROOT, dir, 'SKILL.md')
    if (!existsSync(skillFile)) continue

    let parsed: Record<string, unknown>
    try {
      parsed = matter(readFileSync(skillFile, 'utf-8')).data
    } catch {
      continue
    }
    const name: string = (parsed.name as string | undefined) ?? dir

    const rawHint = parsed['argument-hint']
    const argumentHint = Array.isArray(rawHint)
      ? rawHint.join(' | ')
      : typeof rawHint === 'string'
        ? rawHint
        : undefined

    nodes.push({
      id: name,
      name,
      description: typeof parsed.description === 'string' ? parsed.description : '',
      category: (parsed.category as SkillCategory) ?? CATEGORY_MAP[name] ?? 'utility',
      argumentHint,
    })

    for (const target of Array.isArray(parsed['feeds-into']) ? parsed['feeds-into'] : []) {
      links.push({ source: name, target: String(target), type: 'feeds-into' })
    }
    if (parsed.parent) {
      links.push({ source: String(parsed.parent), target: name, type: 'parent' })
    }
  }

  const nodeIds = new Set(nodes.map((n) => n.id))
  const validLinks = links.filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))

  return {
    nodes,
    links: validLinks,
    skillCount: nodes.length,
    categoryCount: new Set(nodes.map((n) => n.category)).size,
  }
}
