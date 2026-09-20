import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../../app/store'
import { SEARCH_SUGGESTIONS } from '../../data/types'
import { GroupCard } from '../domain/GroupCard'
import { Icon } from '../ui/Icon'
import { Avatar, EmptyState } from '../ui/primitives'

type Scope = 'pessoas' | 'grupos' | 'posts'

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function BuscarScreen() {
  const { users, groups, posts, me, go, isFollowing, toggleFollow, userOf } = useStore()
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Scope>('pessoas')

  // The header search box forwards its submitted term here.
  useEffect(() => {
    const handler = (e: Event) => setQuery((e as CustomEvent<string>).detail ?? '')
    window.addEventListener('gooday:search', handler)
    return () => window.removeEventListener('gooday:search', handler)
  }, [])

  const q = norm(query.trim())

  const people = useMemo(
    () =>
      users
        .filter((u) => u.id !== me.id)
        .filter((u) => !q || norm(`${u.name} ${u.handle} ${u.interests.join(' ')} ${u.city ?? ''}`).includes(q)),
    [users, me.id, q],
  )

  const foundGroups = useMemo(
    () => groups.filter((g) => !q || norm(`${g.name} ${g.category} ${g.description}`).includes(q)),
    [groups, q],
  )

  const foundPosts = useMemo(
    () => posts.filter((p) => !q || norm(`${p.text} ${p.tags.join(' ')}`).includes(q)),
    [posts, q],
  )

  const counts: Record<Scope, number> = {
    pessoas: people.length,
    grupos: foundGroups.length,
    posts: foundPosts.length,
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-ink-900">Buscar</h1>

      <div className="relative mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          autoComplete="off"
          aria-label="Buscar pessoas, grupos e publicações"
          placeholder="Pessoas, grupos, hashtags…"
          className="w-full rounded-full bg-surface py-3 pl-5 pr-12 text-sm shadow-sm outline-none transition placeholder:text-ink-500 focus:ring-2 focus:ring-pine"
        />
        <Icon
          name="search"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
          strokeWidth={2.2}
        />
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {SEARCH_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQuery(s)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              norm(query) === norm(s)
                ? 'bg-pine text-white'
                : 'bg-surface text-ink-700 shadow-sm hover:bg-line-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-5 border-b border-line-200 text-sm font-semibold">
        {(['pessoas', 'grupos', 'posts'] as Scope[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            aria-pressed={scope === s}
            className={`-mb-px border-b-2 pb-2 capitalize transition ${
              scope === s ? 'border-pine text-pine' : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            {s} <span className="text-xs font-normal">({counts[s]})</span>
          </button>
        ))}
      </div>

      {scope === 'pessoas' &&
        (people.length === 0 ? (
          <EmptyState title="Ninguém por aqui" description={`Nenhuma pessoa encontrada para “${query}”.`} />
        ) : (
          <>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-500">Pessoas</p>
            <ul className="card divide-y divide-line-200 p-2">
              {people.map((u) => {
                const shared = u.interests.filter((i) => me.interests.includes(i)).length
                return (
                  <li key={u.id} className="flex items-center gap-3 px-2 py-3">
                    <Avatar src={u.avatar} alt={u.name} size={46} onClick={() => go('user', u.id)} />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => go('user', u.id)}
                        className="block truncate text-sm font-bold text-ink-900 hover:underline"
                      >
                        {u.name}
                      </button>
                      <p className="truncate text-xs text-ink-500">
                        @{u.handle} · {shared} interesse{shared === 1 ? '' : 's'} em comum
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFollow(u.id)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition active:scale-95 ${
                        isFollowing(u.id)
                          ? 'border border-line-300 bg-surface text-ink-700 hover:bg-line-100'
                          : 'bg-pine text-white hover:bg-pine-soft'
                      }`}
                    >
                      {isFollowing(u.id) ? 'Seguindo' : 'Seguir'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        ))}

      {scope === 'grupos' &&
        (foundGroups.length === 0 ? (
          <EmptyState title="Nenhum grupo" description={`Nada encontrado para “${query}”.`} />
        ) : (
          <div className="grid grid-cols-2 gap-3.5 app:grid-cols-3">
            {foundGroups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        ))}

      {scope === 'posts' &&
        (foundPosts.length === 0 ? (
          <EmptyState title="Nenhuma publicação" description={`Nada encontrado para “${query}”.`} />
        ) : (
          <ul className="flex flex-col gap-2">
            {foundPosts.map((p) => {
              const author = userOf(p.authorId)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => go('post', p.id)}
                    className="card flex w-full items-center gap-3 p-3 text-left transition hover:shadow-md"
                  >
                    <Avatar src={author.avatar} alt={author.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{p.text}</p>
                      <p className="truncate text-xs text-ink-500">
                        @{author.handle} · {p.tags.map((t) => `#${t}`).join(' ')}
                      </p>
                    </div>
                    <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-ink-500" />
                  </button>
                </li>
              )
            })}
          </ul>
        ))}
    </div>
  )
}
