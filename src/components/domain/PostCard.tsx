import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../app/store'
import type { Post } from '../../data/types'
import { Icon } from '../ui/Icon'
import { Img } from '../ui/Img'
import { Avatar, Button, Tag, Textarea } from '../ui/primitives'

const QUICK_REACTIONS = ['💪', '🌱', '🔥', '🧘', '👏']

export function PostCard({ post, expanded = false }: { post: Post; expanded?: boolean }) {
  const {
    me,
    userOf,
    go,
    toggleLike,
    toggleSave,
    toggleReaction,
    addComment,
    loadPostComments,
    toggleFollow,
    isFollowing,
    updatePost,
    deletePost,
    toast,
  } = useStore()
  const author = userOf(post.authorId)
  const isOwner = post.authorId === me.id
  const [pickerOpen, setPickerOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState(post.text)
  const [draft, setDraft] = useState('')
  const optionsRef = useRef<HTMLDivElement>(null)

  // Comments load lazily — only once the card is expanded (post detail view).
  useEffect(() => {
    if (expanded) loadPostComments(post.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, post.id])

  // Close the options menu on any outside click.
  useEffect(() => {
    if (!optionsOpen) return
    const onDown = (e: MouseEvent) => {
      if (!optionsRef.current?.contains(e.target as Node)) setOptionsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [optionsOpen])

  const copyLink = async () => {
    const url = `${window.location.origin}/#post-${post.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copiado')
    } catch {
      toast('Não foi possível copiar o link')
    }
  }

  const share = async () => {
    const url = `${window.location.origin}/#post-${post.id}`
    try {
      if (navigator.share) await navigator.share({ title: 'Gooday', text: post.text, url })
      else await copyLink()
    } catch {
      // o usuário cancelou o share nativo — nada a fazer
    }
  }

  const startEdit = () => {
    setEditDraft(post.text)
    setEditing(true)
    setOptionsOpen(false)
  }

  const saveEdit = () => {
    if (!editDraft.trim()) return
    updatePost(post.id, editDraft)
    setEditing(false)
  }

  const confirmDelete = () => {
    setOptionsOpen(false)
    if (window.confirm('Excluir esta publicação? Essa ação não pode ser desfeita.')) {
      deletePost(post.id)
      if (expanded) go('home')
    }
  }

  return (
    <article className="card p-4 app:p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={author.avatar} alt={author.name} size={40} ring onClick={() => go('user', author.id)} />
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => go('user', author.id)}
              className="block truncate text-sm font-bold leading-tight text-ink-900 hover:underline"
            >
              @{author.handle}
            </button>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
              <Icon name="infinity" className="h-3.5 w-3.5" filled />
              <span>{post.createdAt}</span>
            </div>
          </div>
        </div>
        <div ref={optionsRef} className="relative shrink-0">
          <button
            type="button"
            aria-label="Mais opções"
            aria-expanded={optionsOpen}
            onClick={() => setOptionsOpen((v) => !v)}
            className="rounded-full p-1.5 text-ink-500 transition hover:bg-line-100 hover:text-ink-900"
          >
            <Icon name="dots" className="h-5 w-5" strokeWidth={2.6} />
          </button>

          {optionsOpen && (
            <div
              role="menu"
              className="anim-zoom absolute right-0 top-10 z-20 w-64 overflow-hidden rounded-2xl bg-surface p-2 shadow-lg ring-1 ring-line-200"
            >
              {isOwner ? (
                <>
                  <MenuItem icon="edit" label="Editar publicação" onClick={startEdit} />
                  <MenuItem icon="trash" label="Excluir publicação" tone="danger" onClick={confirmDelete} />
                </>
              ) : (
                <>
                  <MenuItem
                    icon="bookmark"
                    label={post.saved ? 'Remover dos salvos' : 'Salvar publicação'}
                    onClick={() => {
                      toggleSave(post.id)
                      setOptionsOpen(false)
                    }}
                  />
                  <MenuItem
                    icon="userPlus"
                    label={isFollowing(author.id) ? `Deixar de seguir @${author.handle}` : `Seguir @${author.handle}`}
                    onClick={() => {
                      toggleFollow(author.id)
                      setOptionsOpen(false)
                    }}
                  />
                  <MenuItem
                    icon="volumeOff"
                    label={`Silenciar @${author.handle}`}
                    onClick={() => {
                      toast('Silenciar autores ainda não está disponível')
                      setOptionsOpen(false)
                    }}
                  />
                  <MenuItem
                    icon="link"
                    label="Copiar link da publicação"
                    onClick={() => {
                      copyLink()
                      setOptionsOpen(false)
                    }}
                  />
                  <MenuItem
                    icon="alertTriangle"
                    label="Denunciar publicação"
                    tone="danger"
                    onClick={() => {
                      toast('Publicação denunciada. Nossa equipe vai revisar.')
                      setOptionsOpen(false)
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {editing ? (
        <div className="mb-3 flex flex-col gap-2">
          <Textarea
            autoFocus
            rows={4}
            maxLength={2000}
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={!editDraft.trim()}>
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-sm leading-relaxed text-ink-900">{post.text}</p>
      )}

      {post.tags.length > 0 && (
        <div className="mb-3.5 flex flex-wrap items-center gap-2">
          {post.tags.map((tag) => (
            <Tag key={tag}>#{tag}</Tag>
          ))}
        </div>
      )}

      {post.image && (
        <button
          type="button"
          onClick={() => !expanded && go('post', post.id)}
          className="mb-3.5 block w-full overflow-hidden rounded-2xl"
          aria-label="Abrir publicação"
        >
          <Img
            src={post.image}
            alt={post.text}
            seed={post.id}
            className="h-[240px] w-full bg-line-200 object-cover app:h-[320px]"
          />
        </button>
      )}

      {post.reactions.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {post.reactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              onClick={() => toggleReaction(post.id, r.emoji)}
              aria-pressed={r.mine}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                r.mine ? 'border-accent bg-accent/10 text-accent-strong' : 'border-accent/60 bg-surface text-ink-700 hover:bg-accent/5'
              }`}
            >
              <span>{r.emoji}</span>
              <span>{r.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative flex items-center justify-between pt-1 text-ink-700">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => toggleLike(post.id)}
            aria-pressed={post.liked}
            aria-label="Curtir"
            className={`flex items-center gap-1.5 text-xs font-medium transition ${
              post.liked ? 'text-danger' : 'hover:text-danger'
            }`}
          >
            <Icon name="heart" className="h-4 w-4" filled={post.liked} />
            <span>{post.likes}</span>
          </button>

          <button
            type="button"
            onClick={() => go('post', post.id)}
            aria-label="Comentários"
            className="flex items-center gap-1.5 text-xs font-medium transition hover:text-pine"
          >
            <Icon name="chat" className="h-4 w-4" />
            <span>{post.commentsCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            aria-label="Adicionar reação"
            aria-expanded={pickerOpen}
            className="text-ink-500 transition hover:text-warning"
          >
            <Icon name="smile" className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={share}
            aria-label="Compartilhar publicação"
            className="text-ink-500 transition hover:text-pine"
          >
            <Icon name="share" className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => toggleSave(post.id)}
          aria-pressed={post.saved}
          aria-label="Salvar post"
          className={`transition ${post.saved ? 'text-pine' : 'text-ink-500 hover:text-ink-900'}`}
        >
          <Icon name="bookmark" className="h-4 w-4" filled={post.saved} />
        </button>

        {pickerOpen && (
          <div className="anim-zoom absolute bottom-8 left-0 z-10 flex gap-1 rounded-full bg-surface px-2 py-1.5 shadow-lg ring-1 ring-line-200">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  toggleReaction(post.id, emoji)
                  setPickerOpen(false)
                }}
                className="rounded-full px-1.5 py-0.5 text-lg transition hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {expanded && (
        <section className="mt-5 border-t border-line-200 pt-4">
          <h3 className="mb-3 text-sm font-bold text-ink-900">
            Comentários ({post.commentsCount})
          </h3>

          <ul className="flex flex-col gap-3">
            {post.comments.map((c) => {
              const cAuthor = userOf(c.authorId)
              return (
                <li key={c.id} className="flex gap-3">
                  <Avatar src={cAuthor.avatar} alt={cAuthor.name} size={32} />
                  <div className="min-w-0 rounded-2xl bg-line-100 px-3.5 py-2">
                    <p className="text-[13px] font-bold text-ink-900">@{cAuthor.handle}</p>
                    <p className="text-sm text-ink-700">{c.text}</p>
                    <p className="mt-0.5 text-[11px] text-ink-500">{c.createdAt}</p>
                  </div>
                </li>
              )
            })}
            {post.commentsCount === 0 && post.comments.length === 0 && (
              <li className="text-sm text-ink-500">Ninguém comentou ainda. Comece a conversa.</li>
            )}
          </ul>

          <form
            className="mt-4 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!draft.trim()) return
              addComment(post.id, draft)
              setDraft('')
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escreva um comentário…"
              aria-label="Escreva um comentário"
              className="min-w-0 flex-1 rounded-full border border-line-200 bg-surface px-4 py-2.5 text-sm outline-none focus:border-pine focus:ring-2 focus:ring-pine/20"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Enviar comentário"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine text-white transition disabled:opacity-40"
            >
              <Icon name="send" className="h-4 w-4" filled />
            </button>
          </form>
        </section>
      )}
    </article>
  )
}

function MenuItem({
  icon,
  label,
  tone = 'default',
  onClick,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  label: string
  tone?: 'default' | 'danger'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-line-100 ${
        tone === 'danger' ? 'text-danger' : 'text-ink-900'
      }`}
    >
      <Icon name={icon} className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
      <span className="truncate">{label}</span>
    </button>
  )
}
