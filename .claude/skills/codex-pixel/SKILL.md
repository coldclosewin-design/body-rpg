---
name: codex-pixel
description: 픽셀 직업 스킨 추가 작업을 Codex CLI(codex exec)에 위임하고, 결과를 워크트리에서 검증해 사용자 확인 후 main 에 병합한다. 사용법 — /codex-pixel <캐릭터 목록과 외형>
---

# /codex-pixel — 그림 작업을 Codex 에 위임

사용자는 그림(파츠·캐릭터) 작업을 Codex 에 맡기길 원한다. Claude 는 격리·실행·검증·병합을 맡는다.
저장소 스킬 `.agents/skills/pixel-skin/SKILL.md` 가 Codex 쪽 절차를 정하므로 과제문은 `$pixel-skin` 한 줄이면 된다.

## 1. 워크트리 준비 (프로젝트 폴더 안, 커밋되지 않음)

```bash
TASK=<짧은-영문-작업명>            # 예: combat
git worktree add .worktrees/$TASK -b codex/$TASK main
cd .worktrees/$TASK && npm ci       # Codex 샌드박스는 네트워크가 막히므로 먼저 설치
```

`.worktrees/` 는 `.gitignore` 에 있다. 이미 같은 브랜치가 있으면 `-b` 를 빼고 재사용한다.

## 2. Codex 실행 (백그라운드, 마지막 보고는 파일로)

```bash
codex exec -C .worktrees/$TASK -s workspace-write --add-dir "<repo>/.git" --color never \
  -o "<scratchpad>/codex-$TASK.md" - <<'EOF'
$pixel-skin <사용자가 준 캐릭터 목록과 외형>
PR 은 열지 말고 이 브랜치(codex/<TASK>)에 커밋만 해라. 푸시도 하지 마라.
EOF
```

- `-s workspace-write` 를 꼭 명시한다. 사용자 config 기본값은 danger-full-access 다.
- Windows 에서는 `--add-dir "<repo>/.git"` 를 줘도 Codex 의 `git add` 가 index.lock 생성 거부로 실패한다(두 번 확인). 과제문에 "커밋은 하지 말고 파일만 바꿔라"라고 쓰고, 커밋은 Claude 가 3절 검증 후에 한다.
- 분위기(스타일) 변경을 맡길 때는 "피부(S/s)는 recolor 하지 말 것, HEAD 의 눈(E)을 덮어 지우지 말 것"을 과제문에 명시한다. 첫 다크 풍 작업에서 Codex 가 피부를 회색으로 바꾸고 눈을 그늘 띠로 덮어 유령처럼 보였다.
- Bash 는 `run_in_background: true`, timeout 600000. 끝나면 알림이 온다. 폴링하지 않는다.
- 토큰을 아끼려면 `-c model_reasoning_effort=high` 를 붙인다.

## 3. 검증 (Claude 가 직접)

```bash
cd .worktrees/$TASK
git log --oneline main..HEAD && git diff --stat main..HEAD
npm test && npm run lint && npm run sheet
```

- `design/character-sheet.png` 를 Read 로 열어 새 캐릭터 칸을 눈으로 확인한다(외곽선 끊김, 가려진 소품, 기존 캐릭터와 구분).
- 문제가 작으면 Claude 가 워크트리에서 직접 고치고 커밋한다. 크면 `codex exec resume --last` 또는 새 exec 로 수정 과제를 준다.
- 시트 PNG 를 SendUserFile 로 보여주고 Codex 의 마지막 보고를 요약한다.

## 4. 병합 (사용자 확인 후)

```bash
git merge --ff-only codex/$TASK || git merge --no-edit codex/$TASK
git worktree remove .worktrees/$TASK && git branch -d codex/$TASK
```

푸시는 사용자가 따로 확인했을 때만.

## 주의

- Codex 는 Windows 에서 PowerShell 로 명령을 돌린다. `rg` 가 없어 한 번 실패해도 스스로 우회하니 개입하지 않는다.
- Codex 가 `src/` 나 `supabase/` 를 건드렸으면 병합 전에 사용자에게 알린다.
- Codex 가 커밋을 안 했으면 Claude 가 워크트리에서 변경 파일만 골라 커밋한다.
