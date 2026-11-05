import { useEffect, useState } from 'react'
import { useAuth } from '@/app/auth'
import { Bar, Empty, PageTitle } from '@/components/ui'
import { deriveWorld } from '@/game'
import { SupabaseRepo } from '@/lib/repo'
import { supabase } from '@/lib/supabase'
import { PixelCanvas } from '@/pixel/PixelCanvas'
import type { World } from '@/types/model'

interface FriendRow { id: string; display_name: string }

export function FriendsPage() {
  const { session } = useAuth()
  const [me, setMe] = useState<{ invite_code: string; display_name: string } | null>(null)
  const [friends, setFriends] = useState<FriendRow[]>([])
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ friend: FriendRow; world: World } | null>(null)

  const load = async () => {
    if (!supabase || !session) return
    const { data: p } = await supabase.from('profiles').select('invite_code, display_name').eq('id', session.user.id).single()
    setMe(p)
    const { data: fs } = await supabase.from('friendships').select('friend_id').eq('user_id', session.user.id)
    const ids = (fs ?? []).map((f) => f.friend_id as string)
    if (ids.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', ids)
      setFriends((profiles ?? []) as FriendRow[])
    } else setFriends([])
  }
  useEffect(() => { void load() }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!supabase || !session) {
    return (
      <div className="space-y-3">
        <PageTitle>친구</PageTitle>
        <Empty>친구 기능은 클라우드 모드(Supabase 로그인)에서만 동작합니다. 편집 → 데이터 탭을 참고하세요.</Empty>
      </div>
    )
  }

  const sb = supabase
  const addFriend = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    const { error } = await sb.rpc('add_friend_by_code', { code: code.trim() })
    if (error) setMsg('초대코드를 찾을 수 없습니다.')
    else { setMsg('친구가 추가되었습니다.'); setCode(''); await load() }
  }

  const view = async (f: FriendRow) => {
    const world = await new SupabaseRepo(sb, f.id).loadWorld()
    setSelected({ friend: f, world })
  }

  return (
    <div className="space-y-3">
      <PageTitle>친구</PageTitle>
      <div className="card text-sm space-y-1">
        <div>내 초대코드: <span className="text-gold select-all">{me?.invite_code ?? '…'}</span></div>
        <p className="text-xs text-muted">이 코드를 지인에게 주면 서로의 캐릭터를 볼 수 있습니다. 상대도 이 앱에 가입해야 합니다.</p>
        <form onSubmit={addFriend} className="flex gap-2">
          <input className="input" placeholder="상대 초대코드" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn-mint whitespace-nowrap">추가</button>
        </form>
        {msg && <p className="text-xs text-sky">{msg}</p>}
      </div>
      {friends.length === 0 && <Empty>아직 친구가 없습니다.</Empty>}
      <div className="flex gap-2 flex-wrap">
        {friends.map((f) => <button key={f.id} className={`btn text-xs ${selected?.friend.id === f.id ? 'btn-gold' : ''}`} onClick={() => view(f)}>{f.display_name || '이름 없음'}</button>)}
      </div>
      {selected && <FriendView friend={selected.friend} world={selected.world} />}
    </div>
  )
}

function FriendView({ friend, world }: { friend: FriendRow; world: World }) {
  const d = deriveWorld(world)
  const c = world.character
  return (
    <div className="space-y-2">
      <div className="card flex flex-col items-center gap-2 py-4">
        {c.equippedTitle && <div className="text-xs px-2 py-0.5 bg-gold text-black border-2 border-black">「{c.equippedTitle}」</div>}
        <PixelCanvas appearance={c.appearance} outfit={c.equippedOutfit} accessory={c.equippedAccessory} scale={6} />
        <div>{c.name} <span className="text-xs text-muted">({friend.display_name})</span></div>
        <div className="text-xs text-muted">총 {d.totalXp} XP · 🔥 {d.streak.current}일</div>
      </div>
      {d.domains.map((ds) => (
        <div key={ds.domain.id} className="card text-sm" style={{ borderLeft: `6px solid ${ds.domain.color}` }}>
          {ds.domain.icon} {ds.domain.name} · <span className="text-gold">{ds.jobName}</span> <span className="text-xs text-muted">달성 {ds.masteredCount}/{ds.totalSkills}</span>
          {ds.nextTier && <Bar ratio={ds.masteredCount / ds.nextTier.requiredMastered} color={ds.domain.color} className="mt-1" />}
        </div>
      ))}
      {d.seasonStat && (
        <div className="card text-sm">
          {d.seasonStat.season.name} · T{d.seasonStat.currentTier?.tier ?? 0} · {d.seasonStat.xp} XP
          <Bar ratio={d.seasonStat.ratioToNext} color="var(--color-gold)" className="mt-1" />
        </div>
      )}
    </div>
  )
}
