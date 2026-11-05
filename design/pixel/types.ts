/**
 * 스프라이트 소스 두 종류.
 * - pixelmap: 코드로 그린 문자 픽셀맵 (design/pixel/parts.ts + characters.ts 에서 합성)
 * - png: 나중에 사용자가 제공하는 스프라이트 시트 (public/sprites/*.png)
 * 렌더러(src/pixel/PixelCanvas)는 둘 다 처리하므로 src/pixel/sprites.ts 레지스트리 항목만 바꾸면 교체된다.
 */

/** 팔레트 역할 문자. 캐릭터 외형(피부/머리/옷 색)에 따라 실제 색으로 치환된다. */
export type PaletteRole = 'skin' | 'skinShadow' | 'hair' | 'hairShadow' | 'outfit' | 'outfitDark'

export interface PixelMap {
  kind: 'pixelmap'
  w: number
  h: number
  /** 프레임별 행 문자열. '.' 는 투명 */
  frames: string[][]
  /** 문자 → 색상(hex) 또는 팔레트 역할 */
  palette: Record<string, string | PaletteRole>
  offsetX?: number
  offsetY?: number
}

export interface PngSheet {
  kind: 'png'
  url: string
  frameW: number
  frameH: number
  frames: number
  offsetX?: number
  offsetY?: number
}

export type SpriteSource = PixelMap | PngSheet

/** outfit = 캐릭터 전신 스킨(직업), accessory = 머리 장식 */
export type Layer = 'outfit' | 'accessory'

export interface SpriteDef {
  key: string
  label: string
  layer: Layer
  desc?: string
  source: SpriteSource
}

export const CANVAS_W = 24
export const CANVAS_H = 32
