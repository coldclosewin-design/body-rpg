import { CHARACTERS } from '@design/pixel/characters'
import { CROWN, HEADBAND, SUNGLASSES } from '@design/pixel/parts'
import { PALETTE, toPixelMap } from '@design/pixel/palette'
import type { SpriteDef } from '@design/pixel/types'

export { PALETTE, toPixelMap }

/**
 * 앱 전용 스프라이트 레지스트리. 그림 자체(파츠·캐릭터·팔레트)는 design/pixel/ 에 있고, 여기서는
 * 그것을 앱의 키(JobTier.outfit / Reward.value / Character.equipped*)에 연결한다.
 * PNG 에셋으로 교체하려면 해당 항목의 source 를
 *   { kind:'png', url:'/sprites/xxx.png', frameW:24, frameH:32, frames:2 }
 * 로 바꾸면 된다.
 */

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
