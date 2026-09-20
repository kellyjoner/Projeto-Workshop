import type { ReactNode } from 'react'
import { useStore } from '../../app/store'
import { Icon } from '../ui/Icon'

/** Title row with a back affordance, used by every non-primary view. */
export function ScreenHeader({
  title,
  subtitle,
  action,
  onBack,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  onBack?: () => void
}) {
  const { back, canGoBack } = useStore()
  const handleBack = onBack ?? back
  const showBack = Boolean(onBack) || canGoBack

  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Voltar"
            className="mt-0.5 shrink-0 rounded-lg p-1 text-ink-900 transition hover:bg-line-100"
          >
            <Icon name="chevronLeft" className="h-5 w-5" strokeWidth={2.4} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-ink-900 app:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
