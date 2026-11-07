---
name: pixel-skin
description: Body RPG 픽셀 캐릭터(직업 스킨)를 design/pixel 에 추가한다. 캐릭터 이름과 외형 설명만 받아 파츠 그리기 → 캐릭터 조합 → 테스트 → 시트 재생성 → README 갱신 → 커밋 → PR 까지 끝낸다.
---

# pixel-skin — 픽셀 직업 스킨 추가

사용자는 추가할 캐릭터 목록과 외형만 준다. 예:
`$pixel-skin 전사·궁수 추가. 전사는 뿔 투구에 대검, 궁수는 후드에 화살통.`
나머지 절차와 규칙은 이 문서와 `AGENTS.md`, `design/README.md` 가 정한다.

## 0. 시작 전에 읽을 것

1. `AGENTS.md` 의 "픽셀 에셋 작업 규칙" 절 (좌표, 파츠 규칙, 레이어 순서, 금지 사항).
2. `design/README.md` 2절 (캔버스 규격, 팔레트, 파츠 시스템, 캐릭터 표).
3. `design/pixel/parts.ts` 의 export 목록. 이미 있는 파츠는 다시 그리지 않는다.
4. `design/pixel/characters.ts` 의 기존 캐릭터. 새 캐릭터가 기존 것(예: 전사 ↔ knight, 궁수 ↔ ranger, 마법사 ↔ sage)과 겹치면 색·모자·소품을 다르게 해 한눈에 구분되게 한다.

## 1. 입력 해석

- 캐릭터마다 `key`(영문 소문자, 기존 key 와 중복 금지), `label`(한국어 2~5자), `desc`(한국어 한 문장, 앱 도감에 노출), 외형 요소를 정한다.
- 사용자가 어느 분야 몇 차 전직용인지 말하지 않았으면 **미배정 스킨**(시즌 보상·예비)으로 둔다. 전직 배정은 코드가 아니라 Supabase 사용자 데이터이므로 어차피 코드에서 하지 않는다.
- 사용자가 외형을 안 준 요소는 레퍼런스 스타일(머리 큰 2.5등신, 1px 검정 외곽선, 2단계 명암의 16비트 RPG 직업 스티커)에 맞게 알아서 정한다.

## 2. 파츠 (`design/pixel/parts.ts`)

- 재사용 후보: HEAD, HAIR_*, BEARD, HELMET, PLUME, HOOD, POINTED_HAT, FEATHER_CAP, FEATHER, HEADBAND, SHIRT, JACKET, ROBE, ARMOR, CAPE, PANTS, SHORTS, SWORD, SHIELD, BOW, STAFF, AXE, CLUB, TORCH, SPEED_LINES.
- 새 파츠는 파일 끝에 섹션 주석(`// ── 전투 직업 파츠 ──` 처럼)을 달고 추가. 이름은 대문자 스네이크.
- 색을 바꿀 수 있어야 하는 파츠는 함수로: `export const HORNED_HELMET = (c1: string, c2: string) => part(rows, y, x, { '1': c1, '2': c2 })`.
- 행 길이는 파츠 안에서 모두 같게. 소품은 2px 이상 굵기. 작은 디테일에는 `W` 하이라이트 1px.
- 함수형 파츠는 테스트가 행 길이를 검사하지 않으므로, 추가한 뒤 직접 호출해 `rows.every(r => r.length === rows[0].length)` 가 참인지 확인한다. 간단한 방법: 임시 스크립트를 `npx tsx` 로 실행하거나, 그 파츠를 쓰는 캐릭터를 만들고 `npm test` 의 스프라이트 검사(24칸)를 통과시키는 것.

## 3. 캐릭터 (`design/pixel/characters.ts`)

- `goblin` 앞에 `{ key, label, desc, parts, recolor? }` 한 줄씩 추가.
- `parts` 순서 = 레이어 순서: 배경 효과 → 다리 → 몸통 → 머리 → 수염 → 머리카락 → 모자 → 얼굴 장식 → 손 소품 → 효과. 몸통 뒤로 들어갈 소품(등의 화살통, 망토)은 몸통 앞에 두고, 손에 든 것은 몸통 뒤에 둔다.
- 앱 코드(`src/`)는 손대지 않는다. `src/pixel/sprites.ts` 가 CHARACTERS 를 자동 등록한다.

## 4. 검증

```bash
npm test          # 22+ 개 통과해야 함
npm run lint      # tsc --noEmit
npm run sheet     # design/character-sheet.png 재생성
```

시트 PNG 를 열어 새 캐릭터 칸을 확인한다: 외곽선이 끊긴 곳, 팔·몸통에 가려진 소품, 작아서 글자처럼 읽히는 기호, 기존 캐릭터와 구분이 안 되는 실루엣. 문제가 있으면 고치고 다시 렌더한다. 이미지를 볼 수 없는 환경이면 보고에 "시트 미확인"이라고 적는다.

## 5. 문서

`design/README.md` 를 갱신한다: 폴더 트리의 파츠·캐릭터 개수, 레이어 순서 목록에 새 파츠 이름, 캐릭터 표에 새 행(key / 이름 / 용도).

## 6. 커밋과 PR

- 바꾼 파일만 스테이징: `design/pixel/parts.ts`, `design/pixel/characters.ts`, `design/character-sheet.png`, `design/README.md`.
- 커밋 메시지는 한국어 한 줄. 예: `전투 스킨 4종 추가: 전사·궁수·마법사·도적`.
- **푸시하지 말고 PR 로 올린다.** main 에 푸시하면 바로 GitHub Pages 배포가 나간다.

## 7. 보고 형식

```
추가한 캐릭터: key(이름) — parts 배열 요약
새 파츠: 이름 목록 (함수형이면 인자)
재사용한 파츠: 이름 목록
검증: npm test N개 통과 / lint 통과 / 시트 확인 결과(또는 미확인)
앱에서 쓰려면: 편집 → 분야·전직 또는 시즌 화면에서 key 를 고른다
PR: 링크
```
