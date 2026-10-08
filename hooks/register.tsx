import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionUsage } from 'claude-code'

import type { Limit, Snapshot } from '../types'

// Reads the session again twice a minute, so the countdowns move and a
// /model or a branch switch shows up without waiting for a turn
const TICK_MS = 30_000
// Cells of a bar when the band has room for everything, and when it has not
const BAR_CELLS = 8
const COMPACT_BAR_CELLS = 5
// A pill's frame and padding, and the gap between two pills
const PILL_CHROME = 4
const PILL_GAP = 1

const snapshot = atom({ plugin: 'status-pills', key: 'snapshot' } as const, null)
const effort = atom({ plugin: 'status-pills', key: 'effort' } as const, null)

const MODEL = '#67e8f9'
const LABEL = '#9ca3af'
const VALUE = '#f3f4f6'
const TIME = '#cbd5e1'
const TRACK = '#3f3f46'
const PROJECT = '#e2e8f0'

// The same thresholds as the shell status line: under 50% fine, under 80% watch, then critical
const OK = '#4ade80'
const WARN = '#facc15'
const CRIT = '#f87171'

const BORDERS = {
  model: '#0e7490',
  context: '#2563eb',
  fiveHour: '#15803d',
  sevenDay: '#7e22ce',
  project: '#475569',
}

const EFFORT_COLORS: Record<string, string> = {
  low: '#94a3b8',
  medium: '#22d3ee',
  high: '#facc15',
  xhigh: '#fb923c',
  max: '#f43f5e',
}
const OTHER_EFFORT = '#cbd5e1'

// One run of text inside a pill
type Part = { text: string; color: string; bold: boolean }
type Pill = { key: string; border: string; parts: Part[] }

const plain = (text: string, color: string): Part => ({ text, color, bold: false })
const strong = (text: string, color: string): Part => ({ text, color, bold: true })

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

// "claude-opus-5-5[1m]" -> "Opus 5.5 1M", "opus" -> "Opus", "Opus 5 (1M context)" -> "Opus 5 1M"
function shortModel(model: string): string {
  const id = /^claude-([a-z]+)-(\d+(?:-\d{1,2})*)(?:-\d{8})?(\[1m\])?$/i.exec(model)
  if (id) {
    const [, family = '', version = '', long] = id
    return `${capitalize(family)} ${version.replace(/-/g, '.')}${long ? ' 1M' : ''}`
  }
  const alias = /^([a-z]+)(\[1m\])?$/.exec(model)
  if (alias) {
    const [, name = '', long] = alias
    return `${capitalize(name)}${long ? ' 1M' : ''}`
  }
  return model.replace(/ *\((\d+[MK]) context\)/, ' $1').replace(/ *\([^)]*\)/g, '').trim()
}

// The last component of a path, with / or \ and a trailing separator
const nameOf = (path: string) => path.replace(/[\\/]+$/, '').replace(/.*[\\/]/, '')

const pad = (n: number) => String(n).padStart(2, '0')

// 10_440_000 -> "2h54"
function countdown(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000))
  return `${Math.floor(minutes / 60)}h${pad(minutes % 60)}`
}

// "10/10 14h", as the shell status line writes the 7-day reset
function dayOf(at: number): string {
  const date = new Date(at)
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}h`
}

function severity(percent: number): string {
  const rounded = Math.round(percent)
  return rounded < 50 ? OK : rounded < 80 ? WARN : CRIT
}

function bar(percent: number, cells: number): Part[] {
  const filled = Math.min(cells, Math.max(0, Math.round((percent / 100) * cells)))
  return [plain('▒'.repeat(filled), severity(percent)), plain('▒'.repeat(cells - filled), TRACK)]
}

function limitOf(usage: SessionUsage, kind: string): Limit | null {
  const found = usage.rateLimits.find(one => one.kind === kind)
  if (found === undefined) {
    return null
  }
  const resetsAt = found.resetsAt === undefined ? Number.NaN : Date.parse(found.resetsAt)
  return { percent: found.percentUsed, resetsAt: Number.isFinite(resetsAt) ? resetsAt : null }
}

async function branchOf($: EngineInterface, cwd: string): Promise<string | null> {
  try {
    const { exitCode, stdout } = await $.process.run(['git', '--no-optional-locks', 'branch', '--show-current'], {
      cwd,
      timeoutMs: 5000,
    })
    const branch = stdout.trim()
    return exitCode === 0 && branch !== '' ? branch : null
  } catch {
    // git missing from the PATH, or it hung
    return null
  }
}

async function refresh($: EngineInterface) {
  const [usage, model, root, cwd, now] = await Promise.all([
    $.session.usage(),
    $.session.model(),
    $.session.root(),
    $.session.cwd(),
    $.clock.now(),
  ])
  const branch = await branchOf($, cwd)
  await update($, snapshot, () => ({
    model,
    contextPercent: usage.context.percent ?? null,
    fiveHour: limitOf(usage, 'five_hour'),
    sevenDay: limitOf(usage, 'seven_day'),
    project: nameOf(root) || null,
    branch,
    at: now,
  }))
}

// A window's pill: its bar and share, then when it resets, as resetOf writes it
function limitPill(key: string, label: string, border: string, limit: Limit, isCompact: boolean, resetOf: (resetsAt: number) => string): Pill {
  const parts = [
    plain(`${label} `, LABEL),
    ...bar(limit.percent, isCompact ? COMPACT_BAR_CELLS : BAR_CELLS),
    strong(` ${Math.round(limit.percent)}%`, VALUE),
  ]
  if (limit.resetsAt !== null) {
    parts.push(plain(' │ ', border), plain(`↻ ${resetOf(limit.resetsAt)}`, TIME))
  }
  return { key, border, parts }
}

function pillsOf(shot: Snapshot, effortLevel: string | null, isCompact: boolean): Pill[] {
  const pills: Pill[] = []
  if (shot.model !== null) {
    const parts = [strong(shortModel(shot.model), MODEL)]
    if (effortLevel !== null) {
      parts.push(plain(` ${effortLevel}`, EFFORT_COLORS[effortLevel] ?? OTHER_EFFORT))
    }
    pills.push({ key: 'model', border: BORDERS.model, parts })
  }
  if (shot.contextPercent !== null) {
    pills.push({
      key: 'context',
      border: BORDERS.context,
      parts: [
        plain('ctx ', LABEL),
        ...bar(shot.contextPercent, isCompact ? COMPACT_BAR_CELLS : BAR_CELLS),
        strong(` ${Math.round(shot.contextPercent)}%`, VALUE),
      ],
    })
  }
  if (shot.fiveHour !== null) {
    // The 5-hour window by the time left, the 7-day one by the date it resets
    pills.push(limitPill('five-hour', '5h', BORDERS.fiveHour, shot.fiveHour, isCompact, resetsAt => countdown(resetsAt - shot.at)))
  }
  if (shot.sevenDay !== null) {
    pills.push(limitPill('seven-day', '7D', BORDERS.sevenDay, shot.sevenDay, isCompact, dayOf))
  }
  const place = [shot.project, shot.branch].filter(name => name !== null)
  if (place.length > 0) {
    pills.push({ key: 'project', border: BORDERS.project, parts: [plain(place.join(' · '), PROJECT)] })
  }
  return pills.map(pill => ({ ...pill, parts: pill.parts.filter(part => part.text !== '') }))
}

const widthOf = (pills: Pill[]) =>
  pills.reduce((sum, pill) => sum + PILL_CHROME + pill.parts.reduce((n, part) => n + [...part.text].length, 0), 0) +
  PILL_GAP * Math.max(0, pills.length - 1)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await refresh($)
    $.clock.every(TICK_MS, () => void refresh($))
    return next(e)
  })

  // After each turn of the main loop, and when a limit moves a whole point
  on('session.measure', async ($, e, next) => {
    const result = await next(e)
    await refresh($)
    return result
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined && e.effort !== undefined) {
      const level = String(e.effort)
      await update($, effort, () => level)
    }
    return yield* next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const shot = await read($, snapshot)
    if (e.props.hasSurvey || shot === null) {
      return next(e)
    }
    const effortLevel = await read($, effort)
    const full = pillsOf(shot, effortLevel, false)
    const pills = widthOf(full) <= e.props.bodyColumns ? full : pillsOf(shot, effortLevel, true)
    if (pills.length === 0) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" flexWrap="wrap" columnGap={PILL_GAP}>
        {pills.map(pill => (
          <Box key={pill.key} borderStyle="round" borderColor={pill.border} paddingX={1} flexShrink={0}>
            {pill.parts.map(part => (
              <Text color={part.color} bold={part.bold}>
                {part.text}
              </Text>
            ))}
          </Box>
        ))}
      </Box>
    )
  })
}
