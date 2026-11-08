# PNG 스프라이트 (레퍼런스 풍 고해상도 캐릭터)

24×32 문자 픽셀맵(`design/pixel/`)과 별개로, 이미지 생성 모델이나 작가가 그린 PNG 원본을 **64×128 스프라이트 시트**로 변환해 앱에 얹는 경로.
앱(`src/pixel/PixelCanvas.tsx`)은 캐릭터에 `png` 가 있으면 픽셀맵 대신 이것을 그린다. 없으면 기존 픽셀맵으로 떨어진다.

```
design/sprites/
├─ README.md      이 문서 (규격, 생성 프롬프트, 절차)
├─ build.ts       변환기: 배경 제거 → 여백 자르기 → 64×128 축소 → 알파 이진화 → 32색 팔레트 → 2프레임 시트
├─ src/<key>.png  원본 (크기 자유. 단색 배경 또는 투명 배경)
└─ preview.png    빌드 결과 4배 미리보기
public/sprites/<key>.png   빌드 결과. 앱이 읽는 파일
```

## 규격

| 항목 | 값 |
|---|---|
| 프레임 | 64 × 128 px, 가로 중앙·바닥 정렬 (발바닥이 y=127) |
| 비율 | 7~8등신 사실 비율. 머리 약 16px |
| 프레임 수 | 2 (idle). 2프레임은 1프레임을 1px 내린 것. 빌드가 자동 생성 |
| 색 | 스프라이트당 최대 32색. 어둡고 채도 낮은 팔레트, 포인트 색 1~2개 |
| 외곽선 | 검정 1px 고정선 없음. 어두운 면색으로 경계를 만든다 |
| 명암 | 면마다 3~5단계 |
| 배경 | 원본은 단색(회색 권장) 또는 투명. 바닥 그림자는 넣지 않는다(빌드가 배경과 함께 지운다) |
| 표시 | 앱은 `image-rendering: pixelated`, 정수 배율. 24×32 스킨과 같은 자리에서 높이 32×scale 에 맞춰 보인다 |

스타일 앵커: 사용자가 준 레퍼런스(백발 노신사, 긴 검정 트렌치코트, 흰 셔츠·검은 넥타이, 지팡이, 한쪽 붉은 눈, 회색 배경). 원본 이미지는 작가 저작물이므로 저장소에 넣지 않는다.

## 절차

1. 원본을 `design/sprites/src/<key>.png` 로 저장. `<key>` 는 `design/pixel/characters.ts` 의 캐릭터 key(warrior, archer …).
2. `npm run sprites` (특정 하나만: `npm run sprites -- --only warrior`, 색 수 조절: `--colors 24`).
3. `design/sprites/preview.png` 를 열어 확인. 배경이 덜 지워졌으면 `--bgtol 40` 처럼 허용치를 키운다.
4. `characters.ts` 의 해당 캐릭터에 한 줄 추가:
   `png: { kind: 'png', url: 'sprites/<key>.png', frameW: 64, frameH: 128, frames: 2 }`
5. `npm test`, `npm run lint`, 앱에서 도감·캐릭터·오늘 화면 확인 후 `public/sprites/<key>.png` 와 `src/<key>.png` 를 함께 커밋.

## 이미지 생성 프롬프트 (ChatGPT 이미지 등)

공통 접두:

> Pixel art full-body character sprite, front-facing idle pose, standing on flat ground, 8-heads-tall realistic proportions, dark fantasy mood, muted low-saturation palette (charcoal, navy, brown, silver, off-white) with one small red accent, soft 4-step shading, no black outline, no ground shadow, plain flat gray background (#3e3c3f), centered, the character fills about 80% of the image height, 16-bit era quality similar to a hand-pixelled Aseprite piece. Single character, no text, no frame.

캐릭터별 뒤에 붙일 문장:

- **warrior 전사** — silver-haired middle-aged man, long black trench coat open over a white shirt and black tie, one glowing red eye, resting both hands on a greatsword planted point-down on the ground.
- **archer 궁수** — hooded figure in a dark coat, worn leather quiver on the back, dark wooden recurve bow held low in one hand, face half hidden in hood shadow, a single silver hair strand.
- **mage 마법사** — old mage with long white hair and beard, wide-brimmed black pointed hat, long navy robe, gnarled dark staff with a small red orb, two faint silver sparks.
- **rogue 도적** — masked rogue, dark leather jacket, tattered long cape blowing to one side, twin daggers held low at the sides, silver belt buckle.
- 나머지 21종은 `design/README.md` 캐릭터 표의 설명을 같은 형식의 영어 한 문장으로 옮겨 쓴다. 분위기 접두는 그대로 둔다.

생성 결과가 정사각형(1024×1024)이어도 상관없다. 빌드가 캐릭터 부분만 잘라 64×128 에 맞춘다. 캐릭터가 너무 가늘면 가로가 남고, 너무 넓으면 세로가 남는다.

## 아직 안 된 것

- 피부·머리색을 사용자 외형 설정에 따라 바꾸는 기능은 PNG 에 적용되지 않는다(팔레트 스왑 미구현).
- 24×32 액세서리(헤어밴드·선글라스·왕관)는 PNG 스킨 위에 얹히지 않는다.
- `npm run sheet` 의 캐릭터 시트는 여전히 픽셀맵만 그린다. PNG 미리보기는 `preview.png`.
