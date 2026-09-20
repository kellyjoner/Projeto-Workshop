import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { Img } from './Img'
import { useStore } from '../../app/store'

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

type Variant = 'primary' | 'accent' | 'ghost' | 'outline' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-pine text-white hover:bg-pine-soft shadow-sm',
  accent: 'bg-accent text-white hover:bg-accent-strong shadow-sm',
  ghost: 'text-ink-700 hover:bg-line-100',
  outline: 'border border-line-300 text-ink-900 bg-surface hover:bg-line-100',
  danger: 'text-danger hover:bg-danger/8',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  full?: boolean
}

export function Button({ variant = 'primary', full, className = '', ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition
        active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100
        ${VARIANTS[variant]} ${full ? 'w-full' : ''} ${className}`}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Fields                                                                     */
/* -------------------------------------------------------------------------- */

const FIELD =
  'w-full rounded-2xl border border-line-200 bg-surface px-4 py-3 text-sm text-ink-900 placeholder:text-ink-500 transition focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/20'

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink-700">{label}</span>
      {children}
      {error ? (
        <span className="text-xs font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-500">{hint}</span>
      ) : null}
    </label>
  )
}

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`${FIELD} ${className}`} />
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`${FIELD} resize-none ${className}`} />
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                     */
/* -------------------------------------------------------------------------- */

export function Avatar({
  src,
  alt,
  size = 40,
  ring = false,
  online = false,
  onClick,
}: {
  src: string
  alt: string
  size?: number
  ring?: boolean
  online?: boolean
  onClick?: () => void
}) {
  const img = (
    <Img
      src={src}
      alt={alt}
      seed={alt}
      style={{ width: size, height: size }}
      className="rounded-full object-cover bg-line-200"
    />
  )

  const body = ring ? (
    <span className="inline-block rounded-full bg-gradient-to-tr from-accent to-accent-strong p-[2px]">
      <span className="block rounded-full border-2 border-white">{img}</span>
    </span>
  ) : (
    img
  )

  const content = (
    <span className="relative inline-flex shrink-0">
      {body}
      {online && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-success" />
      )}
    </span>
  )

  if (!onClick) return content
  return (
    <button type="button" onClick={onClick} aria-label={alt} className="shrink-0 rounded-full">
      {content}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Tag / pill                                                                 */
/* -------------------------------------------------------------------------- */

export function Tag({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  const base =
    'rounded-full border px-3 py-1 text-xs font-semibold transition whitespace-nowrap active:scale-[.97]'
  const style = active
    ? 'border-accent bg-accent text-white'
    : 'border-accent/50 bg-accent/5 text-accent-strong hover:bg-accent/10'
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} ${style}`}>
      {children}
    </button>
  ) : (
    <span className={`${base} ${style}`}>{children}</span>
  )
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="text-base font-bold text-ink-900">{title}</p>
      <p className="max-w-xs text-sm text-ink-500">{description}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Toasts                                                                     */
/* -------------------------------------------------------------------------- */

export function ToastHost() {
  const { toasts } = useStore()
  if (toasts.length === 0) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 app:bottom-8"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="anim-slide-up max-w-[90vw] rounded-full bg-ink-900/92 px-5 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur"
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
