/**
 * Shared UI types + constants for the Gooday app.
 *
 * This used to be `mock.ts` and held fake seed data. All data now comes
 * from Supabase (see `src/app/store.tsx`); this file only keeps the shapes
 * every screen renders against, plus the small constants that aren't
 * worth a database round-trip (the fixed interest taxonomy, search chips).
 */

export type Interest = 'Corrida' | 'Ciclismo' | 'Nutrição' | 'Treino' | 'Yoga'

export const INTERESTS: Interest[] = ['Corrida', 'Ciclismo', 'Nutrição', 'Treino', 'Yoga']

export const SEARCH_SUGGESTIONS = ['corrida', 'nutrição', 'ciclismo urbano', 'yoga', 'treino funcional']

export interface User {
  id: string
  name: string
  handle: string
  avatar: string
  bio?: string
  city?: string
  verified?: boolean
  interests: Interest[]
  followers: number
  following: number
  /** No presence system yet — always false. See DATABASE.md follow-ups. */
  online?: boolean
}

export interface Comment {
  id: string
  authorId: string
  text: string
  createdAt: string
}

export interface Post {
  id: string
  authorId: string
  text: string
  tags: string[]
  image?: string
  createdAt: string
  likes: number
  liked: boolean
  saved: boolean
  /** Total comment count from the server; `comments` itself loads lazily. */
  commentsCount: number
  reactions: { emoji: string; count: number; mine: boolean }[]
  comments: Comment[]
}

export interface Story {
  id: string
  authorId: string
  image: string
  caption: string
  seen: boolean
}

export interface Group {
  id: string
  name: string
  cover: string
  members: number
  topics: number
  privacy: 'Público' | 'Privado'
  joined: boolean
  /** Requested to join a private group, awaiting admin approval. */
  pending?: boolean
  category: Interest
  description: string
}

export interface Message {
  id: string
  fromMe: boolean
  text: string
  time: string
}

export interface Conversation {
  id: string
  userId: string
  preview: string
  time: string
  unread: number
  messages: Message[]
}

export type NotificationKind = 'like' | 'comment' | 'mention' | 'follow' | 'group' | 'message' | 'share'

export interface AppNotification {
  id: string
  kind: NotificationKind
  text: string
  time: string
  read: boolean
  userId?: string
  actionLabel?: string
}
