import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * One overlay primitive for every modal in the app:
 * bottom sheet under the `app` breakpoint, centred dialog above it.
 * Backdrop click and the close button both dismiss; Escape is handled globally.
 */
export function Sheet({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panel.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center app:items-center app:p-6">
      <div
        className="anim-fade absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`anim-slide-up relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[32px] bg-surface
          shadow-2xl outline-none app:anim-zoom app:rounded-[32px] ${wide ? 'app:max-w-[720px]' : 'app:max-w-[540px]'}`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 px-6 pb-4 pt-6 app:px-8 app:pt-8">
          <h2 className="text-xl font-bold tracking-tight text-ink-900 app:text-2xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-line-100 text-ink-500 transition hover:bg-line-200 hover:text-ink-900 active:scale-95"
          >
            <Icon name="close" className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 app:px-8">{children}</div>

        {footer && (
          <footer className="shrink-0 border-t border-line-200 bg-surface px-6 py-4 pb-safe app:px-8">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
