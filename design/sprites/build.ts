// PNG 스프라이트 빌드. 실행: npm run sprites [-- --size 64x128 --colors 32 --only warrior]
// 입력:  design/sprites/src/<key>.png   (이미지 생성 모델·작가가 만든 원본. 크기 자유, 배경은 단색 또는 투명)
// 출력:  public/sprites/<key>.png       (idle 2프레임 가로 시트. 2프레임은 1프레임을 1px 내린 것)
//        design/sprites/preview.png     (전체 미리보기, 4배)
// 외부 의존성 없음(Node 내장 zlib). 과정: 배경 제거 → 여백 자르기 → 격자 축소 → 알파 이진화 → 팔레트 축소.
import { deflateSync, inflateSync } from 'node:zlib'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

type RGBA = Uint8ClampedArray // length w*h*4
interface Img { w: number; h: number; px: RGBA }

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const SRC_DIR = join(HERE, 'src')
const OUT_DIR = join(ROOT, 'public', 'sprites')

// ── CLI ──
const args = process.argv.slice(2)
const opt = (name: string, def: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def }
const [FRAME_W, FRAME_H] = opt('size', '64x128').split('x').map(Number)
const MAX_COLORS = Number(opt('colors', '32'))
const ONLY = opt('only', '')
const BG_TOL = Number(opt('bgtol', '28'))
const FRAMES = 2

// ── PNG 읽기 (color type 0/2/3/4/6, 8bit) ──
function decodePng(buf: Buffer): Img {
  let off = 8, w = 0, h = 0, ct = 0, bd = 0
  const idat: Buffer[] = []; let plte: Buffer | null = null; let trns: Buffer | null = null
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; if (data[12] !== 0) throw new Error('interlaced PNG 미지원') }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'PLTE') plte = Buffer.from(data)
    else if (type === 'tRNS') trns = Buffer.from(data)
    off += 12 + len
  }
  if (bd !== 8) throw new Error(`bit depth ${bd} 미지원 (8만)`)
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : ct === 4 ? 2 : 1
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * ch
  const px = new Uint8ClampedArray(w * h * 4)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)))
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0, b = prev[i], c = i >= ch ? prev[i - ch] : 0
      let v = line[i]
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1
      else if (f === 4) { const p = a + b - c; const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
      line[i] = v & 255
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4, s = x * ch
      if (ct === 6) { px[o] = line[s]; px[o + 1] = line[s + 1]; px[o + 2] = line[s + 2]; px[o + 3] = line[s + 3] }
      else if (ct === 2) { px[o] = line[s]; px[o + 1] = line[s + 1]; px[o + 2] = line[s + 2]; px[o + 3] = 255 }
      else if (ct === 4) { px[o] = px[o + 1] = px[o + 2] = line[s]; px[o + 3] = line[s + 1] }
      else if (ct === 3) { const idx = line[s]; px[o] = plte![idx * 3]; px[o + 1] = plte![idx * 3 + 1]; px[o + 2] = plte![idx * 3 + 2]; px[o + 3] = trns && idx < trns.length ? trns[idx] : 255 }
      else { px[o] = px[o + 1] = px[o + 2] = line[s]; px[o + 3] = 255 }
    }
    prev = line
  }
  return { w, h, px }
}

// ── PNG 쓰기 (RGBA) ──
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc32 = (b: Buffer) => { let c = 0xffffffff; for (const v of b) c = CRC[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function encodePng(img: Img): Buffer {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4); ihdr[8] = 8; ihdr[9] = 6
  const raw = Buffer.alloc((img.w * 4 + 1) * img.h)
  for (let y = 0; y < img.h; y++) { raw[y * (img.w * 4 + 1)] = 0; Buffer.from(img.px.buffer, img.px.byteOffset + y * img.w * 4, img.w * 4).copy(raw, y * (img.w * 4 + 1) + 1) }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

// ── 1. 배경 제거: 알파가 없으면 네 모서리 색과 비슷한 픽셀을 가장자리에서부터 채워 지운다 ──
function removeBackground(img: Img): Img {
  const { w, h, px } = img
  let hasAlpha = false
  for (let i = 3; i < px.length; i += 4) if (px[i] < 250) { hasAlpha = true; break }
  if (hasAlpha) return img
  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].map(([x, y]) => { const o = (y * w + x) * 4; return [px[o], px[o + 1], px[o + 2]] })
  const isBg = (o: number) => corners.some((c) => Math.abs(px[o] - c[0]) + Math.abs(px[o + 1] - c[1]) + Math.abs(px[o + 2] - c[2]) <= BG_TOL * 3)
  const seen = new Uint8Array(w * h)
  const stack: number[] = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const i = stack.pop()!
    if (seen[i]) continue
    seen[i] = 1
    if (!isBg(i * 4)) continue
    px[i * 4 + 3] = 0
    const x = i % w, y = (i / w) | 0
    if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1); if (y > 0) stack.push(i - w); if (y < h - 1) stack.push(i + w)
  }
  return img
}

// ── 2. 불투명 영역으로 자르기 ──
function crop(img: Img): Img {
  const { w, h, px } = img
  let x0 = w, x1 = -1, y0 = h, y1 = -1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
  if (x1 < 0) throw new Error('불투명 픽셀이 없음 (배경 제거 과다?)')
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1
  const out = new Uint8ClampedArray(cw * ch * 4)
  for (let y = 0; y < ch; y++) out.set(px.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4), y * cw * 4)
  return { w: cw, h: ch, px: out }
}

// ── 3. 프레임에 맞춰 축소(박스 필터, 알파 가중) → 가로 중앙·세로 바닥 정렬 ──
function fitToFrame(img: Img, fw: number, fh: number): Img {
  const s = Math.min(fw / img.w, fh / img.h)
  const tw = Math.max(1, Math.round(img.w * s)), th = Math.max(1, Math.round(img.h * s))
  const out = new Uint8ClampedArray(fw * fh * 4)
  const ox = Math.floor((fw - tw) / 2), oy = fh - th
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
    const sx0 = Math.floor(tx / s), sx1 = Math.min(img.w, Math.ceil((tx + 1) / s))
    const sy0 = Math.floor(ty / s), sy1 = Math.min(img.h, Math.ceil((ty + 1) / s))
    let r = 0, g = 0, b = 0, a = 0, n = 0
    for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) {
      const o = (y * img.w + x) * 4, al = img.px[o + 3] / 255
      r += img.px[o] * al; g += img.px[o + 1] * al; b += img.px[o + 2] * al; a += al; n++
    }
    const o = ((ty + oy) * fw + tx + ox) * 4
    if (a > 0) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a }
    out[o + 3] = n ? (a / n) * 255 : 0
  }
  // 알파 이진화: 픽셀아트는 반투명 가장자리가 없다
  for (let i = 3; i < out.length; i += 4) out[i] = out[i] >= 128 ? 255 : 0
  return { w: fw, h: fh, px: out }
}

// ── 4. 팔레트 축소 (median cut) ──
function quantize(img: Img, maxColors: number): { img: Img; colors: number } {
  const pts: number[][] = []
  for (let i = 0; i < img.px.length; i += 4) if (img.px[i + 3]) pts.push([img.px[i], img.px[i + 1], img.px[i + 2]])
  const uniq = new Set(pts.map((p) => p.join(','))).size
  if (uniq <= maxColors) return { img, colors: uniq }
  let boxes: number[][][] = [pts]
  while (boxes.length < maxColors) {
    boxes.sort((a, b) => range(b) - range(a))
    const box = boxes.shift()!
    if (box.length < 2) { boxes.push(box); break }
    const c = widestChannel(box)
    box.sort((p, q) => p[c] - q[c])
    const mid = box.length >> 1
    boxes.push(box.slice(0, mid), box.slice(mid))
  }
  const palette = boxes.map((b) => [0, 1, 2].map((c) => Math.round(b.reduce((s, p) => s + p[c], 0) / b.length)))
  const out = new Uint8ClampedArray(img.px)
  for (let i = 0; i < out.length; i += 4) {
    if (!out[i + 3]) continue
    let best = 0, bd = Infinity
    for (let k = 0; k < palette.length; k++) { const p = palette[k]; const d = (p[0] - out[i]) ** 2 + (p[1] - out[i + 1]) ** 2 + (p[2] - out[i + 2]) ** 2; if (d < bd) { bd = d; best = k } }
    out[i] = palette[best][0]; out[i + 1] = palette[best][1]; out[i + 2] = palette[best][2]
  }
  return { img: { w: img.w, h: img.h, px: out }, colors: palette.length }
}
const range = (box: number[][]) => Math.max(...[0, 1, 2].map((c) => spread(box, c)))
const spread = (box: number[][], c: number) => { let lo = 255, hi = 0; for (const p of box) { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c] } return hi - lo }
const widestChannel = (box: number[][]) => [0, 1, 2].reduce((a, c) => (spread(box, c) > spread(box, a) ? c : a), 0)

// ── 5. 시트: 프레임 N개 가로 배치, 2프레임부터는 1px 아래로 ──
function toSheet(frame: Img, frames: number): Img {
  const w = frame.w * frames, h = frame.h
  const out = new Uint8ClampedArray(w * h * 4)
  for (let f = 0; f < frames; f++) {
    const dy = f === 0 ? 0 : 1
    for (let y = 0; y < frame.h - dy; y++) out.set(frame.px.subarray(y * frame.w * 4, (y + 1) * frame.w * 4), ((y + dy) * w + f * frame.w) * 4)
  }
  return { w, h, px: out }
}

// ── 6. 미리보기 (배율 확대, 어두운 바탕) ──
function preview(frames: { key: string; img: Img }[], scale: number, cols = 5): Img {
  const cellW = FRAME_W * scale + 8, cellH = FRAME_H * scale + 8
  const rows = Math.ceil(frames.length / cols)
  const w = cellW * cols, h = cellH * rows
  const out = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < out.length; i += 4) { out[i] = 26; out[i + 1] = 26; out[i + 2] = 46; out[i + 3] = 255 }
  frames.forEach(({ img }, idx) => {
    const cx = (idx % cols) * cellW + 4, cy = Math.floor(idx / cols) * cellH + 4
    for (let y = 0; y < FRAME_H * scale; y++) for (let x = 0; x < FRAME_W * scale; x++) {
      const so = (((y / scale) | 0) * FRAME_W + ((x / scale) | 0)) * 4
      const o = ((cy + y) * w + cx + x) * 4
      if (img.px[so + 3]) { out[o] = img.px[so]; out[o + 1] = img.px[so + 1]; out[o + 2] = img.px[so + 2] }
      else { out[o] = 22; out[o + 1] = 33; out[o + 2] = 62 }
    }
  })
  return { w, h, px: out }
}

// ── main ──
if (!existsSync(SRC_DIR)) { console.error(`원본 폴더가 없습니다: ${SRC_DIR}`); process.exit(1) }
mkdirSync(OUT_DIR, { recursive: true })
const files = readdirSync(SRC_DIR).filter((f) => f.toLowerCase().endsWith('.png') && (!ONLY || basename(f, '.png') === ONLY)).sort()
if (!files.length) { console.error('처리할 PNG 가 없습니다'); process.exit(1) }
const built: { key: string; img: Img }[] = []
for (const f of files) {
  const key = basename(f, '.png')
  const src = decodePng(readFileSync(join(SRC_DIR, f)))
  const cut = crop(removeBackground(src))
  const fit = fitToFrame(cut, FRAME_W, FRAME_H)
  const { img, colors } = quantize(fit, MAX_COLORS)
  writeFileSync(join(OUT_DIR, `${key}.png`), encodePng(toSheet(img, FRAMES)))
  built.push({ key, img })
  console.log(`${key}: ${src.w}×${src.h} → 잘라냄 ${cut.w}×${cut.h} → ${FRAME_W}×${FRAME_H} ×${FRAMES}프레임, 색 ${colors}개 → public/sprites/${key}.png`)
}
writeFileSync(join(HERE, 'preview.png'), encodePng(preview(built, 4)))
console.log(`미리보기: design/sprites/preview.png (${built.length}개)`)
console.log(`등록: characters.ts 의 해당 캐릭터에 png: { kind: 'png', url: 'sprites/<key>.png', frameW: ${FRAME_W}, frameH: ${FRAME_H}, frames: ${FRAMES} }`)
