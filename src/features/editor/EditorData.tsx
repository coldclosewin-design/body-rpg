import { useRef, useState } from 'react'
import { useWorld } from '@/app/world'
import { makeSeedWorld } from '@/data/seed'
import { WorldSchema } from '@/types/model'

export function EditorData() {
  const { world, mode, replaceWorld, pushToast } = useWorld()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(world, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bodyrpg-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = async (file: File) => {
    setError(null)
    try {
      const parsed = WorldSchema.parse(JSON.parse(await file.text()))
      if (!window.confirm('현재 세계관과 기록을 모두 이 파일 내용으로 교체할까요?')) return
      await replaceWorld(parsed)
      pushToast('가져오기 완료')
    } catch (e) { setError((e as Error).message) }
  }

  return (
    <div className="space-y-3">
      <div className="card space-y-2 text-sm">
        <div className="text-gold">저장 모드: {mode === 'cloud' ? '☁ 클라우드 (Supabase)' : '💾 로컬 (이 브라우저에만 저장)'}</div>
        {mode === 'local' && (
          <p className="text-xs text-muted">
            PC↔폰 동기화를 켜려면 Supabase 프로젝트를 만들고 <code>.env.local</code> 에 URL/anon key 를 넣은 뒤 다시 빌드하세요. 자세한 절차는 README 참고.
            그 전까지는 아래 JSON 내보내기/가져오기로 기기 간에 옮길 수 있습니다.
          </p>
        )}
      </div>
      <div className="card space-y-2">
        <div className="text-sm">백업 / 이동</div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn" onClick={exportJson}>⬇ JSON 내보내기</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>⬆ JSON 가져오기</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </div>
        {error && <p className="text-accent text-xs">{error}</p>}
      </div>
      <div className="card space-y-2">
        <div className="text-sm">초기화</div>
        <p className="text-xs text-muted">예시 세계관(볼러·리프터, 시즌 1)으로 되돌립니다. 모든 기록이 사라집니다.</p>
        <button className="btn btn-accent" onClick={() => window.confirm('정말 예시 세계관으로 초기화할까요? 모든 기록이 삭제됩니다.') && replaceWorld(makeSeedWorld()).then(() => pushToast('초기화 완료'))}>예시 세계관으로 초기화</button>
      </div>
      <div className="card text-xs text-muted space-y-1">
        <div>분야 {world.domains.length} · 스킬 {world.skills.length} · 과제 {world.tasks.length} · 기록 {world.logs.length} · 시즌 {world.seasons.length}</div>
      </div>
    </div>
  )
}
