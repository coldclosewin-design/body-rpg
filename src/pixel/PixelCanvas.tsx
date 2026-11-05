import { useEffect, useRef } from 'react'
import type { Appearance } from '@/types/model'
import { spriteByKey } from './sprites'
import { CANVAS_H, CANVAS_W, type PaletteRole, type SpriteDef, type SpriteSource } from './types'

export interface PixelCanvasProps {
  appearance: Appearance
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

/** 레이어 합성: body → hair → outfit → accessory */
export function PixelCanvas({ appearance, outfit, accessory, scale = 6, animate = true, className }: PixelCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const layers: (SpriteDef | undefined)[] = [
      spriteByKey('base'),
      spriteByKey(`hair_${appearance.hairStyle}`),
      spriteByKey(outfit),
      spriteByKey(accessory),
    ]
    const render = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
      for (const l of layers) if (l) drawSource(ctx, l.source, frameRef.current, appearance, render)
    }
    render()
    if (!animate) return
    const id = window.setInterval(() => { frameRef.current = (frameRef.current + 1) % 2; render() }, 600)
    return () => window.clearInterval(id)
  }, [appearance, outfit, accessory, animate])

  return (
    <canvas
      ref={ref}
      className={`pixel ${className ?? ''}`}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ width: CANVAS_W * scale, height: CANVAS_H * scale }}
    />
  )
}
