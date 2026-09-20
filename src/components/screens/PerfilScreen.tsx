import { useState } from 'react'
import { useStore } from '../../app/store'
import { Icon } from '../ui/Icon'
import { Img } from '../ui/Img'
import { Avatar, Button, EmptyState, Tag } from '../ui/primitives'
import { PostCard } from '../domain/PostCard'
import { GroupCard } from '../domain/GroupCard'
import { ScreenHeader } from '../layout/ScreenHeader'

type Tab = 'Publicações' | 'Salvos' | 'Grupos' | 'Sobre'

/** Serves both "Meu perfil" and any other user's profile. */
export function PerfilScreen({ userId }: { userId?: string }) {
  const { me, userOf, posts, groups, go, openSheet, isFollowing, toggleFollow, startConversationWith } = useStore()

  const user = userId ? userOf(userId) : me
  const isMe = user.id === me.id
  const [tab, setTab] = useState<Tab>('Publicações')

  const authored = posts.filter((p) => p.authorId === user.id)
  const saved = posts.filter((p) => p.saved)
  const joined = groups.filter((g) => g.joined)

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ScreenHeader title={isMe ? 'Meu perfil' : user.name} />

      <section className="card p-5 app:p-6">
        <div className="flex items-start gap-4">
          <Avatar src={user.avatar} alt={user.name} size={72} ring />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-lg font-bold text-ink-900">{user.name}</h2>
              {user.verified && <Icon name="check" className="h-4 w-4 shrink-0 text-pine" strokeWidth={3} />}
            </div>
            <p className="truncate text-sm text-ink-500">
              @{user.handle}
              {user.city ? ` · ${user.city}` : ''}
            </p>
            {user.bio && <p className="mt-2 text-sm leading-relaxed text-ink-700">{user.bio}</p>}
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-2 border-y border-line-200 py-4 text-center">
          {[
            ['seguidores', user.followers],
            ['seguindo', user.following],
            ['publicações', authored.length],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="sr-only">{label as string}</dt>
              <dd>
                <span className="block text-lg font-bold text-ink-900">{value as number}</span>
                <span className="text-xs text-ink-500">{label as string}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          {isMe ? (
            <>
              <Button variant="outline" onClick={() => openSheet('editar-perfil')}>
                <Icon name="edit" className="h-4 w-4" />
                Editar perfil
              </Button>
              <Button variant="outline" onClick={() => go('grupos')}>
                <Icon name="users" className="h-4 w-4" />
                Meus grupos
              </Button>
              <Button variant="ghost" onClick={() => go('configuracoes')}>
                <Icon name="settings" className="h-4 w-4" />
                Configurações
              </Button>
            </>
          ) : (
            <>
              <Button
                variant={isFollowing(user.id) ? 'outline' : 'primary'}
                onClick={() => toggleFollow(user.id)}
              >
                {isFollowing(user.id) ? 'Seguindo' : 'Seguir'}
              </Button>
              <Button variant="outline" onClick={() => startConversationWith(user.id)}>
                <Icon name="chat" className="h-4 w-4" />
                Mensagem
              </Button>
            </>
          )}
        </div>

        {user.interests.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {user.interests.map((i) => (
              <Tag key={i}>{i}</Tag>
            ))}
          </div>
        )}
      </section>

      <div className="no-scrollbar mb-4 mt-5 flex gap-5 overflow-x-auto border-b border-line-200 text-sm font-semibold">
        {(['Publicações', 'Salvos', 'Grupos', 'Sobre'] as Tab[])
          .filter((t) => isMe || t !== 'Salvos')
          .map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`-mb-px shrink-0 border-b-2 pb-2 transition ${
                tab === t ? 'border-pine text-pine' : 'border-transparent text-ink-500 hover:text-ink-700'
              }`}
            >
              {t}
            </button>
          ))}
      </div>

      {tab === 'Publicações' &&
        (authored.length === 0 ? (
          <EmptyState title="Nada publicado ainda" description="Compartilhe seu primeiro bom dia." />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {authored
                .filter((p) => p.image)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => go('post', p.id)}
                    className="relative aspect-square overflow-hidden rounded-xl"
                    aria-label={`Abrir publicação: ${p.text}`}
                  >
                    <Img
                      src={p.image!}
                      alt={p.text}
                      seed={p.id}
                      className="h-full w-full bg-line-200 object-cover transition hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 text-[11px] font-semibold text-white">
                      <span className="flex items-center gap-1">
                        <Icon name="heart" className="h-3 w-3" filled /> {p.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="chat" className="h-3 w-3" /> {p.commentsCount}
                      </span>
                    </span>
                  </button>
                ))}
            </div>
            <div className="flex flex-col gap-5">
              {authored.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </>
        ))}

      {tab === 'Salvos' &&
        (saved.length === 0 ? (
          <EmptyState title="Nenhum salvo" description="Toque no marcador de um post para guardá-lo aqui." />
        ) : (
          <div className="flex flex-col gap-5">
            {saved.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        ))}

      {tab === 'Grupos' &&
        (joined.length === 0 ? (
          <EmptyState title="Sem grupos ainda" description="Participe de um grupo para vê-lo aqui." />
        ) : (
          <div className="grid grid-cols-2 gap-3.5 app:grid-cols-3">
            {joined.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        ))}

      {tab === 'Sobre' && (
        <div className="card flex flex-col gap-3 p-5 text-sm">
          <Row label="Nome" value={user.name} />
          <Row label="Usuário" value={`@${user.handle}`} />
          <Row label="Cidade" value={user.city ?? '—'} />
          <Row label="Interesses" value={user.interests.join(', ')} />
          <Row label="Bio" value={user.bio ?? '—'} />
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line-200 pb-3 last:border-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</span>
      <span className="text-ink-900">{value}</span>
    </div>
  )
}
