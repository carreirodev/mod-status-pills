// Where the terminal draws pictures, a pill's bar and icons are painted here,
// pixel by pixel on the pill's tint: the desktop's thin bar with round ends,
// and its line icons stroked from the same paths

import type { ImageSource } from 'claude-code'

import { BAR_HEIGHT, ICON_PATHS, ICON_SIZE, ICON_STROKE, PILL_HEIGHT } from './picture'
import type { Icon } from './picture'

// One cell in pixels. The terminal stretches a picture over its box of cells
// and never tells the mod how big a cell is, so a cell is taken as twice as
// tall as it is wide
const CELL_WIDTH = 22
const CELL_HEIGHT = 2 * CELL_WIDTH
// The cells an icon's picture spans: its own, and the space before the text after it
export const ICON_CELLS = 2
// Each pixel is sampled on a 4 by 4 grid: an edge gets 16 shades, and a pixel
// a shape covers whole keeps the shape's exact color
const GRID = 4
// Curves are cut into pieces of at most this angle, finer than a pixel shows
const ARC_STEP = Math.PI / 16
const CURVE_STEPS = 16

type Rgb = [number, number, number]

function rgbOf(hex: string): Rgb {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16))
  return [r, g, b]
}

// A shape to paint: its color, and whether it covers a point
type Layer = { color: string; covers: (x: number, y: number) => boolean }

// The layers painted in order over `background`, every pixel opaque, so a
// picture meets the cells beside it the same in any terminal
function paint(width: number, height: number, background: string, layers: Layer[]): ImageSource {
  const pixels = new Uint8Array(width * height * 4)
  const base = rgbOf(background)
  const inks = layers.map(layer => ({ rgb: rgbOf(layer.color), covers: layer.covers }))
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let color: number[] = base
      for (const ink of inks) {
        let hits = 0
        for (let row = 0; row < GRID; row++) {
          for (let column = 0; column < GRID; column++) {
            if (ink.covers(x + (column + 0.5) / GRID, y + (row + 0.5) / GRID)) {
              hits++
            }
          }
        }
        const share = hits / (GRID * GRID)
        color = color.map((value, at) => value + ((ink.rgb[at] ?? 0) - value) * share)
      }
      pixels.set([...color.map(Math.round), 255], 4 * (y * width + x))
    }
  }
  // btoa, as the environment's lib types no Uint8Array.toBase64
  let binary = ''
  for (const byte of pixels) {
    binary += String.fromCharCode(byte)
  }
  return { rgba: btoa(binary), width, height }
}

// A band across the picture at `middle` with round ends: every point within
// `radius` of the line from `from` to `to`
const capsule = (from: number, to: number, middle: number, radius: number) => (x: number, y: number) => {
  const dx = x - Math.min(to, Math.max(from, x))
  const dy = y - middle
  return dx * dx + dy * dy <= radius * radius
}

// The pictures painted so far: the band draws the same ones again at every tick
const painted = new Map<string, ImageSource>()

function remembered(key: string, draw: () => ImageSource): ImageSource {
  const known = painted.get(key)
  if (known !== undefined) {
    return known
  }
  // The percents of a long session add up; the band shows a dozen at most
  if (painted.size >= 64) {
    painted.clear()
  }
  const picture = draw()
  painted.set(key, picture)
  return picture
}

// A bar over `cells` cells, as thick against the row as the desktop's against
// its pill: the track the whole width, the fill from its left end over the share
// used, never shorter than the bar is thick so its ends stay round
export function barPicture(percent: number, cells: number, colors: { fill: string; track: string; tint: string }): ImageSource {
  return remembered(`bar ${percent} ${cells} ${colors.fill} ${colors.track} ${colors.tint}`, () => {
    const width = cells * CELL_WIDTH
    const thickness = Math.round((CELL_HEIGHT * BAR_HEIGHT) / PILL_HEIGHT)
    const radius = thickness / 2
    const middle = CELL_HEIGHT / 2
    const share = Math.min(1, Math.max(0, percent / 100))
    const filled = share === 0 ? 0 : Math.max(thickness, width * share)
    const layers = [{ color: colors.track, covers: capsule(radius, width - radius, middle, radius) }]
    if (filled > 0) {
      layers.push({ color: colors.fill, covers: capsule(radius, filled - radius, middle, radius) })
    }
    return paint(width, CELL_HEIGHT, colors.tint, layers)
  })
}

type Point = [number, number]
type Segment = [number, number, number, number]

// An SVG arc from `start` to `end`, as the points along it after the start;
// the endpoint form turned to the center form, as the SVG spec does it
function arcPoints(start: Point, radii: Point, rotation: number, large: number, sweep: number, end: Point): Point[] {
  const [x1, y1] = start
  const [x2, y2] = end
  if (x1 === x2 && y1 === y2) {
    return []
  }
  let [rx, ry] = radii.map(Math.abs) as Point
  if (rx === 0 || ry === 0) {
    return [end]
  }
  const phi = (rotation * Math.PI) / 180
  const [cos, sin] = [Math.cos(phi), Math.sin(phi)]
  const [hx, hy] = [(x1 - x2) / 2, (y1 - y2) / 2]
  const [px, py] = [cos * hx + sin * hy, -sin * hx + cos * hy]
  // Radii too short to reach the end grow until they just do
  const reach = (px * px) / (rx * rx) + (py * py) / (ry * ry)
  if (reach > 1) {
    rx *= Math.sqrt(reach)
    ry *= Math.sqrt(reach)
  }
  const spread = rx * rx * py * py + ry * ry * px * px
  const lift = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, (rx * rx * ry * ry - spread) / spread))
  const [cpx, cpy] = [(lift * rx * py) / ry, (-lift * ry * px) / rx]
  const [cx, cy] = [cos * cpx - sin * cpy + (x1 + x2) / 2, sin * cpx + cos * cpy + (y1 + y2) / 2]
  const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
  const from = angle(1, 0, (px - cpx) / rx, (py - cpy) / ry)
  let turn = angle((px - cpx) / rx, (py - cpy) / ry, (-px - cpx) / rx, (-py - cpy) / ry)
  if (sweep === 0 && turn > 0) {
    turn -= 2 * Math.PI
  } else if (sweep !== 0 && turn < 0) {
    turn += 2 * Math.PI
  }
  const steps = Math.max(2, Math.ceil(Math.abs(turn) / ARC_STEP))
  return Array.from({ length: steps }, (_, at): Point => {
    if (at === steps - 1) {
      return end
    }
    const t = from + (turn * (at + 1)) / steps
    const [ex, ey] = [rx * Math.cos(t), ry * Math.sin(t)]
    return [cos * ex - sin * ey + cx, sin * ex + cos * ey + cy]
  })
}

// The straight pieces an SVG path's outline is made of, its curves cut fine;
// the commands the icons are written in: M, L, H, V, C, A and Z, in both cases
function segmentsOf(path: string): Segment[] {
  const tokens = path.match(/[a-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []
  const segments: Segment[] = []
  let at = 0
  let command = ''
  let [x, y] = [0, 0]
  let start: Point = [0, 0]
  const next = () => Number(tokens[at++])
  const lineTo = ([toX, toY]: Point) => {
    segments.push([x, y, toX, toY])
    ;[x, y] = [toX, toY]
  }
  while (at < tokens.length) {
    if (/[a-z]/i.test(tokens[at] ?? '')) {
      command = tokens[at++] ?? ''
    }
    // A lowercase command counts from where the pen is
    const [dx, dy] = command === command.toLowerCase() ? [x, y] : [0, 0]
    switch (command.toUpperCase()) {
      case 'M':
        ;[x, y] = [next() + dx, next() + dy]
        start = [x, y]
        // Pairs after a move draw lines
        command = command === 'm' ? 'l' : 'L'
        break
      case 'L':
        lineTo([next() + dx, next() + dy])
        break
      case 'H':
        lineTo([next() + dx, y])
        break
      case 'V':
        lineTo([x, next() + dy])
        break
      case 'C': {
        const from: Point = [x, y]
        const first: Point = [next() + dx, next() + dy]
        const second: Point = [next() + dx, next() + dy]
        const end: Point = [next() + dx, next() + dy]
        for (let step = 1; step <= CURVE_STEPS; step++) {
          const t = step / CURVE_STEPS
          const along = (axis: 0 | 1) =>
            (1 - t) ** 3 * from[axis] + 3 * (1 - t) ** 2 * t * first[axis] + 3 * (1 - t) * t ** 2 * second[axis] + t ** 3 * end[axis]
          lineTo([along(0), along(1)])
        }
        break
      }
      case 'A': {
        const [rx, ry, rotation, large, sweep] = [next(), next(), next(), next(), next()]
        const end: Point = [next() + dx, next() + dy]
        for (const point of arcPoints([x, y], [rx, ry], rotation, large, sweep, end)) {
          lineTo(point)
        }
        break
      }
      case 'Z':
        lineTo(start)
        command = ''
        break
      default:
        throw new Error(`the terminal cannot paint an icon path with "${command || tokens[at]}" in it`)
    }
  }
  return segments
}

// Whether a point lies within `reach` of a segment: a stroke with round caps and joins
function near([ax, ay, bx, by]: Segment, x: number, y: number, reach: number): boolean {
  const [vx, vy] = [bx - ax, by - ay]
  const length = vx * vx + vy * vy
  const t = length === 0 ? 0 : Math.min(1, Math.max(0, ((x - ax) * vx + (y - ay) * vy) / length))
  const [dx, dy] = [x - ax - t * vx, y - ay - t * vy]
  return dx * dx + dy * dy <= reach * reach
}

// An icon over two cells, its own and the space after it: in one, its square
// could be no wider than the cell, half the row's height. The desktop's
// 13-pixel box fills a square of 3/4 of the row against the left edge, which
// leaves the rest as the gap before the text, and its path is stroked as
// thick against it as there
export function iconPicture(icon: Icon, color: string, tint: string): ImageSource {
  return remembered(`icon ${icon} ${color} ${tint}`, () => {
    const width = ICON_CELLS * CELL_WIDTH
    const side = (3 / 4) * CELL_HEIGHT
    const top = (CELL_HEIGHT - side) / 2
    const scale = side / ICON_SIZE
    const segments = segmentsOf(ICON_PATHS[icon]).map(([ax, ay, bx, by]): Segment => [ax * scale, top + ay * scale, bx * scale, top + by * scale])
    const reach = (ICON_STROKE / 2) * scale
    // Each pixel's segments close enough to touch it, so a sample tests a few, not the whole path
    const touching: Segment[][] = Array.from({ length: width * CELL_HEIGHT }, () => [])
    for (const segment of segments) {
      const [ax, ay, bx, by] = segment
      const [left, right] = [Math.max(0, Math.floor(Math.min(ax, bx) - reach)), Math.min(width - 1, Math.floor(Math.max(ax, bx) + reach))]
      const [upper, lower] = [Math.max(0, Math.floor(Math.min(ay, by) - reach)), Math.min(CELL_HEIGHT - 1, Math.floor(Math.max(ay, by) + reach))]
      for (let y = upper; y <= lower; y++) {
        for (let x = left; x <= right; x++) {
          touching[y * width + x]?.push(segment)
        }
      }
    }
    const covers = (x: number, y: number) => (touching[Math.floor(y) * width + Math.floor(x)] ?? []).some(segment => near(segment, x, y, reach))
    return paint(width, CELL_HEIGHT, tint, [{ color, covers }])
  })
}
