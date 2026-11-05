import { useEffect, useState } from 'react'
import { useWorld } from '@/app/world'
import { Field } from '@/components/ui'
import { PixelCanvas } from '@/pixel/PixelCanvas'
import { spritesOfLayer } from '@/pixel/sprites'
import type { Character, Settings } from '@/types/model'

export function EditorCharacter() {
  const { world, derived, saveCharacter } = useWorld()
  const [c, setC] = useState<Character>(world.character)
  const [settings, setSettings] = useState<Settings>(world.settings)
  useEffect(() => { setC(world.character); setSettings(world.settings) }, [world.character, world.settings])
  const dirty = JSON.stringify(c) !== JSON.stringify(world.character) || JSON.stringify(settings) !== JSON.stringify(world.settings)
  const set = (patch: Partial<Character>) => setC({ ...c, ...patch })
  const setA = (patch: Partial<Character['appearance']>) => set({ appearance: { ...c.appearance, ...patch } })

  const unlocked = new Set(derived.unlocked)
  const titles = [...new Set(derived.unlocked.filter((u) => u.startsWith('title:')).map((u) => u.slice(6)))]
  const outfits = spritesOfLayer('outfit').map((s) => ({ ...s, ok: unlocked.has(`outfit:${s.key}`) }))
  const accs = spritesOfLayer('accessory').map((s) => ({ ...s, ok: unlocked.has(`accessory:${s.key}`) }))
  const hairs = spritesOfLayer('hair')

  return (
    <div className="grid md:grid-cols-[auto_1fr] gap-3">
      <div className="card flex flex-col items-center gap-2 md:w-56">
        {c.equippedTitle && <div className="text-xs px-2 py-0.5 bg-gold text-black border-2 border-black">「{c.equippedTitle}」</div>}
        <PixelCanvas appearance={c.appearance} outfit={c.equippedOutfit} accessory={c.equippedAccessory} scale={8} />
        <div>{c.name}</div>
      </div>
      <div className="card space-y-3">
        <Field label="이름"><input className="input" value={c.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="피부"><input className="input h-9 p-0" type="color" value={c.appearance.skin} onChange={(e) => setA({ skin: e.target.value })} /></Field>
          <Field label="머리색"><input className="input h-9 p-0" type="color" value={c.appearance.hair} onChange={(e) => setA({ hair: e.target.value })} /></Field>
          <Field label="기본 옷색"><input className="input h-9 p-0" type="color" value={c.appearance.outfitColor} onChange={(e) => setA({ outfitColor: e.target.value })} /></Field>
        </div>
        <Field label="머리 스타일">
          <select className="input" value={c.appearance.hairStyle} onChange={(e) => setA({ hairStyle: e.target.value })}>
            {hairs.map((h) => <option key={h.key} value={h.key.replace('hair_', '')}>{h.label}</option>)}
          </select>
        </Field>
        <Field label="칭호 (해금된 것만)">
          <select className="input" value={c.equippedTitle ?? ''} onChange={(e) => set({ equippedTitle: e.target.value || null })}>
            <option value="">없음</option>
            {titles.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="코스튬">
          <select className="input" value={c.equippedOutfit ?? ''} onChange={(e) => set({ equippedOutfit: e.target.value || null })}>
            <option value="">기본 옷</option>
            {outfits.map((o) => <option key={o.key} value={o.key} disabled={!o.ok}>{o.ok ? '' : '🔒 '}{o.label}</option>)}
          </select>
        </Field>
        <Field label="액세서리">
          <select className="input" value={c.equippedAccessory ?? ''} onChange={(e) => set({ equippedAccessory: e.target.value || null })}>
            <option value="">없음</option>
            {accs.map((o) => <option key={o.key} value={o.key} disabled={!o.ok}>{o.ok ? '' : '🔒 '}{o.label}</option>)}
          </select>
        </Field>
        <Field label="주 시작 요일">
          <select className="input" value={settings.weekStartsOn} onChange={(e) => setSettings({ ...settings, weekStartsOn: Number(e.target.value) })}>
            <option value={1}>월요일</option><option value={0}>일요일</option>
          </select>
        </Field>
        <div className="flex justify-end">
          <button className="btn btn-gold" disabled={!dirty} onClick={() => saveCharacter(c, settings)}>{dirty ? '저장' : '저장됨'}</button>
        </div>
        <p className="text-xs text-muted">픽셀 캐릭터는 코드로 그린 16×24 스프라이트입니다. 나중에 PNG 에셋을 주시면 <code>src/pixel/sprites.ts</code> 레지스트리 항목만 바꿔 교체할 수 있습니다.</p>
      </div>
    </div>
  )
}
