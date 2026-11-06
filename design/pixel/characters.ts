import * as P from './parts'
import type { Part } from './parts'

/** 캐릭터(직업 스킨) 정의. 파츠 순서 = 그리는 순서(뒤 → 앞). */
export interface CharacterDef {
  key: string
  label: string
  desc: string
  parts: Part[]
  /** 합성 후 전체 치환 (예: 고블린 피부색) */
  recolor?: Record<string, string>
}

export const CHARACTERS: CharacterDef[] = [
  {
    key: 'novice', label: '견습생', desc: '모든 모험의 시작. 흰 티에 반바지. 옷 색은 외형 편집에서 바꿀 수 있다.',
    parts: [P.HEAD, P.HAIR_SHORT, P.SHIRT('O', 'o'), P.SHORTS('P', 'X')],
  },
  {
    key: 'tracksuit', label: '운동깔짝이', desc: '1차 전직. 줄무늬 트레이닝복에 헤어밴드.',
    parts: [P.HEAD, P.HAIR_SHORT, P.HEADBAND, P.JACKET('B', 'b'), P.PANTS('B', 'b', 'W')],
  },
  {
    key: 'runner', label: '러너', desc: '질주하는 자. 번호표와 바람 자국, 뾰족 머리.',
    parts: [P.SPEED_LINES, P.HEAD, P.HAIR_SPIKY, P.TANK('A', 'a'), P.BIB, P.SHORTS('X', 'Y')],
  },
  {
    key: 'lifter', label: '리프터', desc: '바바리안 체형. 수염, 챔피언 벨트, 덤벨.',
    parts: [P.HEAD, P.HAIR_SHORT, P.BARE('Y', 'y'), P.PANTS('N', 'n', 'X'), P.BEARD, P.DUMBBELL],
  },
  {
    key: 'striker', label: '스트라이커', desc: '10번 유니폼의 볼러. 발밑에 공.',
    parts: [P.HEAD, P.HAIR_SHORT, P.SHIRT('R', 'r'), P.NUMBER10, P.SHORTS('W', 'X'), P.BALL],
  },
  {
    key: 'ranger', label: '레인저', desc: '정밀함의 상징. 녹색 후드, 가죽 재킷, 긴 활.',
    parts: [P.HEAD, P.HOOD('G', 'g'), P.JACKET('N', 'n'), P.PANTS('n', 'n', 'X'), P.BOW],
  },
  {
    key: 'brawler', label: '브롤러', desc: '맨몸의 파이터. 붉은 글러브와 헤어밴드.',
    parts: [P.HEAD, P.HAIR_SHORT, P.HEADBAND, P.BARE('R', 'r'), P.SHORTS('B', 'X'), P.GLOVE_L, P.GLOVE_R],
  },
  {
    key: 'monk', label: '수행자', desc: '유연과 평정. 삭발, 주황 로브, 염주.',
    parts: [P.HEAD, P.ROBE('A', 'a', 'Y'), P.BEADS],
  },
  {
    key: 'swimmer', label: '스위머', desc: '물결을 가르는 자. 수모·물안경, 발밑의 파도.',
    parts: [P.HEAD, P.SWIM_CAP('B', 'b'), P.GOGGLES, P.BARE('B', 'b'), P.SHORTS('B', 'S'), P.WAVES],
  },
  {
    key: 'knight', label: '철의 기사', desc: '리프터의 정점. 강철 갑옷, 붉은 깃털 투구, 검과 방패.',
    parts: [P.HEAD, P.HELMET('L', 'l'), P.PLUME, P.ARMOR('L', 'l'), P.PANTS('X', 'x', 'l'), P.SWORD, P.SHIELD],
  },
  {
    key: 'champion', label: '챔피언', desc: '시즌의 왕. 황금 갑옷, 붉은 망토, 왕관.',
    parts: [P.CAPE('R', 'r'), P.HEAD, P.HAIR_SHORT, P.CROWN, P.ARMOR('Y', 'y'), P.PANTS('X', 'x', 'y'), P.SWORD],
  },
  {
    key: 'sage', label: '현자', desc: '계획과 기록의 마스터. 보라 로브, 흰 수염, 수정 지팡이.',
    parts: [P.HEAD, P.ROBE('M', 'm', 'Y'), P.LONG_BEARD('L', 'l'), P.POINTED_HAT('M', 'm'), P.STAFF('C', 'c')],
  },
  {
    key: 'climber', label: '클라이머', desc: '벽을 오르는 자. 포니테일, 로프, 피켈.',
    parts: [P.HEAD, P.HAIR_SHORT, P.PONYTAIL, P.TANK('C', 'c'), P.PANTS('X', 'x', 'A'), P.ROPE, P.AXE],
  },
  {
    key: 'healer', label: '힐러', desc: '회복의 수호자. 긴 머리, 흰 로브, 초록 수정 지팡이.',
    parts: [P.HEAD, P.HAIR_LONG, P.ROBE('W', 'x', 'G'), P.STAFF('G', 'g')],
  },
  // ── 토커(영어) ──
  {
    key: 'bookworm', label: '책벌레', desc: '토커 중간 단계. 동그란 안경에 펼친 책. 읽고 또 읽는다.',
    parts: [P.HEAD, P.HAIR_SHORT, P.ROUND_GLASSES, P.SHIRT('G', 'g'), P.PANTS('N', 'n', 'X'), P.BOOK],
  },
  {
    key: 'speaker', label: '스피커', desc: '토커의 완성. 흰 셔츠에 넥타이, 손마이크와 말풍선.',
    parts: [P.HEAD, P.HAIR_SHORT, P.SHIRT('W', 'x'), P.TIE, P.PANTS('X', 'x', 'N'), P.MIC, P.SPEECH_BUBBLE],
  },
  // ── 사운드메이커 ──
  {
    key: 'dj', label: '디제이', desc: '사운드메이커 중간 단계. 큰 헤드폰, 선글라스, 미니 신디.',
    parts: [P.HEAD, P.HAIR_SHORT, P.SUNGLASSES, P.HEADPHONES('R', 'r'), P.SHIRT('X', 'x'), P.PANTS('B', 'b', 'W'), P.SYNTH],
  },
  {
    key: 'bard', label: '바드', desc: '사운드메이커의 완성. 깃털 모자, 류트, 흩날리는 음표.',
    parts: [P.HEAD, P.FEATHER_CAP('G', 'g'), P.FEATHER, P.SHIRT('M', 'm'), P.PANTS('N', 'n', 'X'), P.LUTE, P.NOTES],
  },
  // ── 슬리퍼 ──
  {
    key: 'napper', label: '낮잠꾼', desc: '슬리퍼 중간 단계. 안대를 쓰고 베개를 꼭 안았다.',
    parts: [P.HEAD, P.HAIR_SHORT, P.EYE_MASK('R', 'r'), P.SHIRT('C', 'c'), P.PANTS('x', 'x', 'W'), P.PILLOW],
  },
  {
    key: 'dreamer', label: '드리머', desc: '슬리퍼의 완성. 수면모자와 줄무늬 잠옷, 머리 위로 zZ.',
    parts: [P.HEAD, P.CLOSED_EYES, P.NIGHTCAP('M', 'm'), P.PAJAMA('B', 'b', 'W'), P.PANTS('B', 'b', 'A'), P.ZZZ],
  },
  {
    key: 'goblin', label: '나태 고블린', desc: '스트릭이 끊기면 나타나는 훼방꾼. 초록 피부, 뾰족 귀, 몽둥이.',
    parts: [P.HEAD, P.EAR_L, P.EAR_R, P.TANK('N', 'n'), P.SHORTS('n', 'G'), P.CLUB],
    recolor: { S: 'G', s: 'g' },
  },
]

export const characterByKey = (key: string) => CHARACTERS.find((c) => c.key === key)
