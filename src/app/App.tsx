import { useStore } from './store'
import { TopHeader } from '../components/layout/TopHeader'
import { SidebarNav } from '../components/layout/SidebarNav'
import { BottomNav } from '../components/layout/BottomNav'
import { StoriesRail } from '../components/domain/StoriesRail'

import { HomeScreen } from '../components/screens/HomeScreen'
import { BuscarScreen } from '../components/screens/BuscarScreen'
import { MensagensScreen } from '../components/screens/MensagensScreen'
import { GruposScreen } from '../components/screens/GruposScreen'
import { GroupDetailScreen } from '../components/screens/GroupDetailScreen'
import { PerfilScreen } from '../components/screens/PerfilScreen'
import { ConfiguracoesScreen } from '../components/screens/ConfiguracoesScreen'
import { PostDetailScreen } from '../components/screens/PostDetailScreen'
import { NotificacoesScreen } from '../components/screens/NotificacoesScreen'
import { AuthScreen } from '../components/screens/AuthScreen'

import { CreateSheet } from '../components/sheets/CreateSheet'
import { ComposePostSheet, ComposeStorySheet, CreateGroupSheet } from '../components/sheets/ComposeSheets'
import { ChangeEmailSheet, ChangePasswordSheet, EditProfileSheet } from '../components/sheets/AccountSheets'
import { StoryViewer } from '../components/sheets/StoryViewer'
import { ToastHost } from '../components/ui/primitives'

/** Views that show the stories rail (the feed-like surfaces). */
const WITH_STORIES = new Set(['home', 'perfil', 'grupos'])

/** Views rendered inside the two-column desktop grid alongside the left rail. */
function CurrentView() {
  const { view } = useStore()
  switch (view.name) {
    case 'home':
      return <HomeScreen />
    case 'buscar':
      return <BuscarScreen />
    case 'mensagens':
      return <MensagensScreen />
    case 'grupos':
      return <GruposScreen />
    case 'group':
      return <GroupDetailScreen groupId={view.id} />
    case 'perfil':
      return <PerfilScreen />
    case 'user':
      return <PerfilScreen userId={view.id} />
    case 'configuracoes':
      return <ConfiguracoesScreen />
    case 'post':
      return <PostDetailScreen postId={view.id} />
    case 'notificacoes':
      return <NotificacoesScreen />
    default:
      return <HomeScreen />
  }
}

function Overlays() {
  const { sheet } = useStore()
  return (
    <>
      {sheet?.name === 'criar' && <CreateSheet />}
      {sheet?.name === 'compose-post' && <ComposePostSheet />}
      {sheet?.name === 'compose-story' && <ComposeStorySheet />}
      {sheet?.name === 'criar-grupo' && <CreateGroupSheet />}
      {sheet?.name === 'editar-perfil' && <EditProfileSheet />}
      {sheet?.name === 'alterar-email' && <ChangeEmailSheet />}
      {sheet?.name === 'alterar-senha' && <ChangePasswordSheet />}
      <StoryViewer />
      <ToastHost />
    </>
  )
}

function SplashScreen() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-app-bg">
      <span className="anim-fade flex h-14 w-14 items-center justify-center rounded-2xl bg-pine text-2xl font-extrabold text-white">
        g
      </span>
    </div>
  )
}

export function App() {
  const { signedIn, auth, view, loading } = useStore()

  if (loading) {
    return <SplashScreen />
  }

  if (!signedIn || auth) {
    return (
      <>
        <AuthScreen mode={auth ?? 'login'} />
        <ToastHost />
      </>
    )
  }

  const showStories = WITH_STORIES.has(view.name)
  // Home is the only view that lays out its own two columns.
  const fullWidthContent = view.name === 'home'

  return (
    <div className="flex min-h-dvh w-full flex-col">
      <TopHeader />

      {showStories && <div className="mb-4 app:mb-6">{<StoriesRail />}</div>}

      <main className="w-full flex-1 px-4 pb-28 app:px-6 app:pb-12 xl:px-8">
        <div className="grid grid-cols-12 items-start gap-5 app:gap-7">
          <aside className="col-span-12 hidden lg:col-span-2 lg:block">
            <SidebarNav />
          </aside>

          <div className={`col-span-12 ${fullWidthContent ? 'lg:col-span-10' : 'lg:col-span-10'}`}>
            <CurrentView />
          </div>
        </div>
      </main>

      <BottomNav />
      <Overlays />
    </div>
  )
}
