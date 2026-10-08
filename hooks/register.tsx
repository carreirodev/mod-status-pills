import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionUsage } from 'claude-code'

import type { Limit, Snapshot } from '../types'
import { PICTURE_HEIGHT, pictureOf } from './picture'
import type { Accent, Icon, Item, Pill } from './picture'

// Reads the session again twice a minute, so the countdowns move and a
// /model or a branch switch shows up without waiting for a turn
const TICK_MS = 30_000
// Cells of a bar when the band has room for everything, and when it has not
const BAR_CELLS = 8
const COMPACT_BAR_CELLS = 5
const PILL_GAP = 1

const snapshot = atom({ plugin: 'status-pills', key: 'snapshot' } as const, null)
const effort = atom({ plugin: 'status-pills', key: 'effort' } as const, null)

// The colors are made for a dark background; the desktop's light theme darkens each
const MODEL = '#67e8f9'
const LABEL = '#9ca3af'
const VALUE = '#f3f4f6'
const TIME = '#cbd5e1'
const TRACK = '#3f3f46'
// The oh-my-posh prompt's colors: a green folder, a blue branch
const PROJECT = '#33dd2d'
const BRANCH = '#3a86ff'

// The same thresholds as the shell status line: under 50% fine, under 80% watch, then critical
const OK = '#4ade80'
const WARN = '#facc15'
const CRIT = '#f87171'

const ACCENTS = {
  model: { border: '#0e7490', tint: '#0f2e35', icon: MODEL },
  context: { border: '#2563eb', tint: '#14254a', icon: '#60a5fa' },
  fiveHour: { border: '#15803d', tint: '#11301d', icon: OK },
  sevenDay: { border: '#7e22ce', tint: '#2a1744', icon: '#c084fc' },
  project: { border: '#475569', tint: '#222934', icon: PROJECT },
}

const EFFORT_COLORS: Record<string, string> = {
  low: '#94a3b8',
  medium: '#22d3ee',
  high: '#facc15',
  xhigh: '#fb923c',
  max: '#f43f5e',
}
const OTHER_EFFORT = '#cbd5e1'

// The icons as Nerd Font glyphs, for the terminal
const glyph = (code: number) => String.fromCodePoint(code)
const GLYPHS: Record<Icon, string> = {
  model: glyph(0xf2db),
  context: glyph(0xf086),
  fiveHour: glyph(0xf0e4),
  sevenDay: glyph(0xf073),
  reset: glyph(0xf1da),
  folder: glyph(0xe5ff),
  branch: glyph(0xe0a0),
}
// Powerline's half circles, which round off the ends of a pill's tint
const LEFT_CAP = glyph(0xe0b6)
const RIGHT_CAP = glyph(0xe0b4)

const plain = (text: string, color: string): Item => ({ kind: 'text', text, color, bold: false })
const strong = (text: string, color: string): Item => ({ kind: 'text', text, color, bold: true })
const icon = (name: Icon, color: string): Item => ({ kind: 'icon', icon: name, color })
const bar = (percent: number): Item => ({ kind: 'bar', percent, color: severity(percent) })
const SEPARATOR: Item = { kind: 'separator' }

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
function limitPill(key: string, label: string, name: Icon, accent: Accent, limit: Limit, resetOf: (resetsAt: number) => string): Pill {
  const items = [icon(name, accent.icon), plain(label, LABEL), bar(limit.percent), strong(`${Math.round(limit.percent)}%`, VALUE)]
  if (limit.resetsAt !== null) {
    items.push(SEPARATOR, icon('reset', TIME), plain(resetOf(limit.resetsAt), TIME))
  }
  return { key, accent, items }
}

function pillsOf(shot: Snapshot, effortLevel: string | null): Pill[] {
  const pills: Pill[] = []
  if (shot.model !== null) {
    const items = [icon('model', ACCENTS.model.icon), strong(shortModel(shot.model), MODEL)]
    if (effortLevel !== null) {
      items.push(plain(effortLevel, EFFORT_COLORS[effortLevel] ?? OTHER_EFFORT))
    }
    pills.push({ key: 'model', accent: ACCENTS.model, items })
  }
  if (shot.contextPercent !== null) {
    pills.push({
      key: 'context',
      accent: ACCENTS.context,
      items: [
        icon('context', ACCENTS.context.icon),
        plain('ctx', LABEL),
        bar(shot.contextPercent),
        strong(`${Math.round(shot.contextPercent)}%`, VALUE),
      ],
    })
  }
  if (shot.fiveHour !== null) {
    // The 5-hour window by the time left, the 7-day one by the date it resets
    pills.push(limitPill('five-hour', '5h', 'fiveHour', ACCENTS.fiveHour, shot.fiveHour, resetsAt => countdown(resetsAt - shot.at)))
  }
  if (shot.sevenDay !== null) {
    pills.push(limitPill('seven-day', '7D', 'sevenDay', ACCENTS.sevenDay, shot.sevenDay, dayOf))
  }
  const place: Item[] = []
  if (shot.project !== null) {
    place.push(icon('folder', PROJECT), plain(shot.project, PROJECT))
  }
  if (shot.branch !== null) {
    place.push(icon('branch', BRANCH), plain(shot.branch, BRANCH))
  }
  if (place.length > 0) {
    pills.push({ key: 'project', accent: ACCENTS.project, items: place })
  }
  return pills
}

// One run of text in the terminal; `background` is the pill's tint
type Run = { text: string; color: string; bold: boolean; background?: string }

function runsOf(item: Item, accent: Accent, cells: number): Run[] {
  switch (item.kind) {
    case 'text':
      return [{ text: item.text, color: item.color, bold: item.bold }]
    case 'icon':
      return [{ text: GLYPHS[item.icon], color: item.color, bold: false }]
    case 'separator':
      return [{ text: '│', color: accent.border, bold: false }]
    case 'bar': {
      const filled = Math.min(cells, Math.max(0, Math.round((item.percent / 100) * cells)))
      return [
        { text: '▒'.repeat(filled), color: item.color, bold: false },
        { text: '▒'.repeat(cells - filled), color: TRACK, bold: false },
      ]
    }
  }
}

// A pill in the terminal: one row, a space between its items, on its tint between two rounded ends
function terminalRuns(pill: Pill, cells: number): Run[] {
  const { tint } = pill.accent
  const items = pill.items.flatMap((item, index) =>
    runsOf(item, pill.accent, cells).map((run, at) => (index > 0 && at === 0 ? { ...run, text: ` ${run.text}` } : run)),
  )
  const padding: Run = { text: ' ', color: tint, bold: false }
  return [
    { text: LEFT_CAP, color: tint, bold: false },
    ...[padding, ...items, padding].map(run => ({ ...run, background: tint })),
    { text: RIGHT_CAP, color: tint, bold: false },
  ].filter(run => run.text !== '')
}

const widthOf = (rows: Run[][]) =>
  rows.reduce((sum, runs) => sum + runs.reduce((n, run) => n + [...run.text].length, 0), 0) + PILL_GAP * Math.max(0, rows.length - 1)

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
    const pills = pillsOf(shot, await read($, effort))
    if (pills.length === 0) {
      return next(e)
    }

    if (e.surface === 'desktop') {
      const { Box, Svg } = $.ui.resolve(e)
      return (
        <Box flexDirection="row" flexWrap="wrap" columnGap={PILL_GAP}>
          {pills.map(pill => {
            const { source, width, alt } = pictureOf(pill)
            return <Svg source={source} alt={alt} width={width} height={PICTURE_HEIGHT} />
          })}
        </Box>
      )
    }

    const rowsOf = (cells: number) => pills.map(pill => ({ key: pill.key, runs: terminalRuns(pill, cells) }))
    const full = rowsOf(BAR_CELLS)
    const rows = widthOf(full.map(row => row.runs)) <= e.props.bodyColumns ? full : rowsOf(COMPACT_BAR_CELLS)
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" flexWrap="wrap" columnGap={PILL_GAP}>
        {rows.map(row => (
          <Box key={row.key} flexDirection="row" flexShrink={0}>
            {row.runs.map(run => (
              <Text color={run.color} bold={run.bold} {...(run.background === undefined ? {} : { backgroundColor: run.background })}>
                {run.text}
              </Text>
            ))}
          </Box>
        ))}
      </Box>
    )
  })
}
