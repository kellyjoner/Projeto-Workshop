import { useStore } from '../../app/store'
import { Icon } from '../ui/Icon'
import { Img } from '../ui/Img'
import { Button, EmptyState, Tag } from '../ui/primitives'
import { PostCard } from '../domain/PostCard'
import { ScreenHeader } from '../layout/ScreenHeader'

export function GroupDetailScreen({ groupId }: { groupId?: string }) {
  const { groups, posts, toggleJoinGroup, openSheet, toast } = useStore()
  const group = groups.find((g) => g.id === groupId)

  if (!group) {
    return <EmptyState title="Grupo não encontrado" description="Ele pode ter sido removido." />
  }

  const related = posts.filter((p) => p.tags.some((t) => group.category.toLowerCase().startsWith(t.slice(0, 4))))

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ScreenHeader title={group.name} subtitle={`${group.privacy} · ${group.members} membros`} />

      <div className="card overflow-hidden">
        <Img
          src={group.cover}
          alt={group.name}
          seed={group.id}
          className="h-44 w-full bg-line-200 object-cover app:h-56"
        />
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Tag>{group.category}</Tag>
            <span className="rounded-full bg-line-100 px-3 py-1 text-xs font-semibold text-ink-700">
              {group.topics} tópicos
            </span>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-ink-700">{group.description}</p>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={group.joined ? 'outline' : 'primary'}
              onClick={() => toggleJoinGroup(group.id)}
            >
              {group.joined ? 'Participando' : 'Participar'}
            </Button>
            <Button variant="outline" onClick={() => openSheet('compose-post')}>
              <Icon name="edit" className="h-4 w-4" />
              Publicar no grupo
            </Button>
            <Button variant="ghost" onClick={() => toast('Link do grupo copiado')}>
              <Icon name="share" className="h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>

      <h2 className="mb-3 mt-6 text-base font-bold text-ink-900">Publicações do grupo</h2>
      {related.length === 0 ? (
        <EmptyState
          title="Ainda sem publicações"
          description="Seja a primeira pessoa a compartilhar algo por aqui."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {related.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}
