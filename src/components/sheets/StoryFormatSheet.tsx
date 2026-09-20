import { useStore, type StoryFormat } from '../../app/store'
import { Icon, type IconName } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'

const FORMATS: {
  id: StoryFormat
  icon: IconName
  title: string
  description: string
  tone: string
}[] = [
  {
    id: 'camera',
    icon: 'camera',
    title: 'Câmera instantânea',
    description: 'Tirar foto ou gravar o momento agora',
    tone: 'bg-accent/10 text-accent-strong',
  },
  {
    id: 'galeria',
    icon: 'photo',
    title: 'Galeria / Enviar mídia',
    description: 'Fotos ou vídeos do seu aparelho',
    tone: 'bg-success/10 text-success',
  },
  {
    id: 'texto',
    icon: 'textLines',
    title: 'Texto & Humor',
    description: 'Pensamento, frase ou reflexão do dia',
    tone: 'bg-lime-soft text-lime',
  },
  {
    id: 'checkin',
    icon: 'bolt',
    title: 'Check-in de Treino',
    description: 'Atividade física, km ou hidratação',
    tone: 'bg-pine/10 text-pine',
  },
]

/**
 * Shown right after "Criar → Story": lets the user pick the story format
 * before landing in the caption composer (ComposeStorySheet), which reads
 * `storyFormat` from the store to tailor its copy.
 */
export function StoryFormatSheet() {
  const { closeSheet, openSheet, setStoryFormat } = useStore()

  const pick = (id: StoryFormat) => {
    setStoryFormat(id)
    openSheet('compose-story')
  }

  return (
    <Sheet title="Criar" onClose={closeSheet}>
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-strong">
            <Icon name="plus" className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-ink-900">Story</h3>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">
                Ativo
              </span>
            </div>
            <p className="text-xs text-ink-500">Desaparece em 24 horas • Escolha o formato</p>
          </div>
        </div>

        <div className="border-t border-line-200" />

        <div className="grid grid-cols-1 gap-3 app:grid-cols-2">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => pick(f.id)}
              className="flex flex-col items-start gap-2.5 rounded-2xl border border-line-200 bg-surface p-4 text-left transition hover:border-line-300 hover:bg-line-100/60 active:scale-[.99]"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${f.tone}`}>
                <Icon name={f.icon} className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-bold leading-snug text-ink-900">{f.title}</span>
                <span className="text-xs text-ink-500">{f.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
