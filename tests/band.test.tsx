import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On, SessionUsage } from 'claude-code'

const PLUGIN = 'status-pills'

// 2026-10-08 17:40 in São Paulo
const NOW = Date.UTC(2026, 9, 8, 20, 40, 0)
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const SURFACES = ['terminal', 'desktop'] as const

const OK = '#4ade80'
const WARN = '#facc15'
const CRIT = '#f87171'

const band = (bodyColumns: number, hasSurvey = false) => ({
  component: 'AbovePrompt' as const,
  props: {
    hasSurvey,
    isWorking: false,
    maxRows: 12,
    bodyColumns,
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

// The engine beneath the plugin, answering as a session would
function engine(on: On, options: { branch?: string | null } = {}) {
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

type Found = { text: string; props: { color?: unknown } }

const textsOf = async (ui: { findAll: (q: { type: string }) => Promise<Found[]> }) =>
  (await ui.findAll({ type: 'Text' })).map(t => t.text)

test('draws every pill with its bar, share and reset when the band has room', async ($, on) => {
  engine(on)
  await begin($)
  await step($, 'high')

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface, ...band(200) })
    const texts = await textsOf(ui)

    expect(texts).toContain('Opus 5.5')
    expect(texts).toContain(' high')
    expect(texts).not.toContain(' · ')
    expect(texts).toContain('ctx ')
    expect(texts).toContain(' 23%')
    // The 5-hour window by the time left alone, the 7-day one by its reset date alone
    expect(texts).toContain(' 48%')
    expect(texts).toContain('↻ 2h54')
    expect(texts).toContain(' 52%')
    expect(texts).toContain('↻ 11/10 19h')
    expect(texts.some(text => text.includes('20:34') || text.includes('3d02h'))).toBe(false)
    expect(texts).toContain('painel-agents-mod · main')
    await ui.unmount()
  }
})

test('a narrow band keeps the resets and shortens the bars', async ($, on) => {
  engine(on)
  await begin($)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface, ...band(80) })
    const texts = await textsOf(ui)

    expect(texts).toContain('↻ 2h54')
    expect(texts).toContain('↻ 11/10 19h')
    // ctx at 23% of five cells: one filled, four of track
    expect(texts).toContain('▒')
    expect(texts).toContain('▒▒▒▒')
    await ui.unmount()
  }
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

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...band(200) })
  const found = await ui.findAll({ type: 'Text' })
  const colorOf = (text: string) => found.find(t => t.text === text)?.props.color

  expect(colorOf('▒▒')).toBe(OK)
  expect(colorOf('▒▒▒▒▒')).toBe(WARN)
  expect(colorOf('▒▒▒▒▒▒▒')).toBe(CRIT)
  await ui.unmount()
})

test('before the first response: the model and the project alone', async ($, on) => {
  const beneath = engine(on)
  beneath.usage = { ...USAGE, context: { window: 1_000_000 }, rateLimits: [] }
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...band(200) })
  const texts = await textsOf(ui)

  expect(texts).toContain('Opus 5.5')
  expect(texts).toContain('painel-agents-mod · main')
  expect(texts).not.toContain('ctx ')
  expect(texts.some(text => text.startsWith('↻'))).toBe(false)
  await ui.unmount()
})

test("a subagent's effort does not replace the main loop's", async ($, on) => {
  engine(on)
  await begin($)
  await step($, 'medium')
  await step($, 'max', 'a1')

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...band(200) })
  const texts = await textsOf(ui)

  expect(texts).toContain(' medium')
  expect(texts).not.toContain(' max')
  await ui.unmount()
})

test('the countdowns move with the clock, and a new measurement shows new numbers', async ($, on) => {
  const beneath = engine(on)
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...band(200) })
  await beneath.clock.advance(4 * MINUTE)
  expect(await textsOf(ui)).toContain('↻ 2h50')

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

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...band(200) })
  expect(await textsOf(ui)).toContain('painel-agents-mod')
  await ui.unmount()
})

test('yields the band to a survey', async ($, on) => {
  engine(on)
  // The engine draws the survey beneath the plugin
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>survey</Text>
  })
  await begin($)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...band(200, true) })
  const texts = await textsOf(ui)

  expect(texts).toContain('survey')
  expect(texts).not.toContain('Opus 5.5')
  await ui.unmount()
})
