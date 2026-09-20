import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../app/store'
import { Icon } from '../ui/Icon'
import { Avatar } from '../ui/primitives'
import { NotificationsPanel } from '../sheets/NotificationsPanel'

export function TopHeader() {
  const { me, go, view, unreadNotifications } = useStore()
  const [query, setQuery] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  // Close the desktop notifications popover on any outside click.
  useEffect(() => {
    if (!panelOpen) return
    const onDown = (e: MouseEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) setPanelOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [panelOpen])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    go('buscar')
    window.dispatchEvent(new CustomEvent('gooday:search', { detail: query }))
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-app-bg/90 pt-safe backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 app:gap-7 app:px-6 app:py-3.5 xl:px-8">
        <button
          type="button"
          onClick={() => go('home')}
          aria-label="Gooday — ir para o início"
          className="flex shrink-0 items-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-pine text-base font-extrabold text-white">
            g
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight text-ink-900 app:inline">
            Gooday
          </span>
        </button>

        <form onSubmit={submit} className="relative min-w-0 flex-1 app:max-w-md" role="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => view.name !== 'buscar' && go('buscar')}
            type="search"
            aria-label="Buscar no Gooday"
            placeholder="O que deseja fazer de bom hoje?"
            className="w-full rounded-full bg-surface py-2.5 pl-5 pr-11 text-sm text-ink-700 shadow-sm outline-none transition placeholder:text-ink-500 focus:ring-2 focus:ring-pine"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-700 transition hover:text-pine"
          >
            <Icon name="search" className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-3 app:gap-6">
          <span className="hidden text-sm font-medium text-ink-700 xl:inline">
            Respeite sua mente e trate seu corpo bem!
          </span>

          <div ref={bellRef} className="relative">
            <button
              type="button"
              aria-label={`Notificações${unreadNotifications ? ` (${unreadNotifications} novas)` : ''}`}
              onClick={() => {
                // Popover on desktop, full view on mobile.
                if (window.matchMedia('(min-width: 800px)').matches) setPanelOpen((v) => !v)
                else go('notificacoes')
              }}
              className="relative text-ink-900 transition hover:text-pine"
            >
              <Icon name="bell" className="h-6 w-6" strokeWidth={1.8} />
              {unreadNotifications > 0 && (
                <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-app-bg" />
              )}
            </button>

            {panelOpen && (
              <div className="anim-zoom absolute right-0 top-11 hidden w-[380px] app:block">
                <NotificationsPanel onClose={() => setPanelOpen(false)} />
              </div>
            )}
          </div>

          <Avatar
            src={me.avatar}
            alt={me.name}
            size={40}
            online
            onClick={() => go('perfil')}
          />
        </div>
      </div>
    </header>
  )
}
