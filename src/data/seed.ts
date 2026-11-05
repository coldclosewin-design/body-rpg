import { addDays, todayKey } from '@/game/dates'
import { CharacterSchema, SettingsSchema, uid, type World } from '@/types/model'

/** 첫 실행 시 자동 생성되는 예시 세계관. 편집기에서 자유롭게 바꿀 수 있다. */
export function makeSeedWorld(): World {
  const dBall = uid(), dLift = uid()
  const sLeftFoot = uid(), sPullup = uid(), sPushup = uid()
  const tShoot = uid(), tDribble = uid(), tPullup = uid(), tPushup = uid()
  const today = todayKey()
  const monthStart = today.slice(0, 8) + '01'
  const nextMonth = new Date(monthStart + 'T00:00:00')
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const monthEnd = addDays(`${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`, -1)

  return {
    domains: [
      {
        id: dBall, name: '볼러', icon: '⚽', color: '#06d6a0', baseJobName: '동네 공차기', order: 0,
        tiers: [
          { tier: 1, name: '운동깔짝이', title: '깔짝이', requiredMastered: 1, outfit: 'tracksuit' },
          { tier: 2, name: '운동러', title: '운동러', requiredMastered: 3, outfit: null },
          { tier: 3, name: '프로운동러', title: '프로', requiredMastered: 6, outfit: 'pro_kit' },
          { tier: 4, name: '전설의 볼러', title: '레전드', requiredMastered: 10, outfit: 'legend' },
        ],
      },
      {
        id: dLift, name: '리프터', icon: '💪', color: '#e94560', baseJobName: '헬린이', order: 1,
        tiers: [
          { tier: 1, name: '운동깔짝이', title: '깔짝이', requiredMastered: 1, outfit: 'tracksuit' },
          { tier: 2, name: '운동러', title: '운동러', requiredMastered: 3, outfit: null },
          { tier: 3, name: '프로운동러', title: '프로', requiredMastered: 6, outfit: 'pro_kit' },
          { tier: 4, name: '전설의 리프터', title: '레전드', requiredMastered: 10, outfit: 'legend' },
        ],
      },
    ],
    skills: [
      { id: sLeftFoot, domainId: dBall, name: '왼발로 축구하기', description: '왼발 슈팅·드리블을 8주 동안 꾸준히', status: 'active', goal: { kind: 'weeks', weeks: 8 }, masteredAt: null, order: 0 },
      { id: sPullup, domainId: dLift, name: '턱걸이 500회 쌓기', description: '매일 10개씩, 누적 500회', status: 'active', goal: { kind: 'total', taskId: tPullup, value: 500 }, masteredAt: null, order: 0 },
      { id: sPushup, domainId: dLift, name: '팔굽혀펴기 습관', description: '매일 30개, 4주', status: 'active', goal: { kind: 'weeks', weeks: 4 }, masteredAt: null, order: 1 },
    ],
    tasks: [
      { id: tShoot, skillId: sLeftFoot, name: '왼발 슈팅 연습', metric: 'minutes', target: 30, cadence: { per: 'week', times: 3 }, xp: 30, order: 0 },
      { id: tDribble, skillId: sLeftFoot, name: '왼발 드리블 연습', metric: 'minutes', target: 15, cadence: { per: 'week', times: 2 }, xp: 15, order: 1 },
      { id: tPullup, skillId: sPullup, name: '턱걸이', metric: 'count', target: 10, cadence: { per: 'day', times: 1 }, xp: 10, order: 2 },
      { id: tPushup, skillId: sPushup, name: '팔굽혀펴기', metric: 'count', target: 30, cadence: { per: 'day', times: 1 }, xp: 10, order: 3 },
    ],
    logs: [],
    seasons: [
      {
        id: uid(), name: '시즌 1', startDate: monthStart, endDate: monthEnd,
        tiers: [
          { tier: 1, xp: 100, reward: { type: 'title', value: '시즌1 참가자', label: '칭호: 시즌1 참가자' } },
          { tier: 2, xp: 300, reward: { type: 'accessory', value: 'headband', label: '헤어밴드' } },
          { tier: 3, xp: 600, reward: { type: 'accessory', value: 'sunglasses', label: '선글라스' } },
          { tier: 4, xp: 1000, reward: { type: 'outfit', value: 'champion', label: '챔피언 유니폼' } },
          { tier: 5, xp: 1500, reward: { type: 'title', value: '시즌1 챔피언', label: '칭호: 시즌1 챔피언' } },
        ],
      },
    ],
    character: CharacterSchema.parse({ name: '나' }),
    settings: SettingsSchema.parse({}),
  }
}
