import { useStore, type ViewName } from '../../app/store'
import { Icon, type IconName } from '../ui/Icon'

const LEFT: { view: ViewName; label: string; icon: IconName }[] = [
  { view: 'home', label: 'Início', icon: 'home' },
  { view: 'buscar', label: 'Buscar', icon: 'search' },
]
const RIGHT: { view: ViewName; label: string; icon: IconName }[] = [
  { view: 'mensagens', label: 'Mensagens', icon: 'chat' },
  { view: 'perfil', label: 'Perfil', icon: 'user' },
]

/** Mobile tab bar — the exports had no mobile chrome, so this is new. */
export function BottomNav() {
  const { view, go, openSheet, unreadMessages } = useStore()

  const Tab = ({ item }: { item: { view: ViewName; label: string; icon: IconName } }) => {
    const active = view.name === item.view
    return (
      <button
        type="button"
        onClick={() => go(item.view)}
        aria-current={active ? 'page' : undefined}
        aria-label={item.label}
        className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition ${
          active ? 'text-pine' : 'text-ink-500'
        }`}
      >
        <Icon name={item.icon} className="h-6 w-6" strokeWidth={active ? 2.3 : 1.9} />
        <span>{item.label}</span>
        {item.view === 'mensagens' && unreadMessages > 0 && (
          <span className="absolute right-[22%] top-1 min-w-4 rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-white">
            {unreadMessages}
          </span>
        )}
      </button>
    )
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-line-200 bg-surface/95 pb-safe backdrop-blur-md app:hidden"
    >
      {LEFT.map((i) => (
        <Tab key={i.view} item={i} />
      ))}

      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={() => openSheet('criar')}
          aria-label="Criar"
          className="-mt-5 flex h-13 w-13 items-center justify-center rounded-full bg-pine text-white shadow-lg transition active:scale-95"
          style={{ height: 52, width: 52 }}
        >
          <Icon name="plus" className="h-6 w-6" strokeWidth={2.2} />
        </button>
      </div>

      {RIGHT.map((i) => (
        <Tab key={i.view} item={i} />
      ))}
    </nav>
  )
}
