import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export const TELOS_ROOT =
  process.env.TELOS_ROOT ?? join(process.env.HOME!, '.claude/PAI/USER/TELOS')

export const TELOS_CATEGORIES: Record<string, string[]> = {
  Core: ['TELOS.md', 'MISSION.md', 'STATUS.md'],
  Growth: ['GOALS.md', 'CHALLENGES.md', 'STRATEGIES.md', 'PROBLEMS.md'],
  Reflection: ['BELIEFS.md', 'FRAMES.md', 'MODELS.md', 'WRONG.md', 'LEARNED.md', 'NARRATIVES.md'],
  Wisdom: ['WISDOM.md', 'BOOKS.md', 'MOVIES.md', 'MUSIC.md', 'QUOTES.md'],
  Alchemy: [
    'ALCHEMY/ARCHETYPES.md',
    'ALCHEMY/GREAT_WORK.md',
    'ALCHEMY/GRIMOIRE.md',
    'ALCHEMY/RITUALS.md',
    'ALCHEMY/SACRED.md',
    'ALCHEMY/SULPHUR.md',
    'ALCHEMY/TRADITIONS.md',
  ],
  Futures: ['PREDICTIONS.md', 'IDEAS.md', 'UPDATES.md'],
  Authors: ['AUTHORS.md', 'TRAUMAS.md'],
}

export interface TelosFileEntry {
  category: string
  file: string
  exists: boolean
}

export function telosPath(file: string): string {
  const resolved = resolve(TELOS_ROOT, file)
  if (!resolved.startsWith(TELOS_ROOT + '/') && resolved !== TELOS_ROOT) {
    throw new Error(`Path traversal rejected: ${file}`)
  }
  return resolved
}

export function listTelosFiles(): TelosFileEntry[] {
  const entries: TelosFileEntry[] = []
  for (const [category, files] of Object.entries(TELOS_CATEGORIES)) {
    for (const file of files) {
      const abs = join(TELOS_ROOT, file)
      entries.push({ category, file, exists: existsSync(abs) })
    }
  }
  return entries
}

export function readTelosFile(file: string): string {
  const abs = telosPath(file)
  return readFileSync(abs, 'utf-8')
}
