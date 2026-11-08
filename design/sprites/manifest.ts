// 자동 생성 파일 — design/sprites/build.ts 가 public/sprites/*.png 를 보고 다시 쓴다. 손으로 고치지 말 것.
import type { PngSheet } from '../pixel/types'

/** key → PNG 스프라이트. 앱(src/pixel/sprites.ts)은 여기 있는 캐릭터를 픽셀맵 대신 PNG 로 그린다 */
export const PNG_SPRITES: Record<string, PngSheet> = {
  brawler: { kind: 'png', url: 'sprites/brawler.png', frameW: 64, frameH: 128, frames: 2 },
  novice: { kind: 'png', url: 'sprites/novice.png', frameW: 64, frameH: 128, frames: 2 },
  ranger: { kind: 'png', url: 'sprites/ranger.png', frameW: 64, frameH: 128, frames: 2 },
  runner: { kind: 'png', url: 'sprites/runner.png', frameW: 64, frameH: 128, frames: 2 },
  striker: { kind: 'png', url: 'sprites/striker.png', frameW: 64, frameH: 128, frames: 2 },
  tracksuit: { kind: 'png', url: 'sprites/tracksuit.png', frameW: 64, frameH: 128, frames: 2 },
  warrior: { kind: 'png', url: 'sprites/warrior.png', frameW: 64, frameH: 128, frames: 2 },
}
