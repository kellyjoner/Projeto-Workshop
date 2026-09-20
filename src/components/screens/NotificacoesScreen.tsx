import { NotificationsPanel } from '../sheets/NotificationsPanel'
import { ScreenHeader } from '../layout/ScreenHeader'

export function NotificacoesScreen() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <ScreenHeader title="Notificações" />
      <NotificationsPanel standalone />
    </div>
  )
}
