#!/usr/bin/env node
/**
 * Refresh the graphify code graph (AST only, no LLM, no token cost) and put
 * it where the graphify skill and agents read it: `graphify-out/` at the repo
 * root. `graphify update` writes to `src/graphify-out/` because the graph's
 * scan root is `src`, so the three outputs are copied up afterwards.
 *
 *   npm run graph
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const OUT = 'graphify-out'
const pythonFile = path.join(OUT, '.graphify_python')
if (!existsSync(pythonFile)) {
  console.error('graphify is not set up here (no graphify-out/.graphify_python). Run /graphify once first.')
  process.exit(1)
}

const python = readFileSync(pythonFile, 'utf8').trim()
const exe = path.join(path.dirname(python), process.platform === 'win32' ? 'graphify.exe' : 'graphify')
const result = spawnSync(exe, ['update'], { encoding: 'utf8', env: { ...process.env, GRAPHIFY_NO_TIPS: '1' } })
const lines = `${result.stdout ?? ''}${result.stderr ?? ''}`.split(/\r?\n/)
const rebuilt = lines.find((l) => l.includes('Rebuilt:'))
if (result.status === 0 && lines.some((l) => l.includes('No code-graph topology changes'))) {
  console.log(`Graph already current (${OUT}/GRAPH_REPORT.md).`)
  process.exit(0)
}
if (result.status !== 0 || !rebuilt) {
  console.error(lines.filter(Boolean).slice(-15).join('\n'))
  process.exit(result.status || 1)
}

const scanRoot = readFileSync(path.join(OUT, '.graphify_root'), 'utf8').trim()
const built = path.join(scanRoot, OUT)
for (const file of ['graph.json', 'graph.html', 'GRAPH_REPORT.md', 'manifest.json', '.graphify_labels.json']) {
  if (existsSync(path.join(built, file))) copyFileSync(path.join(built, file), path.join(OUT, file))
}
console.log(`${rebuilt.replace(/^\[graphify watch\]\s*/, '')} -> ${OUT}/`)
