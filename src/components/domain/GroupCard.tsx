import { useStore } from '../../app/store'
import type { Group } from '../../data/types'
import { Icon } from '../ui/Icon'
import { Img } from '../ui/Img'

export function GroupCard({ group, compact = false }: { group: Group; compact?: boolean }) {
  const { go, toggleJoinGroup, toast } = useStore()

  return (
    <div className="card flex flex-col p-3 transition hover:shadow-md">
      <button
        type="button"
        onClick={() => go('group', group.id)}
        className="relative mb-3 block h-24 w-full overflow-hidden rounded-xl"
        aria-label={`Abrir grupo ${group.name}`}
      >
        <Img
          src={group.cover}
          alt={group.name}
          seed={group.id}
          className="h-full w-full bg-line-200 object-cover"
        />
        <span className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-ink-700">
          {group.privacy}
        </span>
      </button>

      <div className="mb-2 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => go('group', group.id)}
          className="truncate text-xs font-bold text-ink-900 hover:underline"
        >
          {group.name}
        </button>
        <button
          type="button"
          aria-label={`Compartilhar ${group.name}`}
          onClick={() => toast('Link do grupo copiado')}
          className="shrink-0 text-ink-500 transition hover:text-ink-900"
        >
          <Icon name="share" className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-1 text-[11px] font-medium text-ink-500">
        <div className="flex items-center gap-1.5">
          <Icon name="grid" className="h-3.5 w-3.5 text-ink-500" />
          <span>{group.topics} tópicos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="members" className="h-3.5 w-3.5 text-ink-500" />
          <span>{group.members} membros</span>
        </div>
      </div>

      {!compact && (
        <button
          type="button"
          onClick={() => toggleJoinGroup(group.id)}
          aria-pressed={group.joined}
          className={`mt-3 w-full rounded-full px-3 py-2 text-xs font-semibold transition active:scale-[.98] ${
            group.joined
              ? 'border border-line-300 bg-surface text-ink-700 hover:bg-line-100'
              : 'bg-pine text-white hover:bg-pine-soft'
          }`}
        >
          {group.joined ? 'Participando' : 'Participar'}
        </button>
      )}
    </div>
  )
}
