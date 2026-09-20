import { useMemo, useState } from 'react'
import { useStore } from '../../app/store'
import { INTERESTS, type Interest } from '../../data/types'
import { GroupCard } from '../domain/GroupCard'
import { Icon } from '../ui/Icon'
import { Button, EmptyState } from '../ui/primitives'
import { ScreenHeader } from '../layout/ScreenHeader'

type Status = 'Todos' | 'Participando' | 'Sugeridos'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function GruposScreen() {
  const { groups, openSheet } = useStore()
  const [status, setStatus] = useState<Status>('Todos')
  const [category, setCategory] = useState<Interest | null>(null)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const visible = useMemo(() => {
    const q = norm(query.trim())
    return groups
      .filter((g) =>
        status === 'Participando' ? g.joined : status === 'Sugeridos' ? !g.joined : true,
      )
      .filter((g) => (category ? g.category === category : true))
      .filter((g) => (q ? norm(`${g.name} ${g.description} ${g.category}`).includes(q) : true))
  }, [groups, status, category, query])

  return (
    <div className="mx-auto w-full max-w-4xl">
      <ScreenHeader
        title="Meus grupos"
        subtitle="Comunidades que você participa e acompanha."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Buscar grupos"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
              className={`rounded-full p-2 transition hover:bg-line-100 ${searchOpen ? 'text-pine' : 'text-ink-500'}`}
            >
              <Icon name="search" className="h-5 w-5" strokeWidth={2.2} />
            </button>
            <Button onClick={() => openSheet('criar-grupo')}>
              <Icon name="plus" className="h-4 w-4" />
              <span className="hidden app:inline">Criar grupo</span>
            </Button>
          </div>
        }
      />

      {searchOpen && (
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          aria-label="Buscar grupos"
          placeholder="Buscar por nome ou tema…"
          className="anim-fade mb-4 w-full rounded-full bg-surface px-5 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-pine"
        />
      )}

      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
        {(['Todos', 'Participando', 'Sugeridos'] as Status[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              status === s ? 'bg-ink-900 text-white' : 'bg-surface text-ink-700 shadow-sm hover:bg-line-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {INTERESTS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory((prev) => (prev === c ? null : c))}
            aria-pressed={category === c}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              category === c
                ? 'border-accent bg-accent text-white'
                : 'border-accent/40 bg-accent/5 text-accent-strong hover:bg-accent/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Nenhum grupo por aqui"
          description="Ajuste os filtros ou crie um grupo novo para reunir gente com a mesma rotina."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3.5 app:grid-cols-3 lg:grid-cols-4">
          {visible.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}

      <div className="card mt-6 flex flex-col items-start gap-3 p-6 app:flex-row app:items-center app:justify-between">
        <div>
          <p className="text-base font-bold text-ink-900">Criar Grupo</p>
          <p className="text-sm text-ink-500">
            Conecte pessoas apaixonadas pela mesma rotina saudável.
          </p>
        </div>
        <Button variant="accent" onClick={() => openSheet('criar-grupo')}>
          Começar agora
        </Button>
      </div>
    </div>
  )
}
