import { useState } from 'react'
import { useStore } from '../../app/store'
import { GroupCard } from '../domain/GroupCard'
import { PostCard } from '../domain/PostCard'
import { Icon } from '../ui/Icon'
import { Avatar } from '../ui/primitives'

export function HomeScreen() {
  const { posts, groups, users, me, go, isFollowing, toggleFollow, toast } = useStore()
  const [tab, setTab] = useState<'grupos' | 'pessoas'>('grupos')
  const [filterJoined, setFilterJoined] = useState(false)

  const suggestions = users.filter((u) => u.id !== me.id).slice(0, 6)
  const visibleGroups = (filterJoined ? groups.filter((g) => g.joined) : groups).slice(0, 6)

  return (
    <div className="grid grid-cols-12 items-start gap-5 app:gap-7">
      {/* Feed */}
      <section aria-label="Feed principal" className="col-span-12 flex flex-col gap-5 lg:col-span-5">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>

      {/* Groups / people rail */}
      <aside aria-label="Comunidades e pessoas" className="col-span-12 lg:col-span-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm font-semibold">
            {(['grupos', 'pessoas'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`pb-0.5 capitalize transition ${
                  tab === t
                    ? 'border-b-2 border-ink-900 text-ink-900'
                    : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-ink-500">
            <button
              type="button"
              aria-label="Pesquisar nos grupos"
              onClick={() => go('buscar')}
              className="transition hover:text-ink-900"
            >
              <Icon name="search" className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label="Filtrar grupos"
              aria-pressed={filterJoined}
              onClick={() => {
                setFilterJoined((v) => !v)
                toast(filterJoined ? 'Mostrando todos os grupos' : 'Mostrando só os que você participa')
              }}
              className={`transition hover:text-ink-900 ${filterJoined ? 'text-pine' : ''}`}
            >
              <Icon name="filter" className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {tab === 'grupos' ? (
          <div className="grid grid-cols-2 gap-3.5">
            {visibleGroups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
            {visibleGroups.length === 0 && (
              <p className="col-span-2 rounded-2xl bg-surface p-6 text-center text-sm text-ink-500">
                Você ainda não participa de nenhum grupo.
              </p>
            )}
          </div>
        ) : (
          <ul className="card divide-y divide-line-200 p-2">
            {suggestions.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-2 py-3">
                <Avatar src={u.avatar} alt={u.name} size={44} onClick={() => go('user', u.id)} />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => go('user', u.id)}
                    className="block truncate text-sm font-bold text-ink-900 hover:underline"
                  >
                    {u.name}
                  </button>
                  <p className="truncate text-xs text-ink-500">
                    @{u.handle} · {u.interests.slice(0, 2).join(', ')}
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
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}
