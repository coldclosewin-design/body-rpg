import { describe, expect, it } from 'vitest'
import { CHARACTERS, characterByKey } from './characters'
import { DEFAULT_APPEARANCE, PALETTE, toPixelMap } from './palette'
import { HEAD, HEADBAND, SUNGLASSES, CROWN, compose } from './parts'

const FIXED_EYES = ['swimmer', 'knight', 'bookworm', 'dj', 'napper', 'dreamer', 'rogue']
const EYE_X = [9, 10, 14, 15]

describe('A안 캐릭터와 idle', () => {
  it('25종의 함수형 파츠와 눈 감김 행도 잘림 없이 캔버스 안에 들어간다', () => {
    expect(CHARACTERS).toHaveLength(25)
    for (const c of CHARACTERS) for (const p of c.parts) {
      for (const rows of [p.rows, p.blinkRows].filter((r) => r !== undefined)) {
        expect(rows.length, c.key).toBe(p.rows.length)
        for (const row of rows) expect(row.length, c.key).toBe(p.rows[0].length)
        expect((p.x ?? 0) + rows[0].length, c.key).toBeLessThanOrEqual(24)
        expect((p.y ?? 0) + rows.length, c.key).toBeLessThanOrEqual(32)
      }
    }
  })

  it('기본 자세를 보존하고 눈 위쪽 4픽셀만 닫는다; 발과 소품은 움직이지 않는다', () => {
    for (const c of CHARACTERS) {
      const { frames } = toPixelMap(c.parts, c.recolor)
      expect(frames, c.key).toHaveLength(2)
      const [open, blink] = frames
      expect(open, c.key).toEqual(compose(c.parts, c.recolor))
      expect(open[31], c.key).toContain('K')
      expect(blink[31], c.key).toBe(open[31])
      const changes: string[] = []
      open.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch !== blink[y][x]) changes.push(`${x},${y}`)
      }))
      if (FIXED_EYES.includes(c.key)) {
        expect(changes, c.key).toEqual([])
      } else {
        expect(changes, c.key).toEqual(EYE_X.map((x) => `${x},8`))
        for (const x of EYE_X) {
          expect(blink[8][x], c.key).toBe(c.key === 'goblin' ? 'G' : 'S')
          expect(blink[9][x], c.key).toBe('E')
        }
        for (const x of [9, 14]) expect(open[8][x], c.key).toBe(c.key === 'archer' ? 'L' : 'W')
      }
    }
  })

  it('장식 단독 호출은 그대로이며 원본 파츠와 이전 프레임을 변경하지 않는다', () => {
    for (const p of [HEADBAND, SUNGLASSES, CROWN]) {
      const [open, blink] = toPixelMap([p]).frames
      expect(blink).toEqual(open)
    }
    const before = structuredClone(HEAD)
    const first = toPixelMap([HEAD])
    first.frames[1][8] = '.'.repeat(24)
    expect(toPixelMap([HEAD]).frames[0]).toEqual(compose([HEAD]))
    expect(HEAD).toEqual(before)
    expect(toPixelMap([]).frames).toEqual([Array(32).fill('.'.repeat(24)), Array(32).fill('.'.repeat(24))])
  })

  it('역할 문자와 기존 recolor를 양쪽 프레임에 적용한다', () => {
    const novice = characterByKey('novice')!
    for (const frame of toPixelMap(novice.parts).frames) {
      for (const role of ['S', 's', 'H', 'h', 'O', 'o']) expect(frame.join('')).toContain(role)
    }
    const goblin = characterByKey('goblin')!
    for (const frame of toPixelMap(goblin.parts, goblin.recolor).frames) expect(frame.join('')).not.toMatch(/[Ss]/)
  })

  it('두 프레임 모두 14색 이내이며 모든 노출 실루엣은 K로 닫혀 있다', () => {
    for (const c of CHARACTERS) for (const frame of toPixelMap(c.parts, c.recolor).frames) {
      const colors = new Set<string>()
      frame.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') return
        expect(PALETTE[ch], `${c.key}: ${ch}`).toBeDefined()
        colors.add(DEFAULT_APPEARANCE[PALETTE[ch]] ?? PALETTE[ch])
        const touchesAir = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
          .some(([xx, yy]) => !frame[yy]?.[xx] || frame[yy][xx] === '.')
        if (touchesAir) expect(ch, `${c.key}: (${x}, ${y})`).toBe('K')
      }))
      expect(colors.size, c.key).toBeLessThanOrEqual(14)
    }
  })
})
