import { useState } from 'react'
import { useStore } from '../../app/store'
import { Icon, type IconName } from '../ui/Icon'
import { Avatar } from '../ui/primitives'
import { ScreenHeader } from '../layout/ScreenHeader'

export function ConfiguracoesScreen() {
  const { me, email, openSheet, signOut, toast, go } = useStore()
  const [prefs, setPrefs] = useState({ push: true, email: false, privateProfile: false })

  const toggle = (key: keyof typeof prefs, label: string) => {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] }
      toast(`${label}: ${next[key] ? 'ativado' : 'desativado'}`)
      return next
    })
  }

  return (
    <div className="mx-auto w-full max-w-[660px]">
      <ScreenHeader title="Configurações" onBack={() => go('perfil')} />

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => openSheet('editar-perfil')}
          className="card flex items-center gap-4 p-5 text-left transition hover:shadow-md app:p-6"
        >
          <Avatar src={me.avatar} alt={me.name} size={66} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-ink-900">{me.name}</h2>
            <span className="text-sm text-ink-500">@{me.handle}</span>
          </div>
          <Icon name="chevronRight" className="h-5 w-5 shrink-0 text-ink-500" strokeWidth={2.2} />
        </button>

        <section className="card overflow-hidden p-0">
          <RowLink
            icon="mail"
            label="Alterar e-mail"
            value={email}
            onClick={() => openSheet('alterar-email')}
          />
          <Divider />
          <RowLink
            icon="lock"
            label="Alterar senha"
            value="•••••••••"
            onClick={() => openSheet('alterar-senha')}
          />
        </section>

        <section className="card overflow-hidden p-0">
          <RowToggle
            label="Notificações push"
            hint="Curtidas, comentários e convites de grupo"
            checked={prefs.push}
            onChange={() => toggle('push', 'Notificações push')}
          />
          <Divider />
          <RowToggle
            label="Resumo por e-mail"
            hint="Um resumo semanal da sua rotina"
            checked={prefs.email}
            onChange={() => toggle('email', 'Resumo por e-mail')}
          />
          <Divider />
          <RowToggle
            label="Perfil privado"
            hint="Só quem você aprova vê suas publicações"
            checked={prefs.privateProfile}
            onChange={() => toggle('privateProfile', 'Perfil privado')}
          />
        </section>

        <section className="card overflow-hidden p-0">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 px-6 py-5 text-left text-base font-medium text-danger transition hover:bg-danger/5"
          >
            <Icon name="logout" className="h-5 w-5" />
            Sair da conta
          </button>
        </section>

        <p className="px-2 pb-4 text-center text-xs text-ink-500">Gooday · versão MVP 0.1</p>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="mx-6 border-b border-line-200" />
}

function RowLink({
  icon,
  label,
  value,
  onClick,
}: {
  icon: IconName
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-line-100/60"
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon name={icon} className="h-5 w-5 shrink-0 text-ink-500" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-base font-semibold text-ink-900">{label}</span>
          <span className="truncate text-sm text-ink-500">{value}</span>
        </span>
      </span>
      <Icon
        name="chevronRight"
        className="h-5 w-5 shrink-0 text-ink-500 transition group-hover:text-ink-900"
        strokeWidth={2.2}
      />
    </button>
  )
}

function RowToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-5">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-semibold text-ink-900">{label}</span>
        <span className="text-sm text-ink-500">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-pine' : 'bg-line-300'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}
