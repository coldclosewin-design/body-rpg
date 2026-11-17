# Body RPG 디자인 컨셉

앱과 분리해 관리하는 디자인 자산. 다른 프로젝트에서 같은 분위기를 쓰려면 이 폴더를 통째로 복사하면 된다.
앱 코드(`src/`)는 이 폴더를 `@design/*` 별칭으로 가져다 쓰고, 그림·색·폰트의 원본은 여기에만 둔다.

```
design/
├─ README.md             이 문서
├─ character-sheet.png   캐릭터 25종 기본·눈 감김 비교 시트 (npm run sheet 로 재생성)
├─ pixel/                픽셀 캐릭터 시스템 (앱 의존성 없음, Node/브라우저 공용)
│  ├─ types.ts           캔버스 규격 24×32, PixelMap / PngSheet / SpriteDef 타입
│  ├─ palette.ts         문자 → 색 팔레트, 기본 외형 색, toPixelMap()
│  ├─ parts.ts           파츠 76종 (머리·머리카락·모자·몸통·다리·소품·효과) + compose()
│  ├─ characters.ts      파츠를 조합한 캐릭터 25종
│  ├─ palette.test.ts    눈 감김·외곽선·색 수·함수형 파츠 검증
│  └─ render-sheet.ts    시트 PNG 생성 스크립트
├─ sprites/              레퍼런스 풍 고해상도 PNG 스프라이트(64×128) 파이프라인 — sprites/README.md
│  ├─ build.ts           원본 PNG → 배경 제거·축소·팔레트 → public/sprites/<key>.png (npm run sprites)
│  └─ src/<key>.png      이미지 생성 모델·작가가 만든 원본
└─ theme/
   └─ theme.css          Tailwind v4 @theme 토큰(색·폰트) + 픽셀 UI 컴포넌트 클래스
```

캐릭터에 `png` 필드가 있으면 앱은 24×32 픽셀맵 대신 그 PNG 스프라이트를 그린다. 전환 방향과 규격은 `sprites/README.md`.

## 1. 컨셉 한 줄

**"내 몸을 레트로 RPG 캐릭터처럼 키운다."** 16비트 시절 RPG 스티커 같은 픽셀 캐릭터, 두꺼운 검정 외곽선, 오프셋 그림자가 붙은 UI, 한글 픽셀 폰트. 어둡고 채도 높은 남색 바탕에 금색·민트·하늘색 포인트.

레퍼런스: 머리가 큰 2.5등신, 외곽선이 뚜렷하고 명암이 2단계인 RPG 직업 캐릭터 스티커(기사·엘프·도적·마녀·드워프·고블린 등). 사용자가 준 레퍼런스 이미지를 보관하려면 `design/reference/` 폴더를 만들어 넣는다.

## 2. 픽셀 캐릭터 규격

**확정: 캐릭터 A안 — 익숙한 모험가.** 24×32와 기존 25종·76개 파츠의 조합 구조를 유지하고, 얼굴과 대표 소품을 3배(72×96px)에서도 읽을 수 있게 한다.

| 항목 | 값 |
|---|---|
| 캔버스 | 24 × 32 px, 캐릭터는 가운데 정렬, 발바닥이 y=31 |
| 비율 | 2.5등신. 머리(모자 포함) 약 12px, 몸통 10px, 다리 7px |
| 프레임 | idle 2프레임. 기본 자세 + 같은 자세에서 눈 감김. 발·몸·소품은 이동하지 않음 |
| 외곽선 | 모든 실루엣에 `K`(#101018) 1px. 내부 구분선도 같은 색 |
| 명암 | 면마다 밝은 면(대문자)과 그림자 면(소문자) 2단계. 광원은 왼쪽 위 |
| 눈 | x=9,10 / 14,15, y=8..9. 각 눈에 1px `W` 하이라이트, 아래쪽 `E` 유지. 눈을 가리는 장식은 실루엣 우선 |
| 소품 | 2px 이상 굵기, 몸·팔과 겹치는 곳에 `K` 구분선. 손잡이·날·하단도 외곽선을 닫음 |
| 색 수 | 캐릭터당 최대 14색 목표. 현재 기본 외형 기준 6~14색(투명 제외, 같은 색인 `K/E`는 하나로 계산) |
| 투명 | `.` |
| 렌더 | `image-rendering: pixelated`, 정수 배율(앱 3~5배, 시트 8배) |

### 팔레트 (`palette.ts`)

- 고정: `K` 외곽선 `E` 눈 `W` 흰색
- 역할 문자(사용자 외형 설정으로 치환): `S/s` 피부, `H/h` 머리카락, `O/o` 옷
- 고정 색: `R` 빨강 `B` 파랑 `G` 초록 `Y` 노랑(금) `M` 보라 `C` 하늘 `A` 주황 `L` 은색 `N` 갈색 `X` 진회색 `P` 남색 `F` 형광주황. 소문자는 각각의 그림자 색.
- 파츠 안의 `1` `2` `3`은 자리표시자. 파츠를 쓰는 쪽(`part(rows, y, x, { '1': 'R', '2': 'r' })`)이나 캐릭터의 `recolor`로 채운다. 남아 있으면 테스트가 실패한다.

- 기존 팔레트만 사용한다. `X`(#3a3a4a)는 `x`(#6b6b80)보다 어두운 예외이므로 회색 바지는 `x/X`, 어두운 전투 옷은 `X/P`로 명암을 준다. `S/s`, `H/h`, `O/o`의 역할은 유지한다.

### 눈 감김 프레임 (`palette.ts`, `parts.ts`)

`toPixelMap(parts, recolor?)`의 호출 방식과 `PixelMap.frames: string[][]`는 그대로이며 항상 2프레임을 반환한다. `HEAD`와 `RED_EYE`에 선택적 `Part.blinkRows`를 두고, 두 번째 프레임에서는 이 행만 바꿔 **동일한 순서·좌표로 파츠 전체를 다시 합성**한다. 눈 위쪽(y=8)의 네 픽셀을 피부 `S`로 바꾸고, 아래쪽(y=9)의 `EE` 선은 유지한다. 이후 기존 `recolor`를 적용하므로 고블린은 감긴 눈 위도 초록 피부가 된다. `shiftDown`은 범용 유틸리티로 남지만 idle에는 쓰지 않는다.

눈 위 장식도 같은 레이어로 합성되므로 장식 위로 눈이 새어 나오지 않는다. 스위머(`swimmer`), 철의 기사(`knight`), 책벌레(`bookworm`), 디제이(`dj`), 낮잠꾼(`napper`), 드리머(`dreamer`), 도적(`rogue`)은 두 프레임이 같다. 책벌레는 안경 렌즈·반사광을 고정하며, 나머지는 물안경·투구·선글라스·안대·감은 눈·복면이 눈을 덮는다. 궁수의 기존 `W → L` 치환도 유지해 하이라이트가 은색으로 보인다. 렌더러와 깜박임 간격은 변경하지 않는다.

### 파츠 시스템 (`parts.ts`)

`part(rows, y, x, map)` 로 조각을 만들고 `compose(parts)` 가 순서대로 덮어 그린다(뒤 파츠가 앞 파츠를 가림). 대략의 레이어 순서:

```
CAPE/LONG_COAT/TATTERED_CAPE/QUIVER 같은 뒤 배경 → 다리(PANTS/SHORTS) → 몸통(SHIRT/JACKET/TANK/BARE/ROBE/ARMOR/LEATHER_ARMOR) → 셔츠 깃·넥타이(SHIRT_COLLAR/TIE)
→ 머리(HEAD) → 수염 → 머리카락(HAIR_*) → 모자(HELMET/HORNED_HELMET/HOOD/POINTED_HAT/SWIM_CAP/NIGHTCAP/FEATHER_CAP/HEADPHONES) → 얼굴 장식(HEADBAND/SUNGLASSES/GOGGLES/CROWN/ROUND_GLASSES/EYE_MASK/CLOSED_EYES/BROW_SHADOW/RED_EYE/FACE_WRAP)
→ 손 소품(SWORD/GROUNDED_SWORD/SHIELD/DUMBBELL/BALL/BOW/RECURVE_BOW/TORCH/STAFF/ORB_STAFF/AXE/BATTLE_AXE/DAGGER_L/DAGGER_R/CLUB/ROPE/MIC/LUTE/BOOK/PILLOW/SYNTH) → 효과(WAVES/SPEED_LINES/SPEECH_BUBBLE/NOTES/ZZZ/SPARKLES)
```

새 파츠를 그릴 때 규칙: 행 길이는 파츠 안에서 일정하게, 전폭 파츠는 24칸. 외곽선을 먼저 닫고 안을 채운다. 가는 소품(활·지팡이)은 2px 이상 굵기로, 1px 선은 축소 화면에서 사라진다.

위 목록은 겹침 관계를 설명한다. 기존 캐릭터별 파츠 순서는 유지하며, 류트·책·베개는 몸통 다음에 합성하고 파도는 다리 앞에 둔다. 로브 파츠 자체에도 y=31 발바닥이 있다. `palette.test.ts`는 실제 사용하는 함수형 파츠와 `blinkRows`의 행 길이·캔버스 범위, 눈 밖 픽셀 고정, 장식 단독 호출, 색 치환, 14색 제한, 두 프레임의 노출 외곽선을 검사한다.

### 캐릭터 (`characters.ts`)

`{ key, label, desc, parts, recolor? }` 한 줄이 캐릭터 하나. 현재 25종:

| key | 이름 | 용도 | A안 보정 | 색 수 |
|---|---|---|---|---|
| novice | 견습생 | 기본, 옷 색 외형 설정 | 눈 반사광·피부와 셔츠 명암·종아리 그림자 | 10 |
| tracksuit | 운동깔짝이 | 1차 전직 공용 | 눈 반사광·밴드 테두리·트레이닝복 명암 | 10 |
| runner | 러너 | 볼러 2차 | 눈 반사광·번호표 테두리·닫힌 속도선 | 11 |
| lifter | 리프터 | 리프터 3차 | 눈 반사광·수염 명암·넓은 덤벨과 손잡이 | 13 |
| striker | 스트라이커 | 볼러 3차 | 눈 반사광·유니폼 명암·공의 흰색/은색 면 | 10 |
| ranger | 레인저 | 볼러 4차 | 눈 반사광·후드 명암·2px 목재 활대와 쥔 손 | 9 |
| brawler | 브롤러 | 리프터 2차 | 눈 반사광·밴드 테두리·맨몸과 다리 명암 | 10 |
| monk | 수행자 | 요가 예비 | 눈 반사광·염주 테두리·로브 명암과 발바닥 | 7 |
| swimmer | 스위머 | 수영 예비 | 눈을 덮는 물안경과 반사광·닫힌 파도 외곽선 | 8 |
| knight | 철의 기사 | 리프터 4차 | 투구·깃털 테두리·갑옷 어깨·검날과 방패 분리 | 10 |
| champion | 챔피언 | 시즌 보상 | 눈 반사광·닫힌 왕관/망토·굵은 검날 | 14 |
| sage | 현자 | 기록 예비 | 눈 반사광·수염/모자 명암·수정 지팡이와 발바닥 | 13 |
| climber | 클라이머 | 클라이밍 예비 | 눈 반사광·포니테일 테두리·금속 피켈과 굵은 로프 | 14 |
| healer | 힐러 | 회복 예비 | 눈 반사광·긴 머리 명암·흰 로브/은색 그림자·지팡이 | 11 |
| bookworm | 책벌레 | 토커 중간 | 안경 실루엣 유지·옷 명암·책의 두 페이지와 책등 | 12 |
| speaker | 스피커 | 토커 완성 | 눈 반사광·옷 명암·마이크 헤드/손잡이 테두리 | 13 |
| dj | 디제이 | 사운드메이커 중간 | 선글라스 반사광·신디 노브 색 통일과 건반 구분 | 12 |
| bard | 바드 | 사운드메이커 완성 | 눈 반사광·깃털 테두리·류트 목재색 통일·닫힌 음표 | 14 |
| napper | 낮잠꾼 | 슬리퍼 중간 | 안대 유지·머리/옷 명암·베개 오른쪽 그림자 | 12 |
| dreamer | 드리머 | 슬리퍼 완성 | 감은 눈 유지·수면모자 외곽선·7×7 Z 효과 | 10 |
| warrior | 전사 | 미배정 시즌 보상 | 흰 반사광과 붉은 눈 1px·눈동자 유지·코트 명암 | 10 |
| archer | 궁수 | 미배정 시즌 보상 | 은색 눈 반사광·후드 명암·반곡궁 현의 외곽선 | 9 |
| mage | 마법사 | 미배정 시즌 보상 | 눈 반사광·백발/수염/모자 명암·로브 발바닥 | 11 |
| rogue | 도적 | 미배정 시즌 보상 | 복면·쌍단검 유지·후드/망토/바지 명암 | 10 |
| goblin | 나태 고블린 | 스트릭이 끊기면 등장하는 적 | 초록 피부 유지·눈 반사광·몽둥이 손잡이와 끝 테두리 | 6 |

전투 스킨 4종은 특정 분야 전직에 배정하지 않는다. 앱 편집 → 시즌 화면에서 보상 스킨으로 해당 key를 고를 수 있다.

전투 스킨은 `X/x`, `P`, `N/n`, `L/l`, `W`와 검정 외곽선만 바탕에 쓴다. 피부 역할 문자는 유지하고 머리의 기존 무채색 치환을 보존하며, 원색은 전사의 붉은 눈 1px과 마법사 구슬 2px로 제한한다. 기존 팔레트에 소문자 `p`는 없으므로 남색의 보조 면에는 `X`를 쓴다. 긴 코트·망토는 몸통 뒤에, 낮춰 든 무기는 몸통 앞에 겹친다.

미리보기: `npm run sheet` → `design/character-sheet.png` (2272×1472px, 8배). 위 표 순서대로 5×5칸이며, 각 칸의 왼쪽은 기본·오른쪽은 눈 감김이다. 3배 확인은 `npx tsx design/pixel/render-sheet.ts 3`으로 같은 파일을 생성한다(852×552px, 캐릭터 하나당 72×96px). 검토 후 `npm run sheet`로 8배 시트를 복원한다.

## 3. UI 테마 (`theme/theme.css`)

테마 이름은 **밤의 길드**(2026-11-16 디자인 검토에서 채택한 테마 A — 기존 남색·금색을 정돈). Tailwind v4 `@theme` 토큰. `text-gold`, `bg-panel`, `border-muted` 같은 유틸리티가 자동 생성된다.

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--color-bg` | #1a1a2e | 페이지 바탕 |
| `--color-panel` | #16213e | 카드 |
| `--color-panel2` | #0f3460 | 기본 버튼, 사이드바 강조 |
| `--color-accent` | #e94560 | 되돌릴 수 없는 행동(초기화), 경고 |
| `--color-gold` | #ffd166 | 화면의 주 행동 하나, XP, 시즌 보상, 장착 중 |
| `--color-mint` | #60deb9 | 완료에만 (완료 표시, 고블린 안내) |
| `--color-sky` | #4cc9f0 | 링크, 해금 경로 |
| `--color-ink` | #eaeaea | 본문 글자 |
| `--color-muted` | #b2bdcb | 보조 글자, 입력 테두리 |
| `--color-edge` | #080d18 | 경계선과 오프셋 그림자 |
| `--font-pixel` | Galmuri11 → Galmuri9 → monospace | 전체 글꼴. 안티앨리어싱 끔 |

컴포넌트 클래스: `.card` `.btn` `.btn-accent` `.btn-gold` `.btn-mint` `.btn-ghost` `.input` `.label` `.bar` `.pixel-border`.
공통 문법은 **2px 경계선(`--color-edge`) + 3px 오프셋 그림자**, 버튼은 누르면 2px 내려가며 그림자가 사라진다. 둥근 모서리와 그라데이션은 쓰지 않는다.
주 행동 버튼은 화면당 하나만 금색(`.btn-gold`), 보조 행동은 외곽선(`.btn-ghost`). 진행 바는 채움 8px. 선택된 탭은 금색 밑줄 + 굵은 글자.

## 4. 다른 프로젝트에서 쓰기

1. `design/` 폴더를 복사한다.
2. `tsconfig.json` `paths` 에 `"@design/*": ["./design/*"]`, `include` 에 `"design"` 을 넣고, Vite `resolve.alias` 에도 `@design` 을 추가한다.
3. 메인 CSS 에서 `@import "tailwindcss";` 다음에 galmuri 폰트와 `design/theme/theme.css` 를 `@import` 한다.
4. 캐릭터를 그리려면 `toPixelMap(characterByKey('knight').parts)` 로 픽셀맵을 얻어 캔버스에 찍는다. 이 앱의 `src/pixel/PixelCanvas.tsx` 가 React 렌더러 예시이고, PNG 시트(`PngSheet`)도 같은 렌더러로 그릴 수 있다.
5. 팔레트의 역할 문자(`skin`, `hair`, `outfit` …)는 렌더 시점에 실제 색으로 바꿔 준다. `DEFAULT_APPEARANCE` 가 기본값이다.
