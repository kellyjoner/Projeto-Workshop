import { useEffect, useRef, useState } from 'react'
import { useStore, type StoryFormat } from '../../app/store'
import { INTERESTS, type Interest } from '../../data/types'
import { Sheet } from '../ui/Sheet'
import { Icon } from '../ui/Icon'
import { Button, Field, Input, Textarea } from '../ui/primitives'
import { Avatar } from '../ui/primitives'

/* -------------------------------------------------------------------------- */
/* Publicação                                                                 */
/* -------------------------------------------------------------------------- */

export function ComposePostSheet() {
  const { closeSheet, createPost, me, go } = useStore()
  const [text, setText] = useState('')
  const [tags, setTags] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const invalid = text.trim().length < 3
  const parsedTags = tags
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean)
    .slice(0, 5)

  const onFileChosen = (file: File | undefined) => {
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const submit = async () => {
    setTouched(true)
    if (invalid || busy) return
    setBusy(true)
    try {
      await createPost({ text, tags: parsedTags, imageFile: imageFile ?? undefined })
      closeSheet()
      go('home')
    } catch {
      // erro já mostrado via toast — mantém a folha aberta para o usuário tentar de novo
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      title="Nova publicação"
      onClose={closeSheet}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-500">{text.trim().length}/280</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={closeSheet} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={invalid || busy}>
              {busy ? 'Publicando…' : 'Publicar'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar src={me.avatar} alt={me.name} size={42} ring />
          <div>
            <p className="text-sm font-bold text-ink-900">{me.name}</p>
            <p className="text-xs text-ink-500">@{me.handle}</p>
          </div>
        </div>

        <Field
          label="O que você fez de bom hoje?"
          error={touched && invalid ? 'Escreva pelo menos 3 caracteres.' : undefined}
        >
          <Textarea
            autoFocus
            rows={5}
            maxLength={280}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Corrida leve de 5km antes do trabalho…"
          />
        </Field>

        <Field label="Hashtags" hint="Separe por espaço. Até 5.">
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="corrida rotina"
          />
        </Field>

        {parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {parsedTags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-accent/50 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent-strong"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <Field label="Foto" hint="Opcional. JPG, PNG, WEBP ou GIF — até 8MB.">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFileChosen(e.target.files?.[0])}
          />
          {preview ? (
            <div className="relative overflow-hidden rounded-2xl">
              <img src={preview} alt="Prévia da foto escolhida" className="h-48 w-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur"
                aria-label="Remover foto"
              >
                <Icon name="close" className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line-300 text-ink-500 transition hover:border-pine hover:text-pine"
            >
              <Icon name="photo" className="h-6 w-6" />
              <span className="text-xs font-semibold">Adicionar foto</span>
            </button>
          )}
        </Field>
      </div>
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */
/* Story                                                                      */
/* -------------------------------------------------------------------------- */

const FORMAT_COPY: Record<StoryFormat, { title: string; placeholder: string }> = {
  camera: { title: 'Novo story · Câmera', placeholder: 'Legenda para a foto de agora…' },
  galeria: { title: 'Novo story · Galeria', placeholder: 'Legenda para essa mídia…' },
  texto: { title: 'Novo story · Texto & Humor', placeholder: 'Solta o verbo — pensamento, frase ou reflexão do dia' },
  checkin: { title: 'Novo story · Check-in de Treino', placeholder: '5km, 28min, 2L de água…' },
}

export function ComposeStorySheet() {
  const { closeSheet, createStory, go, storyFormat, setStoryFormat } = useStore()
  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const needsMediaPicker = storyFormat === 'camera' || storyFormat === 'galeria'
  const copy = FORMAT_COPY[storyFormat ?? 'texto']
  const invalid = needsMediaPicker && !imageFile

  // Open the device's camera/gallery picker right away for those two formats.
  useEffect(() => {
    if (needsMediaPicker) fileInputRef.current?.click()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onFileChosen = (file: File | undefined) => {
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const close = () => {
    setStoryFormat(null)
    closeSheet()
  }

  const submit = async () => {
    setTouched(true)
    if (invalid || busy) return
    setBusy(true)
    try {
      await createStory({ caption, imageFile: imageFile ?? undefined })
      close()
      go('home')
    } catch {
      // erro já mostrado via toast — mantém a folha aberta para o usuário tentar de novo
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      title={copy.title}
      onClose={close}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="accent" onClick={submit} disabled={invalid || busy}>
            {busy ? 'Publicando…' : 'Publicar story'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <p className="rounded-2xl bg-lime-soft px-4 py-3 text-sm text-ink-700">
          Stories somem em 24 horas. Conte rapidinho como foi o seu dia.
        </p>

        {needsMediaPicker && (
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture={storyFormat === 'camera' ? 'environment' : undefined}
              className="hidden"
              onChange={(e) => onFileChosen(e.target.files?.[0])}
            />
            {preview ? (
              <div className="relative overflow-hidden rounded-2xl">
                <img src={preview} alt="Prévia da mídia escolhida" className="h-48 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-32 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line-300 text-ink-500 transition hover:border-pine hover:text-pine"
              >
                <Icon name={storyFormat === 'camera' ? 'camera' : 'photo'} className="h-6 w-6" />
                <span className="text-xs font-semibold">
                  {storyFormat === 'camera' ? 'Abrir câmera' : 'Escolher da galeria'}
                </span>
              </button>
            )}
            {touched && invalid && (
              <p className="text-xs font-medium text-danger">Escolha uma foto para publicar o story.</p>
            )}
          </div>
        )}

        <Field label="Legenda" hint="Opcional.">
          <Input
            autoFocus={!needsMediaPicker}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={80}
            placeholder={copy.placeholder}
          />
        </Field>
      </div>
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */
/* Criar grupo                                                                */
/* -------------------------------------------------------------------------- */

export function CreateGroupSheet() {
  const { closeSheet, createGroup, go } = useStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Interest>('Corrida')
  const [privacy, setPrivacy] = useState<'Público' | 'Privado'>('Público')
  const [touched, setTouched] = useState(false)

  const invalid = name.trim().length < 3

  const submit = () => {
    setTouched(true)
    if (invalid) return
    createGroup({ name, description, category, privacy })
    closeSheet()
    go('grupos')
  }

  return (
    <Sheet
      title="Criar grupo"
      onClose={closeSheet}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={closeSheet}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={invalid}>
            Criar grupo
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field
          label="Nome do grupo"
          error={touched && invalid ? 'Use pelo menos 3 caracteres.' : undefined}
        >
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Corrida no Ibirapuera"
          />
        </Field>

        <Field label="Descrição" hint="Explique em uma frase para quem é o grupo.">
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Encontros de sábado às 7h, no seu ritmo."
          />
        </Field>

        <Field label="Categoria">
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCategory(i)}
                aria-pressed={category === i}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  category === i ? 'bg-pine text-white' : 'bg-line-100 text-ink-700 hover:bg-line-200'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Privacidade">
          <div className="flex gap-2">
            {(['Público', 'Privado'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrivacy(p)}
                aria-pressed={privacy === p}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  privacy === p
                    ? 'border-pine bg-pine/5 text-pine'
                    : 'border-line-200 text-ink-700 hover:bg-line-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Sheet>
  )
}
