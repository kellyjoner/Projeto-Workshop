import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, type Tables, type Views } from '../lib/supabase'
import { clockTime, timeAgo } from '../lib/format'
import { mapNotification } from '../lib/notifications'
import { photo, type PhotoTheme } from '../data/images'
import type {
  AppNotification,
  Comment,
  Conversation,
  Group,
  Interest,
  Message,
  Post,
  Story,
  User,
} from '../data/types'

/* -------------------------------------------------------------------------- */
/* Navigation model                                                           */
/* -------------------------------------------------------------------------- */

export type ViewName =
  | 'home'
  | 'buscar'
  | 'mensagens'
  | 'grupos'
  | 'perfil'
  | 'configuracoes'
  | 'notificacoes'
  | 'post'
  | 'group'
  | 'user'

export interface View {
  name: ViewName
  /** Id of the post / group / user the view is about. */
  id?: string
}

export type SheetName =
  | 'criar'
  | 'story-format'
  | 'compose-post'
  | 'compose-story'
  | 'notificacoes'
  | 'editar-perfil'
  | 'alterar-email'
  | 'alterar-senha'
  | 'criar-grupo'

/** Which of the 4 story formats the user picked before composing. */
export type StoryFormat = 'camera' | 'galeria' | 'texto' | 'checkin'

export interface Sheet {
  name: SheetName
}

export type AuthScreen = 'login' | 'cadastro' | null

/** Primary destinations, shared by the desktop rail and the mobile bottom bar. */
export const PRIMARY_NAV: { view: ViewName; label: string }[] = [
  { view: 'home', label: 'Início' },
  { view: 'buscar', label: 'Buscar' },
  { view: 'mensagens', label: 'Mensagens' },
  { view: 'grupos', label: 'Grupos' },
  { view: 'perfil', label: 'Perfil' },
]

const THEME_TO_PHOTO: Record<Interest, PhotoTheme> = {
  Corrida: 'run',
  Ciclismo: 'bike',
  Nutrição: 'food',
  Treino: 'gym',
  Yoga: 'yoga',
}

const EMPTY_USER: User = {
  id: '',
  name: '',
  handle: '',
  avatar: '',
  interests: [],
  followers: 0,
  following: 0,
}

/* -------------------------------------------------------------------------- */
/* Row -> UI mappers                                                          */
/* -------------------------------------------------------------------------- */

type ProfileRow = Views<'profiles_with_interests'>
type PostRow = Views<'feed_posts'>
type StoryRow = Views<'active_stories'>
type GroupRow = Views<'groups_with_membership'>
type ConversationRow = Views<'my_conversations'>
type CommentRow = Pick<Tables<'comments'>, 'id' | 'author_id' | 'body' | 'created_at'>

function mapUser(row: ProfileRow): User {
  return {
    id: row.id!,
    name: row.name!,
    handle: row.handle!,
    avatar: row.avatar_url ?? '',
    bio: row.bio ?? undefined,
    city: row.location ?? undefined,
    verified: row.is_verified ?? false,
    interests: (row.interests ?? []) as Interest[],
    followers: row.followers_count ?? 0,
    following: row.following_count ?? 0,
    // No presence system yet (see DATABASE.md follow-ups) — never fabricate this.
    online: false,
  }
}

function mapPost(row: PostRow): Post {
  const reactions = (row.reactions ?? []) as { emoji: string; count: number; mine: boolean }[]
  return {
    id: row.id!,
    authorId: row.author_id!,
    text: row.body!,
    tags: (row.tags ?? []) as string[],
    image: (row.media_urls as string[] | null)?.[0],
    createdAt: timeAgo(row.created_at!),
    likes: row.likes_count ?? 0,
    liked: row.viewer_has_liked ?? false,
    saved: row.viewer_has_saved ?? false,
    commentsCount: row.comments_count ?? 0,
    reactions,
    comments: [],
  }
}

function mapStory(row: StoryRow): Story {
  return {
    id: row.id!,
    authorId: row.author_id!,
    image: row.image_url ?? '',
    caption: row.caption ?? '',
    seen: row.viewer_has_seen ?? false,
  }
}

function mapGroup(row: GroupRow): Group {
  const interests = (row.interests ?? []) as Interest[]
  return {
    id: row.id!,
    name: row.name!,
    cover: row.cover_url ?? '',
    members: row.members_count ?? 0,
    topics: row.posts_count ?? 0,
    privacy: row.privacy === 'PRIVATE' ? 'Privado' : 'Público',
    joined: row.viewer_status === 'ACTIVE',
    pending: row.viewer_status === 'PENDING',
    category: interests[0] ?? 'Corrida',
    description: row.description ?? '',
  }
}

function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id!,
    userId: row.other_user_id ?? '',
    preview: row.preview ? (row.preview_is_mine ? `Você: ${row.preview}` : row.preview) : 'Diga oi 👋',
    time: row.preview_at ? clockTime(row.preview_at) : '',
    unread: row.unread_count ?? 0,
    messages: [],
  }
}

function mapComment(row: CommentRow): Comment {
  return { id: row.id, authorId: row.author_id, text: row.body, createdAt: timeAgo(row.created_at) }
}

/** Translates common GoTrue error strings into the product's Portuguese voice. */
function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already exists')) return 'Já existe uma conta com este e-mail.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('password') && (m.includes('at least') || m.includes('6 characters')))
    return 'A senha precisa ter pelo menos 8 caracteres.'
  if (m.includes('rate limit')) return 'Muitas tentativas. Aguarde um instante e tente de novo.'
  if (m.includes('invalid email')) return 'E-mail inválido.'
  return 'Não foi possível concluir. Tente novamente.'
}

/* -------------------------------------------------------------------------- */
/* Store shape                                                                */
/* -------------------------------------------------------------------------- */

interface Toast {
  id: number
  text: string
}

interface StoreValue {
  /* auth */
  auth: AuthScreen
  signedIn: boolean
  loading: boolean
  authBusy: boolean
  authError: string | null
  showAuth: (screen: AuthScreen) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: { name: string; handle: string; email: string; password: string; interests: Interest[] }) => Promise<void>
  signOut: () => Promise<void>
  updatePassword: (current: string, next: string) => Promise<boolean>

  /* navigation */
  view: View
  canGoBack: boolean
  go: (name: ViewName, id?: string) => void
  back: () => void

  /* overlays */
  sheet: Sheet | null
  openSheet: (name: SheetName) => void
  closeSheet: () => void
  storyIndex: number | null
  openStory: (index: number) => void
  closeStory: () => void
  /** Format picked in the "Story" sheet, read by the composer to tailor its copy. */
  storyFormat: StoryFormat | null
  setStoryFormat: (format: StoryFormat | null) => void

  /* data */
  me: User
  users: User[]
  posts: Post[]
  stories: Story[]
  groups: Group[]
  conversations: Conversation[]
  notifications: AppNotification[]
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void

  /* derived */
  unreadNotifications: number
  unreadMessages: number
  userOf: (id: string) => User

  /* actions */
  toggleLike: (postId: string) => void
  toggleSave: (postId: string) => void
  toggleReaction: (postId: string, emoji: string) => void
  loadPostComments: (postId: string) => void
  addComment: (postId: string, text: string) => void
  createPost: (input: { text: string; tags: string[]; theme?: Interest }) => void
  updatePost: (postId: string, text: string) => void
  deletePost: (postId: string) => void
  createStory: (caption: string) => void
  toggleFollow: (userId: string) => void
  isFollowing: (userId: string) => boolean
  toggleJoinGroup: (groupId: string) => void
  createGroup: (input: { name: string; description: string; category: Interest; privacy: Group['privacy'] }) => void
  sendMessage: (conversationId: string, text: string) => void
  startConversationWith: (userId: string) => void
  markConversationRead: (conversationId: string) => void
  markAllNotificationsRead: () => void
  markNotificationRead: (id: string) => void
  updateProfile: (input: { name: string; bio: string; city: string }) => void
  updateEmail: (email: string) => void
  email: string

  /* feedback */
  toasts: Toast[]
  toast: (text: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  /* auth ------------------------------------------------------------------ */
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState<AuthScreen>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const signedIn = session !== null && profile !== null
  const me = profile ?? EMPTY_USER

  /* navigation ------------------------------------------------------------ */
  const [stack, setStack] = useState<View[]>([{ name: 'home' }])
  const view = stack[stack.length - 1]

  const go = useCallback((name: ViewName, id?: string) => {
    setStack((prev) => {
      const top = prev[prev.length - 1]
      if (top.name === name && top.id === id) return prev
      // Primary destinations reset the stack; detail views push onto it.
      const isPrimary = PRIMARY_NAV.some((n) => n.view === name)
      return isPrimary ? [{ name, id }] : [...prev, { name, id }]
    })
  }, [])

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  /* overlays -------------------------------------------------------------- */
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [storyIndex, setStoryIndex] = useState<number | null>(null)
  const [storyFormat, setStoryFormat] = useState<StoryFormat | null>(null)

  const openSheet = useCallback((name: SheetName) => setSheet({ name }), [])
  const closeSheet = useCallback(() => setSheet(null), [])
  const openStory = useCallback((index: number) => setStoryIndex(index), [])
  const closeStory = useCallback(() => setStoryIndex(null), [])

  /* data -------------------------------------------------------------------
     Everything below is real Supabase data — see DATABASE.md for the schema,
     RLS policies and RPCs this reads and writes. -------------------------- */
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])
  const userOf = useCallback((id: string): User => usersById.get(id) ?? EMPTY_USER, [usersById])

  /** interest name -> id, resolved once per session; used when creating a group. */
  const interestIds = useRef<Map<string, string>>(new Map())
  /** Conversations whose message history has already been fetched. */
  const loadedConversations = useRef<Set<string>>(new Set())

  /* toasts ---------------------------------------------------------------- */
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<number[]>([])

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, text }])
    const t = window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 2600)
    timers.current.push(t)
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  /* -------------------------------------------------------------------- */
  /* Initial load + auth session lifecycle                                 */
  /* -------------------------------------------------------------------- */

  const resetLocalState = useCallback(() => {
    setProfile(null)
    setUsers([])
    setPosts([])
    setStories([])
    setGroups([])
    setConversations([])
    setNotifications([])
    setFollowingIds(new Set())
    setActiveConversationId(null)
    loadedConversations.current.clear()
    setStack([{ name: 'home' }])
    setSheet(null)
    setStoryIndex(null)
  }, [])

  const loadAll = useCallback(
    async (userId: string) => {
      const [meRes, usersRes, postsRes, storiesRes, groupsRes, convRes, notifRes, interestsRes] = await Promise.all([
        supabase.from('profiles_with_interests').select('*').eq('id', userId).single(),
        supabase.from('profiles_with_interests').select('*'),
        supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('active_stories').select('*').order('created_at', { ascending: false }),
        supabase.from('groups_with_membership').select('*').order('name'),
        supabase.from('my_conversations').select('*').order('last_message_at', { ascending: false }),
        supabase.from('my_notifications').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('interests').select('id, name'),
      ])

      if (meRes.error || !meRes.data) {
        console.error('Falha ao carregar o perfil:', meRes.error)
        toast('Não foi possível carregar sua conta. Tente entrar novamente.')
        await supabase.auth.signOut()
        return
      }

      setProfile(mapUser(meRes.data))

      if (usersRes.data) {
        const mapped = usersRes.data.map(mapUser)
        setUsers(mapped)
        setFollowingIds(new Set(usersRes.data.filter((r) => r.viewer_is_following).map((r) => r.id!)))
      }
      if (postsRes.data) setPosts(postsRes.data.map(mapPost))
      if (storiesRes.data) setStories(storiesRes.data.map(mapStory))
      if (groupsRes.data) setGroups(groupsRes.data.map(mapGroup))
      if (convRes.data) setConversations(convRes.data.map(mapConversation))
      if (notifRes.data) setNotifications(notifRes.data.map(mapNotification))
      if (interestsRes.data) {
        interestIds.current = new Map(interestsRes.data.map((i) => [i.name, i.id]))
      }

      for (const res of [usersRes, postsRes, storiesRes, groupsRes, convRes, notifRes]) {
        if (res.error) console.error(res.error)
      }
    },
    [toast],
  )

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) await loadAll(data.session.user.id)
      if (active) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'SIGNED_IN' && newSession) {
        loadAll(newSession.user.id)
      }
      if (event === 'SIGNED_OUT') {
        resetLocalState()
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* -------------------------------------------------------------------- */
  /* Auth actions                                                          */
  /* -------------------------------------------------------------------- */

  const showAuth = useCallback((screen: AuthScreen) => {
    setAuthError(null)
    setAuth(screen)
  }, [])

  const signIn = useCallback(async (emailInput: string, password: string) => {
    setAuthBusy(true)
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: emailInput.trim(), password })
    setAuthBusy(false)
    if (error) {
      setAuthError(mapAuthError(error.message))
      return
    }
    setAuth(null)
  }, [])

  const signUp = useCallback(
    async (input: { name: string; handle: string; email: string; password: string; interests: Interest[] }) => {
      setAuthBusy(true)
      setAuthError(null)
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: {
            name: input.name.trim(),
            handle: input.handle.trim(),
            interests: input.interests,
          },
        },
      })
      setAuthBusy(false)
      if (error) {
        setAuthError(mapAuthError(error.message))
        return
      }
      if (data.session) {
        setAuth(null)
      } else {
        toast(`Enviamos um link de confirmação para ${input.email}. Confirme para entrar.`)
        setAuth('login')
      }
    },
    [toast],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setAuth('login')
  }, [])

  const updatePassword = useCallback(
    async (current: string, next: string) => {
      if (!session?.user.email) return false
      // GoTrue has no "verify current password" call — re-authenticating checks it.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: current,
      })
      if (reauthError) {
        toast('Senha atual incorreta')
        return false
      }
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) {
        toast(mapAuthError(error.message))
        return false
      }
      toast('Senha atualizada')
      return true
    },
    [session, toast],
  )

  /* -------------------------------------------------------------------- */
  /* Post actions                                                          */
  /* -------------------------------------------------------------------- */

  const toggleLike = useCallback(
    async (postId: string) => {
      const before = posts.find((p) => p.id === postId)
      if (!before) return
      const optimistic = !before.liked
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, liked: optimistic, likes: p.likes + (optimistic ? 1 : -1) } : p)),
      )
      const { data, error } = await supabase.rpc('toggle_like', { p_post_id: postId })
      if (error) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, liked: before.liked, likes: before.likes } : p)))
        toast('Não foi possível curtir agora')
        return
      }
      if (data !== optimistic) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, liked: data } : p)))
      }
    },
    [posts, toast],
  )

  const toggleSave = useCallback(
    async (postId: string) => {
      const before = posts.find((p) => p.id === postId)
      if (!before) return
      const optimistic = !before.saved
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: optimistic } : p)))
      const { data, error } = await supabase.rpc('toggle_bookmark', { p_post_id: postId })
      if (error) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: before.saved } : p)))
        toast('Não foi possível salvar agora')
        return
      }
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: data } : p)))
      toast(data ? 'Post salvo' : 'Removido dos salvos')
    },
    [posts, toast],
  )

  const toggleReaction = useCallback(
    async (postId: string, emoji: string) => {
      const before = posts.find((p) => p.id === postId)
      if (!before) return
      const existing = before.reactions.find((r) => r.emoji === emoji)
      const nextReactions = existing
        ? existing.mine
          ? before.reactions
              .map((r) => (r.emoji === emoji ? { ...r, mine: false, count: r.count - 1 } : r))
              .filter((r) => r.count > 0)
          : before.reactions.map((r) => (r.emoji === emoji ? { ...r, mine: true, count: r.count + 1 } : r))
        : [...before.reactions, { emoji, count: 1, mine: true }]

      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reactions: nextReactions } : p)))
      const { error } = await supabase.rpc('toggle_reaction', { p_post_id: postId, p_emoji: emoji })
      if (error) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reactions: before.reactions } : p)))
        toast('Não foi possível reagir agora')
      }
    },
    [posts, toast],
  )

  const loadPostComments = useCallback(
    async (postId: string) => {
      const { data, error } = await supabase
        .from('comments')
        .select('id, author_id, body, created_at')
        .eq('post_id', postId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
      if (error) {
        toast('Não foi possível carregar os comentários')
        return
      }
      const comments = (data ?? []).map(mapComment)
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments } : p)))
    },
    [toast],
  )

  const addComment = useCallback(
    async (postId: string, text: string) => {
      const clean = text.trim()
      if (!clean || !session) return
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, author_id: session.user.id, body: clean })
        .select('id, author_id, body, created_at')
        .single()
      if (error || !data) {
        toast('Não foi possível comentar agora')
        return
      }
      const comment = mapComment(data)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentsCount: p.commentsCount + 1, comments: [...p.comments, comment] } : p,
        ),
      )
      toast('Comentário publicado')
    },
    [session, toast],
  )

  const createPost = useCallback(
    async ({ text, tags, theme }: { text: string; tags: string[]; theme?: Interest }) => {
      if (!session) return
      const image = photo(theme ? THEME_TO_PHOTO[theme] : 'nature', Math.floor(Math.random() * 3))
      const { data: postId, error } = await supabase.rpc('create_post', {
        p_body: text.trim(),
        p_tags: tags,
        p_media_urls: [image],
        p_audience: 'PUBLIC',
      })
      if (error || !postId) {
        toast('Não foi possível publicar agora')
        return
      }
      const newPost: Post = {
        id: postId,
        authorId: session.user.id,
        text: text.trim(),
        tags,
        image,
        createdAt: 'agora',
        likes: 0,
        liked: false,
        saved: false,
        commentsCount: 0,
        reactions: [],
        comments: [],
      }
      setPosts((prev) => [newPost, ...prev])
      toast('Publicação criada')
    },
    [session, toast],
  )

  const updatePost = useCallback(
    async (postId: string, text: string) => {
      const clean = text.trim()
      const before = posts.find((p) => p.id === postId)
      if (!clean || !before) return
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, text: clean } : p)))
      const { error } = await supabase.from('posts').update({ body: clean }).eq('id', postId)
      if (error) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, text: before.text } : p)))
        toast('Não foi possível editar a publicação')
        return
      }
      toast('Publicação atualizada')
    },
    [posts, toast],
  )

  const deletePost = useCallback(
    async (postId: string) => {
      const before = posts
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) {
        setPosts(before)
        toast('Não foi possível excluir a publicação')
        return
      }
      toast('Publicação excluída')
    },
    [posts, toast],
  )

  const createStory = useCallback(
    async (caption: string) => {
      if (!session) return
      const clean = caption.trim() || 'Meu dia hoje'
      const image = photo('nature', Math.floor(Math.random() * 3), 700)
      const { data: storyId, error } = await supabase.rpc('create_story', {
        p_caption: clean,
        p_media_url: image,
      })
      if (error || !storyId) {
        toast('Não foi possível publicar o story')
        return
      }
      const newStory: Story = { id: storyId, authorId: session.user.id, image, caption: clean, seen: true }
      setStories((prev) => [newStory, ...prev])
      toast('Story publicado — some em 24 h')
    },
    [session, toast],
  )

  /* Persist "seen" the moment a story is opened. */
  useEffect(() => {
    if (storyIndex === null || !session) return
    const story = stories[storyIndex]
    if (!story || story.seen) return
    setStories((prev) => prev.map((s) => (s.id === story.id ? { ...s, seen: true } : s)))
    supabase
      .from('story_views')
      .insert({ story_id: story.id, viewer_id: session.user.id })
      .then(({ error }) => {
        if (error) console.error(error)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyIndex])

  /* -------------------------------------------------------------------- */
  /* Social graph                                                          */
  /* -------------------------------------------------------------------- */

  const isFollowing = useCallback((userId: string) => followingIds.has(userId), [followingIds])

  const toggleFollow = useCallback(
    async (userId: string) => {
      const wasFollowing = followingIds.has(userId)
      setFollowingIds((prev) => {
        const next = new Set(prev)
        wasFollowing ? next.delete(userId) : next.add(userId)
        return next
      })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, followers: u.followers + (wasFollowing ? -1 : 1) } : u)))
      setProfile((prev) => (prev ? { ...prev, following: prev.following + (wasFollowing ? -1 : 1) } : prev))

      const { data, error } = await supabase.rpc('toggle_follow', { p_target: userId })
      if (error) {
        setFollowingIds((prev) => {
          const next = new Set(prev)
          wasFollowing ? next.add(userId) : next.delete(userId)
          return next
        })
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, followers: u.followers + (wasFollowing ? 1 : -1) } : u)),
        )
        setProfile((prev) => (prev ? { ...prev, following: prev.following + (wasFollowing ? 1 : -1) } : prev))
        toast('Não foi possível atualizar agora')
        return
      }
      const name = usersById.get(userId)?.name ?? ''
      toast(data ? `Seguindo ${name}` : `Deixou de seguir ${name}`)
    },
    [followingIds, usersById, toast],
  )

  /* -------------------------------------------------------------------- */
  /* Groups                                                                */
  /* -------------------------------------------------------------------- */

  const toggleJoinGroup = useCallback(
    async (groupId: string) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group) return
      const { data: nextStatus, error } = await supabase.rpc('toggle_group_membership', { p_group_id: groupId })
      if (error) {
        toast('Não foi possível atualizar sua participação')
        return
      }
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g
          const wasActive = g.joined
          const joined = nextStatus === 'ACTIVE'
          const pending = nextStatus === 'PENDING'
          const delta = joined && !wasActive ? 1 : !joined && !pending && wasActive ? -1 : 0
          return { ...g, joined, pending, members: g.members + delta }
        }),
      )
      if (nextStatus === 'ACTIVE') toast(`Você entrou em ${group.name}`)
      else if (nextStatus === 'PENDING') toast(`Pedido enviado para ${group.name}`)
      else toast(`Você saiu de ${group.name}`)
    },
    [groups, toast],
  )

  const createGroup = useCallback(
    async ({
      name,
      description,
      category,
      privacy,
    }: {
      name: string
      description: string
      category: Interest
      privacy: Group['privacy']
    }) => {
      if (!session) return
      const cover = photo(THEME_TO_PHOTO[category], Math.floor(Math.random() * 3), 700)
      const cleanDescription = description.trim() || 'Um grupo novinho, bora chamar gente.'
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: cleanDescription,
          cover_url: cover,
          privacy: privacy === 'Privado' ? 'PRIVATE' : 'PUBLIC',
          created_by: session.user.id,
        })
        .select('id, name, cover_url, description')
        .single()

      if (error || !data) {
        toast('Não foi possível criar o grupo')
        return
      }

      const interestId = interestIds.current.get(category)
      if (interestId) {
        const { error: interestErr } = await supabase
          .from('group_interests')
          .insert({ group_id: data.id, interest_id: interestId })
        if (interestErr) console.error(interestErr)
      }

      const newGroup: Group = {
        id: data.id,
        name: data.name,
        cover: data.cover_url ?? cover,
        members: 1,
        topics: 0,
        privacy,
        joined: true,
        category,
        description: data.description ?? cleanDescription,
      }
      setGroups((prev) => [newGroup, ...prev])
      toast(`Grupo "${newGroup.name}" criado`)
    },
    [session, toast],
  )

  /* -------------------------------------------------------------------- */
  /* Messages                                                              */
  /* -------------------------------------------------------------------- */

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!session) return
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, body, sent_at')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('sent_at', { ascending: true })
      if (error) {
        toast('Não foi possível carregar as mensagens')
        return
      }
      const messages: Message[] = (data ?? []).map((m) => ({
        id: m.id,
        fromMe: m.sender_id === session.user.id,
        text: m.body,
        time: clockTime(m.sent_at),
      }))
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, messages } : c)))
    },
    [session, toast],
  )

  const setActiveConversation = useCallback(
    (id: string | null) => {
      setActiveConversationId(id)
      if (id && !loadedConversations.current.has(id)) {
        loadedConversations.current.add(id)
        loadMessages(id)
      }
    },
    [loadMessages],
  )

  const sendMessage = useCallback(
    async (conversationId: string, text: string) => {
      const clean = text.trim()
      if (!clean || !session) return
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: session.user.id, body: clean })
        .select('id, sender_id, body, sent_at')
        .single()
      if (error || !data) {
        toast('Não foi possível enviar a mensagem')
        return
      }
      const time = clockTime(data.sent_at)
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                preview: `Você: ${clean}`,
                time,
                unread: 0,
                messages: [...c.messages, { id: data.id, fromMe: true, text: data.body, time }],
              }
            : c,
        ),
      )
    },
    [session, toast],
  )

  const startConversationWith = useCallback(
    async (userId: string) => {
      const existing = conversations.find((c) => c.userId === userId)
      if (existing) {
        setActiveConversation(existing.id)
        go('mensagens')
        return
      }
      const { data: conversationId, error } = await supabase.rpc('get_or_create_direct_conversation', {
        p_other_user: userId,
      })
      if (error || !conversationId) {
        toast('Não foi possível abrir a conversa')
        return
      }
      loadedConversations.current.add(conversationId)
      setConversations((prev) => [
        { id: conversationId, userId, preview: 'Diga oi 👋', time: '', unread: 0, messages: [] },
        ...prev,
      ])
      setActiveConversationId(conversationId)
      go('mensagens')
    },
    [conversations, go, setActiveConversation, toast],
  )

  const markConversationRead = useCallback(async (conversationId: string) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)))
    const { error } = await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId })
    if (error) console.error(error)
  }, [])

  /* -------------------------------------------------------------------- */
  /* Notifications                                                         */
  /* -------------------------------------------------------------------- */

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    const { error } = await supabase.rpc('mark_all_notifications_read')
    if (error) toast('Não foi possível atualizar as notificações')
    else toast('Notificações marcadas como lidas')
  }, [toast])

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) console.error(error)
  }, [])

  /* -------------------------------------------------------------------- */
  /* Account                                                               */
  /* -------------------------------------------------------------------- */

  const updateProfile = useCallback(
    async ({ name, bio, city }: { name: string; bio: string; city: string }) => {
      if (!session) return
      const { error } = await supabase
        .from('profiles')
        .update({ name, bio: bio || null, location: city || null })
        .eq('id', session.user.id)
      if (error) {
        toast('Não foi possível salvar o perfil')
        return
      }
      setProfile((prev) => (prev ? { ...prev, name, bio, city } : prev))
      setUsers((prev) => prev.map((u) => (u.id === session.user.id ? { ...u, name, bio, city } : u)))
      toast('Perfil atualizado')
    },
    [session, toast],
  )

  const updateEmail = useCallback(
    async (newEmail: string) => {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) {
        toast(mapAuthError(error.message))
        return
      }
      toast('Enviamos um link de confirmação para o novo e-mail')
    },
    [toast],
  )

  const email = session?.user.email ?? ''

  /* derived --------------------------------------------------------------- */
  const unreadNotifications = notifications.filter((n) => !n.read).length
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread, 0)

  /* Body scroll lock while any overlay is open. */
  const overlayOpen = sheet !== null || storyIndex !== null
  useEffect(() => {
    if (!overlayOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [overlayOpen])

  /* Escape closes the topmost overlay, then pops the view stack. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (storyIndex !== null) closeStory()
      else if (sheet) closeSheet()
      else back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [storyIndex, sheet, closeStory, closeSheet, back])

  const value: StoreValue = {
    auth,
    signedIn,
    loading,
    authBusy,
    authError,
    showAuth,
    signIn,
    signUp,
    signOut,
    updatePassword,
    view,
    canGoBack: stack.length > 1,
    go,
    back,
    sheet,
    openSheet,
    closeSheet,
    storyIndex,
    openStory,
    closeStory,
    storyFormat,
    setStoryFormat,
    me,
    users,
    posts,
    stories,
    groups,
    conversations,
    notifications,
    activeConversationId,
    setActiveConversation,
    unreadNotifications,
    unreadMessages,
    userOf,
    toggleLike,
    toggleSave,
    toggleReaction,
    loadPostComments,
    addComment,
    createPost,
    updatePost,
    deletePost,
    createStory,
    toggleFollow,
    isFollowing,
    toggleJoinGroup,
    createGroup,
    sendMessage,
    startConversationWith,
    markConversationRead,
    markAllNotificationsRead,
    markNotificationRead,
    updateProfile,
    updateEmail,
    email,
    toasts,
    toast,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
