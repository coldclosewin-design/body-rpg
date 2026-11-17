// 캐릭터 도감 시트 PNG 생성. 실행: npm run sheet  (= npx tsx design/pixel/render-sheet.ts [scale])
// 출력: design/character-sheet.png
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHARACTERS } from './characters'
import { DEFAULT_APPEARANCE, PALETTE, toPixelMap } from './palette'

const SCALE = Number(process.argv[2] ?? 6)
const COLS = 5
const CELL_W = 24, CELL_H = 32, PAD = 4
// 한 칸에 기본(왼쪽) / 눈 감김(오른쪽). 두 프레임을 같은 바닥선에서 비교한다.
const PAIR_W = CELL_W * 2 + PAD
const APPEAR = DEFAULT_APPEARANCE
const BG: [number, number, number] = [26, 26, 46]
const CELL_BG: [number, number, number] = [22, 33, 62]

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const colorOf = (ch: string): [number, number, number] | null => {
  const v = PALETTE[ch]
  if (!v) return null
  const resolved = APPEAR[v] ?? v
  return hex(resolved)
}

const rows = Math.ceil(CHARACTERS.length / COLS)
const W = (COLS * (PAIR_W + PAD) + PAD) * SCALE
const H = (rows * (CELL_H + PAD) + PAD) * SCALE
const px = new Uint8Array(W * H * 3)
const put = (x: number, y: number, c: [number, number, number]) => { const o = (y * W + x) * 3; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2] }
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(x, y, BG)

CHARACTERS.forEach((ch, i) => {
  const cx = (PAD + (i % COLS) * (PAIR_W + PAD)) * SCALE
  const cy = (PAD + Math.floor(i / COLS) * (CELL_H + PAD)) * SCALE
  for (let y = 0; y < CELL_H * SCALE; y++) for (let x = 0; x < PAIR_W * SCALE; x++) put(cx + x, cy + y, CELL_BG)
  toPixelMap(ch.parts, ch.recolor).frames.forEach((frame, f) => {
    const fx = cx + f * (CELL_W + PAD) * SCALE
    frame.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = colorOf(row[x])
        if (!c) continue
        for (let dy = 0; dy < SCALE; dy++) for (let dx = 0; dx < SCALE; dx++) put(fx + x * SCALE + dx, cy + y * SCALE + dy, c)
      }
    })
  })
})

const crcTable = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c })
const crc32 = (buf: Uint8Array) => { let c = -1; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0 }
const chunk = (type: string, data: Uint8Array) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
const raw = Buffer.alloc((W * 3 + 1) * H)
for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; px.subarray(y * W * 3, (y + 1) * W * 3).forEach((v, i) => { raw[y * (W * 3 + 1) + 1 + i] = v }) }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'character-sheet.png')
writeFileSync(out, png)
console.log(`${out} ${W}x${H}, ${CHARACTERS.length} characters, open / blink pairs at ${SCALE}x`)
