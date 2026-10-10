// The desktop draws each pill as one SVG picture: a soft fill and a thin
// border, line icons, smooth bars, and colors that follow its light or dark theme

// The icons as 13-pixel line drawings; the terminal draws the same ones as Nerd Font glyphs
const ICON_PATHS = {
  // A microchip
  model: 'M4.5 3.5h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zM5.5 1.5v2M7.5 1.5v2M5.5 9.5v2M7.5 9.5v2M1.5 5.5h2M1.5 7.5h2M9.5 5.5h2M9.5 7.5h2',
  // A speech bubble
  context: 'M2 2.5h9a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H6l-2.5 2v-2H2a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z',
  // A gauge
  fiveHour: 'M1.8 9.5a4.9 4.9 0 1 1 9.4 0M6.5 8.2l2.4-2.6',
  // A calendar
  sevenDay: 'M3 2.5h7a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 10V4A1.5 1.5 0 0 1 3 2.5zM1.5 5.5h10M4.5 1v3M8.5 1v3',
  // A clock with an arrow running back
  reset: 'M2.2 6.5a4.3 4.3 0 1 0 1.3-3.1M1.8 1.8v2.4h2.4M6.5 4.3v2.4l1.7 1',
  folder: 'M1.5 3.5a1 1 0 0 1 1-1h2.8l1.2 1.5h4.5a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1z',
  branch: 'M2.6 2.9a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M2.6 10.1a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M7.6 3.8a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M4 4.3v4.4M9 5.2c0 2-5 1.5-5 3.5',
}
export type Icon = keyof typeof ICON_PATHS

// What a pill shows, item by item; the terminal and the desktop each draw them their own way
export type Item =
  | { kind: 'text'; text: string; color: string; bold: boolean }
  | { kind: 'icon'; icon: Icon; color: string }
  | { kind: 'bar'; percent: number; color: string }
  | { kind: 'separator' }
// A pill's border on the desktop, the tint behind it in the terminal, and its icon's color
export type Accent = { border: string; tint: string; icon: string }
export type Pill = { key: string; accent: Accent; items: Item[] }

// Sizes in CSS pixels
const PILL_HEIGHT = 22
// Clear space above and below the pill inside its picture: rows that wrap sit
// twice this apart, finer than the band's gaps, which count whole cells
const ROW_INSET = 2
export const PICTURE_HEIGHT = PILL_HEIGHT + 2 * ROW_INSET
const PADDING = 9
const GAP = 5
const SEPARATOR_GAP = 7
const ICON_SIZE = 13
const BAR_WIDTH = 56
const BAR_HEIGHT = 6
const FONT_SIZE = 12
const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif'

const px = (n: number) => Math.round(n * 10) / 10

// A guess at the text's width in a system UI font; textLength then fits the
// text to exactly that width, so a wrong guess squeezes it, never clips it
function textWidth(text: string, bold: boolean): number {
  let ems = 0
  for (const char of text) {
    ems += /[ijl.,:;'|!]/.test(char) ? 0.27 : /[mwMW%]/.test(char) ? 0.86 : /[A-Z]/.test(char) ? 0.66 : /\d/.test(char) ? 0.56 : char === ' ' ? 0.28 : 0.52
  }
  return ems * FONT_SIZE * (bold ? 1.06 : 1)
}

// The mod's colors are made for a dark background; on a light one each keeps
// its hue and saturation, its lightness mirrored into the readable band
export function lightThemeOf(hex: string): string {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const chroma = max - min
  const lightness = (max + min) / 2
  const saturation = chroma === 0 ? 0 : chroma / (1 - Math.abs(2 * lightness - 1))
  const sector = chroma === 0 ? 0 : max === r ? (g - b) / chroma : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4
  const hue = (sector + 6) % 6
  const target = Math.min(0.45, Math.max(0.2, 1.05 - lightness))
  const c = (1 - Math.abs(2 * target - 1)) * saturation
  const x = c * (1 - Math.abs((hue % 2) - 1))
  const rgb: [number, number, number] =
    hue < 1 ? [c, x, 0] : hue < 2 ? [x, c, 0] : hue < 3 ? [0, c, x] : hue < 4 ? [0, x, c] : hue < 5 ? [x, 0, c] : [c, 0, x]
  return `#${rgb.map(v => Math.round((v + target - c / 2) * 255).toString(16).padStart(2, '0')).join('')}`
}

const escapeXml = (text: string) => text.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`)

// The pill as an SVG document, its width, and its words for a reader without the picture
export function pictureOf(pill: Pill): { source: string; width: number; alt: string } {
  const middle = PILL_HEIGHT / 2
  // Each color gets a class: the light theme's shade by default, its own under a dark theme
  const colors: string[] = []
  const classOf = (color: string) => {
    if (!colors.includes(color)) {
      colors.push(color)
    }
    return `c${colors.indexOf(color)}`
  }
  const marks: string[] = []
  const words: string[] = []
  let x = PADDING
  pill.items.forEach((item, index) => {
    if (index > 0) {
      x += item.kind === 'separator' || pill.items[index - 1]?.kind === 'separator' ? SEPARATOR_GAP : GAP
    }
    switch (item.kind) {
      case 'icon':
        marks.push(
          `<path class="${classOf(item.color)}" transform="translate(${px(x)} ${px(middle - ICON_SIZE / 2)})" d="${ICON_PATHS[item.icon]}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
        )
        x += ICON_SIZE
        break
      case 'text': {
        const width = textWidth(item.text, item.bold)
        marks.push(
          `<text class="${classOf(item.color)}" x="${px(x)}" y="${px(middle + FONT_SIZE * 0.35)}" fill="currentColor"${item.bold ? ' font-weight="600"' : ''} textLength="${px(width)}" lengthAdjust="spacingAndGlyphs">${escapeXml(item.text)}</text>`,
        )
        words.push(item.text)
        x += width
        break
      }
      case 'bar': {
        const top = px(middle - BAR_HEIGHT / 2)
        const share = Math.min(1, Math.max(0, item.percent / 100))
        // A sliver under the bar's own height would lose its round ends
        const filled = share === 0 ? 0 : Math.max(BAR_HEIGHT, BAR_WIDTH * share)
        marks.push(`<rect x="${px(x)}" y="${top}" width="${BAR_WIDTH}" height="${BAR_HEIGHT}" rx="${BAR_HEIGHT / 2}" fill="#808080" fill-opacity="0.25"/>`)
        if (filled > 0) {
          marks.push(
            `<rect class="${classOf(item.color)}" x="${px(x)}" y="${top}" width="${px(filled)}" height="${BAR_HEIGHT}" rx="${BAR_HEIGHT / 2}" fill="currentColor"/>`,
          )
        }
        x += BAR_WIDTH
        break
      }
      case 'separator':
        marks.push(
          `<line x1="${px(x + 0.5)}" y1="${middle - 5}" x2="${px(x + 0.5)}" y2="${middle + 5}" stroke="${pill.accent.border}" stroke-opacity="0.45"/>`,
        )
        words.push('|')
        x += 1
        break
    }
  })
  const width = Math.ceil(x + PADDING)
  const light = colors.map((color, at) => `.c${at}{color:${lightThemeOf(color)}}`).join('')
  const dark = colors.map((color, at) => `.c${at}{color:${color}}`).join('')
  const style = `<style>text{font-family:${FONT};font-size:${FONT_SIZE}px}${light}@media (prefers-color-scheme: dark){${dark}}</style>`
  const frame = `<rect x="0.5" y="0.5" width="${width - 1}" height="${PILL_HEIGHT - 1}" rx="${(PILL_HEIGHT - 1) / 2}" fill="${pill.accent.border}" fill-opacity="0.12" stroke="${pill.accent.border}" stroke-opacity="0.5"/>`
  // The pill is drawn from 0 to PILL_HEIGHT; the view box starts ROW_INSET above it
  return {
    source: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${PICTURE_HEIGHT}" viewBox="0 ${-ROW_INSET} ${width} ${PICTURE_HEIGHT}">${style}${frame}${marks.join('')}</svg>`,
    width,
    alt: words.join(' '),
  }
}
