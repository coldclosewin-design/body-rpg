import { compose, shiftDown, type Part } from './parts'
import { CANVAS_H, CANVAS_W, type PixelMap } from './types'

/**
 * 픽셀맵 문자 → 색. 대문자는 밝은 면, 소문자는 그림자 면.
 * K/E 외곽선·눈, W 흰색은 고정. S/s H/h O/o 는 외형 설정(피부·머리·옷)으로 치환되는 역할 문자.
 * 나머지는 고정 색: R빨강 B파랑 G초록 Y노랑 M보라 C하늘 A주황 L은색 N갈색 X진회색 P남색 F형광주황.
 */
export const PALETTE: PixelMap['palette'] = {
  K: '#101018', E: '#101018', W: '#ffffff',
  S: 'skin', s: 'skinShadow', H: 'hair', h: 'hairShadow', O: 'outfit', o: 'outfitDark',
  R: '#e94560', r: '#b3243f',
  B: '#3a86ff', b: '#2458b3',
  G: '#4caf50', g: '#2e7d32',
  Y: '#ffd166', y: '#d9a441',
  M: '#7b4fb5', m: '#51327a',
  C: '#4cc9f0', c: '#2a7fa8',
  A: '#f4a261', a: '#c9772f',
  L: '#c8ccd8', l: '#8e94a6',
  N: '#8b5a2b', n: '#5c3a1a',
  X: '#3a3a4a', x: '#6b6b80',
  P: '#2b2d42',
  F: '#fb5607',
}

/** 미리보기·시트 렌더용 기본 외형 색 (앱에서는 사용자 외형 설정이 대신 들어간다) */
export const DEFAULT_APPEARANCE: Record<string, string> = {
  skin: '#f3c9a6', skinShadow: '#c7a588', hair: '#3b2a1a', hairShadow: '#291d12', outfit: '#e94560', outfitDark: '#a3303f',
}

/** 파츠 목록 → 2프레임(idle: 1px 바운스) 픽셀맵 */
export const toPixelMap = (parts: Part[], recolor?: Record<string, string>): PixelMap => {
  const f0 = compose(parts, recolor)
  return { kind: 'pixelmap', w: CANVAS_W, h: CANVAS_H, frames: [f0, shiftDown(f0, 1)], palette: PALETTE }
}
