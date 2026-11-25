import { useState } from 'react'
import { Pencil, Plus, QrCode, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Checkbox, Field, Input } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { createTable, deleteTable, getTableQr, listTables, updateTable } from '@/lib/staff'
import { tableSchema, validate } from '@/lib/schemas'
import type { TableInfo, TableQr } from '@/types/api'

export default function AdminTablesPage() {
  const { t } = useTranslation()
  const tables = useAsync(listTables, 'tables')
  const [editing, setEditing] = useState<TableInfo | 'new' | null>(null)
  const [number, setNumber] = useState('')
  const [active, setActive] = useState(true)
  const [qr, setQr] = useState<TableQr | null>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => setEditing(null)

  const openNew = () => {
    setEditing('new')
    setNumber('')
    setActive(true)
    setError(null)
  }

  const openEdit = (table: TableInfo) => {
    setEditing(table)
    setNumber(String(table.number))
    setActive(table.isActive)
    setError(null)
  }

  const save = async () => {
    const payload = { number: Number(number) }
    const invalid = validate(tableSchema, payload)
    if (invalid) {
      setError(invalid)
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (editing === 'new') {
        await createTable(payload.number, active)
      } else if (editing) {
        await updateTable(editing.id, { ...payload, isActive: active })
      }
      close()
      tables.reload()
    } catch {
      setError('staff.error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (table: TableInfo) => {
    if (!window.confirm(t('staff.admin.confirmDelete', { name: String(table.number) }))) return
    try {
      await deleteTable(table.id)
      tables.reload()
    } catch {
      setError('staff.error')
    }
  }

  const openQr = async (table: TableInfo) => {
    setCopied(false)
    setQrImage(null)
    try {
      const { toDataURL } = await import('qrcode')
      const data = await getTableQr(table.id)
      setQr(data)
      setQrImage(await toDataURL(data.url, { width: 512, margin: 2 }))
    } catch {
      setError('staff.error')
    }
  }

  const closeQr = () => {
    setQr(null)
    setQrImage(null)
  }

  const downloadQr = async () => {
    if (!qr) return
    setDownloading(true)
    try {
      const { toDataURL } = await import('qrcode')
      const dataUrl = await toDataURL(qr.url, { width: 1024, margin: 2 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `mesa-${qr.number}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      setError('staff.error')
    } finally {
      setDownloading(false)
    }
  }

  const copyUrl = async () => {
    if (!qr) return
    try {
      await navigator.clipboard.writeText(qr.url)
      setCopied(true)
    } catch {
      setError('staff.error')
    }
  }

  return (
    <StaffLayout
      title={t('staff.nav.tables')}
      actions={
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('staff.admin.create')}
        </Button>
      }
    >
      {tables.status === 'loading' ? (
        <LoadingState label={t('common.loading')} />
      ) : tables.status === 'error' ? (
        <ErrorState title={t('staff.error')} onRetry={tables.reload} />
      ) : tables.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          {t('staff.admin.empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {tables.data.map((table) => (
            <li
              key={table.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 p-3 shadow-card"
            >
              <div>
                <p className="font-medium">{t('staff.kds.table', { number: table.number })}</p>
                {!table.isActive && (
                  <p className="text-xs text-muted">{t('staff.admin.inactive')}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('staff.admin.tables.qr')}
                  onClick={() => void openQr(table)}
                >
                  <QrCode className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('staff.admin.edit')}
                  onClick={() => openEdit(table)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('staff.admin.delete')}
                  onClick={() => void remove(table)}
                >
                  <Trash2 className="h-4 w-4 text-rose-600" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title={editing === 'new' ? t('staff.admin.create') : t('staff.admin.edit')}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {t('staff.admin.cancel')}
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? t('staff.admin.saving') : t('staff.admin.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t('staff.admin.tables.number')}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={number}
              onChange={(event) => setNumber(event.target.value)}
            />
          </Field>
          <Checkbox label={t('staff.admin.tables.active')} checked={active} onChange={setActive} />
          {error && (
            <p role="alert" className="text-sm text-rose-700">
              {t(error)}
            </p>
          )}
        </div>
      </Dialog>

      <Dialog
        open={qr !== null}
        onOpenChange={(open) => {
          if (!open) closeQr()
        }}
        title={qr ? t('staff.kds.table', { number: qr.number }) : ''}
        footer={
          <>
            <Button variant="secondary" onClick={closeQr}>
              {t('common.close')}
            </Button>
            <Button variant="secondary" onClick={() => void copyUrl()}>
              {copied ? t('staff.admin.copied') : t('staff.admin.tables.copy')}
            </Button>
            <Button onClick={() => void downloadQr()} disabled={downloading || !qrImage}>
              {t('staff.admin.tables.download')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted">{t('staff.admin.tables.qrHint')}</p>
          {qrImage && qr && (
            <img
              src={qrImage}
              alt={t('staff.admin.tables.qrAlt', { number: qr.number })}
              className="mx-auto w-full max-w-[16rem] rounded-xl bg-white p-3"
            />
          )}
          <code className="block break-all rounded-lg bg-surface p-3 text-sm">{qr?.url}</code>
          {qr && (
            <a
              href={qr.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-brand underline"
            >
              {t('staff.admin.tables.open')}
            </a>
          )}
        </div>
      </Dialog>
    </StaffLayout>
  )
}
