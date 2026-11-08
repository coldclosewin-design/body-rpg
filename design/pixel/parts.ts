/**
 * 24×32 캐릭터 파츠. '.' 은 투명.
 * 문자: K 외곽선, S/s 피부, H/h 머리색, E 눈, W 흰색 + 고정색(R r B b G g Y y M m C c A a L l N n X x P F)
 * 플레이스홀더 '1'(주색) '2'(음영) '3'(보조: 신발/띠) 는 캐릭터별로 치환된다.
 */
export interface Part {
  rows: string[]
  x?: number
  y?: number
  /** 플레이스홀더/색 치환 */
  map?: Record<string, string>
}

export const W = 24
export const H = 32

export const part = (rows: string[], y = 0, x = 0, map?: Record<string, string>): Part => ({ rows, x, y, map })

/** 파츠를 순서대로 겹쳐 24×32 프레임을 만든다. 뒤의 파츠가 앞을 덮는다. */
export function compose(parts: Part[], globalMap?: Record<string, string>): string[] {
  const grid: string[][] = Array.from({ length: H }, () => Array(W).fill('.'))
  for (const p of parts) {
    const ox = p.x ?? 0, oy = p.y ?? 0
    p.rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        const ch = row[dx]
        if (ch === '.') continue
        const yy = oy + dy, xx = ox + dx
        if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue
        grid[yy][xx] = p.map?.[ch] ?? ch
      }
    })
  }
  return grid.map((r) => r.map((ch) => globalMap?.[ch] ?? ch).join(''))
}

/** 프레임을 dy 만큼 아래로 민다 (idle 애니메이션용) */
export const shiftDown = (rows: string[], dy: number): string[] => {
  const blank = '.'.repeat(rows[0]?.length ?? W)
  const out = [...rows]
  for (let i = 0; i < dy; i++) { out.unshift(blank); out.pop() }
  return out
}

// ───────────────────────── 머리 (y=2) ─────────────────────────
export const HEAD = part([
  '.......KKKKKKKKKK.......',
  '......KSSSSSSSSSSK......',
  '.....KSSSSSSSSSSSSK.....',
  '.....KSSSSSSSSSSSSK.....',
  '.....KSSSSSSSSSSSSK.....',
  '.....KSSSSSSSSSSSSK.....',
  '.....KSSSEESSSEESSK.....',
  '.....KSSSEESSSEESSK.....',
  '.....KSSSSSSSSSSSSK.....',
  '.....KSsSSSSSSSSsSK.....',
  '......KSSSSSSSSSSK......',
  '.......KSSssssSSK.......',
  '........KKKKKKKK........',
  '..........KSSK..........',
], 2)

// ───────────────────────── 머리카락 ─────────────────────────
export const HAIR_SHORT = part([
  '.......KKKKKKKKKK.......',
  '......KHHHHHHHHHHK......',
  '.....KHHHHHHHHHHHHK.....',
  '.....KHHhSSSSSShHHK.....',
  '.....KHhSSSSSSSShHK.....',
  '.....KhSSSSSSSSSShK.....',
], 2)

export const HAIR_LONG = part([
  '.......KKKKKKKKKK.......',
  '......KHHHHHHHHHHK......',
  '.....KHHHHHHHHHHHHK.....',
  '.....KHHHhSSSShHHHK.....',
  '.....KHHSSSSSSSSHHK.....',
  '.....KHhSSSSSSSShHK.....',
  '....KHK..........KHK....',
  '....KHK..........KHK....',
  '....KHK..........KHK....',
  '....KHK..........KHK....',
  '....KHhK........KhHK....',
  '.....KHHK......KHHK.....',
  '......KKKK....KKKK......',
], 2)

export const HAIR_SPIKY = part([
  '......K..K..K..K..K.....',
  '.....KHKKHKKHKKHKKHK....',
  '.....KHHHHHHHHHHHHK.....',
  '.....KHHHHHHHHHHHHK.....',
  '.....KHHHHHHHHHHHHK.....',
  '.....KHhSSSSSSSShHK.....',
  '.....KhSSSSSSSSSShK.....',
], 0)

export const PONYTAIL = part([
  'KHK.',
  'KHHK',
  'KHHK',
  '.KHK',
  '.KhK',
  '..K.',
], 4, 19)

export const BEARD = part([
  '.....KHSSSSSSSSSSHK.....',
  '.....KHHSSSSSSSSHHK.....',
  '......KHHHSSSSHHHK......',
  '.......KHHHhhHHHK.......',
  '.......KHHHHHHHHK.......',
  '........KHHHHHHK........',
  '.........KHHHHK.........',
  '..........KKKK..........',
], 10)

export const LONG_BEARD = (c1: string, c2: string) => part([
  '.....K1SSSSSSSSSS1K.....',
  '.....K11SSSSSSSS11K.....',
  '......K111SSSS111K......',
  '.......K11122111K.......',
  '.......K11111111K.......',
  '.......K11111111K.......',
  '.......K11111111K.......',
  '........K111111K........',
  '........K121121K........',
  '........K111111K........',
  '.........K1111K.........',
  '..........KKKK..........',
], 10, 0, { 1: c1, 2: c2 })

// ───────────────────────── 모자·액세서리 ─────────────────────────
export const HEADBAND = part([
  '.....KRRRRRRRRRRRRK.....',
  '.....KrrrrrrrrrrrrK.....',
], 6)

export const SUNGLASSES = part([
  '.....KSKXXXKKXXXKSK.....',
  '.....KSKxXXKKxXXKSK.....',
], 8)

export const CROWN = part([
  '........Y..YY..Y........',
  '........YYYYYYYY........',
  '.......KYyYYYYyYK.......',
], 0)

export const POINTED_HAT = (c1: string, c2: string) => part([
  '...........KK...........',
  '..........K11K..........',
  '.........K1111K.........',
  '........K111111K........',
  '.......KYYYYYYYYK.......',
  '...KKKK1222222221KKKK...',
  '..K222222222222222222K..',
  '...KKKKKKKKKKKKKKKKKK...',
], 0, 0, { 1: c1, 2: c2 })

export const HELMET = (c1: string, c2: string) => part([
  '........KKKKKKKK........',
  '.......K11111111K.......',
  '......K1111111111K......',
  '.....K111111111111K.....',
  '.....K111111111111K.....',
  '.....K111111111111K.....',
  '.....KKKKKKKKKKKKKK.....',
  '.....K1KXXXXXXXXK1K.....',
  '.....K1KXXXXXXXXK1K.....',
  '.....K1KKKKKKKKKK1K.....',
  '.....K111111111111K.....',
  '......K2222222222K......',
  '.......K22222222K.......',
  '........KKKKKKKK........',
], 1, 0, { 1: c1, 2: c2 })

export const PLUME = part([
  '...........KRRK.........',
  '..........KRRRRK........',
  '..........KrrrrK........',
], 0)

export const HOOD = (c1: string, c2: string) => part([
  '........KKKKKKKK........',
  '.......K11111111K.......',
  '......K1111111111K......',
  '.....K111111111111K.....',
  '.....K12KKKKKKKK21K.....',
  '.....K1K........K1K.....',
  '.....K1K........K1K.....',
  '.....K1K........K1K.....',
  '.....K1K........K1K.....',
  '.....K1K........K1K.....',
  '.....K12K......K21K.....',
  '......K11K....K11K......',
  '.......K1K....K1K.......',
  '........KK....KK........',
], 1, 0, { 1: c1, 2: c2 })

export const SWIM_CAP = (c1: string, c2: string) => part([
  '........KKKKKKKK........',
  '.......K11111111K.......',
  '......K1111111111K......',
  '.....K111111111111K.....',
  '.....K122222222221K.....',
  '.....KKKKKKKKKKKKKK.....',
], 1, 0, { 1: c1, 2: c2 })

export const GOGGLES = part(['.....KXKCCKXXKCCKXK.....'], 7)

// ───────────────────────── 몸통 (y=15) ─────────────────────────
export const SHIRT = (c1: string, c2: string) => part([
  '........KKKSSKKK........',
  '.......K11111111K.......',
  '......K1111111111K......',
  '.....K111111111111K.....',
  '.....K1K11111111K1K.....',
  '.....KSK11111111KSK.....',
  '.....KSK11111111KSK.....',
  '....KSSK12222221KSSK....',
  '....KKKK22222222KKKK....',
  '........KKKKKKKK........',
], 15, 0, { 1: c1, 2: c2 })

export const JACKET = (c1: string, c2: string) => part([
  '........KK1SS1KK........',
  '.......K11111111K.......',
  '......K1111111111K......',
  '.....K111111111111K.....',
  '.....K1K11122111K1K.....',
  '.....KWK11122111KWK.....',
  '.....K1K11122111K1K.....',
  '....KSSK12222221KSSK....',
  '....KKKK22222222KKKK....',
  '........KKKKKKKK........',
], 15, 0, { 1: c1, 2: c2 })

export const TANK = (c1: string, c2: string) => part([
  '........KKKSSKKK........',
  '.......KS1SSSS1SK.......',
  '......KSS1SSSS1SSK......',
  '.....KSSS111111SSSK.....',
  '.....KSK11111111KSK.....',
  '.....KSK11111111KSK.....',
  '.....KSK11111111KSK.....',
  '....KSSK12222221KSSK....',
  '....KKKK22222222KKKK....',
  '........KKKKKKKK........',
], 15, 0, { 1: c1, 2: c2 })

/** 맨몸 + 벨트(1 벨트색, 2 버클) */
export const BARE = (belt: string, buckle: string) => part([
  '........KKKSSKKK........',
  '.......KSSSSSSSSK.......',
  '......KSSSSSSSSSSK......',
  '.....KSSSSSSSSSSSSK.....',
  '.....KSKSsSSSSsSKSK.....',
  '.....KSKSSSSSSSSKSK.....',
  '.....KSKSSsSSsSSKSK.....',
  '....KSSKSSsSSsSSKSSK....',
  '....KKKKSSSSSSSSKKKK....',
  '.......K11122111K.......',
], 15, 0, { 1: belt, 2: buckle })

/** 긴 로브 (다리까지 덮음) 1 주색 2 음영 3 띠 */
export const ROBE = (c1: string, c2: string, sash: string) => part([
  '........KK1SS1KK........',
  '.......K11111111K.......',
  '......K1111111111K......',
  '.....K111111111111K.....',
  '.....K1K11111111K1K.....',
  '.....K1K11111111K1K.....',
  '.....K1K11111111K1K.....',
  '....KSSK11111111KSSK....',
  '....KKKK33333333KKKK....',
  '.......K11111111K.......',
  '.......K11111111K.......',
  '......K1111111111K......',
  '......K1111111111K......',
  '.....K112111111211K.....',
  '.....K222222222222K.....',
  '.....KKKKKKKKKKKKKK.....',
], 15, 0, { 1: c1, 2: c2, 3: sash })

export const ARMOR = (c1: string, c2: string) => part([
  '........KKK11KKK........',
  '......K11K1111K11K......',
  '.....K111K1111K111K.....',
  '.....K221K1111K122K.....',
  '.....K1K11111111K1K.....',
  '.....K1K11211211K1K.....',
  '.....K1K11111111K1K.....',
  '....K11K22222222K11K....',
  '....KKKKYYYYYYYYKKKK....',
  '.......K22222222K.......',
], 15, 0, { 1: c1, 2: c2 })

export const CAPE = (c1: string, c2: string) => part([
  '......KK........KK......',
  '.....K11K......K11K.....',
  '....K111K......K111K....',
  '.....K11K......K11K.....',
  '.....K11K......K11K.....',
  '.....K11K......K11K.....',
  '.....K11K......K11K.....',
  '.....K11K......K11K.....',
  '.....K11K......K11K.....',
  '....K1111K....K1111K....',
  '..K111111111111111111K..',
  '..K111111111111111111K..',
  '..K222222222222222222K..',
  '..KKKKKKKKKKKKKKKKKKKK..',
], 15, 0, { 1: c1, 2: c2 })

// ───────────────────────── 다리 (y=25) ─────────────────────────
export const PANTS = (c1: string, c2: string, shoes: string) => part([
  '.......K11111111K.......',
  '.......K11111111K.......',
  '.......K111KK111K.......',
  '.......K111K.K111K......',
  '.......K111K.K111K......',
  '......K3333K.K3333K.....',
  '......KKKKKK.KKKKKK.....',
], 25, 0, { 1: c1, 2: c2, 3: shoes })

export const SHORTS = (c1: string, shoes: string) => part([
  '.......K11111111K.......',
  '.......K11111111K.......',
  '.......K111KK111K.......',
  '.......KSSSK.KSSSK......',
  '.......KSSSK.KSSSK......',
  '......K3333K.K3333K.....',
  '......KKKKKK.KKKKKK.....',
], 25, 0, { 1: c1, 3: shoes })

// ───────────────────────── 소품 ─────────────────────────
export const SWORD = part([
  '.K.',
  'KLK', 'KLK', 'KLK', 'KLK', 'KLK', 'KLK', 'KLK',
  'KYK',
  'KNK', 'KNK', 'KNK',
  '.K.',
], 10, 19)

export const SHIELD = part([
  '.KKKK.',
  'KLLLLK',
  'KLRRLK',
  'KLRRLK',
  'KLLLLK',
  'KLllLK',
  '.KllK.',
  '..KK..',
], 15, 0)

export const DUMBBELL = part([
  'KKKKK', 'KLLLK', 'KLlLK', 'KKKKK',
  '.KXK.', '.KXK.', '.KXK.',
  'KKKKK', 'KLLLK', 'KLlLK', 'KKKKK',
], 15, 19)

export const BALL = part([
  '.KKKK.',
  'KWWWWK',
  'KWKKWK',
  'KWKKWK',
  'KxWWxK',
  '.KKKK.',
], 26, 18)

export const BOW = part([
  '.KK.',
  'KNK.',
  'KN.K', 'KN.K', 'KN.K', 'KN.K', 'KN.K', 'KN.K', 'KN.K', 'KN.K', 'KN.K', 'KN.K',
  'KNK.',
  '.KK.',
], 10, 19)

export const TORCH = part([
  '.F.',
  'FYF',
  'FYF',
  '.F.',
  ...Array(14).fill('KNK'),
], 7, 20)

export const STAFF = (gem: string, gemDark: string) => part([
  '.KK.',
  'K11K',
  'K21K',
  '.KK.',
  ...Array(18).fill('.KNK'),
], 4, 19, { 1: gem, 2: gemDark })

export const AXE = part([
  '.KKK',
  'KLLK',
  'KLLK',
  'KLlK',
  ...Array(16).fill('.KNK'),
], 7, 19)

export const CLUB = part([
  '.KK.',
  'KNNK',
  'KNNK',
  'KNnK',
  'KNnK',
  '.KK.',
  ...Array(8).fill('.KNK'),
], 12, 19)

const GLOVE = ['.KK.', 'KRRK', 'KRrK', '.KK.']
export const GLOVE_L = part(GLOVE, 20, 3)
export const GLOVE_R = part(GLOVE, 20, 17)

export const SPEED_LINES = part([
  'xxx.....',
  '........',
  '.xxxx...',
  '........',
  'xxx.....',
], 16, 0)

export const WAVES = part([
  '.CC..CC..CC..CC..CC..CC.',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  'cCCcCCcCCcCCcCCcCCcCCcCC',
], 29, 0)

export const EAR_L = part(['KK..', 'KSK.', 'KSSK', 'KSSK', '.KK.'], 5, 2)
export const EAR_R = part(['..KK', '.KSK', 'KSSK', 'KSSK', '.KK.'], 5, 18)

export const NUMBER10 = part([
  '.W.WWW..',
  '.W.W.W..',
  '.W.W.W..',
  '.W.W.W..',
  '.W.WWW..',
], 17, 8)

export const BIB = part(['WWWWWW', 'WKKWKW', 'WWWWWW'], 18, 9)

export const BEADS = part(['Y.Y.Y.Y.', '.Y.Y.Y.Y'], 16, 8)

export const ROPE = part([
  '.KKK.',
  'KAAAK',
  'KA.AK',
  'KA.AK',
  'KAAAK',
  '.KKK.',
], 21, 1)

// ───────────────────────── 분야 스킨 파츠: 토커·사운드메이커·슬리퍼 ─────────────────────────
/** 감은 눈 (수면용). HEAD 의 눈 2줄을 덮어 1px 로 줄인다 */
export const CLOSED_EYES = part([
  '.....KSSSSSSSSSSSSK.....',
  '.....KSSSEESSSEESSK.....',
], 8)

/** 동그란 안경. 렌즈 테 K, 눈은 HEAD 의 것을 그대로 쓴다 */
export const ROUND_GLASSES = part([
  '.......KKKKK.KKKKK......',
  '.......KWEWKKKWEWK......',
  '.......KWEWK.KWEWK......',
  '.......KKKKK.KKKKK......',
], 7)

/** 수면 안대 (1 주색 2 음영). 눈을 완전히 가린다 */
export const EYE_MASK = (c1: string, c2: string) => part([
  '.....KSKKKKKKKKKKSK.....',
  '.....KKK11111111KKK.....',
  '.....KKK12222221KKK.....',
  '.....KSKKKKKKKKKKSK.....',
], 7, 0, { 1: c1, 2: c2 })

/** 수면모자: 돔 + 흰 털 밴드 + 오른쪽으로 늘어진 꼬리와 방울 */
export const NIGHTCAP = (c1: string, c2: string) => part([
  '........KKKKKKKK........',
  '.......K11111111K.......',
  '......K111111111111KKKKK',
  '.....K11111111111112222K',
  '.....K122222222221KK22K.',
  '.....KWWWWWWWWWWWWK.K2K.',
  '.....KLLLLLLLLLLLLK.KWWK',
  '...................KWWWK',
  '...................KWLLK',
  '....................KKK.',
], 1, 0, { 1: c1, 2: c2 })

/** 챙 넓은 음유시인 모자 (FEATHER 와 같이 쓴다) */
export const FEATHER_CAP = (c1: string, c2: string) => part([
  '........KKKKKKKK........',
  '.......K11111111K.......',
  '......K1111111111K......',
  '.....K111111111111K.....',
  '....KK122222222221KK....',
  '...K2222222222222222K...',
  '....KKKKKKKKKKKKKKKK....',
], 1, 0, { 1: c1, 2: c2 })

/** 모자 오른쪽에 꽂은 붉은 깃털 */
export const FEATHER = part([
  '....KK',
  '..KRRK',
  '.KRRK.',
  'KRrK..',
  'KrK...',
], 0, 17)

/** 큰 헤드폰: 머리 위 밴드 + 양쪽 컵 */
export const HEADPHONES = (c1: string, c2: string) => part([
  '........KKKKKKKK........',
  '......KK11111111KK......',
  '.....K11KKKKKKKK11K.....',
  '.....K1K........K1K.....',
  '.....K1K........K1K.....',
  '...KKKKK........KKKKK...',
  '..K1111K........K1111K..',
  '..K1221K........K1221K..',
  '..K1221K........K1221K..',
  '..K1111K........K1111K..',
  '...KKKK..........KKKK...',
], 0, 0, { 1: c1, 2: c2 })

/** 줄무늬 잠옷 상의 (1 주색 2 음영 3 줄무늬) */
export const PAJAMA = (c1: string, c2: string, stripe: string) => part([
  '........KKKSSKKK........',
  '.......K13131313K.......',
  '......K1131313131K......',
  '.....K111313131311K.....',
  '.....K1K13131313K1K.....',
  '.....KSK13131313KSK.....',
  '.....KSK13131313KSK.....',
  '....KSSK23232323KSSK....',
  '....KKKK22222222KKKK....',
  '........KKKKKKKK........',
], 15, 0, { 1: c1, 2: c2, 3: stripe })

/** 셔츠 위 넥타이 */
export const TIE = part([
  'KRRK',
  'KRRK',
  'KRrK',
  'KRrK',
  '.KK.',
], 16, 10)

// ── 손에 든 소품 (몸통 뒤·앞 순서는 캐릭터 정의에서 정한다) ──
/** 가슴에 꼭 안은 베개 */
export const PILLOW = part([
  '..KKKKKKKK..',
  '.KWWWWWWWWK.',
  'KWWWWWWWWWWK',
  'KWWWWWWWWWWK',
  'KWLLLLLLLLWK',
  '.KLLLLLLLLK.',
  '..KKKKKKKK..',
], 17, 6)

/** 펼친 책 */
export const BOOK = part([
  'KKKKKKKKKKKK',
  'KWWWWKKWWWWK',
  'KWLLWKKWLLWK',
  'KWWWWKKWWWWK',
  'KWLLWKKWLLWK',
  'KKKKKKKKKKKK',
], 18, 6)

/** 미니 신디사이저 (노브 4개 + 건반) */
export const SYNTH = part([
  'KKKKKKKKKK',
  'KXRXGXYXBK',
  'KWWKWWKWWK',
  'KWWWWWWWWK',
  'KKKKKKKKKK',
], 19, 7)

/** 손마이크 */
export const MIC = part([
  '.KK.',
  'KLLK',
  'KLlK',
  'KllK',
  '.KK.',
  ...Array(8).fill('.KXK'),
], 12, 19)

/** 류트: 세로 목 + 둥근 몸통. 몸통 파츠 뒤에 그려 오른손 앞에 오게 한다 */
export const LUTE = part([
  '..KKKK.',
  '..KNNnK',
  '..KNNnK',
  '..KNnK.',
  '..KNnK.',
  '..KNnK.',
  '..KNnK.',
  '..KNnK.',
  '..KNnK.',
  '.KKKKK.',
  'KAALLaK',
  'KAALLaK',
  'KAXLLXK',
  'KAXLLXK',
  'KAALLaK',
  'KaaLLaK',
  '.KKKKK.',
], 8, 16)

// ── 효과 ──
/** 왼쪽 위 말풍선 (… ) */
export const SPEECH_BUBBLE = part([
  '.KKKKK.',
  'KWWWWWK',
  'KWXWXWK',
  'KWWWWWK',
  '.KKKWKK',
  '....KK.',
], 0, 0)

/** 왼쪽 위로 흩날리는 음표 2개 */
export const NOTES = part([
  '..Y..',
  '..YY.',
  '..Y..',
  'YYY..',
  'YYY..',
  '.....',
  '...Y.',
  '...YY',
  '...Y.',
  '.YYY.',
  '.YYY.',
], 0, 0)

/** 왼쪽 위 zZ */
export const ZZZ = part([
  'WWWWW',
  '...W.',
  '..W..',
  '.W...',
  'WWWWW',
  '.....',
  '.WWWW',
  '...W.',
  '..W..',
  '.WWWW',
], 0, 0)

// ── 전투 직업 파츠: 미배정 시즌 보상 스킨 ──
/** 얼굴이 드러나는 뿔 투구. 1 주색 2 음영, 뿔은 고정 은색 */
export const HORNED_HELMET = (c1: string, c2: string) => part([
  '..KK................KK..',
  '.KWWK..............KWWK.',
  '.KWLK...KKKKKKKK...KLWK.',
  '.KLLK..K11111111K..KLLK.',
  '..KLLKK1111111222KKLLK..',
  '...KLLK1111112222KLLK...',
  '....KK1KKKKKKKKKK1KK....',
  '.....K1K........K2K.....',
  '.....K1K........K2K.....',
  '.....K1K........K2K.....',
], 0, 0, { 1: c1, 2: c2 })

/** 가죽 조끼·대각선 어깨끈·장갑·은색 버클 허리띠 (1 주색 2 음영) */
export const LEATHER_ARMOR = (c1: string, c2: string) => part([
  '........KKKSSKKK........',
  '.......K111K1112K.......',
  '......K1L1K111L22K......',
  '.....K11K111112222K.....',
  '.....KSK11112222KSK.....',
  '.....K1K11222222K2K.....',
  '.....K1KKKKKKKKKK2K.....',
  '....KXxKNNNLlNNNKXxK....',
  '....KKKKnnnLlnnnKKKK....',
  '.......KKKKKKKKKK.......',
], 15, 0, { 1: c1, 2: c2 })

/** 넓은 날의 전투 도끼. 2px 목재 자루와 손잡이를 쥔 손까지 몸통 앞에 그린다 */
export const BATTLE_AXE = part([
  '.KK....',
  'KNNKKK.',
  'KNYLLWK',
  'KNYLLWK',
  'KNYLLWK',
  'KNYLlLK',
  'KNYllLK',
  'KNnKKK.',
  'KNnK...',
  'KNnK...',
  'KNnK...',
  'KSSK...',
  'KSSK...',
  'KNnK...',
  'KNnK...',
  'KNnK...',
  'KNnK...',
  'KYYK...',
  '.KK....',
], 10, 17)

/** 왼쪽 어깨 뒤의 어두운 가죽 화살통과 흰 깃 화살 두 개. 몸통보다 먼저 그린다 */
export const QUIVER = part([
  'KK.KK.',
  'KWKKWK',
  'KLKKLK',
  '.KNKNK',
  '.KNKNK',
  'KKKKKK',
  'KNNnnK',
  'KNXxnK',
  ...Array(8).fill('KNnnnK'),
  '.KnnK.',
  '..KK..',
], 8, 0)

/** 아래로 내려 든 반곡궁. 은색 현 옆에 2px 목재 활대, 손은 y=22..23에 둔다 */
export const RECURVE_BOW = part([
  '..KKK..',
  '..KNnK.',
  '.KLNnK.',
  'KL.KNnK',
  ...Array(6).fill('KL.KNnK'),
  'KSSKNnK',
  'KSSKNnK',
  ...Array(4).fill('KL.KNnK'),
  '.KLNnK.',
  '..KNnK.',
  '..KnnK.',
  '...KK..',
], 12, 17)

/** 작은 구슬과 어두운 나무 지팡이. 구슬색은 2px, 손은 y=22..23, 끝은 y=31 */
export const ORB_STAFF = (gem: string, gemDark: string) => part([
  '.KKK.',
  'KX12K',
  'KX1XK',
  '.KXK.',
  ...Array(9).fill('.KNnK'),
  'KSSnK',
  'KSSnK',
  ...Array(7).fill('.KNnK'),
  '..KK.',
], 9, 19, { 1: gem, 2: gemDark })

/** 모자 양옆의 희미한 빛 두 점. 각각 3×3 외곽선 안에 은색/흰색 1px만 둔다 */
export const SPARKLES = part([
  '.K......................',
  'KLK.....................',
  '.K....................K.',
  '.....................KWK',
  '......................K.',
], 0, 0)

/** 후드 아래 은발 한 가닥과 가늘게 그늘진 눈, 목까지 덮는 복면 (1 주색 2 음영) */
export const FACE_WRAP = (c1: string, c2: string) => part([
  '.....K1HKKKKKKKKK2K.....',
  '.....K1hKKKKKKKKK2K.....',
  '.....K1KxxxxxxxxK2K.....',
  '.....K1KlKlllKllK2K.....',
  '.....K1KKKKKKKKKK2K.....',
  '.....K111111112222K.....',
  '......K1111122222K......',
  '.......K22222222K.......',
  '........KKKKKKKK........',
  '..........K22K..........',
], 6, 0, { 1: c1, 2: c2 })

/** 몸 옆으로 내려 든 짧은 쌍단검. 장갑은 y=22, 날은 아래를 향하며 끝은 y=29 */
export const DAGGER_L = part([
  '..KK..',
  '.KXxKK',
  '.KXxKK',
  'KLLlK.',
  '.KWlK.',
  '.KLlK.',
  '..KlK.',
  '...K..',
], 22, 1)

export const DAGGER_R = part([
  '..KK..',
  'KKXxK.',
  'KKXxK.',
  '.KLLlK',
  '.KWlK.',
  '.KLlK.',
  '.KLK..',
  '..K...',
], 22, 17)

// ── 다크 판타지 전투 파츠 ──
/** 왼쪽 자락은 발목까지, 오른쪽은 무릎까지 흐르는 코트. 다리·몸통 뒤에 겹친다 */
export const LONG_COAT = (c1: string, c2: string) => part([
  '.....KKKK......KKKKK....',
  '....K1111K....K11112K...',
  '....K1111K....K11112K...',
  '....K1111K....K11112K...',
  '....K1112K....K11112K...',
  '....K1112K....K11122K...',
  '....K1112K....K11122K...',
  '...K11112K....K11222K...',
  '...K11112K....K11222K...',
  '...K11112K....K11222K...',
  '..K111122K....K12222K...',
  '..K111122K....K2222K....',
  '..K111222K.....KKKK.....',
  '..K112222K..............',
  '...K2222K...............',
  '....KKKK................',
], 15, 0, { 1: c1, 2: c2 })

/** 왼쪽 어깨에서 길게 흘러 끝이 갈라지는 망토. 몸통과 손 소품보다 먼저 그린다 */
export const TATTERED_CAPE = (c1: string, c2: string) => part([
  '....KKKK..',
  '...K1112K.',
  '..K111122K',
  '..K111122K',
  '.K1111122K',
  '.K1111122K',
  'K11111222K',
  'K11111222K',
  'K11112222K',
  'K11112222K',
  'K11112222K',
  'K11122222K',
  'K11122222K',
  'K11222222K',
  'K112K2222K',
  'K12KK222K.',
  'K12K.K22K.',
  '.KK..K2K..',
  '......K...',
], 13, 1, { 1: c1, 2: c2 })

/** 검은 넥타이 양옆으로 드러나는 흰 셔츠 깃 3px */
export const SHIRT_COLLAR = part(['W....W', 'W.....'], 16, 9)

/** 눈썹 아래 1px 피부 그늘. 눈(E)은 HEAD 의 것을 그대로 쓴다 */
export const BROW_SHADOW = part(['ssssssss'], 7, 8)
/** 오른쪽 눈만 붉게 빛남. HEAD 의 눈 위에 덮는다 */
export const RED_EYE = part(['RR', 'rr'], 8, 14)

/** 손을 낮춰 짚는 대검. 검날은 3px 은색 면과 K 외곽선, 끝은 y=31 */
export const GROUNDED_SWORD = part([
  '...KK..',
  '..KXxK.',
  '..KXxK.',
  '..KXxK.',
  'KSSSSK.',
  'KLLlllK',
  '.KWllK.',
  '.KLllK.',
  '.KLllK.',
  '.KLllK.',
  '.KLllK.',
  '.KLllK.',
  '..KLK..',
  '...K...',
], 18, 17)
