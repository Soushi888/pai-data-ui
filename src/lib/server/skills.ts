import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import type { SkillCategory, SkillGraphData, SkillLink, SkillNode } from '$lib/data/skills.js'

export const SKILLS_ROOT =
  process.env.SKILLS_ROOT ?? join(process.env.HOME!, '.hermes/skills')

/**
 * Maps Hermes category directory names to the SkillCategory type.
 * Hermes skills are organized as: ~/.hermes/skills/<category-dir>/<skill-name>/SKILL.md
 */
const DIR_TO_CATEGORY: Record<string, SkillCategory> = {
  datalayer: 'domain',
  method: 'thinking',
  identity: 'personal',
  'software-development': 'implementation',
  'software-development/ad4m': 'implementation',
  productivity: 'utility',
  email: 'utility',
  github: 'implementation',
  research: 'content',
  creative: 'content',
  media: 'content',
  mlops: 'implementation',
  'mlops/inference': 'implementation',
  'mlops/models': 'implementation',
  'mlops/evaluation': 'analysis',
  'note-taking': 'utility',
  'data-science': 'analysis',
  'social-media': 'utility',
  'smart-home': 'utility',
  'computer-use': 'implementation',
  'dogfood': 'analysis',
  'autonomous-ai-agents': 'implementation',
}

interface SkillEntry {
  name: string
  description: string
  category: SkillCategory
  argumentHint?: string
  feedsInto: string[]
  parent?: string
}

function parseSkillEntry(dirPath: string, dirName: string): SkillEntry | null {
  const skillFile = join(dirPath, dirName, 'SKILL.md')
  if (!existsSync(skillFile)) return null

  let parsed: Record<string, unknown>
  try {
    parsed = matter(readFileSync(skillFile, 'utf-8')).data
  } catch {
    return null
  }

  const name: string = (parsed.name as string | undefined) ?? dirName

  const rawHint = parsed['argument-hint']
  const argumentHint = Array.isArray(rawHint)
    ? rawHint.join(' | ')
    : typeof rawHint === 'string'
      ? rawHint
      : undefined

  const feedsInto: string[] = Array.isArray(parsed['feeds-into'])
    ? (parsed['feeds-into'] as string[])
    : []

  const parent = parsed.parent ? String(parsed.parent) : undefined

  return {
    name,
    description: typeof parsed.description === 'string' ? parsed.description : '',
    category: 'utility',
    argumentHint,
    feedsInto,
    parent,
  }
}

function deriveCategory(name: string, categoryDir: string | null): SkillCategory {
  // Highest priority: explicit category in Hermes skill metadata or old frontmatter
  // (Handled by the caller which reads frontmatter first)
  // If we have a category directory, map it
  if (categoryDir && DIR_TO_CATEGORY[categoryDir]) {
    return DIR_TO_CATEGORY[categoryDir]
  }
  // Fallback
  return 'utility'
}

export function loadSkillGraph(): SkillGraphData {
  const nodes: SkillNode[] = []
  const links: SkillLink[] = []

  const topDirs = readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  for (const top of topDirs) {
    const topPath = join(SKILLS_ROOT, top)

    // Check if this is a flat skill (has SKILL.md directly)
    const flatSkill = parseSkillEntry(SKILLS_ROOT, top)
    if (flatSkill) {
      // Try old-style frontmatter category first
      const skillFile = join(SKILLS_ROOT, top, 'SKILL.md')
      const parsed = matter(readFileSync(skillFile, 'utf-8')).data
      const frontmatterCategory = parsed.category as SkillCategory | undefined
      nodes.push({
        id: flatSkill.name,
        name: flatSkill.name,
        description: flatSkill.description,
        category: frontmatterCategory ?? 'utility',
        argumentHint: flatSkill.argumentHint,
      })
      for (const target of flatSkill.feedsInto) {
        links.push({ source: flatSkill.name, target, type: 'feeds-into' })
      }
      if (flatSkill.parent) {
        links.push({ source: flatSkill.parent, target: flatSkill.name, type: 'parent' })
      }
      continue
    }

    // Treat as a category directory: walk its subdirectories for skills
    const categoryDir = top
    const subDirs = readdirSync(topPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)

    for (const sub of subDirs) {
      const skill = parseSkillEntry(topPath, sub)
      if (!skill) continue

      // Read frontmatter for explicit category
      const skillFile = join(topPath, sub, 'SKILL.md')
      let frontmatterCategory: SkillCategory | undefined
      try {
        const parsed = matter(readFileSync(skillFile, 'utf-8')).data
        frontmatterCategory = parsed.category as SkillCategory | undefined
      } catch { /* skip */ }

      nodes.push({
        id: skill.name,
        name: skill.name,
        description: skill.description,
        category: frontmatterCategory ?? deriveCategory(skill.name, categoryDir),
        argumentHint: skill.argumentHint,
      })
      for (const target of skill.feedsInto) {
        links.push({ source: skill.name, target, type: 'feeds-into' })
      }
      if (skill.parent) {
        links.push({ source: skill.parent, target: skill.name, type: 'parent' })
      }
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
