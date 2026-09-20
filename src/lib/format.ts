/** Small pt-BR relative-time helpers, used to render timestamps read from Postgres. */

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return 'agora'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return hr === 1 ? 'há 1 h' : `há ${hr} h`
  const day = Math.floor(hr / 24)
  if (day === 1) return 'ontem'
  if (day < 7) return `há ${day} dias`
  const week = Math.floor(day / 7)
  if (week < 5) return week === 1 ? 'há 1 semana' : `há ${week} semanas`
  const month = Math.floor(day / 30)
  if (month < 12) return month === 1 ? 'há 1 mês' : `há ${month} meses`
  const year = Math.floor(day / 365)
  return year === 1 ? 'há 1 ano' : `há ${year} anos`
}

/** "08:16" — used for message bubbles sent today. */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Conversation list timestamp: clock time today, weekday this week, date otherwise. */
export function conversationTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return clockTime(iso)
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
