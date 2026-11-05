import type { PixelMap, SpriteDef } from './types'

/**
 * 스프라이트 레지스트리. 키(key)는 JobTier.outfit / Reward.value 로 참조된다.
 * PNG 에셋으로 교체하려면 해당 항목의 source 를 { kind:'png', url:'/sprites/xxx.png', frameW:16, frameH:24, frames:2 } 로 바꾸면 된다.
 */

const BASE_PALETTE: PixelMap['palette'] = {
  K: '#101018', S: 'skin', s: 'skinShadow', H: 'hair', h: 'hairShadow',
  O: 'outfit', o: 'outfitDark', P: '#2b2d42', E: '#101018', W: '#ffffff',
  Y: '#ffd166', y: '#d9a441', R: '#e94560', r: '#b3243f', B: '#4cc9f0', b: '#2a7fa8',
  G: '#06d6a0', g: '#04956f', X: '#3a3a4a', M: '#c77dff',
}

const pm = (frames: string[][], extra: Partial<PixelMap> = {}): PixelMap => ({
  kind: 'pixelmap', w: frames[0]?.[0]?.length ?? 16, h: frames[0]?.length ?? 24, frames, palette: BASE_PALETTE, ...extra,
})

/** 기본 몸체 (피부·눈·바지·신발 + 기본 머리). 16x24, 2프레임(idle: 2번째 프레임은 어깨가 살짝 내려감) */
const BODY_F0 = [
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
  '..KKKooooooKKK..',
  '.....KPPPPK.....',
  '.....KPPPPK.....',
  '.....KPKKPK.....',
  '.....KPK.KPK....',
  '.....KPK.KPK....',
  '....KKKK.KKKK...',
  '................',
]
const BODY_F1 = [
  '................',
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
  '..KKKooooooKKK..',
  '.....KPPPPK.....',
  '.....KPKKPK.....',
  '.....KPK.KPK....',
  '.....KPK.KPK....',
  '....KKKK.KKKK...',
  '................',
]

// ---- 코스튬 오버레이 (상의 영역 rows 11~16, frame1 은 1px 아래) ----
const shift = (rows: string[], dy: number): string[] => {
  const blank = '.'.repeat(rows[0].length)
  const out = [...rows]
  for (let i = 0; i < dy; i++) { out.unshift(blank); out.pop() }
  return out
}
const outfit = (rows: string[]): PixelMap => pm([rows, shift(rows, 1)])

const TRACKSUIT = [
  '................', '................', '................', '................', '................', '................',
  '................', '................', '................', '................', '................',
  '....KBBBBBBK....',
  '...KSBWBBWBSK...',
  '..KSKBWBBWBKSK..',
  '..KSKBWBBWBKSK..',
  '..KSKbWbbWbKSK..',
  '..KKKbbbbbbKKK..',
  '.....KXXXXK.....',
  '.....KXXXXK.....',
  '.....KXKKXK.....',
  '.....KXK.KXK....',
  '.....KXK.KXK....',
  '....KKKK.KKKK...',
  '................',
]
const PRO_KIT = [
  '................', '................', '................', '................', '................', '................',
  '................', '................', '................', '................', '................',
  '....KOOOOOOK....',
  '...KSOWOOWOSK...',
  '..KSKOOWWOOKSK..',
  '..KSKOOWWOOKSK..',
  '..KSKoOWWOoKSK..',
  '..KKKooooooKKK..',
  '.....KWWWWK.....',
  '.....KWWWWK.....',
  '.....KWKKWK.....',
  '.....KWK.KWK....',
  '.....KWK.KWK....',
  '....KKKK.KKKK...',
  '................',
]
const LEGEND = [
  '................', '................', '................', '................', '................', '................',
  '................', '................', '................', '................', '................',
  '...KKYYYYYYKK...',
  '..KRKYyYYyYKRK..',
  '.KRRKYYYYYYKRRK.',
  '.KRRKYyYYyYKRRK.',
  '.KRRKyyyyyyKRRK.',
  '.KrrKKyyyyKKrrK.',
  '.KrrrKXXXXKrrrK.',
  '.KrrrKXXXXKrrrK.',
  '..KKKKXKKXKKKK..',
  '.....KXK.KXK....',
  '.....KXK.KXK....',
  '....KYYY.YYYK...',
  '................',
]
const CHAMPION = [
  '................', '................', '................', '................', '................', '................',
  '................', '................', '................', '................', '................',
  '....KMMMMMMK....',
  '...KSMYMMYMSK...',
  '..KSKMMYYMMKSK..',
  '..KSKMMYYMMKSK..',
  '..KSKMMMMMMKSK..',
  '..KKKMMMMMMKKK..',
  '.....KXXXXK.....',
  '.....KXXXXK.....',
  '.....KXKKXK.....',
  '.....KXK.KXK....',
  '.....KXK.KXK....',
  '....KYYY.YYYK...',
  '................',
]

// ---- 액세서리 (머리 영역) ----
const HEADBAND = [
  '................', '................', '................', '................',
  '...KRRRRRRRRK...',
  '...KrRRRRRRrK...',
]
const SUNGLASSES = [
  '................', '................', '................', '................', '................', '................',
  '................',
  '...KKKKKKKKKK...',
  '....KXXKKXXK....',
]
const CROWN = [
  '.....Y.YY.Y.....',
  '.....YYYYYY.....',
  '.....YyYYyY.....',
]

// ---- 머리 스타일 (rows 2~5 교체) ----
const HAIR_LONG = [
  '................', '................',
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHhSSHhHK...',
  '...KHSSSSSSHK...',
  '...KHSESSSEHK...',
  '...KHSSSsSsHK...',
  '...KHSSssSSHK...',
  '...KhKSSSSKhK...',
  '...KhK....KhK...',
  '...KKK....KKK...',
]
const HAIR_SPIKY = [
  '....K..KK..K....',
  '...KHKKHHKKHK...',
  '...KHHHHHHHHK...',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHhSSSSHhK...',
]

export const SPRITES: SpriteDef[] = [
  { key: 'base', label: '기본 몸', layer: 'body', source: pm([BODY_F0, BODY_F1]) },
  { key: 'hair_short', label: '짧은 머리', layer: 'hair', source: pm([[], []]) },
  { key: 'hair_long', label: '긴 머리', layer: 'hair', source: pm([HAIR_LONG, shift(HAIR_LONG, 1)]) },
  { key: 'hair_spiky', label: '뾰족 머리', layer: 'hair', source: pm([HAIR_SPIKY, shift(HAIR_SPIKY, 1)]) },
  { key: 'tracksuit', label: '트레이닝복', layer: 'outfit', source: outfit(TRACKSUIT) },
  { key: 'pro_kit', label: '프로 유니폼', layer: 'outfit', source: outfit(PRO_KIT) },
  { key: 'legend', label: '전설의 갑옷', layer: 'outfit', source: outfit(LEGEND) },
  { key: 'champion', label: '챔피언 유니폼', layer: 'outfit', source: outfit(CHAMPION) },
  { key: 'headband', label: '헤어밴드', layer: 'accessory', source: pm([HEADBAND, shift(HEADBAND, 1)]) },
  { key: 'sunglasses', label: '선글라스', layer: 'accessory', source: pm([SUNGLASSES, shift(SUNGLASSES, 1)]) },
  { key: 'crown', label: '왕관', layer: 'accessory', source: pm([CROWN, shift(CROWN, 1)]) },
]

export const spriteByKey = (key: string | null | undefined): SpriteDef | undefined =>
  key ? SPRITES.find((s) => s.key === key) : undefined

export const spritesOfLayer = (layer: SpriteDef['layer']) => SPRITES.filter((s) => s.layer === layer)
