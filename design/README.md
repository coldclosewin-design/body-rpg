# Body RPG 디자인 컨셉

앱과 분리해 관리하는 디자인 자산. 다른 프로젝트에서 같은 분위기를 쓰려면 이 폴더를 통째로 복사하면 된다.
앱 코드(`src/`)는 이 폴더를 `@design/*` 별칭으로 가져다 쓰고, 그림·색·폰트의 원본은 여기에만 둔다.

```
design/
├─ README.md             이 문서
├─ character-sheet.png   캐릭터 25종 미리보기 시트 (npm run sheet 로 재생성)
├─ pixel/                픽셀 캐릭터 시스템 (앱 의존성 없음, Node/브라우저 공용)
│  ├─ types.ts           캔버스 규격 24×32, PixelMap / PngSheet / SpriteDef 타입
│  ├─ palette.ts         문자 → 색 팔레트, 기본 외형 색, toPixelMap()
│  ├─ parts.ts           파츠 71종 (머리·머리카락·모자·몸통·다리·소품·효과) + compose()
│  ├─ characters.ts      파츠를 조합한 캐릭터 25종
│  └─ render-sheet.ts    시트 PNG 생성 스크립트
└─ theme/
   └─ theme.css          Tailwind v4 @theme 토큰(색·폰트) + 픽셀 UI 컴포넌트 클래스
```

## 1. 컨셉 한 줄

**"내 몸을 레트로 RPG 캐릭터처럼 키운다."** 16비트 시절 RPG 스티커 같은 픽셀 캐릭터, 두꺼운 검정 외곽선, 오프셋 그림자가 붙은 UI, 한글 픽셀 폰트. 어둡고 채도 높은 남색 바탕에 금색·민트·하늘색 포인트.

레퍼런스: 머리가 큰 2.5등신, 외곽선이 뚜렷하고 명암이 2단계인 RPG 직업 캐릭터 스티커(기사·엘프·도적·마녀·드워프·고블린 등). 사용자가 준 레퍼런스 이미지를 보관하려면 `design/reference/` 폴더를 만들어 넣는다.

## 2. 픽셀 캐릭터 규격

| 항목 | 값 |
|---|---|
| 캔버스 | 24 × 32 px, 캐릭터는 가운데 정렬, 발바닥이 y=31 |
| 비율 | 2.5등신. 머리(모자 포함) 약 12px, 몸통 10px, 다리 7px |
| 프레임 | idle 2프레임. 2프레임은 1프레임을 1px 아래로 내린 것 (`shiftDown`) |
| 외곽선 | 모든 실루엣에 `K`(#101018) 1px. 내부 구분선도 같은 색 |
| 명암 | 면마다 밝은 면(대문자)과 그림자 면(소문자) 2단계. 광원은 왼쪽 위 |
| 투명 | `.` |
| 렌더 | `image-rendering: pixelated`, 정수 배율(앱 3~5배, 시트 8배) |

### 팔레트 (`palette.ts`)

- 고정: `K` 외곽선 `E` 눈 `W` 흰색
- 역할 문자(사용자 외형 설정으로 치환): `S/s` 피부, `H/h` 머리카락, `O/o` 옷
- 고정 색: `R` 빨강 `B` 파랑 `G` 초록 `Y` 노랑(금) `M` 보라 `C` 하늘 `A` 주황 `L` 은색 `N` 갈색 `X` 진회색 `P` 남색 `F` 형광주황. 소문자는 각각의 그림자 색.
- 파츠 안의 `1` `2` `3`은 자리표시자. 파츠를 쓰는 쪽(`part(rows, y, x, { '1': 'R', '2': 'r' })`)이나 캐릭터의 `recolor`로 채운다. 남아 있으면 테스트가 실패한다.

### 파츠 시스템 (`parts.ts`)

`part(rows, y, x, map)` 로 조각을 만들고 `compose(parts)` 가 순서대로 덮어 그린다(뒤 파츠가 앞 파츠를 가림). 대략의 레이어 순서:

```
CAPE/WAVES/QUIVER 같은 뒤 배경 → 다리(PANTS/SHORTS) → 몸통(SHIRT/JACKET/TANK/BARE/ROBE/ARMOR/LEATHER_ARMOR)
→ 머리(HEAD) → 수염 → 머리카락(HAIR_*) → 모자(HELMET/HORNED_HELMET/HOOD/POINTED_HAT/SWIM_CAP/NIGHTCAP/FEATHER_CAP/HEADPHONES) → 얼굴 장식(HEADBAND/SUNGLASSES/GOGGLES/CROWN/ROUND_GLASSES/EYE_MASK/CLOSED_EYES/FACE_WRAP)
→ 손 소품(SWORD/SHIELD/DUMBBELL/BALL/BOW/RECURVE_BOW/TORCH/STAFF/ORB_STAFF/AXE/BATTLE_AXE/DAGGER_L/DAGGER_R/CLUB/ROPE/MIC/LUTE/BOOK/PILLOW/SYNTH) → 효과(SPEED_LINES/SPEECH_BUBBLE/NOTES/ZZZ/SPARKLES)
```

새 파츠를 그릴 때 규칙: 행 길이는 파츠 안에서 일정하게, 전폭 파츠는 24칸. 외곽선을 먼저 닫고 안을 채운다. 가는 소품(활·지팡이)은 2px 이상 굵기로, 1px 선은 축소 화면에서 사라진다.

### 캐릭터 (`characters.ts`)

`{ key, label, desc, parts, recolor? }` 한 줄이 캐릭터 하나. 현재 25종:

| key | 이름 | 용도 |
|---|---|---|
| novice | 견습생 | 기본. 옷 색이 외형 설정을 따르는 유일한 캐릭터 |
| tracksuit | 운동깔짝이 | 1차 전직 공용 |
| runner / striker / ranger | 러너 / 스트라이커 / 레인저 | 볼러 2·3·4차 |
| brawler / lifter / knight | 브롤러 / 리프터 / 철의 기사 | 리프터 2·3·4차 |
| champion | 챔피언 | 시즌 보상 |
| monk / swimmer / sage / climber / healer | 수행자 / 스위머 / 현자 / 클라이머 / 힐러 | 요가·수영·기록·클라이밍·회복 분야용 예비 |
| bookworm / speaker | 책벌레 / 스피커 | 토커(영어) 중간·완성 단계 |
| dj / bard | 디제이 / 바드 | 사운드메이커 중간·완성 단계 |
| napper / dreamer | 낮잠꾼 / 드리머 | 슬리퍼(수면) 중간·완성 단계 |
| warrior | 전사 | 미배정 시즌 보상. 뿔 투구·갈색 가죽 갑옷·대형 도끼 |
| archer | 궁수 | 미배정 시즌 보상. 파란 깃털 모자·화살통·금빛 반곡궁 |
| mage | 마법사 | 미배정 시즌 보상. 푸른 뾰족 모자·긴 로브·붉은 구슬 지팡이·별빛 |
| rogue | 도적 | 미배정 시즌 보상. 복면·어두운 가죽 옷·허리띠·양손 단검 |
| goblin | 나태 고블린 | 적. 스트릭이 끊기면 등장 (`recolor` 로 피부를 초록으로) |

전투 스킨 4종은 특정 분야 전직에 배정하지 않는다. 앱 편집 → 시즌 화면에서 보상 스킨으로 해당 key를 고를 수 있다.

미리보기: `npm run sheet` → `design/character-sheet.png`.

## 3. UI 테마 (`theme/theme.css`)

Tailwind v4 `@theme` 토큰. `text-gold`, `bg-panel`, `border-muted` 같은 유틸리티가 자동 생성된다.

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--color-bg` | #1a1a2e | 페이지 바탕 |
| `--color-panel` | #16213e | 카드 |
| `--color-panel2` | #0f3460 | 기본 버튼, 사이드바 강조 |
| `--color-accent` | #e94560 | 주요 행동(세션 완료), 경고 |
| `--color-gold` | #ffd166 | XP, 시즌, 장착 중 |
| `--color-mint` | #06d6a0 | 완료, 긍정, 고블린 카드 |
| `--color-sky` | #4cc9f0 | 링크, 해금 경로 |
| `--color-ink` | #eaeaea | 본문 글자 |
| `--color-muted` | #9aa5b1 | 보조 글자, 입력 테두리 |
| `--font-pixel` | Galmuri11 → Galmuri9 → monospace | 전체 글꼴. 안티앨리어싱 끔 |

컴포넌트 클래스: `.card` `.btn` `.btn-accent` `.btn-gold` `.btn-mint` `.btn-ghost` `.input` `.label` `.bar` `.pixel-border`.
공통 문법은 **2px 검정 테두리 + 3~4px 오프셋 검정 그림자**, 버튼은 누르면 2px 내려가며 그림자가 사라진다. 둥근 모서리와 그라데이션은 쓰지 않는다.

## 4. 다른 프로젝트에서 쓰기

1. `design/` 폴더를 복사한다.
2. `tsconfig.json` `paths` 에 `"@design/*": ["./design/*"]`, `include` 에 `"design"` 을 넣고, Vite `resolve.alias` 에도 `@design` 을 추가한다.
3. 메인 CSS 에서 `@import "tailwindcss";` 다음에 galmuri 폰트와 `design/theme/theme.css` 를 `@import` 한다.
4. 캐릭터를 그리려면 `toPixelMap(characterByKey('knight').parts)` 로 픽셀맵을 얻어 캔버스에 찍는다. 이 앱의 `src/pixel/PixelCanvas.tsx` 가 React 렌더러 예시이고, PNG 시트(`PngSheet`)도 같은 렌더러로 그릴 수 있다.
5. 팔레트의 역할 문자(`skin`, `hair`, `outfit` …)는 렌더 시점에 실제 색으로 바꿔 준다. `DEFAULT_APPEARANCE` 가 기본값이다.
