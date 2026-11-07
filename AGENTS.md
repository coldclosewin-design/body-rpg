# AGENTS.md — Body RPG 작업 가이드

코딩 에이전트(Codex, Claude Code 등)가 이 저장소에서 작업할 때 따르는 규칙. 사람이 읽어도 된다.

## 프로젝트 한 줄

내 몸을 레트로 RPG 캐릭터처럼 키우는 습관 트래커. Vite + React 19 + TypeScript + Tailwind v4, 저장은 Supabase(없으면 브라우저 로컬). PC 브라우저와 폰 PWA가 코드 1벌.

```
src/                 앱 코드 (라우터·화면·게임 로직·Supabase)
src/pixel/           픽셀 캐릭터 렌더러(PixelCanvas)와 스프라이트 레지스트리. design/pixel 을 가져다 쓴다
design/              디자인 자산 원본. 앱 의존성 없음 — 상세 규격은 design/README.md
design/pixel/        parts.ts(파츠) · characters.ts(캐릭터) · palette.ts(색) · render-sheet.ts(시트 PNG)
design/theme/        Tailwind @theme 토큰과 픽셀 UI 클래스
supabase/            DB 마이그레이션
.github/workflows/   main 푸시 → 테스트 → 빌드 → GitHub Pages 배포
```

## 명령

```bash
npm ci               # 의존성 (환경 setup 단계에서 1회)
npm test             # vitest. 픽셀 파츠 행 길이·스프라이트 규격 검사 포함
npm run lint         # tsc --noEmit
npm run build        # tsc -b && vite build
npm run sheet        # design/character-sheet.png 재생성 (tsx, 네트워크 불필요)
npm run dev          # http://localhost:5173
```

작업을 마치기 전에 반드시 `npm test` 와 `npm run lint` 가 통과해야 한다. 픽셀 자산을 바꿨으면 `npm run sheet` 도 실행해 PNG를 함께 커밋한다.

## 픽셀 에셋 작업 규칙 (가장 자주 맡기는 일)

규격 전체는 `design/README.md` 2절을 먼저 읽는다. 아래는 그중 실수하기 쉬운 것만 추린 것.

### 캔버스와 좌표

- 24 × 32 문자 행. `.` 투명, `K` 외곽선(1px, 모든 실루엣과 내부 구분선), 대문자 밝은 면 / 소문자 그림자 면, 광원은 왼쪽 위.
- 기본 몸 배치: 머리 y=2..15 (x=5..18), 눈 y=8–9 (x=9,10 / 14,15), 몸통 y=15..24, 손 y=22 (x=4..7 / 16..19), 다리 y=25..31, 발바닥 y=31.
- 소품을 둘 빈 공간: 좌우 x=0..4 와 x=19..23, 머리 위 y=0..1. 머리 위 효과(말풍선·음표·zZ)는 x=0 또는 x=19 부근에 7칸 이내로.
- 팔레트 문자는 `design/pixel/palette.ts` 에 있는 것만 쓴다. 역할 문자 `S/s H/h O/o` 는 사용자 외형 설정으로 치환되므로 "고정 색"이 필요한 곳엔 쓰지 않는다.
- 파츠 안의 `1` `2` `3` 은 자리표시자. `part(rows, y, x, { '1': 'R', '2': 'r' })` 또는 캐릭터의 `recolor` 로 반드시 채운다. 남아 있으면 테스트 실패.

### 파츠 그리기 (`design/pixel/parts.ts`)

- 한 파츠 안에서 모든 행의 길이를 같게. 전폭 파츠는 24칸.
- 외곽선을 먼저 닫고 안을 채운다. 가는 소품(활·지팡이·마이크 대)은 **2px 이상** 굵기. 1px 선은 앱의 3배 축소 화면에서 사라진다.
- 눈·안경 같은 작은 디테일은 1px 흰 하이라이트(`W`)로 "검은 덩어리"가 되는 걸 막는다.
- 색을 바꿔 쓸 파츠는 함수로 만든다: `export const HAT = (c1: string, c2: string) => part(rows, y, x, { '1': c1, '2': c2 })`.
- 새 파츠는 파일 끝의 분야별 섹션 주석 아래에 추가하고, 이름은 대문자 스네이크(`FEATHER_CAP`).
- **테스트는 함수형 파츠의 행 길이를 검사하지 않는다.** 함수형 파츠를 추가했으면 직접 호출해 `rows.every(r => r.length === rows[0].length)` 를 확인하거나, 그 파츠를 쓰는 캐릭터를 만들어 스프라이트 테스트로 간접 검증한다.

### 캐릭터 조합 (`design/pixel/characters.ts`)

- 한 줄 = `{ key, label, desc, parts, recolor? }`. `key` 는 영문 소문자, `label`·`desc` 는 한국어(앱 도감에 그대로 노출).
- `parts` 순서가 곧 레이어 순서(뒤 파츠가 앞을 가림): 배경 효과 → 다리 → 몸통 → 머리 → 수염 → 머리카락 → 모자 → 얼굴 장식 → 손 소품 → 효과. 몸통 뒤로 숨어야 할 소품(류트 몸통 등)은 몸통 **뒤**, 손에 든 것은 몸통 **뒤** 가 아니라 **앞** 에.
- 새 캐릭터는 `goblin`(적) 앞에 넣는다. `src/pixel/sprites.ts` 가 자동으로 등록하므로 앱 코드는 손대지 않는다.
- 전직 사다리에 어떤 스킨을 쓰는지는 **코드가 아니라 Supabase 사용자 데이터**(`domains.tiers`)에 있다. 코드에서 배정하려 하지 말고, 완료 보고에 "앱 편집 → 분야·전직 화면에서 `<key>` 를 고르면 된다"고 적는다. 시드(`src/data/seed.ts`)는 볼러·리프터만 다루므로 거기에 새 분야를 끼워 넣지 않는다.

### 마무리 체크리스트

1. `npm test`, `npm run lint` 통과.
2. `npm run sheet` 로 `design/character-sheet.png` 재생성 후 **이미지를 열어 눈으로 확인**(외곽선 끊김, 소품이 팔 뒤에 숨음, 글자처럼 안 읽히는 작은 기호). 이미지를 볼 수 없는 환경이면 보고에 그렇게 적는다.
3. `design/README.md` 의 파츠·캐릭터 개수와 캐릭터 표, 레이어 순서 목록을 갱신한다.
4. 커밋 메시지는 기존 이력처럼 한국어 한 줄 요약. 예: `분야 스킨 6종 추가: 책벌레·스피커(토커), 디제이·바드(사운드메이커), 낮잠꾼·드리머(슬리퍼)`.

## 건드리지 말 것

- `supabase/migrations/`, `.github/workflows/`, `vite.config.ts` 는 과제가 명시하지 않는 한 수정하지 않는다.
- 다른 사람의 외형 설정·세이브 데이터와 관련된 로직(`src/lib/repo.ts`, `src/app/world.tsx`)은 픽셀 에셋 과제 범위 밖이다.
- 브랜치를 바꾸거나 `git stash`/`reset` 을 하지 않는다. 자기가 바꾼 파일만 커밋한다. 푸시는 과제가 허락할 때만.
- 이 저장소 밖의 파일은 수정하지 않는다.

## 픽셀 에셋 생성 사이트 등 별도 프로젝트로 확장할 때

`design/` 폴더는 앱 의존성이 없으므로 통째로 복사해 쓸 수 있다. 절차는 `design/README.md` 4절. 새 프로젝트에도 이 파일을 복사해 두고 "픽셀 에셋 작업 규칙" 절은 그대로 유지한다. 두 저장소의 `design/pixel/` 이 갈라지지 않도록, 파츠·캐릭터를 추가하면 원본인 이 저장소에 먼저 넣고 복사한다.
