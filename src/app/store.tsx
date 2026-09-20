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
import {
  CONVERSATIONS,
  GROUPS,
  ME_ID,
  NOTIFICATIONS,
  POSTS,
  STORIES,
  USERS,
  usersById,
  type AppNotification,
  type Conversation,
  type Group,
  type Interest,
  type Post,
  type Story,
  type User,
} from '../data/types'
import { photo } from '../data/images'

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
  | 'compose-post'
  | 'compose-story'
  | 'notificacoes'
  | 'editar-perfil'
  | 'alterar-email'
  | 'alterar-senha'
  | 'criar-grupo'

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
  showAuth: (screen: AuthScreen) => void
  signIn: () => void
  signOut: () => void

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
  addComment: (postId: string, text: string) => void
  createPost: (input: { text: string; tags: string[]; theme?: Interest }) => void
  createStory: (caption: string) => void
  toggleFollow: (userId: string) => void
  isFollowing: (userId: string) => boolean
  toggleJoinGroup: (groupId: string) => void
  createGroup: (input: { name: string; description: string; category: Interest; privacy: Group['privacy'] }) => void
  sendMessage: (conversationId: string, text: string) => void
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

let nextId = 1000
const uid = (prefix: string) => `${prefix}-${nextId++}`

export function StoreProvider({ children }: { children: ReactNode }) {
  /* auth ------------------------------------------------------------------ */
  const [signedIn, setSignedIn] = useState(true)
  const [auth, setAuth] = useState<AuthScreen>(null)

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

  const openSheet = useCallback((name: SheetName) => setSheet({ name }), [])
  const closeSheet = useCallback(() => setSheet(null), [])
  const openStory = useCallback((index: number) => setStoryIndex(index), [])
  const closeStory = useCallback(() => setStoryIndex(null), [])

  /* data ------------------------------------------------------------------ */
  const [users] = useState<User[]>(USERS)
  const [posts, setPosts] = useState<Post[]>(POSTS)
  const [stories, setStories] = useState<Story[]>(STORIES)
  const [groups, setGroups] = useState<Group[]>(GROUPS)
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS)
  const [notifications, setNotifications] = useState<AppNotification[]>(NOTIFICATIONS)
  const [following, setFollowing] = useState<Set<string>>(new Set(['u-renata', 'u-bruna']))
  const [activeConversationId, setActiveConversation] = useState<string | null>(CONVERSATIONS[0].id)
  const [profile, setProfile] = useState(() => {
    const me = usersById.get(ME_ID)!
    return { name: me.name, bio: me.bio ?? '', city: me.city ?? '' }
  })
  const [email, setEmail] = useState('marcos.v@email.com')

  const me = useMemo<User>(() => ({ ...usersById.get(ME_ID)!, ...profile }), [profile])

  const userOf = useCallback(
    (id: string): User => (id === ME_ID ? me : (usersById.get(id) ?? me)),
    [me],
  )

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

  /* actions --------------------------------------------------------------- */
  const toggleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
      ),
    )
  }, [])

  const toggleSave = useCallback(
    (postId: string) => {
      setPosts((prev) => {
        const next = prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p))
        const target = next.find((p) => p.id === postId)
        toast(target?.saved ? 'Post salvo' : 'Removido dos salvos')
        return next
      })
    },
    [toast],
  )

  const toggleReaction = useCallback((postId: string, emoji: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        const existing = p.reactions.find((r) => r.emoji === emoji)
        if (!existing) return { ...p, reactions: [...p.reactions, { emoji, count: 1, mine: true }] }
        return {
          ...p,
          reactions: p.reactions
            .map((r) =>
              r.emoji === emoji ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) } : r,
            )
            .filter((r) => r.count > 0),
        }
      }),
    )
  }, [])

  const addComment = useCallback(
    (postId: string, text: string) => {
      const clean = text.trim()
      if (!clean) return
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [...p.comments, { id: uid('c'), authorId: ME_ID, text: clean, createdAt: 'agora' }],
              }
            : p,
        ),
      )
      toast('Comentário publicado')
    },
    [toast],
  )

  const createPost = useCallback<StoreValue['createPost']>(
    ({ text, tags, theme }) => {
      const themeMap: Record<Interest, Parameters<typeof photo>[0]> = {
        Corrida: 'run',
        Ciclismo: 'bike',
        Nutrição: 'food',
        Treino: 'gym',
        Yoga: 'yoga',
      }
      const post: Post = {
        id: uid('p'),
        authorId: ME_ID,
        text: text.trim(),
        tags,
        image: photo(theme ? themeMap[theme] : 'nature', Math.floor(Math.random() * 3)),
        createdAt: 'agora',
        likes: 0,
        liked: false,
        saved: false,
        reactions: [],
        comments: [],
      }
      setPosts((prev) => [post, ...prev])
      toast('Publicação criada')
    },
    [toast],
  )

  const createStory = useCallback(
    (caption: string) => {
      const story: Story = {
        id: uid('s'),
        authorId: ME_ID,
        image: photo('nature', Math.floor(Math.random() * 3), 700),
        caption: caption.trim() || 'Meu dia hoje',
        seen: false,
      }
      setStories((prev) => [story, ...prev])
      toast('Story publicado — some em 24 h')
    },
    [toast],
  )

  const toggleFollow = useCallback(
    (userId: string) => {
      setFollowing((prev) => {
        const next = new Set(prev)
        if (next.has(userId)) {
          next.delete(userId)
          toast(`Deixou de seguir ${usersById.get(userId)?.name ?? ''}`)
        } else {
          next.add(userId)
          toast(`Seguindo ${usersById.get(userId)?.name ?? ''}`)
        }
        return next
      })
    },
    [toast],
  )

  const isFollowing = useCallback((userId: string) => following.has(userId), [following])

  const toggleJoinGroup = useCallback(
    (groupId: string) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g
          const joined = !g.joined
          toast(joined ? `Você entrou em ${g.name}` : `Você saiu de ${g.name}`)
          return { ...g, joined, members: g.members + (joined ? 1 : -1) }
        }),
      )
    },
    [toast],
  )

  const createGroup = useCallback<StoreValue['createGroup']>(
    ({ name, description, category, privacy }) => {
      const themeMap: Record<Interest, Parameters<typeof photo>[0]> = {
        Corrida: 'run',
        Ciclismo: 'bike',
        Nutrição: 'food',
        Treino: 'gym',
        Yoga: 'yoga',
      }
      const group: Group = {
        id: uid('g'),
        name: name.trim(),
        description: description.trim() || 'Um grupo novinho, bora chamar gente.',
        cover: photo(themeMap[category], Math.floor(Math.random() * 3), 700),
        members: 1,
        topics: 0,
        privacy,
        joined: true,
        category,
      }
      setGroups((prev) => [group, ...prev])
      toast(`Grupo “${group.name}” criado`)
    },
    [toast],
  )

  const sendMessage = useCallback((conversationId: string, text: string) => {
    const clean = text.trim()
    if (!clean) return
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              preview: `Você: ${clean}`,
              time,
              unread: 0,
              messages: [...c.messages, { id: uid('m'), fromMe: true, text: clean, time }],
            }
          : c,
      ),
    )
  }, [])

  const markConversationRead = useCallback((conversationId: string) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast('Notificações marcadas como lidas')
  }, [toast])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const updateProfile = useCallback<StoreValue['updateProfile']>(
    (input) => {
      setProfile(input)
      toast('Perfil atualizado')
    },
    [toast],
  )

  const updateEmail = useCallback(
    (value: string) => {
      setEmail(value)
      toast('E-mail atualizado')
    },
    [toast],
  )

  const showAuth = useCallback((screen: AuthScreen) => setAuth(screen), [])

  const signIn = useCallback(() => {
    setSignedIn(true)
    setAuth(null)
    setStack([{ name: 'home' }])
    toast(`Bom dia, ${profile.name.split(' ')[0]}!`)
  }, [profile.name, toast])

  const signOut = useCallback(() => {
    setSignedIn(false)
    setAuth('login')
    setSheet(null)
    setStack([{ name: 'home' }])
  }, [])

  /* derived --------------------------------------------------------------- */
  const unreadNotifications = notifications.filter((n) => !n.read).length
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread, 0)

  /* Mark stories seen as they are opened. */
  useEffect(() => {
    if (storyIndex === null) return
    const id = stories[storyIndex]?.id
    if (!id) return
    setStories((prev) => prev.map((s) => (s.id === id ? { ...s, seen: true } : s)))
  }, [storyIndex, stories])

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
    showAuth,
    signIn,
    signOut,
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
    addComment,
    createPost,
    createStory,
    toggleFollow,
    isFollowing,
    toggleJoinGroup,
    createGroup,
    sendMessage,
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
