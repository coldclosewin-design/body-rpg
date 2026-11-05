import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { makeRepo, type Repo } from '@/lib/repo'
import { deriveWorld, todayKey, type Derived } from '@/game'
import { makeSeedWorld } from '@/data/seed'
import { uid, type Character, type Domain, type Season, type Settings, type Skill, type Task, type TaskLog, type World } from '@/types/model'
import { useAuth } from './auth'
import { Center } from './auth'

export interface Toast { id: number; text: string; kind: 'xp' | 'info' | 'levelup' }

interface WorldCtx {
  world: World
  derived: Derived
  mode: Repo['mode']
  toasts: Toast[]
  pushToast: (text: string, kind?: Toast['kind']) => void
  addLog: (taskId: string, value: number) => Promise<void>
  removeLog: (logId: string) => Promise<void>
  upsertDomain: (d: Domain) => Promise<void>
  deleteDomain: (id: string) => Promise<void>
  upsertSkill: (s: Skill) => Promise<void>
  deleteSkill: (id: string) => Promise<void>
  upsertTask: (t: Task) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  upsertSeason: (s: Season) => Promise<void>
  deleteSeason: (id: string) => Promise<void>
  saveCharacter: (c: Character, settings?: Settings) => Promise<void>
  replaceWorld: (w: World) => Promise<void>
  newId: () => string
}

const Ctx = createContext<WorldCtx | null>(null)
export const useWorld = (): WorldCtx => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useWorld outside WorldProvider')
  return v
}

const isEmptyWorld = (w: World) => !w.domains.length && !w.skills.length && !w.seasons.length && !w.logs.length

export function WorldProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const repo = useMemo(() => makeRepo(userId), [userId])
  const qc = useQueryClient()
  const key = useMemo(() => ['world', userId ?? 'local'], [userId])
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const pushToast = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, text, kind }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      let w = await repo.loadWorld()
      if (isEmptyWorld(w)) { w = makeSeedWorld(); await repo.replaceWorld(w) }
      return w
    },
  })

  const world = query.data
  const [today, setToday] = useState(todayKey)
  useEffect(() => {
    const id = window.setInterval(() => setToday(todayKey()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  const derived = useMemo(() => (world ? deriveWorld(world, today) : null), [world, today])

  /** 낙관적 업데이트: 캐시 먼저 바꾸고 저장, 실패 시 다시 불러오기 */
  const mutate = useCallback(async (optimistic: (w: World) => World, persist: () => Promise<void>) => {
    const prev = qc.getQueryData<World>(key)
    if (prev) qc.setQueryData<World>(key, optimistic(prev))
    try { await persist() } catch (e) {
      console.error(e)
      pushToast('저장 실패: ' + (e as Error).message, 'info')
      await qc.invalidateQueries({ queryKey: key })
    }
  }, [qc, key, pushToast])

  // 스킬 달성 자동 판정 → mastered 로 승격
  useEffect(() => {
    if (!world || !derived) return
    for (const m of derived.mastery) {
      if (m.achieved && m.skill.status === 'active') {
        const updated: Skill = { ...m.skill, status: 'mastered', masteredAt: new Date().toISOString() }
        void mutate((w) => ({ ...w, skills: w.skills.map((s) => (s.id === updated.id ? updated : s)) }), () => repo.upsertSkill(updated))
        pushToast(`🏆 스킬 달성! ${m.skill.name}`, 'levelup')
      }
    }
  }, [world, derived, mutate, repo, pushToast])

  const api = useMemo<Omit<WorldCtx, 'world' | 'derived'>>(() => ({
    mode: repo.mode, toasts, pushToast, newId: uid,
    addLog: async (taskId, value) => {
      const log: TaskLog = { id: uid(), taskId, date: todayKey(), value, createdAt: new Date().toISOString() }
      const before = derived?.todayXp ?? 0
      const prev = qc.getQueryData<World>(key)
      const next = prev ? { ...prev, logs: [...prev.logs, log] } : null
      await mutate(() => next!, () => repo.addLog(log))
      if (next) {
        const after = deriveWorld(next, todayKey()).todayXp
        if (after > before) pushToast(`+${after - before} XP`, 'xp')
      }
    },
    removeLog: (logId) => mutate((w) => ({ ...w, logs: w.logs.filter((l) => l.id !== logId) }), () => repo.deleteLog(logId)),
    upsertDomain: (d) => mutate((w) => ({ ...w, domains: upsert(w.domains, d) }), () => repo.upsertDomain(d)),
    deleteDomain: (id) => mutate((w) => {
      const skillIds = w.skills.filter((s) => s.domainId === id).map((s) => s.id)
      const taskIds = w.tasks.filter((t) => skillIds.includes(t.skillId)).map((t) => t.id)
      return { ...w, domains: w.domains.filter((d) => d.id !== id), skills: w.skills.filter((s) => s.domainId !== id), tasks: w.tasks.filter((t) => !skillIds.includes(t.skillId)), logs: w.logs.filter((l) => !taskIds.includes(l.taskId)) }
    }, () => repo.deleteDomain(id)),
    upsertSkill: (s) => mutate((w) => ({ ...w, skills: upsert(w.skills, s) }), () => repo.upsertSkill(s)),
    deleteSkill: (id) => mutate((w) => {
      const taskIds = w.tasks.filter((t) => t.skillId === id).map((t) => t.id)
      return { ...w, skills: w.skills.filter((s) => s.id !== id), tasks: w.tasks.filter((t) => t.skillId !== id), logs: w.logs.filter((l) => !taskIds.includes(l.taskId)) }
    }, () => repo.deleteSkill(id)),
    upsertTask: (t) => mutate((w) => ({ ...w, tasks: upsert(w.tasks, t) }), () => repo.upsertTask(t)),
    deleteTask: (id) => mutate((w) => ({ ...w, tasks: w.tasks.filter((t) => t.id !== id), logs: w.logs.filter((l) => l.taskId !== id) }), () => repo.deleteTask(id)),
    upsertSeason: (s) => mutate((w) => ({ ...w, seasons: upsert(w.seasons, s) }), () => repo.upsertSeason(s)),
    deleteSeason: (id) => mutate((w) => ({ ...w, seasons: w.seasons.filter((s) => s.id !== id) }), () => repo.deleteSeason(id)),
    saveCharacter: (c, settings) => mutate((w) => ({ ...w, character: c, settings: settings ?? w.settings }), () => repo.saveCharacter(c, settings ?? qc.getQueryData<World>(key)!.settings)),
    replaceWorld: async (w) => { await repo.replaceWorld(w); await qc.invalidateQueries({ queryKey: key }) },
  }), [repo, toasts, pushToast, mutate, qc, key, derived])

  if (query.isLoading || !world || !derived) return <Center>세계관 불러오는 중…</Center>
  if (query.error) return <Center><div className="card text-accent">불러오기 실패: {(query.error as Error).message}</div></Center>

  return <Ctx.Provider value={{ world, derived, ...api }}>{children}</Ctx.Provider>
}

function upsert<T extends { id: string }>(arr: T[], item: T): T[] {
  return arr.some((x) => x.id === item.id) ? arr.map((x) => (x.id === item.id ? item : x)) : [...arr, item]
}
