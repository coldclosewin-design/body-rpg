import { CHARACTERS } from './characters'
import { compose, shiftDown, CROWN, HEADBAND, SUNGLASSES, type Part } from './parts'
import type { PixelMap, SpriteDef } from './types'

/**
 * 스프라이트 레지스트리. 키(key)는 JobTier.outfit / Reward.value / Character.equipped* 로 참조된다.
 * PNG 에셋으로 교체하려면 해당 항목의 source 를
 *   { kind:'png', url:'/sprites/xxx.png', frameW:24, frameH:32, frames:2 }
 * 로 바꾸면 된다.
 */

export const PALETTE: PixelMap['palette'] = {
  K: '#101018', E: '#101018', W: '#ffffff',
  S: 'skin', s: 'skinShadow', H: 'hair', h: 'hairShadow', O: 'outfit', o: 'outfitDark',
  R: '#e94560', r: '#b3243f',
  B: '#3a86ff', b: '#2458b3',
  G: '#4caf50', g: '#2e7d32',
  Y: '#ffd166', y: '#d9a441',
  M: '#7b4fb5', m: '#51327a',
  C: '#4cc9f0', c: '#2a7fa8',
  A: '#f4a261', a: '#c9772f',
  L: '#c8ccd8', l: '#8e94a6',
  N: '#8b5a2b', n: '#5c3a1a',
  X: '#3a3a4a', x: '#6b6b80',
  P: '#2b2d42',
  F: '#fb5607',
}

/** 파츠 목록 → 2프레임(idle: 1px 바운스) 픽셀맵 */
export const toPixelMap = (parts: Part[], recolor?: Record<string, string>): PixelMap => {
  const f0 = compose(parts, recolor)
  return { kind: 'pixelmap', w: 24, h: 32, frames: [f0, shiftDown(f0, 1)], palette: PALETTE }
}

const characterSprites: SpriteDef[] = CHARACTERS.map((c) => ({
  key: c.key, label: c.label, desc: c.desc, layer: 'outfit', source: toPixelMap(c.parts, c.recolor),
}))

const accessorySprites: SpriteDef[] = [
  { key: 'headband', label: '헤어밴드', layer: 'accessory', source: toPixelMap([HEADBAND]) },
  { key: 'sunglasses', label: '선글라스', layer: 'accessory', source: toPixelMap([SUNGLASSES]) },
  { key: 'crown', label: '왕관', layer: 'accessory', source: toPixelMap([CROWN]) },
]

export const SPRITES: SpriteDef[] = [...characterSprites, ...accessorySprites]

/** 장착된 스킨이 없을 때 기본 스킨 */
export const DEFAULT_OUTFIT = 'novice'

/** 예전 키 호환 (16×24 시절 코스튬 → 새 직업 스킨) */
const ALIASES: Record<string, string> = { pro_kit: 'striker', legend: 'knight' }

export const spriteByKey = (key: string | null | undefined): SpriteDef | undefined =>
  key ? SPRITES.find((s) => s.key === (ALIASES[key] ?? key)) : undefined

export const spritesOfLayer = (layer: SpriteDef['layer']) => SPRITES.filter((s) => s.layer === layer)
