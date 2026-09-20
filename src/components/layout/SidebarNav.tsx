import { useStore, type ViewName } from '../../app/store'
import { Icon, type IconName } from '../ui/Icon'

const ITEMS: { view: ViewName | 'criar'; label: string; icon: IconName }[] = [
  { view: 'home', label: 'Início', icon: 'home' },
  { view: 'buscar', label: 'Buscar', icon: 'search' },
  { view: 'mensagens', label: 'Mensagens', icon: 'chat' },
  { view: 'criar', label: 'Criar', icon: 'plus' },
  { view: 'grupos', label: 'Grupos', icon: 'users' },
  { view: 'perfil', label: 'Perfil', icon: 'user' },
]

/** Desktop-only left rail. Mobile uses <BottomNav>. */
export function SidebarNav() {
  const { view, go, openSheet, unreadMessages } = useStore()

  const rowFor = (item: (typeof ITEMS)[number]) => {
    const active = item.view !== 'criar' && view.name === item.view
    return (
      <button
        key={item.view}
        type="button"
        aria-current={active ? 'page' : undefined}
        onClick={() => (item.view === 'criar' ? openSheet('criar') : go(item.view as ViewName))}
        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
          active
            ? 'bg-pine text-white shadow-sm'
            : 'text-ink-700 hover:bg-line-100 hover:text-pine'
        }`}
      >
        <Icon name={item.icon} className="h-5 w-5 shrink-0" />
        <span className="truncate">{item.label}</span>
        {item.view === 'mensagens' && unreadMessages > 0 && (
          <span
            className={`ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
              active ? 'bg-white/20 text-white' : 'bg-accent text-white'
            }`}
          >
            {unreadMessages}
          </span>
        )}
      </button>
    )
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="card sticky top-24 flex flex-col gap-1.5 p-3"
    >
      {ITEMS.map(rowFor)}
      <div className="h-6" />
      {rowFor({ view: 'configuracoes', label: 'Configurações', icon: 'settings' })}
    </nav>
  )
}
