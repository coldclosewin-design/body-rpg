// PWA 아이콘 생성 (의존성 없이 PNG 인코딩). 실행: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const PIX = [
  '................',
  '................',
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHhSSSSHhK...',
  '...KSSSSSSSSK...',
  '...KSESSSSESK...',
  '...KSSSsSsSSK...',
  '....KSSssSSK....',
  '.....KSSSSK.....',
  '....KOOOOOOK....',
  '...KSOOOOOOSK...',
  '..KSKOOOOOOKSK..',
  '..KSKOOOOOOKSK..',
  '..KSKOooooOKSK..',
]
const COLORS = { K: [16, 16, 24], H: [59, 42, 26], h: [41, 29, 18], S: [243, 201, 166], s: [199, 165, 136], E: [16, 16, 24], O: [233, 69, 96], o: [163, 48, 67] }
const BG = [26, 26, 46]

const crcTable = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c })
const crc32 = (buf) => { let c = -1; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0 }
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(size) {
  const cell = size / 16
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const ch = PIX[Math.floor(y / cell)]?.[Math.floor(x / cell)] ?? '.'
      const [r, g, b] = COLORS[ch] ?? BG
      const o = y * (size * 3 + 1) + 1 + x * 3
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })
for (const s of [192, 512]) writeFileSync(`public/icon-${s}.png`, png(s))
console.log('icons written')
