import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../../app/store'
import { Icon } from '../ui/Icon'
import { Avatar } from '../ui/primitives'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function MensagensScreen() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    userOf,
    sendMessage,
    markConversationRead,
    go,
  } = useStore()

  const [filter, setFilter] = useState('')
  const [draft, setDraft] = useState('')
  const scroller = useRef<HTMLDivElement>(null)

  const active = conversations.find((c) => c.id === activeConversationId) ?? null

  const list = useMemo(() => {
    const q = norm(filter.trim())
    if (!q) return conversations
    return conversations.filter((c) => {
      const u = userOf(c.userId)
      return norm(`${u.name} ${u.handle} ${c.preview}`).includes(q)
    })
  }, [conversations, filter, userOf])

  // Opening a thread clears its badge.
  useEffect(() => {
    if (active && active.unread > 0) markConversationRead(active.id)
  }, [active, markConversationRead])

  // Keep the thread pinned to the latest message.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [active?.messages.length, active?.id])

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if (!active || !draft.trim()) return
    sendMessage(active.id, draft)
    setDraft('')
  }

  return (
    <div className="card flex h-[calc(100dvh-210px)] min-h-[480px] overflow-hidden app:h-[calc(100dvh-180px)]">
      {/* Conversation list — full width on mobile until a thread is picked */}
      <div
        className={`flex w-full flex-col border-line-200 app:w-[340px] app:shrink-0 app:border-r ${
          active ? 'hidden app:flex' : 'flex'
        }`}
      >
        <div className="shrink-0 px-5 pb-3 pt-5">
          <h1 className="mb-3 text-xl font-bold tracking-tight text-ink-900">Mensagens</h1>
          <div className="relative">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              type="search"
              aria-label="Filtrar conversas"
              placeholder="Buscar conversa"
              className="w-full rounded-full bg-line-100 py-2.5 pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-pine"
            />
            <Icon
              name="search"
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
            />
          </div>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {list.map((c) => {
            const u = userOf(c.userId)
            const isActive = c.id === activeConversationId
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActiveConversation(c.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                    isActive ? 'bg-line-100' : 'hover:bg-line-100/70'
                  }`}
                >
                  <Avatar src={u.avatar} alt={u.name} size={44} online={u.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-bold text-ink-900">{u.name}</span>
                      <span className="shrink-0 text-[11px] text-ink-500">{c.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-xs ${c.unread ? 'font-semibold text-ink-900' : 'text-ink-500'}`}
                      >
                        {c.preview}
                      </span>
                      {c.unread > 0 && (
                        <span className="shrink-0 rounded-full bg-accent px-1.5 text-[10px] font-bold leading-4 text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
          {list.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-ink-500">Nenhuma conversa encontrada.</li>
          )}
        </ul>
      </div>

      {/* Thread */}
      {active ? (
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center gap-3 border-b border-line-200 px-4 py-3.5">
            <button
              type="button"
              onClick={() => setActiveConversation(null)}
              aria-label="Voltar para conversas"
              className="rounded-lg p-1 text-ink-900 transition hover:bg-line-100 app:hidden"
            >
              <Icon name="chevronLeft" className="h-5 w-5" strokeWidth={2.4} />
            </button>
            {(() => {
              const u = userOf(active.userId)
              return (
                <>
                  <Avatar src={u.avatar} alt={u.name} size={40} online={u.online} onClick={() => go('user', u.id)} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink-900">{u.name}</p>
                    <p className="text-xs text-success">{u.online ? 'Online agora' : 'Visto há pouco'}</p>
                  </div>
                </>
              )
            })()}
          </header>

          <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-line-100/50 px-4 py-4">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Hoje
            </p>
            {active.messages.map((m) => (
              <div key={m.id} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    m.fromMe
                      ? 'rounded-br-md bg-pine text-white'
                      : 'rounded-bl-md bg-surface text-ink-900'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>
                  <p className={`mt-1 text-[10px] ${m.fromMe ? 'text-white/70' : 'text-ink-500'}`}>
                    {m.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={send} className="flex shrink-0 items-center gap-2 border-t border-line-200 px-4 py-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Mensagem"
              placeholder="Escreva uma mensagem…"
              className="min-w-0 flex-1 rounded-full bg-line-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pine"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Enviar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine text-white transition active:scale-95 disabled:opacity-40"
            >
              <Icon name="send" className="h-4 w-4" filled />
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-2 bg-line-100/40 app:flex">
          <Icon name="chat" className="h-10 w-10 text-ink-500" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-ink-700">Escolha uma conversa</p>
          <p className="text-xs text-ink-500">Suas mensagens aparecem aqui.</p>
        </div>
      )}
    </div>
  )
}
