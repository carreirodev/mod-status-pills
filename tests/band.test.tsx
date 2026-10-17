import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On, SessionUsage } from 'claude-code'

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

// The engine beneath the plugin, answering as a session would; `under` is a
// text another mod beneath the plugin draws under the engine's hint line, and
// `above` one it draws in the band above the prompt
function engine(on: On, options: { branch?: string | null; under?: string; above?: string } = {}) {
  const beneath = {
    usage: USAGE,
    clock: mock.clock(on, { now: NOW }),
  }
  const branch = options.branch === undefined ? 'main' : options.branch
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('session.root', () => ({ value: 'C:\\Users\\dev\\Repository\\painel-agents-mod' }))
  on('session.cwd', () => ({ value: 'C:\\Users\\dev\\Repository\\painel-agents-mod' }))
  on('session.usage', () => ({ value: beneath.usage }))
  on('process.run', () => ({
    value: {
      exitCode: branch === null ? 128 : 0,
      stdout: branch === null ? '' : `${branch}\n`,
      stderr: branch === null ? 'fatal: not a git repository' : '',
      isStdoutTruncated: false,
      isStderrTruncated: false,
    },
  }))
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
      usage: null,
    }
  })
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

test("the terminal's pills go right under the engine's hint line, which stays as it draws it", async ($, on) => {
  engine(on)
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint(200) })
  expect(await ui.drawn()).toMatchObject(withPills({ type: 'Box' }))
  expect(await ui.drawn()).toMatchObject({ children: [{ type: 'Text' }, expect.anything()] })
  expect((await textsOf(ui))[0]).toBe(HINT)
  expect(await ui.drawn()).not.toMatchObject(withPills({ type: 'Box', props: { marginTop: 1 } }))
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
