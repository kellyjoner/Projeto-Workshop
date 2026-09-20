import { useState } from 'react'
import { useStore } from '../../app/store'
import { Sheet } from '../ui/Sheet'
import { Avatar, Button, Field, Input, Textarea } from '../ui/primitives'

export function EditProfileSheet() {
  const { me, closeSheet, updateProfile } = useStore()
  const [name, setName] = useState(me.name)
  const [bio, setBio] = useState(me.bio ?? '')
  const [city, setCity] = useState(me.city ?? '')
  const [touched, setTouched] = useState(false)

  const invalid = name.trim().length < 2

  const submit = () => {
    setTouched(true)
    if (invalid) return
    updateProfile({ name: name.trim(), bio: bio.trim(), city: city.trim() })
    closeSheet()
  }

  return (
    <Sheet
      title="Editar perfil"
      onClose={closeSheet}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={closeSheet}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={invalid}>
            Salvar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-center gap-4">
          <Avatar src={me.avatar} alt={me.name} size={64} ring />
          <div className="text-sm text-ink-500">
            <p className="font-semibold text-ink-900">@{me.handle}</p>
            <p>A foto vem da sua conta.</p>
          </div>
        </div>

        <Field label="Nome" error={touched && invalid ? 'Informe seu nome.' : undefined}>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Cidade">
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo, SP" />
        </Field>

        <Field label="Bio" hint="Até 140 caracteres.">
          <Textarea
            rows={3}
            maxLength={140}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Corrida, comida de verdade e rotina leve."
          />
        </Field>
      </div>
    </Sheet>
  )
}

export function ChangeEmailSheet() {
  const { email, closeSheet, updateEmail } = useStore()
  const [value, setValue] = useState(email)
  const [touched, setTouched] = useState(false)

  const invalid = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

  const submit = () => {
    setTouched(true)
    if (invalid) return
    updateEmail(value.trim())
    closeSheet()
  }

  return (
    <Sheet
      title="Alterar e-mail"
      onClose={closeSheet}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={closeSheet}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={invalid}>
            Salvar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field
          label="Novo e-mail"
          hint="Enviaremos um link de confirmação."
          error={touched && invalid ? 'E-mail inválido.' : undefined}
        >
          <Input
            autoFocus
            type="email"
            inputMode="email"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
      </div>
    </Sheet>
  )
}

export function ChangePasswordSheet() {
  const { closeSheet, updatePassword } = useStore()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)

  const tooShort = next.length < 8
  const mismatch = next !== confirm
  const invalid = current.length === 0 || tooShort || mismatch

  const submit = async () => {
    setTouched(true)
    if (invalid || busy) return
    setBusy(true)
    const ok = await updatePassword(current, next)
    setBusy(false)
    if (ok) closeSheet()
  }

  return (
    <Sheet
      title="Alterar senha"
      onClose={closeSheet}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={closeSheet}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={invalid || busy}>
            {busy ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field
          label="Senha atual"
          error={touched && current.length === 0 ? 'Informe a senha atual.' : undefined}
        >
          <Input
            autoFocus
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>

        <Field
          label="Nova senha"
          hint="Mínimo de 8 caracteres."
          error={touched && tooShort ? 'Use pelo menos 8 caracteres.' : undefined}
        >
          <Input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>

        <Field
          label="Confirmar nova senha"
          error={touched && mismatch ? 'As senhas não coincidem.' : undefined}
        >
          <Input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
      </div>
    </Sheet>
  )
}
