import { describe, expect, it } from 'vitest'
import { PALETTE, SPRITES } from './sprites'
import * as P from './parts'
import { CANVAS_H, CANVAS_W } from './types'

/** 파츠 원본 행 길이가 들쭉날쭉하면(오타) 여기서 잡힌다 */
const PART_EXPORTS = Object.entries(P).filter(([, v]) => typeof v === 'object' && v && 'rows' in (v as object)) as [string, P.Part][]

describe('pixel parts', () => {
  it('전폭 파츠는 모든 행이 24칸', () => {
    for (const [name, part] of PART_EXPORTS) {
      if (!part.rows.some((r) => r.length === CANVAS_W)) continue
      for (const row of part.rows) expect(row.length, `${name}: "${row}"`).toBe(CANVAS_W)
    }
  })
  it('부분 파츠는 행 길이가 서로 같고 캔버스 안에 들어감', () => {
    for (const [name, part] of PART_EXPORTS) {
      const w = part.rows[0].length
      for (const row of part.rows) expect(row.length, name).toBe(w)
      expect((part.x ?? 0) + w, name).toBeLessThanOrEqual(CANVAS_W)
      expect((part.y ?? 0) + part.rows.length, name).toBeLessThanOrEqual(CANVAS_H)
    }
  })
})

describe('sprite registry', () => {
  it('모든 스프라이트는 24×32, 2프레임, 팔레트에 있는 문자만 사용', () => {
    const allowed = new Set(Object.keys(PALETTE))
    for (const s of SPRITES) {
      if (s.source.kind !== 'pixelmap') continue
      expect(s.source.frames.length, s.key).toBe(2)
      for (const frame of s.source.frames) {
        expect(frame.length, s.key).toBe(CANVAS_H)
        for (const row of frame) {
          expect(row.length, `${s.key}: "${row}"`).toBe(CANVAS_W)
          for (const ch of row) {
            if (ch === '.') continue
            expect(allowed.has(ch), `${s.key} 에 팔레트에 없는 문자 '${ch}'`).toBe(true)
          }
        }
      }
    }
  })
  it('플레이스홀더(1/2/3)가 남아 있지 않음', () => {
    for (const s of SPRITES) {
      if (s.source.kind !== 'pixelmap') continue
      const joined = s.source.frames[0].join('')
      expect(/[123]/.test(joined), `${s.key} 에 치환되지 않은 플레이스홀더`).toBe(false)
    }
  })
  it('키 중복 없음', () => {
    const keys = SPRITES.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
