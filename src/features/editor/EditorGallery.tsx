import { useWorld } from '@/app/world'
import { PixelCanvas } from '@/pixel/PixelCanvas'
import { CHARACTERS } from '@design/pixel/characters'
import { spritesOfLayer } from '@/pixel/sprites'

/** 캐릭터 도감: 모든 직업 스킨과 액세서리, 해금 경로 표시 */
export function EditorGallery() {
  const { world, derived, saveCharacter } = useWorld()
  const unlocked = new Set(derived.unlocked)
  const c = world.character

  const sources = (key: string, type: 'outfit' | 'accessory'): string[] => {
    const out: string[] = []
    for (const d of world.domains) for (const t of d.tiers) if (type === 'outfit' && t.outfit === key) out.push(`${d.icon} ${d.name} ${t.tier}차 「${t.name}」`)
    for (const s of world.seasons) for (const t of s.tiers) if (t.reward?.type === type && t.reward.value === key) out.push(`${s.name} T${t.tier}`)
    return out
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">직업 스킨 {CHARACTERS.length}종 + 액세서리 {spritesOfLayer('accessory').length}종. 전직 사다리나 시즌 보상에 배정하면 해금됩니다. 피부·머리색은 외형 설정을 따릅니다.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {CHARACTERS.map((ch) => {
          const isUnlocked = ch.key === 'novice' || unlocked.has(`outfit:${ch.key}`)
          const equipped = (c.equippedOutfit ?? 'novice') === ch.key
          const from = sources(ch.key, 'outfit')
          return (
            <div key={ch.key} className={`card flex flex-col items-center gap-1 ${equipped ? 'outline outline-2 outline-gold' : ''}`}>
              <PixelCanvas appearance={c.appearance} outfit={ch.key} scale={4} />
              <div className="text-sm">{ch.label}</div>
              <div className="text-[10px] text-muted text-center leading-tight">{ch.desc}</div>
              <div className="text-[10px] text-center mt-1">
                {from.length ? from.map((f) => <div key={f} className="text-sky">{f}</div>) : <span className="text-muted">미배정 (편집에서 보상으로 배정)</span>}
              </div>
              <button
                className={`btn text-xs mt-1 ${equipped ? 'btn-gold' : ''}`}
                disabled={!isUnlocked || equipped}
                onClick={() => saveCharacter({ ...c, equippedOutfit: ch.key === 'novice' ? null : ch.key })}
              >
                {equipped ? '장착 중' : isUnlocked ? '장착' : '🔒 미해금'}
              </button>
            </div>
          )
        })}
      </div>
      <h2 className="text-sm text-muted">액세서리</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {spritesOfLayer('accessory').map((a) => {
          const isUnlocked = unlocked.has(`accessory:${a.key}`)
          const equipped = c.equippedAccessory === a.key
          return (
            <div key={a.key} className="card flex flex-col items-center gap-1">
              <PixelCanvas appearance={c.appearance} outfit={c.equippedOutfit} accessory={a.key} scale={3} />
              <div className="text-xs">{a.label}</div>
              <div className="text-[10px] text-sky text-center">{sources(a.key, 'accessory').join(', ') || <span className="text-muted">미배정</span>}</div>
              <button className="btn text-xs" disabled={!isUnlocked || equipped} onClick={() => saveCharacter({ ...c, equippedAccessory: a.key })}>
                {equipped ? '장착 중' : isUnlocked ? '장착' : '🔒'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
