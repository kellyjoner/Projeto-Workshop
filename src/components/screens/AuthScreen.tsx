import { useMemo, useState } from 'react'
import { useStore } from '../../app/store'
import { INTERESTS, type Interest } from '../../data/types'
import { photo } from '../../data/images'
import { Img } from '../ui/Img'
import { Button, Field, Input } from '../ui/primitives'

function strength(pw: string): { label: string; tone: string; pct: number } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^\w\s]/.test(pw)) score++
  if (pw.length === 0) return { label: '', tone: 'bg-line-300', pct: 0 }
  if (score <= 1) return { label: 'Segurança baixa', tone: 'bg-danger', pct: 33 }
  if (score <= 3) return { label: 'Segurança média', tone: 'bg-warning', pct: 66 }
  return { label: 'Segurança alta', tone: 'bg-success', pct: 100 }
}

/** Split hero + form, as in the `gooday_cadastro_desktop` export. Login reuses it. */
export function AuthScreen({ mode }: { mode: 'login' | 'cadastro' }) {
  const { signIn, showAuth } = useStore()
  const isSignup = mode === 'cadastro'

  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [interests, setInterests] = useState<Interest[]>(['Corrida'])
  const [terms, setTerms] = useState(false)
  const [touched, setTouched] = useState(false)

  const pw = useMemo(() => strength(password), [password])

  const errors = {
    name: isSignup && name.trim().length < 3 ? 'Informe seu nome completo.' : '',
    handle: isSignup && handle.trim().length < 3 ? 'Escolha um nome de usuário.' : '',
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? 'E-mail inválido.' : '',
    password: password.length < 8 ? 'Mínimo de 8 caracteres.' : '',
    terms: isSignup && !terms ? 'Você precisa aceitar os termos.' : '',
  }
  const invalid = Object.values(errors).some(Boolean)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (invalid) return
    signIn()
  }

  const toggleInterest = (i: Interest) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))

  return (
    <div className="flex min-h-dvh w-full flex-col lg:flex-row">
      {/* Hero */}
      <div className="relative flex min-h-[220px] flex-1 items-end overflow-hidden lg:min-h-dvh">
        <Img
          src={photo('run', 1, 1400)}
          alt="Pessoa correndo ao amanhecer"
          seed="auth-hero"
          className="absolute inset-0 h-full w-full bg-pine object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pine/90 via-pine/45 to-pine/20" />
        <div className="relative w-full px-8 py-8 text-white lg:px-14 lg:py-14">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-pine">
              g
            </span>
            <span className="text-lg font-extrabold tracking-tight">Gooday Social</span>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {['Rotina', 'Ativa', 'Bem-estar'].map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="max-w-md text-lg font-semibold leading-snug lg:text-2xl">
            Compartilhe conquistas, hábitos e a sua energia real com quem busca viver bem todos os dias.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center bg-app-bg px-4 py-10 lg:px-10">
        <form onSubmit={submit} noValidate className="card w-full max-w-[460px] p-6 app:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {isSignup ? 'Crie sua conta. Comece seu bom dia.' : 'Bom te ver de novo.'}
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            {isSignup
              ? 'Conecte-se com pessoas no mesmo ritmo e compartilhe sua rotina real.'
              : 'Entre para continuar sua rotina no Gooday.'}
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {isSignup && (
              <>
                <Field label="Nome completo" error={touched ? errors.name : undefined}>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Marcos Vinícius"
                  />
                </Field>

                <Field label="Nome de usuário" error={touched ? errors.handle : undefined}>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-500">
                      @
                    </span>
                    <Input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.replace(/\s/g, '').toLowerCase())}
                      className="pl-8"
                      placeholder="marcos_v"
                    />
                  </div>
                </Field>
              </>
            )}

            <Field label="Email" error={touched ? errors.email : undefined}>
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </Field>

            <Field label="Senha" error={touched ? errors.password : undefined}>
              <Input
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {isSignup && password.length > 0 && (
              <div className="-mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-200">
                  <div
                    className={`h-full rounded-full transition-all ${pw.tone}`}
                    style={{ width: `${pw.pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-ink-500">{pw.label}</p>
              </div>
            )}

            {isSignup && (
              <>
                <div>
                  <p className="mb-2 text-[13px] font-semibold text-ink-700">Interesses principais:</p>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleInterest(i)}
                        aria-pressed={interests.includes(i)}
                        className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                          interests.includes(i)
                            ? 'border-accent bg-accent text-white'
                            : 'border-accent/40 bg-accent/5 text-accent-strong hover:bg-accent/10'
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-300 accent-[#004E44]"
                  />
                  <span>
                    Concordo com os <span className="font-semibold text-pine">Termos de Uso</span> e{' '}
                    <span className="font-semibold text-pine">Política de Privacidade</span> do Gooday.
                  </span>
                </label>
                {touched && errors.terms && (
                  <p className="-mt-2 text-xs font-medium text-danger">{errors.terms}</p>
                )}
              </>
            )}

            <Button type="submit" full disabled={touched && invalid}>
              {isSignup ? 'Cadastrar no Gooday' : 'Entrar'}
            </Button>

            <p className="text-center text-sm text-ink-500">
              {isSignup ? 'Já tem uma conta? ' : 'Ainda não tem conta? '}
              <button
                type="button"
                onClick={() => showAuth(isSignup ? 'login' : 'cadastro')}
                className="font-semibold text-pine hover:underline"
              >
                {isSignup ? 'Entrar' : 'Cadastrar'}
              </button>
            </p>

            <p className="text-center text-xs text-ink-500">
              Respeite sua mente e trate seu corpo bem.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
