# Body RPG

내 몸을 픽셀 캐릭터처럼 키우는 트레이닝 트래커.
이루고 싶은 **스킬**(예: 왼발로 축구하기)을 등록하면 그걸 위한 **과제**(왼발 슈팅 30분 주 3회)가 생기고, 과제를 달성하면 XP가 쌓이고 분야별 **전직**(운동깔짝이 → 프로운동러)과 **시즌 티어** 보상(칭호·코스튬)을 얻는다.

- PC 브라우저 + 폰 홈화면 설치(PWA) 모두 지원. 코드 1벌.
- 모바일 = 오늘의 퀘스트를 큰 버튼으로 빠르게 기록. PC = 세계관(분야/전직/스킬/과제/시즌/캐릭터) 편집.
- 저장: Supabase 키가 있으면 클라우드 동기화, 없으면 브라우저 로컬 저장(JSON 내보내기/가져오기 가능).

## 개발

```bash
npm install
npm run dev          # http://localhost:5173
npm run dev:host     # 같은 Wi-Fi 의 폰에서 접속할 때
npm test             # 게임 계산 로직 테스트 (vitest)
npm run build        # dist/
```

## Supabase 연결 (PC↔폰 동기화)

1. https://supabase.com 에서 무료 프로젝트 생성.
2. SQL Editor 에 `supabase/migrations/0001_init.sql` 내용을 붙여넣고 실행.
3. Authentication → Providers → Email 에서 "Confirm email" 은 켜 두고, URL Configuration 의 Site URL / Redirect URLs 에 배포 주소(예: `https://<계정>.github.io/body-rpg/`)와 `http://localhost:5173/` 추가.
4. 프로젝트 Settings → API 의 URL 과 anon key 를 `.env.local` 에 입력 (`.env.example` 참고).
5. GitHub Pages 배포용으로는 레포 Settings → Secrets and variables → Actions 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가.

로그인은 이메일 매직링크(비밀번호 없음). 로컬 모드에서 쌓은 데이터는 편집 → 데이터 → JSON 내보내기 후 클라우드 모드에서 가져오기로 옮길 수 있다.

## 배포 (GitHub Pages)

`main` 에 푸시하면 `.github/workflows/deploy.yml` 이 테스트 → 빌드 → Pages 배포를 수행한다.
레포 Settings → Pages → Source 를 **GitHub Actions** 로 한 번 설정해야 한다.
배포 주소: `https://<계정>.github.io/<레포명>/` — 폰에서 열고 "홈 화면에 추가" 하면 앱처럼 쓸 수 있다.

## 게임 규칙 요약

| 개념 | 설명 |
|---|---|
| 분야 (Domain) | 직업 트리. 볼러/리프터처럼 큰 카테고리. 전직 사다리를 가진다. |
| 전직 (JobTier) | 분야의 달성 스킬 수가 조건을 넘으면 승급. 직업명·칭호·코스튬 해금. |
| 스킬 (Skill) | 이루고 싶은 목표. 달성 조건: N주 동안 주간 목표 충족, 또는 과제 누적값 도달. |
| 과제 (Task) | 반복 행동. 단위(횟수/분/체크), 세션 목표, 주기(매일/매주 N회), 세션당 XP. |
| 세션 | 기간(일/주) 안에서 누적값이 세션 목표의 배수를 넘을 때마다 1세션 달성 → XP. 주기 횟수까지만 인정. |
| 시즌 | 기간 동안 모은 XP 로 티어 상승, 티어마다 보상(칭호/코스튬/액세서리). 보상은 영구. 기본 티어 XP 는 30일 기준 80/250/500/800/1100 이고 시즌 길이에 비례해 조정. |
| 누적 뱃지 | 과제 누적 100/500/1k/5k/10k 도달 뱃지. |
| 스트릭 | 세션을 달성한 날의 연속 일수. 7일·14일·21일… 되는 날마다 시즌 XP +50 보너스. 끊기면 다시 1일부터. |

계산은 모두 `src/game/` 의 순수함수이며 기록(`logs`)에서 매번 재계산된다. 과제 설정을 바꿔도 과거 기록이 유지된다.

## 픽셀 캐릭터 에셋 교체

`src/pixel/sprites.ts` 의 레지스트리가 모든 그래픽을 정의한다. 현재는 16×24 문자 픽셀맵이고, PNG 스프라이트 시트로 바꾸려면 항목의 `source` 를 다음처럼 바꾸면 된다.

```ts
{ key: 'pro_kit', label: '프로 유니폼', layer: 'outfit',
  source: { kind: 'png', url: '/sprites/pro_kit.png', frameW: 16, frameH: 24, frames: 2 } }
```

레이어 순서: body → hair → outfit → accessory. 프레임은 가로로 나열(idle 2프레임).
PNG 는 `public/sprites/` 에 둔다. 팔레트 색은 pixelmap 에서만 적용되므로 PNG 는 최종 색으로 그린다.

## 구조

```
src/app/        라우터, 레이아웃(모바일 탭/PC 사이드바), 인증, WorldProvider(데이터·낙관적 업데이트)
src/game/       게임 규칙 순수함수 + 테스트
src/pixel/      픽셀 캐릭터 렌더러와 스프라이트 레지스트리
src/features/   화면: today(오늘 퀘스트) character skills editor(편집) friends
src/lib/        supabase 클라이언트, Repo(로컬/클라우드 저장소)
src/data/       예시 세계관 시드
supabase/       DB 스키마 + RLS
```
