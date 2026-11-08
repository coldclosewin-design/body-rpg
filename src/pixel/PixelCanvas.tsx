import { useEffect, useRef } from 'react'
import type { Appearance } from '@/types/model'
import { DEFAULT_OUTFIT, spriteByKey } from './sprites'
import { CANVAS_H, CANVAS_W, type PaletteRole, type SpriteDef, type SpriteSource } from '@design/pixel/types'

export interface PixelCanvasProps {
  appearance: Appearance
  /** 직업 스킨 키 (없으면 견습생) */
  outfit?: string | null
  accessory?: string | null
  scale?: number
  animate?: boolean
  className?: string
}

const darken = (hex: string, amt = 0.25): string => {
  const n = hex.replace('#', '')
  if (n.length !== 6) return hex
  const c = [0, 2, 4].map((i) => Math.max(0, Math.round(parseInt(n.slice(i, i + 2), 16) * (1 - amt))))
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
}

const resolveColor = (v: string | PaletteRole, a: Appearance): string => {
  switch (v) {
    case 'skin': return a.skin
    case 'skinShadow': return darken(a.skin, 0.18)
    case 'hair': return a.hair
    case 'hairShadow': return darken(a.hair, 0.3)
    case 'outfit': return a.outfitColor
    case 'outfitDark': return darken(a.outfitColor, 0.3)
    default: return v
  }
}

const imageCache = new Map<string, HTMLImageElement>()
const loadImage = (url: string, onLoad: () => void): HTMLImageElement => {
  let img = imageCache.get(url)
  if (!img) {
    img = new Image()
    img.src = url
    imageCache.set(url, img)
  }
  if (!img.complete) img.addEventListener('load', onLoad, { once: true })
  return img
}

function drawSource(ctx: CanvasRenderingContext2D, src: SpriteSource, frame: number, a: Appearance, onImageLoad: () => void) {
  const ox = src.offsetX ?? 0
  const oy = src.offsetY ?? 0
  if (src.kind === 'pixelmap') {
    const rows = src.frames[frame % src.frames.length] ?? []
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x]
        if (ch === '.' || ch === ' ') continue
        const col = src.palette[ch]
        if (!col) continue
        ctx.fillStyle = resolveColor(col, a)
        ctx.fillRect(x + ox, y + oy, 1, 1)
      }
    })
  } else {
    const img = loadImage(src.url, onImageLoad)
    if (!img.complete || img.naturalWidth === 0) return
    const f = frame % src.frames
    ctx.drawImage(img, f * src.frameW, 0, src.frameW, src.frameH, ox, oy, src.frameW, src.frameH)
  }
}

/** 스프라이트의 캔버스 크기. 픽셀맵은 24×32 고정, PNG 는 프레임 크기 */
const sizeOf = (src: SpriteSource | undefined): [number, number] =>
  src && src.kind === 'png' ? [src.frameW, src.frameH] : [CANVAS_W, CANVAS_H]

/**
 * 레이어 합성: 직업 스킨(전신) → 액세서리.
 * PNG 스킨은 자체 크기(예: 64×128)로 그리며, 24×32 픽셀맵 액세서리는 크기가 맞지 않으므로 그 위에 얹지 않는다.
 * 표시 크기(scale)는 24×32 기준이라, PNG 스킨은 같은 scale 에서 더 크게 보이지 않도록 높이를 32px 기준으로 맞춘다.
 */
export function PixelCanvas({ appearance, outfit, accessory, scale = 5, animate = true, className }: PixelCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const outfitDef = spriteByKey(outfit) ?? spriteByKey(DEFAULT_OUTFIT)
  const [w, h] = sizeOf(outfitDef?.source)
  const isPng = outfitDef?.source.kind === 'png'
  // PNG 는 픽셀 밀도가 높으므로 CSS 높이를 32×scale 에 맞춘다(정수 배율 유지: 최소 1)
  const cssScale = isPng ? Math.max(1, Math.floor((CANVAS_H * scale) / h)) : scale

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const layers: (SpriteDef | undefined)[] = [outfitDef, isPng ? undefined : spriteByKey(accessory)]
    const render = () => {
      ctx.clearRect(0, 0, w, h)
      for (const l of layers) if (l) drawSource(ctx, l.source, frameRef.current, appearance, render)
    }
    render()
    if (!animate) return
    const id = window.setInterval(() => { frameRef.current = (frameRef.current + 1) % 2; render() }, 600)
    return () => window.clearInterval(id)
  }, [appearance, outfit, accessory, animate, outfitDef, isPng, w, h])

  return (
    <canvas
      ref={ref}
      className={`pixel ${className ?? ''}`}
      width={w}
      height={h}
      style={{ width: w * cssScale, height: h * cssScale }}
    />
  )
}
