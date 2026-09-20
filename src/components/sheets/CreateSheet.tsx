import { useStore, type SheetName } from '../../app/store'
import { Icon, type IconName } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'

const OPTIONS: { target: SheetName; icon: IconName; title: string; description: string }[] = [
  {
    target: 'compose-post',
    icon: 'camera',
    title: 'Publicação',
    description: 'Compartilhe fotos ou texto no feed',
  },
  {
    target: 'compose-story',
    icon: 'plus',
    title: 'Story',
    description: 'Desaparece em 24 horas',
  },
  {
    target: 'criar-grupo',
    icon: 'users',
    title: 'Grupo',
    description: 'Reúna gente com a mesma rotina',
  },
]

export function CreateSheet() {
  const { closeSheet, openSheet } = useStore()

  return (
    <Sheet title="Criar" onClose={closeSheet}>
      <div className="flex flex-col gap-4 pb-2">
        {OPTIONS.map((o) => (
          <button
            key={o.target}
            type="button"
            onClick={() => openSheet(o.target)}
            className="group flex w-full items-center gap-5 rounded-[22px] border border-line-200 bg-surface p-5 text-left transition hover:border-line-300 hover:bg-line-100/60 active:scale-[.99]"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-lime-soft text-lime transition group-hover:scale-105">
              <Icon name={o.icon} className="h-6 w-6" strokeWidth={1.9} />
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-bold leading-snug text-ink-900">{o.title}</span>
              <span className="text-[15px] text-ink-500">{o.description}</span>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
