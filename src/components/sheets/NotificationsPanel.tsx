import { useState } from 'react'
import { useStore } from '../../app/store'
import type { NotificationKind } from '../../data/types'
import { Icon, type IconName } from '../ui/Icon'
import { Avatar } from '../ui/primitives'

const KIND_ICON: Record<NotificationKind, IconName> = {
  like: 'heart',
  comment: 'chat',
  mention: 'sparkles',
  follow: 'user',
  group: 'users',
  message: 'chat',
  share: 'share',
}

const KIND_TONE: Record<NotificationKind, string> = {
  like: 'bg-accent/10 text-accent-strong',
  comment: 'bg-pine/10 text-pine',
  mention: 'bg-warning/15 text-warning',
  follow: 'bg-success/10 text-success',
  group: 'bg-line-200 text-ink-700',
  message: 'bg-pine/10 text-pine',
  share: 'bg-line-200 text-ink-700',
}

/**
 * Shared notifications surface: rendered as a popover on desktop
 * (from the header bell) and as a full view on mobile.
 */
export function NotificationsPanel({
  onClose,
  standalone = false,
}: {
  onClose?: () => void
  standalone?: boolean
}) {
  const {
    notifications,
    unreadNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    userOf,
    go,
    isFollowing,
    toggleFollow,
  } = useStore()

  const [tab, setTab] = useState<'todas' | 'nao-lidas'>('todas')
  const visible = tab === 'todas' ? notifications : notifications.filter((n) => !n.read)

  return (
    <div className={standalone ? 'card overflow-hidden' : 'card overflow-hidden ring-1 ring-line-200'}>
      <header className="flex items-center justify-between gap-3 border-b border-line-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-ink-900">Notificações</h2>
          {unreadNotifications > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">
              {unreadNotifications} novas
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markAllNotificationsRead}
            disabled={unreadNotifications === 0}
            className="text-xs font-semibold text-pine transition hover:underline disabled:opacity-40 disabled:hover:no-underline"
          >
            Marcar como lidas
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar notificações"
              className="rounded-lg p-1 text-ink-500 transition hover:bg-line-100"
            >
              <Icon name="close" className="h-4 w-4" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </header>

      <div className="flex gap-4 border-b border-line-200 px-5 text-sm font-semibold">
        {(
          [
            ['todas', 'Todas'],
            ['nao-lidas', 'Não lidas'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`-mb-px border-b-2 py-2.5 transition ${
              tab === key ? 'border-pine text-pine' : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className={`divide-y divide-line-200 ${standalone ? '' : 'max-h-[60vh] overflow-y-auto'}`}>
        {visible.map((n) => {
          const user = n.userId ? userOf(n.userId) : null
          return (
            <li key={n.id}>
              <div
                className={`flex items-start gap-3 px-5 py-4 transition hover:bg-line-100/60 ${
                  n.read ? '' : 'bg-accent/[0.04]'
                }`}
              >
                {user ? (
                  <Avatar src={user.avatar} alt={user.name} size={38} onClick={() => go('user', user.id)} />
                ) : (
                  <span
                    className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${KIND_TONE[n.kind]}`}
                  >
                    <Icon name={KIND_ICON[n.kind]} className="h-4 w-4" />
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    markNotificationRead(n.id)
                    if (n.userId) go('user', n.userId)
                    onClose?.()
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm leading-snug text-ink-900">{n.text}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{n.time}</p>
                </button>

                {n.actionLabel && n.userId && (
                  <button
                    type="button"
                    onClick={() => toggleFollow(n.userId!)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      isFollowing(n.userId)
                        ? 'border border-line-300 text-ink-700 hover:bg-line-100'
                        : 'bg-pine text-white hover:bg-pine-soft'
                    }`}
                  >
                    {isFollowing(n.userId) ? 'Seguindo' : n.actionLabel}
                  </button>
                )}

                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />}
              </div>
            </li>
          )
        })}

        {visible.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-ink-500">
            Tudo em dia. Nenhuma notificação por aqui.
          </li>
        )}
      </ul>
    </div>
  )
}
