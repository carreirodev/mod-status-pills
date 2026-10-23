import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On, SessionUsage, TurnUsage } from 'claude-code'
import { RELEASE_0_5_0 } from './release-0.5.0'

const PLUGIN = 'status-pills'

// 2026-10-08 17:40 in São Paulo
const NOW = Date.UTC(2026, 9, 8, 20, 40, 0)
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const OK = '#a6da95'
const WARN = '#eed49f'
const CRIT = '#ed8796'
const PROJECT = '#33dd2d'
const BRANCH = '#3a86ff'
const CHIP_TINT = '#303030'
const TRACK = '#585858'
const RULE = '#626262'

// A gray with the same red, green and blue, which a 256-color terminal keeps gray
const isGray = (hex: unknown) => typeof hex === 'string' && /^#([0-9a-f]{2})\1\1$/i.test(hex)

// The Nerd Font glyphs the terminal draws
const glyph = (code: number) => String.fromCodePoint(code)
const MODEL_ICON = glyph(0xf2db)
const RESET_ICON = glyph(0xf1da)
const FOLDER_ICON = glyph(0xe5ff)
const BRANCH_ICON = glyph(0xe0a0)
const CACHE_ICON = glyph(0xf1c0)
const LEFT_CAP = glyph(0xe0b6)
const RIGHT_CAP = glyph(0xe0b4)

// The engine's own hint line under the prompt
const HINT = '⏵⏵ auto mode on (shift+tab to cycle)'

const hint = (columns: number) => ({
  component: 'PromptHint' as const,
  props: { isDraft: false, isWorking: false, hint: HINT },
  viewport: { columns, rows: 40 },
})

const band = (hasSurvey = false) => ({
  component: 'AbovePrompt' as const,
  props: {
    hasSurvey,
    isWorking: false,
    maxRows: 12,
    bodyColumns: 195,
    scroll: { offset: 0, bodyRows: 11 },
    view: {},
  },
})

const iso = (at: number) => new Date(at).toISOString()

// Context at 23%, the 5-hour window at 48% resetting at 20:34, the 7-day one
// at 52% resetting in three days and two hours
const USAGE: SessionUsage = {
  startedAt: NOW,
  context: { tokens: 230_000, window: 1_000_000, percent: 23 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 48, resetsAt: iso(NOW + 2 * HOUR + 54 * MINUTE) },
    { kind: 'seven_day', percentUsed: 52, resetsAt: iso(NOW + 3 * DAY + 2 * HOUR) },
  ],
  cost: { usd: 1.5 },
}

// A main-loop response on a warm cache: 95,000 of its 100,000 input tokens read from it
const WARM: TurnUsage = {
  input_tokens: 1_000,
  output_tokens: 500,
  cache_read_input_tokens: 95_000,
  cache_creation_input_tokens: 4_000,
  model: 'claude-opus-5-5',
}

// A response on a cold cache: its 150,000 input tokens written to it afresh
const COLD: TurnUsage = {
  input_tokens: 0,
  output_tokens: 500,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 150_000,
  model: 'claude-opus-5-5',
}

// A worktree as `git worktree list` names it
type Tree = { path: string; branch: string | null }

// The session's folder and a worktree an agent made beside it, as git writes them
const MAIN_TREE = 'C:/Users/dev/Repository/painel-agents-mod'
const SIDE_TREE = 'C:/Users/dev/Repository/painel-agents-mod-wpc-217'
const TWO_TREES: Tree[] = [
  { path: MAIN_TREE, branch: 'main' },
  { path: SIDE_TREE, branch: 'wpc-217' },
]
// A file the agent edits in that worktree, as the edit tools name it
const SIDE_FILE = 'C:\\Users\\dev\\Repository\\painel-agents-mod-wpc-217\\app\\layout.tsx'

// `git worktree list --porcelain -z`: a NUL after each line, and one more after each worktree
const listingOf = (trees: Tree[]) =>
  trees.map(tree => `worktree ${tree.path}\0HEAD 5bb48ce\0${tree.branch === null ? 'detached' : `branch refs/heads/${tree.branch}`}\0\0`).join('')

// The engine beneath the plugin, answering as a session would; `under` is a
// text another mod beneath the plugin draws under the engine's hint line, and
// `above` one it draws in the band above the prompt
function engine(on: On, options: { branch?: string | null; worktrees?: Tree[]; under?: string; above?: string } = {}) {
  const branch = options.branch === undefined ? 'main' : options.branch
  const beneath = {
    usage: USAGE,
    // What the next model request reports; null, a response that carried no usage
    step: null as TurnUsage | null,
    clock: mock.clock(on, { now: NOW }),
    // What git lists, and whether the person refuses the edit tools' calls
    worktrees: options.worktrees ?? [{ path: MAIN_TREE, branch }],
    refusesEdits: false,
  }
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('session.root', () => ({ value: 'C:\\Users\\dev\\Repository\\painel-agents-mod' }))
  on('session.cwd', () => ({ value: 'C:\\Users\\dev\\Repository\\painel-agents-mod' }))
  on('session.usage', () => ({ value: beneath.usage }))
  // git in the session's folder: the branch checked out there, or the worktrees of its repository
  on('process.run', ($, e) => {
    const stdout = branch === null ? null : e.argv.includes('worktree') ? listingOf(beneath.worktrees) : `${branch}\n`
    return {
      value: {
        exitCode: stdout === null ? 128 : 0,
        stdout: stdout ?? '',
        stderr: stdout === null ? 'fatal: not a git repository' : '',
        isStdoutTruncated: false,
        isStderrTruncated: false,
      },
    }
  })
  on('tool.call', () => (beneath.refusesEdits ? { deny: 'The user refused this edit' } : { result: { written: true } }))
  on('ui.render', { component: 'PromptHint' }, ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const line = <Text>{e.props.hint}</Text>
    if (options.under === undefined) {
      return line
    }
    return (
      <Box flexDirection="column">
        {line}
        <Text>{options.under}</Text>
      </Box>
    )
  })
  // The band above the prompt: a survey, another mod's row, or nothing
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const text = e.props.hasSurvey ? 'survey' : options.above
    if (text === undefined) {
      // why: with no survey and no other mod the engine's own node draws nothing
      return { type: 'engine', ref: 0 }
    }
    const { Text } = $.ui.resolve(e)
    return <Text>{text}</Text>
  })
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('turn.step', async function* ($, e) {
    return {
      turnId: e.turnId,
      index: e.index,
      answer: '',
      toolUses: [],
      stopReason: 'end_turn' as const,
      usage: beneath.step,
    }
  })
  on('classic.PostModelSwitch', () => ({}))
  on('session.end', ($, e) => ({ sessionId: e.sessionId }))
  return beneath
}

const begin = ($: Engine) =>
  $.session.start({ cwd: 'C:\\Users\\dev\\Repository\\painel-agents-mod', surface: 'terminal', isInteractive: true })

// One model request of the main loop, or of a subagent
async function step($: Engine, effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max', agentId?: string) {
  const stream = $.turn.step({
    turnId: 't1',
    index: 0,
    model: 'claude-opus-5-5',
    effort,
    messageCount: 1,
    ...(agentId === undefined ? {} : { agentId }),
  })
  for await (const _ of stream) {
    // drains the response
  }
}

// The main loop editing a file
const edit = ($: Engine, file: string) => $.tool.call({ tool: 'Edit', file_path: file, old_string: 'a', new_string: 'b' })

// The terminal's hint line or the desktop's band as drawn: what the engine and
// the plugins beneath drew, then the pills' own row
const withPills = (row: object) => ({ type: 'Box', props: { flexDirection: 'column' }, children: [expect.anything(), row] })

type Found = { text: string; props: { color?: unknown; backgroundColor?: unknown; source?: unknown; alt?: unknown } }
type Mounted = { findAll: (q: { type: string }) => Promise<Found[]> }

const textsOf = async (ui: Mounted) => (await ui.findAll({ type: 'Text' })).map(t => t.text)

// The desktop's pictures, by the words each carries for a reader without it
async function picturesOf(ui: Mounted) {
  const found = await ui.findAll({ type: 'Svg' })
  return found.map(svg => ({ alt: String(svg.props.alt), source: String(svg.props.source) }))
}

test('the terminal draws every pill on one row, its tint between rounded ends', async ($, on) => {
  engine(on)
  await begin($)
  await step($, 'high')

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  const found = await ui.findAll({ type: 'Text' })
  const texts = found.map(t => t.text)
  const propsOf = (text: string) => found.find(t => t.text === text)?.props

  expect(texts).toContain(MODEL_ICON)
  expect(texts).toContain(' Opus 5.5')
  expect(texts).toContain(' high')
  expect(texts).toContain(' ctx')
  expect(texts).toContain(' 23%')
  // The 5-hour window by the time left alone, the 7-day one by its reset date alone
  expect(texts).toContain(' 48%')
  expect(texts).toContain(` ${RESET_ICON}`)
  expect(texts).toContain(' 2h54')
  expect(texts).toContain(' 52%')
  expect(texts).toContain(' 11/10 19h')
  expect(texts.some(text => text.includes('20:34') || text.includes('3d02h'))).toBe(false)
  // Five pills, each closed by its two rounded ends
  expect(texts.filter(text => text === LEFT_CAP)).toHaveLength(5)
  expect(texts.filter(text => text === RIGHT_CAP)).toHaveLength(5)
  expect(propsOf(' 48%')?.backgroundColor).toBe(CHIP_TINT)
  expect(propsOf(LEFT_CAP)?.backgroundColor).toBeUndefined()
  // Every pill sits on the same tint, its rounded ends drawn in it
  expect([...new Set(found.filter(t => t.props.backgroundColor !== undefined).map(t => t.props.backgroundColor))]).toEqual([CHIP_TINT])
  expect(found.filter(t => t.text === LEFT_CAP || t.text === RIGHT_CAP).every(t => t.props.color === CHIP_TINT)).toBe(true)
  // The empty cells of a bar and the separator stay faint on it: ctx at 23% leaves five of six
  expect(propsOf('▓▓▓▓▓')?.color).toBe(TRACK)
  expect(found.filter(t => t.text === ' │').map(t => t.props.color)).toEqual([RULE, RULE])
  // The surface, its ends, the empty cells and the separators are all grays
  const surface = [
    ...found.filter(t => t.props.backgroundColor !== undefined).map(t => t.props.backgroundColor),
    ...found.filter(t => t.text === LEFT_CAP || t.text === RIGHT_CAP || t.text === ' │').map(t => t.props.color),
    propsOf('▓▓▓▓▓')?.color,
  ]
  expect(surface.every(isGray)).toBe(true)
  await ui.unmount()
})

test("the terminal's pills go a blank row under the engine's hint line, which stays as it draws it", async ($, on) => {
  engine(on)
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  expect(await ui.drawn()).toMatchObject(withPills({ type: 'Box' }))
  expect(await ui.drawn()).toMatchObject({ children: [{ type: 'Text' }, expect.anything()] })
  expect((await textsOf(ui))[0]).toBe(HINT)
  expect(await ui.drawn()).toMatchObject(withPills({ type: 'Box', props: { marginTop: 1 } }))
  await ui.unmount()
})

test('the desktop leaves the hint line to the engine, which it never asks the mods to draw', async ($, on) => {
  engine(on)
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...hint(200) })
  expect(await textsOf(ui)).toEqual([HINT])
  expect(await picturesOf(ui)).toEqual([])
  await ui.unmount()
})

test("the desktop's pills close the band above the prompt, under what the other mods draw there", async ($, on) => {
  // why: the band is one instance shared by every mod; prompt-enhancer draws
  // its buttons there, and the pills stay last, right above the prompt
  engine(on, { above: '✦ Enhance  ➤ Send' })
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...band() })
  expect(await ui.drawn()).toMatchObject(withPills({ type: 'Box' }))
  expect(await ui.drawn()).toMatchObject({ children: [{ type: 'Text' }, expect.anything()] })
  expect(await textsOf(ui)).toEqual(['✦ Enhance  ➤ Send'])
  expect((await picturesOf(ui)).map(picture => picture.alt)).toContain('Opus 5.5')
  await ui.unmount()
})

test('a terminal that has not measured draws the full bars on one row', async ($, on) => {
  engine(on)
  await begin($)

  const { viewport: _, ...unmeasured } = hint(80)
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...unmeasured })
  expect(await ui.drawn()).toMatchObject(withPills({ type: 'Box', props: { justifyContent: 'flex-start' } }))
  // ctx at 23% of six cells: one filled, five of track
  expect(await textsOf(ui)).toContain('▓▓▓▓▓')
  await ui.unmount()
})

test('a terminal band that spills onto a second row centers both rows', async ($, on) => {
  engine(on)
  await begin($)

  // At 200 columns every pill fits on one row, kept to the left
  const wide = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  expect(await wide.drawn()).toMatchObject(withPills({ type: 'Box', props: { justifyContent: 'flex-start' } }))
  await wide.unmount()

  // At 80 even the short bars leave the pills too wide for one row
  const narrow = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(80) })
  expect(await narrow.drawn()).toMatchObject(withPills({ type: 'Box', props: { justifyContent: 'center' } }))
  await narrow.unmount()
})

test('the desktop centers wrapped rows and keeps a single row to the left', async ($, on) => {
  engine(on)
  await begin($)

  // The desktop lays the pictures out itself: a column that does not stretch
  // its row lets one row hug the left, while a wrapped row spans the band
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...band() })
  expect(await ui.drawn()).toMatchObject(
    withPills({
      type: 'Box',
      props: { flexDirection: 'column', alignItems: 'flex-start' },
      children: [{ type: 'Box', props: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' } }],
    }),
  )
  await ui.unmount()
})

test('each desktop picture leaves two clear pixels above and below its pill', async ($, on) => {
  engine(on)
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...band() })
  const found = await ui.findAll({ type: 'Svg' })

  expect(found).toHaveLength(5)
  for (const svg of found) {
    const source = String(svg.props.source)
    // A 22-pixel pill in a 26-pixel picture, its view box starting 2 above it
    expect(svg.props.height).toBe(26)
    expect(source).toMatch(/^<svg [^>]*height="26" viewBox="0 -2 \d+ 26">/)
    expect(source).toContain('height="21" rx="10.5"')
  }
  await ui.unmount()
})

test('the desktop draws every pill as a picture holding the same words', async ($, on) => {
  engine(on)
  await begin($)
  await step($, 'high')

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...band() })
  const pictures = await picturesOf(ui)

  expect(pictures.map(picture => picture.alt)).toEqual([
    'Opus 5.5 high',
    'ctx 23%',
    '5h 48% | 2h54',
    '7D 52% | 11/10 19h',
    'painel-agents-mod main',
  ])
  for (const picture of pictures) {
    expect(picture.source.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    // Its colors switch with the desktop's theme
    expect(picture.source).toContain('@media (prefers-color-scheme: dark)')
  }
  // An empty band holds no text: the pills are pictures alone
  expect(await textsOf(ui)).toEqual([])
  await ui.unmount()
})

test('a narrow terminal band keeps the resets and shortens the bars', async ($, on) => {
  engine(on)
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(80) })
  const texts = await textsOf(ui)

  expect(texts).toContain(' 2h54')
  expect(texts).toContain(' 11/10 19h')
  // ctx at 23% of five cells: one filled, four of track
  expect(texts).toContain(' ▓')
  expect(texts).toContain('▓▓▓▓')
  await ui.unmount()
})

test('bars take the status line colors: green under 50%, yellow under 80%, red from 80%', async ($, on) => {
  const beneath = engine(on)
  beneath.usage = {
    ...USAGE,
    context: { tokens: 300_000, window: 1_000_000, percent: 30 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 60, resetsAt: iso(NOW + HOUR) },
      { kind: 'seven_day', percentUsed: 90, resetsAt: iso(NOW + DAY) },
    ],
  }
  await begin($)

  const terminal = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  const found = await terminal.findAll({ type: 'Text' })
  const colorOf = (text: string) => found.find(t => t.text === text)?.props.color

  expect(colorOf(' ▓▓')).toBe(OK)
  expect(colorOf(' ▓▓▓▓')).toBe(WARN)
  expect(colorOf(' ▓▓▓▓▓')).toBe(CRIT)
  // In the limit pills only the bars carry a severity color: no icon or label shares it
  const severe = found.filter(t => [OK, WARN, CRIT].includes(String(t.props.color)))
  expect(severe.map(t => t.text)).toEqual([' ▓▓', ' ▓▓▓▓', ' ▓▓▓▓▓'])
  await terminal.unmount()

  const desktop = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...band() })
  const sourceOf = async (alt: string) => (await picturesOf(desktop)).find(picture => picture.alt.startsWith(alt))?.source

  expect(await sourceOf('ctx')).toContain(OK)
  expect(await sourceOf('5h')).toContain(WARN)
  expect(await sourceOf('7D')).toContain(CRIT)
  await desktop.unmount()
})

test('before the first response: the model and the project alone', async ($, on) => {
  const beneath = engine(on)
  beneath.usage = { ...USAGE, context: { window: 1_000_000 }, rateLimits: [] }
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  const texts = await textsOf(ui)

  expect(texts).toContain(' Opus 5.5')
  expect(texts).toContain(' painel-agents-mod')
  expect(texts).toContain(' main')
  expect(texts).not.toContain(' ctx')
  expect(texts).not.toContain(` ${RESET_ICON}`)
  expect(texts).not.toContain(CACHE_ICON)
  await ui.unmount()
})

test("a subagent's effort does not replace the main loop's", async ($, on) => {
  engine(on)
  await begin($)
  await step($, 'medium')
  await step($, 'max', 'a1')

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  const texts = await textsOf(ui)

  expect(texts).toContain(' medium')
  expect(texts).not.toContain(' max')
  await ui.unmount()
})

test('the countdowns move with the clock, and a new measurement shows new numbers', async ($, on) => {
  const beneath = engine(on)
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  await beneath.clock.advance(4 * MINUTE)
  expect(await textsOf(ui)).toContain(' 2h50')

  beneath.usage = {
    ...USAGE,
    context: { tokens: 410_000, window: 1_000_000, percent: 41 },
  }
  await $.session.measure({ context: beneath.usage.context, rateLimits: beneath.usage.rateLimits, changed: ['context'] })
  expect(await textsOf(ui)).toContain(' 41%')
  await ui.unmount()
})

test('outside a git repository the project pill has no branch', async ($, on) => {
  engine(on, { branch: null })
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  const texts = await textsOf(ui)

  expect(texts).toContain(' painel-agents-mod')
  expect(texts.some(text => text.includes(BRANCH_ICON))).toBe(false)
  await ui.unmount()
})

test('the project in green after its folder, the branch in blue after its glyph', async ($, on) => {
  engine(on)
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  const found = await ui.findAll({ type: 'Text' })
  const colorOf = (text: string) => found.find(t => t.text === text)?.props.color

  expect(colorOf(FOLDER_ICON)).toBe(PROJECT)
  expect(colorOf(' painel-agents-mod')).toBe(PROJECT)
  expect(colorOf(` ${BRANCH_ICON}`)).toBe(BRANCH)
  expect(colorOf(' main')).toBe(BRANCH)
  expect(found.some(t => t.text.includes('·'))).toBe(false)
  await ui.unmount()
})

test("an edit in another worktree of the repository shows that worktree's branch", async ($, on) => {
  const beneath = engine(on, { worktrees: TWO_TREES })
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  expect(await textsOf(ui)).toContain(' main')

  await edit($, SIDE_FILE)
  expect(await textsOf(ui)).toContain(' wpc-217')
  // The session stays in its own folder, and the next reading keeps the agent's branch
  await beneath.clock.advance(MINUTE)
  expect(await textsOf(ui)).toContain(' painel-agents-mod')
  expect(await textsOf(ui)).toContain(' wpc-217')

  // A file back in the session's folder, its drive letter in another case, brings its branch back
  await $.tool.call({ tool: 'Write', file_path: 'c:\\users\\dev\\repository\\painel-agents-mod\\README.md', content: '' })
  expect(await textsOf(ui)).toContain(' main')
  expect(await textsOf(ui)).not.toContain(' wpc-217')
  await ui.unmount()
})

test('a file outside the repository leaves the branch where the agent was working', async ($, on) => {
  engine(on, { worktrees: TWO_TREES })
  await begin($)
  await edit($, SIDE_FILE)
  await $.tool.call({ tool: 'Write', file_path: 'C:\\Users\\dev\\.claude\\projects\\painel\\memory\\notes.md', content: '' })

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  expect(await textsOf(ui)).toContain(' wpc-217')
  await ui.unmount()
})

test("once that worktree is removed the branch is the session folder's again", async ($, on) => {
  const beneath = engine(on, { worktrees: TWO_TREES })
  await begin($)
  await edit($, SIDE_FILE)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  expect(await textsOf(ui)).toContain(' wpc-217')
  beneath.worktrees = TWO_TREES.slice(0, 1)
  await beneath.clock.advance(MINUTE)
  expect(await textsOf(ui)).toContain(' main')
  await ui.unmount()
})

test('a refused edit leaves the branch as it was', async ($, on) => {
  const beneath = engine(on, { worktrees: TWO_TREES })
  beneath.refusesEdits = true
  await begin($)
  await edit($, SIDE_FILE)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  expect(await textsOf(ui)).toContain(' main')
  expect(await textsOf(ui)).not.toContain(' wpc-217')
  await ui.unmount()
})

test("a worktree inside the session's folder is told apart from it", async ($, on) => {
  engine(on, { worktrees: [...TWO_TREES, { path: `${MAIN_TREE}/.claude/worktrees/fix-header`, branch: 'fix-header' }] })
  await begin($)
  await edit($, 'C:\\Users\\dev\\Repository\\painel-agents-mod\\.claude\\worktrees\\fix-header\\app\\header.tsx')

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  expect(await textsOf(ui)).toContain(' fix-header')
  await ui.unmount()
})

test('the desktop writes a branch name into its picture as text, never as markup', async ($, on) => {
  engine(on, { branch: 'feat/a&b<c>' })
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...band() })
  const project = (await picturesOf(ui)).find(picture => picture.alt.startsWith('painel-agents-mod'))

  expect(project?.alt).toBe('painel-agents-mod feat/a&b<c>')
  expect(project?.source).toContain('feat/a&#38;b&#60;c&#62;')
  expect(project?.source).not.toContain('a&b<c>')
  await ui.unmount()
})

test('the terminal keeps what another mod draws under the hint line, above the pills', async ($, on) => {
  // why: the hint line is one instance shared by every mod; launchpad draws
  // its button under the engine's line, and answering without next drops it
  engine(on, { under: '◆ pad' })
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  expect(await ui.drawn()).toMatchObject({
    type: 'Box',
    props: { flexDirection: 'column' },
    children: [{ type: 'Box', children: [{ type: 'Text' }, { type: 'Text' }] }, { type: 'Box' }],
  })
  expect((await textsOf(ui)).slice(0, 2)).toEqual([HINT, '◆ pad'])
  expect(await textsOf(ui)).toContain(' Opus 5.5')
  await ui.unmount()
})

test('the terminal leaves the band above the prompt to the engine and the other mods', async ($, on) => {
  engine(on, { above: '✦ Enhance  ➤ Send' })
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...band() })
  expect(await textsOf(ui)).toEqual(['✦ Enhance  ➤ Send'])
  await ui.unmount()
})

test('the desktop yields the band to a survey', async ($, on) => {
  engine(on, { above: '✦ Enhance  ➤ Send' })
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...band(true) })
  expect(await textsOf(ui)).toEqual(['survey'])
  expect(await picturesOf(ui)).toEqual([])
  await ui.unmount()
})

// The classic hook a /model raises once the session runs on `to`
const switchTo = ($: Engine, to: string, ttl: '5m' | '1h') =>
  $.classic.PostModelSwitch({
    from_model: 'claude-opus-5-5',
    to_model: to,
    requested_model: null,
    source: 'command',
    context_tokens: 100_000,
    prompt_cache_warm: true,
    cache_ttl: ttl,
    estimated_cache_write_usd: 0.5,
    pricing: 'catalog',
  })

test('the cache pill closes the row: the minutes its entry stays warm and the share it served', async ($, on) => {
  const beneath = engine(on)
  await begin($)
  beneath.step = WARM
  await step($, 'high')

  const terminal = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  const found = await terminal.findAll({ type: 'Text' })
  const texts = found.map(t => t.text)

  // Its icon, a fresh hour in green, then 95 of every 100 input tokens read from the cache
  expect(texts.slice(-7)).toEqual([LEFT_CAP, ' ', CACHE_ICON, ' 60m', ' 95%', ' ', RIGHT_CAP])
  expect(found.find(t => t.text === ' 60m')?.props.color).toBe(OK)
  expect(texts.filter(text => text === LEFT_CAP)).toHaveLength(6)
  await terminal.unmount()

  const desktop = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...band() })
  const pictures = await picturesOf(desktop)
  expect(pictures.at(-1)?.alt).toBe('60m 95%')
  expect(pictures.at(-1)?.source).toContain(OK)
  await desktop.unmount()
})

test('the minutes count down, yellow past half the hour and red past 80% of it, then say frio', async ($, on) => {
  const beneath = engine(on)
  await begin($)
  beneath.step = WARM
  await step($, 'high')

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  const colorOf = async (text: string) => (await ui.findAll({ type: 'Text' })).find(t => t.text === text)?.props.color

  await beneath.clock.advance(31 * MINUTE)
  expect(await colorOf(' 29m')).toBe(WARN)
  await beneath.clock.advance(18 * MINUTE)
  expect(await colorOf(' 11m')).toBe(CRIT)
  await beneath.clock.advance(11 * MINUTE)
  expect(await colorOf(' frio')).toBe(CRIT)
  expect(await textsOf(ui)).toContain(' 95%')

  // The next response writes the cache afresh: a new hour, and the share counts what it paid for
  beneath.step = COLD
  await step($, 'high')
  expect(await colorOf(' 60m')).toBe(OK)
  expect(await textsOf(ui)).toContain(' 38%')
  await ui.unmount()
})

test("a subagent's requests leave the main loop's cache pill as it was", async ($, on) => {
  const beneath = engine(on)
  await begin($)
  beneath.step = WARM
  await step($, 'high')
  await beneath.clock.advance(10 * MINUTE)
  beneath.step = COLD
  await step($, 'high', 'a1')

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  const texts = await textsOf(ui)
  expect(texts).toContain(' 50m')
  expect(texts).toContain(' 95%')
  await ui.unmount()
})

test('a response that neither read nor wrote the cache leaves its entry to run down', async ($, on) => {
  const beneath = engine(on)
  await begin($)
  beneath.step = WARM
  await step($, 'high')
  await beneath.clock.advance(10 * MINUTE)
  beneath.step = { ...WARM, input_tokens: 1_000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
  await step($, 'high')

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  const texts = await textsOf(ui)
  expect(texts).toContain(' 50m')
  // 95,000 read of 101,000 sent
  expect(texts).toContain(' 94%')
  await ui.unmount()
})

test('another model starts cold, and the switch says how long an entry lives', async ($, on) => {
  const beneath = engine(on)
  await begin($)
  beneath.step = WARM
  await step($, 'high')

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  // Asking for the model already running keeps its cache
  await switchTo($, 'claude-opus-5-5', '1h')
  expect(await textsOf(ui)).toContain(' 60m')

  await switchTo($, 'claude-sonnet-5-5', '5m')
  expect(await textsOf(ui)).toContain(' frio')

  // Its first response starts an entry of five minutes
  await step($, 'high')
  expect(await textsOf(ui)).toContain(' 5m')
  await ui.unmount()
})

test('a /clear hides the cache pill until the next response, which keeps the known lifetime', async ($, on) => {
  const beneath = engine(on)
  await begin($)
  beneath.step = WARM
  await step($, 'high')
  await switchTo($, 'claude-sonnet-5-5', '5m')

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  expect(await textsOf(ui)).toContain(CACHE_ICON)

  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  expect(await textsOf(ui)).not.toContain(CACHE_ICON)

  await step($, 'high')
  const texts = await textsOf(ui)
  expect(texts).toContain(' 5m')
  expect(texts).toContain(' 95%')
  await ui.unmount()
})

// Pictures in the terminal: where it draws them, the bars and the icons are
// pictures the mod paints, in the cells their characters take

// What the terminals put in a session's environment
const NOCTTY = { GHOSTTY_RESOURCES_DIR: 'C:\\Program Files\\noctty/share\\ghostty', TERM: 'xterm-ghostty', TERM_PROGRAM: 'ghostty' }
const KITTY = { KITTY_WINDOW_ID: '1', TERM: 'xterm-kitty' }
const WINDOWS_TERMINAL = { WT_SESSION: '0f6c3a4e-2b1d-4c55-9a3e-7d1f2c8b9e01' }
const VS_CODE = { TERM_PROGRAM: 'vscode', TERM: 'xterm-256color' }
const IN_TMUX = { TMUX: '/tmp/tmux-1000/default,4242,0' }
const IN_SCREEN = { STY: '4242.pts-0.host' }

const CONTEXT_ICON = glyph(0xf086)
const FIVE_HOUR_ICON = glyph(0xf0e4)
const SEVEN_DAY_ICON = glyph(0xf073)
const METER = '#8aadf4'
const TIME = '#b8c0e0'
// The icons of a full band, in the order it draws them, each with its glyph's color
const ICONS = [
  { alt: MODEL_ICON, color: '#c6a0f6' },
  { alt: CONTEXT_ICON, color: METER },
  { alt: FIVE_HOUR_ICON, color: METER },
  { alt: RESET_ICON, color: TIME },
  { alt: SEVEN_DAY_ICON, color: METER },
  { alt: RESET_ICON, color: TIME },
  { alt: FOLDER_ICON, color: PROJECT },
  { alt: BRANCH_ICON, color: BRANCH },
  { alt: CACHE_ICON, color: METER },
]

// The environment the plugin reads, which a test can change before starting the session again
function environment(on: On, variables: Record<string, string>) {
  const env = { variables }
  on('env.get', ($, e) => ({ value: env.variables[e.name] }))
  return env
}

// A session as RELEASE_0_5_0 was recorded: past one `high` response on a warm cache
async function warmSession($: Engine, on: On, variables: Record<string, string>) {
  const env = environment(on, variables)
  const beneath = engine(on)
  await begin($)
  beneath.step = WARM
  await step($, 'high')
  return { beneath, env }
}

const { viewport: _unmeasured, ...UNMEASURED } = hint(80)
const terminalAt = ($: Engine, columns?: number) =>
  $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...(columns === undefined ? UNMEASURED : hint(columns)) })

type Node = { type: string; props?: Record<string, unknown>; children?: unknown[] }
type Drawing = { drawn: () => Promise<unknown> }

// The pills of the terminal's band, each a row of Texts and Images, and the row
// that holds them; each Image comes out of the Box that lays the tint under it
async function pillsDrawn(ui: Drawing) {
  const tree = (await ui.drawn()) as Node
  const row = tree.children?.[1] as Node
  const unwrapped = (part: Node) => {
    const [inner] = (part.children ?? []) as Node[]
    return part.type === 'Box' && inner?.type === 'Image' ? inner : part
  }
  return (row.children as Node[]).map(pill => ({ key: String(pill.props?.key), parts: (pill.children as Node[]).map(unwrapped), row }))
}

const isBarAlt = (alt: unknown) => typeof alt === 'string' && /^[▓░]+$/.test(alt)

// The bar of each pill that has one, with the part drawn right before it
async function barsOf(ui: Drawing) {
  return (await pillsDrawn(ui)).flatMap(pill =>
    pill.parts.flatMap((part, at) =>
      part.type === 'Image' && isBarAlt(part.props?.alt) ? [{ key: pill.key, props: part.props ?? {}, before: pill.parts[at - 1] }] : [],
    ),
  )
}

// The icons, in the order drawn
async function iconsOf(ui: Drawing) {
  return (await pillsDrawn(ui)).flatMap(pill => pill.parts.filter(part => part.type === 'Image' && !isBarAlt(part.props?.alt)).map(part => part.props ?? {}))
}

// How many columns a pill takes: its texts' characters and its pictures' cells
const columnsOf = (parts: Node[]) =>
  parts.reduce((sum, part) => sum + (part.type === 'Image' ? Number(part.props?.columns) : [...(part.children ?? []).join('')].length), 0)

// A picture as the terminal is handed it: its size, and each pixel's color and alpha
function pixelsOf(source: unknown) {
  const { rgba, width, height } = source as { rgba: string; width: number; height: number }
  const bytes = Uint8Array.from(atob(rgba), char => char.charCodeAt(0))
  expect(bytes.length).toBe(width * height * 4)
  const byte = (x: number, y: number, channel: number) => bytes[4 * (y * width + x) + channel] ?? -1
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  const colorAt = (x: number, y: number) => `#${hex(byte(x, y, 0))}${hex(byte(x, y, 1))}${hex(byte(x, y, 2))}`
  return {
    width,
    height,
    colorAt,
    alphaAt: (x: number, y: number) => byte(x, y, 3),
    row: (y: number) => Array.from({ length: width }, (_, x) => colorAt(x, y)),
    column: (x: number) => Array.from({ length: height }, (_, y) => colorAt(x, y)),
    every: (holds: (x: number, y: number) => boolean) =>
      Array.from({ length: width * height }, (_, at) => holds(at % width, Math.floor(at / width))).every(Boolean),
  }
}

const rgbOf = (hex: string) => [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16))
const distance = (a: string, b: string) => Math.hypot(...rgbOf(a).map((v, at) => v - (rgbOf(b)[at] ?? 0)))

const PICTURE_TERMINALS: [string, Record<string, string>][] = [
  ['GHOSTTY_RESOURCES_DIR', { GHOSTTY_RESOURCES_DIR: '/usr/share/ghostty' }],
  ['KITTY_WINDOW_ID', { KITTY_WINDOW_ID: '1' }],
  ['TERM=xterm-ghostty', { TERM: 'xterm-ghostty' }],
  ['TERM=xterm-kitty', { TERM: 'xterm-kitty' }],
  ['TERM_PROGRAM=ghostty', { TERM_PROGRAM: 'ghostty' }],
  ['noctty', NOCTTY],
]

for (const [name, variables] of PICTURE_TERMINALS) {
  test(`pictures: ${name} draws the bars as pictures`, async ($, on) => {
    await warmSession($, on, variables)
    const ui = await terminalAt($, 200)
    expect((await barsOf(ui)).map(bar => bar.key)).toEqual(['context', 'five-hour', 'seven-day'])
    expect((await textsOf(ui)).some(text => /[▓░]/.test(text))).toBe(false)
    await ui.unmount()
  })
}

const NO_PICTURES: [string, Record<string, string>][] = [
  ['tmux', IN_TMUX],
  ['screen', IN_SCREEN],
  ['a background session', { CLAUDE_CODE_SESSION_KIND: 'bg' }],
]

for (const [name, variables] of NO_PICTURES) {
  test(`pictures: ${name} keeps the 0.5.0 band`, async ($, on) => {
    await warmSession($, on, { ...NOCTTY, ...KITTY, ...variables })
    const ui = await terminalAt($, 200)
    expect(await ui.drawn()).toEqual(RELEASE_0_5_0.terminal.wide)
    await ui.unmount()
  })
}

// How a session started again in `variables` draws the band: `image` when the
// three bars are Images and no text is a shade, `text` when it is the 0.5.0 band
async function modeIn($: Engine, env: { variables: Record<string, string> }, variables: Record<string, string>) {
  env.variables = variables
  await begin($)
  const ui = await terminalAt($, 200)
  const images = await ui.findAll({ type: 'Image' })
  const drawn = await ui.drawn()
  const bars = (await barsOf(ui)).map(bar => bar.key)
  const shaded = (await textsOf(ui)).some(text => /[▓░]/.test(text))
  await ui.unmount()
  if (images.length === 0) {
    expect(drawn).toEqual(RELEASE_0_5_0.terminal.wide)
    return 'text'
  }
  expect(bars).toEqual(['context', 'five-hour', 'seven-day'])
  expect(shaded).toBe(false)
  return 'image'
}

test('pictures: CLAUDE_CODE_FORCE_TERMINAL_IMAGES draws pictures even inside tmux or screen', async ($, on) => {
  const { env } = await warmSession($, on, WINDOWS_TERMINAL)
  expect(await modeIn($, env, { ...NOCTTY, ...IN_TMUX, CLAUDE_CODE_FORCE_TERMINAL_IMAGES: '1' })).toBe('image')
  expect(await modeIn($, env, { ...NOCTTY, ...IN_SCREEN, CLAUDE_CODE_FORCE_TERMINAL_IMAGES: '1' })).toBe('image')
  expect(await modeIn($, env, { ...WINDOWS_TERMINAL, CLAUDE_CODE_FORCE_TERMINAL_IMAGES: '1' })).toBe('image')
  // Empty, it forces nothing
  expect(await modeIn($, env, { ...NOCTTY, ...IN_TMUX, CLAUDE_CODE_FORCE_TERMINAL_IMAGES: '' })).toBe('text')
})

test('pictures: CLAUDE_STATUS_PILLS_RENDERER=text and =image win over the rules, any other value is ignored', async ($, on) => {
  const { env } = await warmSession($, on, WINDOWS_TERMINAL)
  expect(await modeIn($, env, { ...NOCTTY, CLAUDE_STATUS_PILLS_RENDERER: 'text' })).toBe('text')
  expect(await modeIn($, env, { ...NOCTTY, CLAUDE_CODE_FORCE_TERMINAL_IMAGES: '1', CLAUDE_STATUS_PILLS_RENDERER: 'text' })).toBe('text')
  expect(await modeIn($, env, { ...WINDOWS_TERMINAL, CLAUDE_STATUS_PILLS_RENDERER: 'image' })).toBe('image')
  expect(await modeIn($, env, { ...NOCTTY, ...IN_TMUX, CLAUDE_STATUS_PILLS_RENDERER: 'image' })).toBe('image')
  for (const value of ['IMAGE', 'blocks', '']) {
    expect(await modeIn($, env, { ...NOCTTY, CLAUDE_STATUS_PILLS_RENDERER: value })).toBe('image')
    expect(await modeIn($, env, { ...WINDOWS_TERMINAL, CLAUDE_STATUS_PILLS_RENDERER: value })).toBe('text')
  }
})

test('pictures: Windows Terminal and VS Code keep the 0.5.0 band', async ($, on) => {
  const { env } = await warmSession($, on, WINDOWS_TERMINAL)
  for (const variables of [WINDOWS_TERMINAL, VS_CODE]) {
    env.variables = variables
    await begin($)
    for (const [columns, drawn] of [
      [200, RELEASE_0_5_0.terminal.wide],
      [80, RELEASE_0_5_0.terminal.narrow],
      [undefined, RELEASE_0_5_0.terminal.unmeasured],
    ] as const) {
      const ui = await terminalAt($, columns)
      expect(await ui.drawn()).toEqual(drawn)
      await ui.unmount()
    }
  }
})

test('pictures: a table without Image keeps the 0.5.0 band', async ($, on) => {
  // An engine from before Image, or a mod that leaves it out of the table
  on('ui.resolve', async ($, e, next) => {
    const { Image: _, ...table } = (await next(e)) as Record<string, unknown>
    return table as never
  })
  await warmSession($, on, { ...NOCTTY, CLAUDE_STATUS_PILLS_RENDERER: 'image' })
  const ui = await terminalAt($, 200)
  expect(await ui.drawn()).toEqual(RELEASE_0_5_0.terminal.wide)
  await ui.unmount()
})

test('pictures: before session.start decides, a stored snapshot is drawn in text', async ($, on) => {
  environment(on, NOCTTY)
  engine(on)
  // What the session stored before the mod reloaded, read until it starts again
  const stored = {
    model: 'claude-opus-5-5',
    contextPercent: 23,
    fiveHour: { percent: 48, resetsAt: NOW + 2 * HOUR + 54 * MINUTE },
    sevenDay: { percent: 52, resetsAt: NOW + 3 * DAY + 2 * HOUR },
    project: 'painel-agents-mod',
    branch: 'main',
    at: NOW,
  }
  const reload = { done: false }
  on('state.get', ($, e, next) => (!reload.done && e.key === 'snapshot' ? { value: { value: stored, version: 1 } } : next(e)))

  const ui = await terminalAt($, 200)
  expect(await ui.findAll({ type: 'Image' })).toEqual([])
  expect(await textsOf(ui)).toContain('▓▓▓▓▓')
  reload.done = true
  await begin($)
  expect((await barsOf(ui)).map(bar => bar.key)).toEqual(['context', 'five-hour', 'seven-day'])
  await ui.unmount()
})

test('pictures: each bar is an Image of six cells, five when the band shrinks, after a space on the tint', async ($, on) => {
  await warmSession($, on, NOCTTY)
  for (const [columns, cells] of [
    [200, 6],
    [80, 5],
  ]) {
    const ui = await terminalAt($, columns)
    const bars = await barsOf(ui)
    expect(bars).toHaveLength(3)
    for (const bar of bars) {
      expect(bar.props.columns).toBe(cells)
      expect(bar.props.rows).toBe(1)
      expect(bar.before).toMatchObject({ type: 'Text', props: { backgroundColor: CHIP_TINT }, children: [' '] })
    }
    await ui.unmount()
  }
})

test('pictures: a bar picture is opaque, 3:1 on six cells and 5:2 on five, its corners on the tint', async ($, on) => {
  await warmSession($, on, NOCTTY)
  for (const [columns, ratio] of [
    [200, 3],
    [80, 5 / 2],
  ]) {
    const ui = await terminalAt($, columns)
    const bars = await barsOf(ui)
    expect(bars).toHaveLength(3)
    for (const bar of bars) {
      const picture = pixelsOf(bar.props.source)
      expect(picture.width / picture.height).toBe(ratio)
      expect(picture.every((x, y) => picture.alphaAt(x, y) === 255)).toBe(true)
      const [right, bottom] = [picture.width - 1, picture.height - 1]
      expect([picture.colorAt(0, 0), picture.colorAt(right, 0), picture.colorAt(0, bottom), picture.colorAt(right, bottom)]).toEqual([
        CHIP_TINT,
        CHIP_TINT,
        CHIP_TINT,
        CHIP_TINT,
      ])
    }
    await ui.unmount()
  }
})

// The bars' pictures in a band whose context and limits stand at these percents
async function barsAt($: Engine, on: On, context: number, fiveHour: number, sevenDay: number) {
  environment(on, NOCTTY)
  const beneath = engine(on)
  beneath.usage = {
    ...USAGE,
    context: { tokens: context * 10_000, window: 1_000_000, percent: context },
    rateLimits: [
      { kind: 'five_hour', percentUsed: fiveHour, resetsAt: iso(NOW + HOUR) },
      { kind: 'seven_day', percentUsed: sevenDay, resetsAt: iso(NOW + DAY) },
    ],
  }
  await begin($)
  const ui = await terminalAt($, 200)
  const bars = await barsOf(ui)
  await ui.unmount()
  expect(bars.map(bar => bar.key)).toEqual(['context', 'five-hour', 'seven-day'])
  return bars.map(bar => pixelsOf(bar.props.source))
}

test('pictures: a bar is a thin track with round ends, filled from the left in its severity color', async ($, on) => {
  const bars = await barsAt($, on, 30, 60, 90)
  bars.forEach((bar, at) => {
    const middle = Math.floor(bar.height / 2)
    // The track runs the whole width
    expect(bar.row(middle).every(color => color !== CHIP_TINT)).toBe(true)
    // 6 of 22 of the height, centered
    const painted = bar.column(Math.floor(bar.width / 2)).map(color => color !== CHIP_TINT)
    const thickness = painted.filter(Boolean).length
    expect(Math.abs(thickness - (6 / 22) * bar.height)).toBeLessThanOrEqual(1)
    const top = painted.indexOf(true)
    const below = bar.height - 1 - painted.lastIndexOf(true)
    expect(Math.abs(top - below)).toBeLessThanOrEqual(1)
    // Round ends: the corners of the track's first row stay on the tint
    expect(bar.colorAt(0, top)).toBe(CHIP_TINT)
    expect(bar.colorAt(bar.width - 1, top)).toBe(CHIP_TINT)
    expect(bar.colorAt(Math.floor(bar.width / 2), top)).not.toBe(CHIP_TINT)
    // The fill starts at the left end, in the bar's severity color, and runs
    // whole to its share of the width
    const share = [0.3, 0.6, 0.9][at] ?? 0
    expect([...new Set(bar.row(middle).slice(0, Math.floor(share * bar.width)))]).toEqual([[OK, WARN, CRIT][at]])
  })
  // Past the fill, the track's gray
  const [context] = bars
  expect(context?.colorAt(Math.floor(0.75 * context.width), Math.floor(context.height / 2))).toBe(TRACK)
})

test('pictures: at 50% the fill covers half the width', async ($, on) => {
  const [context] = await barsAt($, on, 50, 10, 10)
  const middle = Math.floor((context?.height ?? 0) / 2)
  const width = context?.width ?? 0
  expect(context?.colorAt(Math.floor(0.25 * width), middle)).toBe(WARN)
  expect(context?.colorAt(Math.floor(0.75 * width), middle)).toBe(TRACK)
})

test('pictures: 0% shows the track alone, 1% a round stub as wide as the bar is thick, 120% stays inside the track', async ($, on) => {
  const [empty, stub, over] = await barsAt($, on, 0, 1, 120)
  if (empty === undefined || stub === undefined || over === undefined) {
    throw new Error('three bars expected')
  }
  expect(empty.every((x, y) => empty.colorAt(x, y) !== OK)).toBe(true)

  const thickness = stub.column(Math.floor(stub.width / 2)).filter(color => color !== CHIP_TINT).length
  const filled = stub.row(Math.floor(stub.height / 2)).filter(color => color === OK).length
  expect(Math.abs(filled - thickness)).toBeLessThanOrEqual(1)

  const middle = over.row(Math.floor(over.height / 2))
  const end = Math.ceil(thickness / 2)
  expect(middle.slice(end, over.width - end).some(color => color === TRACK)).toBe(false)

  // The stub's right end is round: on the track's first and last rows its last column is the track's gray
  const painted = empty.column(Math.floor(empty.width / 2)).map(color => color !== CHIP_TINT)
  const [top, bottom] = [painted.indexOf(true), painted.lastIndexOf(true)]
  expect([stub.colorAt(thickness - 1, top), stub.colorAt(thickness - 1, bottom)]).toEqual([TRACK, TRACK])
  // Neither the stub nor the full bar paints outside the track
  for (const bar of [stub, over]) {
    expect(empty.every((x, y) => empty.colorAt(x, y) !== CHIP_TINT || bar.colorAt(x, y) === CHIP_TINT)).toBe(true)
  }
})

test('pictures: a bar picture changes with its percent and stays byte for byte with the same one', async ($, on) => {
  const { beneath } = await warmSession($, on, NOCTTY)
  const ui = await terminalAt($, 200)
  const sources = async () => Object.fromEntries((await barsOf(ui)).map(bar => [bar.key, JSON.stringify(bar.props.source)]))
  const before = await sources()

  beneath.usage = { ...USAGE, context: { tokens: 410_000, window: 1_000_000, percent: 41 } }
  await $.session.measure({ context: beneath.usage.context, rateLimits: beneath.usage.rateLimits, changed: ['context'] })
  const measured = await sources()
  expect(measured.context).not.toBe(before.context)

  beneath.usage = {
    ...beneath.usage,
    rateLimits: [{ kind: 'five_hour', percentUsed: 63, resetsAt: iso(NOW + 2 * HOUR + 54 * MINUTE) }, ...USAGE.rateLimits.slice(1)],
  }
  await beneath.clock.advance(30_000)
  const ticked = await sources()
  expect(ticked['five-hour']).not.toBe(measured['five-hour'])

  // The same percent, drawn again: the same bytes
  expect(ticked['seven-day']).toBe(before['seven-day'])
  expect(ticked.context).toBe(measured.context)
  const again = await terminalAt($, 200)
  expect(JSON.stringify((await barsOf(again)).find(bar => bar.key === 'context')?.props.source)).toBe(ticked.context)
  await again.unmount()
  await ui.unmount()
})

test("pictures: a bar's alt is its cells in ▓ and ░", async ($, on) => {
  await warmSession($, on, NOCTTY)
  const wide = await terminalAt($, 200)
  expect((await barsOf(wide)).map(bar => bar.props.alt)).toEqual(['▓░░░░░', '▓▓▓░░░', '▓▓▓░░░'])
  await wide.unmount()
  const narrow = await terminalAt($, 80)
  expect((await barsOf(narrow)).find(bar => bar.key === 'context')?.props.alt).toBe('▓░░░░')
  await narrow.unmount()
})

test('pictures: every pill takes the same columns in pictures as in text', async ($, on) => {
  const { env } = await warmSession($, on, { ...NOCTTY, CLAUDE_STATUS_PILLS_RENDERER: 'text' })
  const widths = async (columns: number) => {
    const ui = await terminalAt($, columns)
    const pills = await pillsDrawn(ui)
    const images = await ui.findAll({ type: 'Image' })
    await ui.unmount()
    return { images: images.length, widths: pills.map(pill => [pill.key, columnsOf(pill.parts)]) }
  }
  const text = { wide: await widths(200), narrow: await widths(80) }
  env.variables = NOCTTY
  await begin($)
  const pictures = { wide: await widths(200), narrow: await widths(80) }

  expect(text.wide.images).toBe(0)
  expect(pictures.wide.images).toBeGreaterThan(0)
  expect(pictures.wide.widths).toEqual(text.wide.widths)
  expect(pictures.narrow.widths).toEqual(text.narrow.widths)
})

test('pictures: the picture band shrinks its bars and wraps like the text one', async ($, on) => {
  await warmSession($, on, NOCTTY)
  // How many rows the pills fill at `columns`, a column apart
  const rowsAt = (widths: number[], columns: number) =>
    widths.reduce(
      (laid, width) =>
        laid.x > 0 && laid.x + 1 + width > columns ? { rows: laid.rows + 1, x: width } : { rows: laid.rows, x: laid.x + (laid.x > 0 ? 1 : 0) + width },
      { rows: 1, x: 0 },
    ).rows

  for (const [columns, cells, justify, rows] of [
    [200, 6, 'flex-start', 1],
    [80, 5, 'center', 2],
    [undefined, 6, 'flex-start', 1],
  ] as const) {
    const ui = await terminalAt($, columns)
    const pills = await pillsDrawn(ui)
    expect(pills[0]?.row.props?.justifyContent).toBe(justify)
    expect((await barsOf(ui)).map(bar => bar.props.columns)).toEqual([cells, cells, cells])
    expect(rowsAt(pills.map(pill => columnsOf(pill.parts)), columns ?? Number.POSITIVE_INFINITY)).toBe(rows)
    await ui.unmount()
  }
})

test('pictures: the desktop draws its 0.5.0 SVG pictures whatever the terminal', async ($, on) => {
  await warmSession($, on, { ...NOCTTY, CLAUDE_STATUS_PILLS_RENDERER: 'image' })
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...band() })
  expect(await ui.findAll({ type: 'Image' })).toEqual([])
  expect(await ui.drawn()).toEqual(RELEASE_0_5_0.desktop)
  await ui.unmount()
})

test('pictures: each of the eight icons is an opaque Image over its cell and the space after it, its glyph as alt', async ($, on) => {
  await warmSession($, on, NOCTTY)
  const ui = await terminalAt($, 200)
  const icons = await iconsOf(ui)

  expect(icons.map(icon => icon.alt)).toEqual(ICONS.map(icon => icon.alt))
  // What follows each icon in its pill starts right after the picture, its space taken
  const after = (await pillsDrawn(ui)).flatMap(pill =>
    pill.parts.flatMap((part, at) => (part.type === 'Image' && !isBarAlt(part.props?.alt) ? [pill.parts[at + 1]] : [])),
  )
  expect(after).toHaveLength(ICONS.length)
  for (const part of after) {
    expect(part?.type).toBe('Text')
    expect(String(part?.children?.join('') ?? '').startsWith(' ')).toBe(false)
  }
  for (const icon of icons) {
    expect(icon.columns).toBe(2)
    expect(icon.rows).toBe(1)
    const picture = pixelsOf(icon.source)
    expect(picture.width).toBe(picture.height)
    expect(picture.every((x, y) => picture.alphaAt(x, y) === 255)).toBe(true)
    const [right, bottom] = [picture.width - 1, picture.height - 1]
    expect([picture.colorAt(0, 0), picture.colorAt(right, 0), picture.colorAt(0, bottom), picture.colorAt(right, bottom)]).toEqual([
      CHIP_TINT,
      CHIP_TINT,
      CHIP_TINT,
      CHIP_TINT,
    ])
  }
  // No icon is drawn as its glyph too
  const glyphs = new Set(ICONS.map(icon => icon.alt))
  expect((await textsOf(ui)).some(text => [...text].some(char => glyphs.has(char)))).toBe(false)
  await ui.unmount()
})

test('pictures: every picture sits on a Box of the tint, which shows above and below it in cells taller than it takes', async ($, on) => {
  await warmSession($, on, NOCTTY)
  const ui = await terminalAt($, 200)
  const row = ((await ui.drawn()) as Node).children?.[1] as Node
  const holders = (row.children as Node[]).flatMap(pill => (pill.children as Node[]).filter(part => part.type === 'Box'))

  // Three bars and nine icons
  expect(holders).toHaveLength(12)
  expect(await ui.findAll({ type: 'Image' })).toHaveLength(holders.length)
  for (const holder of holders) {
    expect(holder).toMatchObject({ props: { flexShrink: 0, backgroundColor: CHIP_TINT }, children: [{ type: 'Image' }] })
  }
  await ui.unmount()
})

test('pictures: before the first response the model and project icons are pictures too', async ($, on) => {
  environment(on, NOCTTY)
  const beneath = engine(on)
  beneath.usage = { ...USAGE, context: { window: 1_000_000 }, rateLimits: [] }
  await begin($)

  const ui = await terminalAt($, 200)
  expect((await pillsDrawn(ui)).map(pill => pill.key)).toEqual(['model', 'project'])
  expect((await iconsOf(ui)).map(icon => icon.alt)).toEqual([MODEL_ICON, FOLDER_ICON, BRANCH_ICON])
  expect(await barsOf(ui)).toEqual([])
  await ui.unmount()
})

test("pictures: each icon is stroked in its glyph's color", async ($, on) => {
  await warmSession($, on, NOCTTY)
  const ui = await terminalAt($, 200)
  const icons = await iconsOf(ui)
  expect(icons).toHaveLength(ICONS.length)
  icons.forEach((icon, at) => {
    const picture = pixelsOf(icon.source)
    expect(picture.every((x, y) => picture.colorAt(x, y) !== ICONS[at]?.color)).toBe(false)
  })
  await ui.unmount()
})

// The square an icon is drawn in: against the picture's left edge, 3/4 of its height, centered in it
const iconSquareOf = (picture: { height: number }) => ({ side: (3 / 4) * picture.height, top: picture.height / 8 })

test('pictures: each icon stays inside its square at the left of the picture', async ($, on) => {
  await warmSession($, on, NOCTTY)
  const ui = await terminalAt($, 200)
  const icons = await iconsOf(ui)
  expect(icons).toHaveLength(ICONS.length)
  for (const icon of icons) {
    const picture = pixelsOf(icon.source)
    const { side, top } = iconSquareOf(picture)
    // A pixel wholly outside the square
    const outside = (x: number, y: number) => x >= side || y + 1 <= top || y >= top + side
    expect(picture.every((x, y) => !outside(x, y) || picture.colorAt(x, y) === CHIP_TINT)).toBe(true)
  }
  await ui.unmount()
})

test('pictures: each terminal icon follows the path the desktop draws', async ($, on) => {
  await warmSession($, on, NOCTTY)
  const desktop = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...band() })
  // Every path of the desktop's pictures is an icon, in the order the band draws them
  const paths = (await picturesOf(desktop)).flatMap(picture => [...picture.source.matchAll(/<path [^>]*\bd="([^"]+)"/g)].map(found => found[1] ?? ''))
  await desktop.unmount()

  const ui = await terminalAt($, 200)
  const icons = await iconsOf(ui)
  await ui.unmount()
  expect(icons).toHaveLength(paths.length)
  icons.forEach((icon, at) => {
    const picture = pixelsOf(icon.source)
    const color = ICONS[at]?.color ?? ''
    // The desktop's 13-unit box fills the icon's square
    const { side, top } = iconSquareOf(picture)
    const scale = side / 13
    const starts = [...(paths[at] ?? '').matchAll(/M\s*(-?[\d.]+)[\s,]*(-?[\d.]+)/g)]
    expect(starts.length).toBeGreaterThan(0)
    for (const [, x = '', y = ''] of starts) {
      const pixel = picture.colorAt(Math.floor(Number(x) * scale), Math.floor(top + Number(y) * scale))
      expect(distance(pixel, color)).toBeLessThan(distance(pixel, CHIP_TINT))
    }
  })
})
