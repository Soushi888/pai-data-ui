#!/usr/bin/env bun
// Rebuild the SQLite index from all markdown files under PAI_DATA_ROOT.
// Run from project root: bun scripts/rebuild-index.ts
// Reads PAI_DATA_ROOT from .env (Bun auto-loads .env in the working directory).
import { DATA_ROOT } from '../src/lib/server/index-db.js'
import { rebuildIndex } from '../src/lib/server/sync-engine.js'

console.log(`Rebuilding index from ${DATA_ROOT}...`)

const start = Date.now()
const { indexed, errors } = rebuildIndex()
const ms = Date.now() - start

console.log(`Done in ${ms}ms — ${indexed} indexed, ${errors} errors`)
if (errors > 0) process.exit(1)
