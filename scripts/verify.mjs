#!/usr/bin/env node
/**
 * Quiet project checks: lint, typecheck, unit tests and the Python pipeline
 * tests run in parallel; `--build` adds a production build once they pass.
 *
 * Prints one line per check and, for a failing check, only its error lines.
 * The full output of a passing run is ~150 lines an agent would otherwise
 * read (and pay for) on every verification pass; this prints about six.
 *
 *   npm run verify            lint + typecheck + tests (+ python if its venv exists)
 *   npm run verify -- --build also runs `next build`
 *   npm run verify -- --only=lint,test
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const withBuild = args.includes('--build')
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',')

// An absolute path, spawned without a shell: cmd.exe would read `python/...` as `python /...`.
const venvPython = path.resolve(process.platform === 'win32' ? 'python/.venv/Scripts/python.exe' : 'python/.venv/bin/python')

const CHECKS = [
  { name: 'lint', cmd: 'npx', args: ['eslint'] },
  { name: 'typecheck', cmd: 'npx', args: ['tsc', '--noEmit'] },
  { name: 'test', cmd: 'npx', args: ['vitest', 'run', '--reporter=dot'] },
  existsSync(venvPython) && { name: 'python', cmd: venvPython, args: ['-m', 'unittest', 'discover', '-s', 'python', '-q'], direct: true },
].filter(Boolean)

const BUILD = { name: 'build', cmd: 'npx', args: ['next', 'build'] }

const ANSI = /\x1b\[[0-9;]*[A-Za-z]/g
// Lines worth showing from a failure: errors, failed assertions and the file:line that points at them.
const SIGNAL = /(^[A-Za-z]:\\\S|^\/\S+\.\w+$|error|✖|×|FAIL|failed|Failed|Assertion|Expected|Received|Traceback|warning|⚠|^\s*at .*\.(?:t|j)sx?:\d+|\.(?:t|j)sx?[:(]\d+|\.py", line \d+)/

function run({ name, cmd, args: cmdArgs, direct = false }) {
  const started = Date.now()
  const env = { ...process.env, FORCE_COLOR: '0', CI: '1' }
  // npx is a .cmd shim on Windows and needs a shell; the arguments are the fixed ones above.
  const useShell = !direct && process.platform === 'win32'
  return new Promise((resolve) => {
    const child = useShell ? spawn(`${cmd} ${cmdArgs.join(' ')}`, { shell: true, env }) : spawn(cmd, cmdArgs, { env })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('close', (code) => resolve({ name, code, seconds: ((Date.now() - started) / 1000).toFixed(1), output: output.replace(ANSI, '') }))
    child.on('error', (err) => resolve({ name, code: 1, seconds: '0.0', output: String(err) }))
  })
}

/** A one-line summary for a passing check, when its output carries one. */
function summary(result) {
  const out = result.output
  if (result.name === 'test') return out.match(/Tests\s+(\d+ passed[^\n]*)/)?.[1]?.trim() ?? ''
  if (result.name === 'python') return out.match(/Ran (\d+ tests?)/)?.[1] ?? ''
  if (result.name === 'lint') return out.match(/✖ (\d+ problems?[^\n]*)/)?.[1] ?? ''
  if (result.name === 'build') return `${(out.match(/^[├└┌] [ƒ○●]/gm) ?? []).length} routes`
  return ''
}

function excerpt(output, limit = 60) {
  const lines = output.split(/\r?\n/).filter((l) => l.trim() && !/^> /.test(l))
  const picked = [...new Set(lines.filter((l) => SIGNAL.test(l)))]
  const chosen = picked.length ? picked : lines.slice(-40)
  const cut = chosen.slice(0, limit)
  if (chosen.length > limit) cut.push(`… ${chosen.length - limit} more lines`)
  return cut.map((l) => `    ${l.trimEnd()}`).join('\n')
}

function report(result) {
  const ok = result.code === 0
  const note = summary(result)
  console.log(`${ok ? '✓' : '✗'} ${result.name.padEnd(9)} ${result.seconds.padStart(5)}s${note ? `  ${note}` : ''}`)
  // Lint warnings do not fail the run but are worth seeing.
  if (!ok || (result.name === 'lint' && /warning/.test(result.output))) console.log(excerpt(result.output))
  return ok
}

const selected = only ? CHECKS.filter((c) => only.includes(c.name)) : CHECKS
const results = await Promise.all(selected.map(run))
let passed = results.map(report).every(Boolean)

if (withBuild && (!only || only.includes('build'))) {
  if (passed) passed = report(await run(BUILD))
  else console.log('- build     skipped (fix the failures above first)')
}

console.log(passed ? 'All checks passed.' : 'Checks failed.')
process.exit(passed ? 0 : 1)
