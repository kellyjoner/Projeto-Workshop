import type { Views, Enums } from './supabase'
import type { AppNotification, NotificationKind } from '../data/types'
import { timeAgo } from './format'

type NotificationRow = Views<'my_notifications'>
type DbKind = Enums<'notification_type'>

const KIND_MAP: Record<DbKind, NotificationKind> = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
  MENTION: 'mention',
  GROUP_INVITE: 'group',
  GROUP_REQUEST: 'group',
  GROUP_ACCEPTED: 'group',
  MESSAGE: 'message',
  STORY_REPLY: 'message',
  POST_SHARE: 'share',
}

/**
 * The database stores structured facts (type + actor + references); the
 * copy shown to the user is assembled here, in Portuguese, to match the
 * product's voice.
 */
function describe(row: NotificationRow): { text: string; actionLabel?: string } {
  const actor = row.actor_name ?? 'Alguém'
  const group = row.group_name ?? 'o grupo'

  switch (row.type) {
    case 'FOLLOW':
      return { text: `${actor} começou a seguir você`, actionLabel: 'Seguir de volta' }
    case 'LIKE':
      return { text: `${actor} curtiu sua publicação` }
    case 'COMMENT':
      return { text: `${actor} comentou na sua publicação` }
    case 'MENTION':
      return { text: `${actor} mencionou você em uma publicação` }
    case 'GROUP_INVITE':
      return { text: `Você foi convidado para o grupo ${group}` }
    case 'GROUP_REQUEST':
      return { text: `${actor} pediu para entrar no grupo ${group}` }
    case 'GROUP_ACCEPTED':
      return { text: `Seu pedido para entrar em ${group} foi aceito` }
    case 'MESSAGE':
      return { text: `${actor} enviou uma mensagem` }
    case 'STORY_REPLY':
      return { text: `${actor} respondeu ao seu story` }
    case 'POST_SHARE':
      return { text: `${actor} compartilhou sua publicação` }
    default:
      return { text: 'Nova notificação' }
  }
}

export function mapNotification(row: NotificationRow): AppNotification {
  const { text, actionLabel } = describe(row)
  return {
    id: row.id!,
    kind: KIND_MAP[row.type!],
    text,
    time: timeAgo(row.created_at!),
    read: row.is_read ?? false,
    userId: row.actor_id ?? undefined,
    actionLabel,
  }
}
