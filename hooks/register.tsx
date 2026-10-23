import { atom, read, update } from 'claude-code'
import type { ElementConstructor, EngineInterface, ImageProps, ImageSource, Register, SessionUsage } from 'claude-code'

import type { Cache, Limit, Snapshot } from '../types'
import { PICTURE_HEIGHT, pictureOf } from './picture'
import type { Accent, Icon, Item, Pill } from './picture'
import { ICON_CELLS, barPicture, iconPicture } from './pixels'

// Reads the session again twice a minute, so the countdowns move and a
// /model or a branch switch shows up without waiting for a turn
const TICK_MS = 30_000
// Cells of a bar when the row has room for everything, and when it has not
const BAR_CELLS = 6
const COMPACT_BAR_CELLS = 5
const PILL_GAP = 1

// How long a prompt cache entry lives unused: the engine names it only when the
// model switches, so an hour until then
const CACHE_TTLS = { '5m': 5 * 60_000, '1h': 60 * 60_000 }
const EMPTY_CACHE: Cache = { tokensIn: 0, tokensRead: 0, sentAt: null, ttlMs: CACHE_TTLS['1h'] }
const COLD = 'frio'

const snapshot = atom({ plugin: 'status-pills', key: 'snapshot' } as const, null)
const effort = atom({ plugin: 'status-pills', key: 'effort' } as const, null)
const cache = atom({ plugin: 'status-pills', key: 'cache' } as const, null)
const worktree = atom({ plugin: 'status-pills', key: 'worktree' } as const, null)

// The colors are made for a dark background; the desktop's light theme darkens each.
// One soft palette: every pill sits on the same surface, a pill's own hue is
// on its icon alone, and in the limit pills green, yellow and red belong to the bars
const MODEL = '#c6a0f6'
const METER = '#8aadf4'
const LABEL = '#939ab7'
const VALUE = '#cad3f5'
const TIME = '#b8c0e0'
// A bar's empty cells and a pill's inner separator, kept faint on the terminal's tint
const TRACK = '#585858'
const RULE = '#626262'
// A dense shade: the terminal blends a shade's color with the tint, and a
// lighter one (▒) left the bars at half their color
const SHADE = '▓'
// Where a bar's picture cannot be, its alt is drawn dim and in one color, so
// its empty cells take a lighter shade than its filled ones
const LIGHT_SHADE = '░'
// The oh-my-posh prompt's colors: a green folder, a blue branch
const PROJECT = '#33dd2d'
const BRANCH = '#3a86ff'

// The same thresholds as the shell status line: under 50% fine, under 80% watch, then critical
const OK = '#a6da95'
const WARN = '#eed49f'
const CRIT = '#ed8796'

// The surface every pill shares: its tint in the terminal, a few steps above
// the terminal's own background so the pills stand out, and its border on the desktop.
// The tint, TRACK and RULE are pure grays on the xterm gray ramp: a terminal
// with only 256 colors keeps them as they are, but rounds a dark color with a
// hint of hue to a saturated one, and turned the old #16171f into navy blue
const CHIP = { border: '#5b6078', tint: '#303030' }
const ACCENTS = {
  model: { ...CHIP, icon: MODEL },
  context: { ...CHIP, icon: METER },
  fiveHour: { ...CHIP, icon: METER },
  sevenDay: { ...CHIP, icon: METER },
  project: { ...CHIP, icon: PROJECT },
  cache: { ...CHIP, icon: METER },
}

const EFFORT_COLORS: Record<string, string> = {
  low: '#8087a2',
  medium: '#91d7e3',
  high: '#eed49f',
  xhigh: '#f5a97f',
  max: '#ed8796',
}
const OTHER_EFFORT = TIME

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
  cache: glyph(0xf1c0),
}
// Powerline's half circles, which round off the ends of a pill's tint
const LEFT_CAP = glyph(0xe0b6)
const RIGHT_CAP = glyph(0xe0b4)

// How the terminal draws a pill's bars and icons: as pictures the mod paints, or as characters
type Mode = 'image' | 'text'
// Read when the session starts; until then, as right after a reload, the band is characters
let mode: Mode | null = null

// The rules Claude Code draws pictures by: in kitty and Ghostty, never inside
// tmux or screen nor in a background session, always when forced. Then
// CLAUDE_STATUS_PILLS_RENDERER, `image` or `text`, overrides them all, and any
// other value of it is ignored
async function modeOf($: EngineInterface): Promise<Mode> {
  try {
    const [renderer, forced, ghostty, kitty, term, program, tmux, screen, kind] = await Promise.all([
      $.env.get('CLAUDE_STATUS_PILLS_RENDERER'),
      $.env.get('CLAUDE_CODE_FORCE_TERMINAL_IMAGES'),
      $.env.get('GHOSTTY_RESOURCES_DIR'),
      $.env.get('KITTY_WINDOW_ID'),
      $.env.get('TERM'),
      $.env.get('TERM_PROGRAM'),
      $.env.get('TMUX'),
      $.env.get('STY'),
      $.env.get('CLAUDE_CODE_SESSION_KIND'),
    ])
    if (renderer === 'image' || renderer === 'text') {
      return renderer
    }
    if (forced !== undefined && forced !== '') {
      return 'image'
    }
    if (tmux !== undefined || screen !== undefined || kind === 'bg') {
      return 'text'
    }
    const drawsPictures = ghostty !== undefined || kitty !== undefined || /ghostty|kitty/.test(term ?? '') || program === 'ghostty'
    return drawsPictures ? 'image' : 'text'
  } catch {
    // An engine that answers no read of the environment
    return 'text'
  }
}

// A one-pixel picture, built only to ask the terminal's table what its Image is
const PROBE: ImageSource = { rgba: 'AAAAAA==', width: 1, height: 1 }

// Whether the terminal's table has Image: one from before it, or one a mod
// left it out of, hands out a fragment in its place (or nothing), which would
// leave a bar blank instead of drawing its alt
function hasImage(Image: ElementConstructor<ImageProps> | undefined): boolean {
  return Image !== undefined && Image({ source: PROBE, columns: 1, rows: 1, alt: ' ' }).type === 'Image'
}

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

// What git prints run in `cwd`, or null when it fails there
async function git($: EngineInterface, cwd: string, args: string[]): Promise<string | null> {
  try {
    const { exitCode, stdout } = await $.process.run(['git', '--no-optional-locks', ...args], { cwd, timeoutMs: 5000 })
    return exitCode === 0 ? stdout : null
  } catch {
    // git missing from the PATH, or it hung
    return null
  }
}

type Worktree = { path: string; branch: string | null }

// A path as git writes it, so two can be compared: forward slashes, no
// trailing one, and a Windows path (one with a drive letter) in one case
function comparable(path: string): string {
  const slashed = path.replace(/\\/g, '/').replace(/\/+$/, '')
  return /^[a-z]:\//i.test(slashed) ? slashed.toLowerCase() : slashed
}

const fieldOf = (lines: string[], prefix: string) => lines.find(line => line.startsWith(prefix))?.slice(prefix.length)

// The worktrees of the repository `cwd` is in, each with its branch (null when
// detached). With -z a NUL ends each line, and an empty line each worktree
async function worktreesOf($: EngineInterface, cwd: string): Promise<Worktree[]> {
  const listed = await git($, cwd, ['worktree', 'list', '--porcelain', '-z'])
  return (listed ?? '').split('\0\0').flatMap(record => {
    const lines = record.split('\0')
    const path = fieldOf(lines, 'worktree ')
    return path === undefined ? [] : [{ path, branch: fieldOf(lines, 'branch refs/heads/') ?? null }]
  })
}

// The worktree a file is in: the deepest that holds it, since one worktree
// can sit inside another's folder
function holderOf(worktrees: Worktree[], file: string): Worktree | undefined {
  const path = comparable(file)
  return worktrees
    .filter(one => path.startsWith(`${comparable(one.path)}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]
}

// The branch of the worktree the main loop last edited a file in, while git
// still lists it; else the branch checked out in the session's folder
async function branchOf($: EngineInterface, cwd: string, edited: string | null): Promise<string | null> {
  if (edited !== null) {
    const found = (await worktreesOf($, cwd)).find(one => comparable(one.path) === comparable(edited))
    if (found !== undefined) {
      return found.branch
    }
  }
  const branch = (await git($, cwd, ['branch', '--show-current']))?.trim() ?? ''
  return branch === '' ? null : branch
}

async function refresh($: EngineInterface) {
  const [usage, model, root, cwd, now, edited] = await Promise.all([
    $.session.usage(),
    $.session.model(),
    $.session.root(),
    $.session.cwd(),
    $.clock.now(),
    read($, worktree),
  ])
  const branch = await branchOf($, cwd, edited)
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

// The cache's pill: the minutes its entry stays warm, colored by the share of
// its life gone as a bar by its fill, then the share of the main loop's input
// the cache served
function cachePill(shot: Snapshot, state: Cache): Pill {
  const left = state.sentAt === null ? 0 : state.sentAt + state.ttlMs - Math.max(shot.at, state.sentAt)
  const time = left > 0 ? strong(`${Math.ceil(left / 60_000)}m`, severity(100 * (1 - left / state.ttlMs))) : strong(COLD, CRIT)
  const share = Math.round((100 * state.tokensRead) / state.tokensIn)
  return { key: 'cache', accent: ACCENTS.cache, items: [icon('cache', ACCENTS.cache.icon), time, plain(`${share}%`, VALUE)] }
}

function pillsOf(shot: Snapshot, effortLevel: string | null, cacheState: Cache | null): Pill[] {
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
  if (cacheState !== null && cacheState.tokensIn > 0) {
    pills.push(cachePill(shot, cacheState))
  }
  return pills
}

// One run of the terminal's band: text, `background` the pill's tint; or a
// picture the mod painted, `columns` cells wide, with the text it stands for
type Run = { text: string; color: string; bold: boolean; background?: string } | { picture: ImageSource; columns: number; alt: string }

// `pictures`: the bars and icons as pictures, painted on `tint`
function runsOf(item: Item, cells: number, tint: string, pictures: boolean): Run[] {
  switch (item.kind) {
    case 'text':
      return [{ text: item.text, color: item.color, bold: item.bold }]
    case 'icon':
      if (pictures) {
        return [{ picture: iconPicture(item.icon, item.color, tint), columns: ICON_CELLS, alt: GLYPHS[item.icon] }]
      }
      return [{ text: GLYPHS[item.icon], color: item.color, bold: false }]
    case 'separator':
      return [{ text: '│', color: RULE, bold: false }]
    case 'bar': {
      const filled = Math.min(cells, Math.max(0, Math.round((item.percent / 100) * cells)))
      if (pictures) {
        const picture = barPicture(item.percent, cells, { fill: item.color, track: TRACK, tint })
        return [{ picture, columns: cells, alt: SHADE.repeat(filled) + LIGHT_SHADE.repeat(cells - filled) }]
      }
      return [
        { text: SHADE.repeat(filled), color: item.color, bold: false },
        { text: SHADE.repeat(cells - filled), color: TRACK, bold: false },
      ]
    }
  }
}

// A pill in the terminal: one row, a space between its items, on its tint
// between two rounded ends; before a picture the space is a run of its own,
// and an icon's picture spans the space after it, so the pill keeps the
// columns its text takes
function terminalRuns(pill: Pill, cells: number, pictures: boolean): Run[] {
  const { tint } = pill.accent
  const spansSpace = (index: number) => pictures && pill.items[index]?.kind === 'icon'
  const items = pill.items.flatMap((item, index) =>
    runsOf(item, cells, tint, pictures).flatMap((run, at): Run[] => {
      if (index === 0 || at > 0 || spansSpace(index - 1)) {
        return [run]
      }
      return 'picture' in run ? [{ text: ' ', color: tint, bold: false }, run] : [{ ...run, text: ` ${run.text}` }]
    }),
  )
  const padding: Run = { text: ' ', color: tint, bold: false }
  const closing = spansSpace(pill.items.length - 1) ? [] : [padding]
  const runs: Run[] = [
    { text: LEFT_CAP, color: tint, bold: false },
    ...[padding, ...items, ...closing].map(run => ('picture' in run ? run : { ...run, background: tint })),
    { text: RIGHT_CAP, color: tint, bold: false },
  ]
  return runs.filter(run => 'picture' in run || run.text !== '')
}

// The columns a run takes: a picture its cells, a text its characters
const columnsOf = (run: Run) => ('picture' in run ? run.columns : [...run.text].length)

const widthOf = (rows: Run[][]) =>
  rows.reduce((sum, runs) => sum + runs.reduce((n, run) => n + columnsOf(run), 0), 0) + PILL_GAP * Math.max(0, rows.length - 1)

// The pills as the session stands, or null while there is nothing to show
async function pillsNow($: EngineInterface): Promise<Pill[] | null> {
  const shot = await read($, snapshot)
  if (shot === null) {
    return null
  }
  const pills = pillsOf(shot, await read($, effort), await read($, cache))
  return pills.length === 0 ? null : pills
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // A band drawn before this, as right after a reload, was characters: draw
    // it again in the mode, even if the reading below finds nothing new
    mode = await modeOf($)
    try {
      $.ui.invalidate('ui.render')
    } catch {
      // An engine without it: the band is drawn again once the reading below finds something new
    }
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
    // A subagent's requests keep a cache of their own
    if (e.agentId !== undefined) {
      return yield* next(e)
    }
    if (e.effort !== undefined) {
      const level = String(e.effort)
      await update($, effort, () => level)
    }
    // The entry's life starts over when the request reaches it, not when the answer ends
    const sentAt = await $.clock.now()
    const response = yield* next(e)
    const { usage } = response
    if (usage !== null) {
      const served = usage.cache_read_input_tokens
      const written = usage.cache_creation_input_tokens
      await update($, cache, previous => {
        const state = previous ?? EMPTY_CACHE
        return {
          tokensIn: state.tokensIn + usage.input_tokens + served + written,
          tokensRead: state.tokensRead + served,
          // A request that neither read nor wrote the cache left its entry as it was
          sentAt: served + written > 0 ? sentAt : state.sentAt,
          ttlMs: state.ttlMs,
        }
      })
    }
    return response
  })

  // Another model starts with no cache of its own; the switch is also the one
  // moment the engine says how long an entry lives
  on('classic.PostModelSwitch', async ($, e, next) => {
    const ttlMs = CACHE_TTLS[e.cache_ttl]
    const isSameModel = e.from_model === e.to_model
    await update($, cache, previous => {
      const state = previous ?? EMPTY_CACHE
      return { ...state, sentAt: isSameModel ? state.sentAt : null, ttlMs }
    })
    return next(e)
  })

  // The branch follows the agent: an agent that made a worktree of its own and
  // works in it edits files there, while the session stays in its own folder
  on('tool.call', { tool: ['Edit', 'Write', 'NotebookEdit'] }, async ($, e, next) => {
    const result = await next(e)
    // A subagent may edit in a worktree of its own, which goes when it ends
    if (e.agentId !== undefined || result.deny !== undefined || result.isError === true) {
      return result
    }
    const file = e.tool === 'NotebookEdit' ? e.notebook_path : e.file_path
    // A file outside the repository (a memory, a scratch file) leaves the branch as it was
    const holder = holderOf(await worktreesOf($, await $.session.cwd()), file)
    if (holder !== undefined) {
      await update($, worktree, () => holder.path)
      await update($, snapshot, shot => (shot === null ? null : { ...shot, branch: holder.branch }))
    }
    return result
  })

  // A /clear starts the conversation over: its cache counts start again, the entry's life kept
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await update($, cache, previous => (previous === null ? null : { ...EMPTY_CACHE, ttlMs: previous.ttlMs }))
    }
    return next(e)
  })

  // why: the desktop draws its own controls under the prompt and never asks the
  // mods for the hint line there, so its pills close the band above the prompt
  on('ui.render', { component: 'AbovePrompt', surface: 'desktop' }, async ($, e, next) => {
    const pills = e.props.hasSurvey ? null : await pillsNow($)
    if (pills === null) {
      return next(e)
    }
    // why: the band has one instance shared by every mod; answering without
    // next would drop what the plugins beneath draw there (prompt-enhancer's
    // buttons), so their tree goes above the pills, which stay by the prompt
    const below = await next(e)
    const { Box, Svg } = $.ui.resolve(e)

    // The row hugs its pills: on one row it is only as wide as they are, kept
    // to the left; once they wrap it spans the band and centers every row
    return (
      <Box flexDirection="column">
        {below}
        <Box flexDirection="column" alignItems="flex-start">
          <Box flexDirection="row" flexWrap="wrap" justifyContent="center" columnGap={PILL_GAP}>
            {pills.map(pill => {
              const { source, width, alt } = pictureOf(pill)
              return <Svg source={source} alt={alt} width={width} height={PICTURE_HEIGHT} />
            })}
          </Box>
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'PromptHint', surface: 'terminal' }, async ($, e, next) => {
    const pills = await pillsNow($)
    if (pills === null) {
      return next(e)
    }
    // why: the hint line has one instance shared by every mod; answering without
    // next would drop the engine's own line (the permission mode, the shortcuts)
    // and what the plugins beneath draw under it (launchpad's button), so their
    // tree goes above the pills
    const below = await next(e)

    // why: the hint line, unlike the band above the prompt, is handed no width of
    // its own; until the terminal has measured, the full bars on one row are drawn
    const columns = e.viewport?.columns ?? Number.POSITIVE_INFINITY
    const { Box, Text, Image } = $.ui.resolve(e)
    const pictures = mode === 'image' && hasImage(Image)
    const rowsOf = (cells: number) => pills.map(pill => ({ key: pill.key, runs: terminalRuns(pill, cells, pictures) }))
    const full = rowsOf(BAR_CELLS)
    const rows = widthOf(full.map(row => row.runs)) <= columns ? full : rowsOf(COMPACT_BAR_CELLS)
    // Pills that spill onto a second row center both rows, instead of leaving the second one ragged
    const wraps = widthOf(rows.map(row => row.runs)) > columns

    return (
      <Box flexDirection="column">
        {below}
        <Box flexDirection="row" flexWrap="wrap" justifyContent={wraps ? 'center' : 'flex-start'} columnGap={PILL_GAP} marginTop={1}>
          {rows.map(row => (
            <Box key={row.key} flexDirection="row" flexShrink={0}>
              {row.runs.map(run =>
                'picture' in run ? (
                  <Image source={run.picture} columns={run.columns} rows={1} alt={run.alt} />
                ) : (
                  <Text color={run.color} bold={run.bold} {...(run.background === undefined ? {} : { backgroundColor: run.background })}>
                    {run.text}
                  </Text>
                ),
              )}
            </Box>
          ))}
        </Box>
      </Box>
    )
  })
}
