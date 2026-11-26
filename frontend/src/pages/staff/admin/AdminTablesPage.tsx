import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Plus, QrCode, Table as TableIcon, Trash2 } from 'lucide-react'
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
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('staff.admin.create')}
        </motion.button>
      }
    >
      {tables.status === 'loading' ? (
        <LoadingState label={t('common.loading')} />
      ) : tables.status === 'error' ? (
        <ErrorState title={t('staff.error')} onRetry={tables.reload} />
      ) : tables.data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6 text-slate-400">
            <TableIcon className="h-10 w-10" aria-hidden />
          </div>
          <h3 className="font-playfair font-bold text-lg text-slate-900 mb-2">
            {t('staff.admin.empty')}
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">Aún no hay mesas configuradas.</p>
        </motion.div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.data.map((table) => (
            <motion.li
              key={table.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * tables.data.indexOf(table) }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-2xl font-playfair font-bold text-slate-900">{table.number}</p>
                  {!table.isActive && (
                    <span className="text-xs font-medium text-rose-600 mt-1 inline-block">
                      {t('staff.admin.inactive')}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('staff.admin.tables.qr')}
                  onClick={() => void openQr(table)}
                >
                  <QrCode className="h-4 w-4" aria-hidden />
                </Button>
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
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
            </motion.li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title={editing === 'new' ? t('staff.admin.create') : t('staff.admin.edit')}
      >
        <div className="space-y-3 p-4">
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
        <div className="border-t border-slate-100 px-4 py-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            {t('staff.admin.cancel')}
          </Button>
          <Button
            onClick={() => void save()}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? t('staff.admin.saving') : t('staff.admin.save')}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={qr !== null}
        onOpenChange={(open) => {
          if (!open) closeQr()
        }}
        title={qr ? t('staff.kds.table', { number: qr.number }) : ''}
      >
        <div className="space-y-3 p-4">
          <p className="text-sm text-muted">{t('staff.admin.tables.qrHint')}</p>
          {qrImage && qr && (
            <div className="flex items-center justify-center">
              <img
                src={qrImage}
                alt={t('staff.admin.tables.qrAlt', { number: qr.number })}
                className="w-full max-w-[200px] rounded-xl bg-white p-3 shadow-sm"
              />
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <code className="block break-all text-slate-700">{qr?.url}</code>
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={closeQr}>
            {t('common.close')}
          </Button>
          <Button variant="secondary" onClick={() => void copyUrl()} disabled={!qrImage}>
            {copied ? t('staff.admin.copied') : t('staff.admin.tables.copy')}
          </Button>
          <Button onClick={() => void downloadQr()} disabled={downloading || !qrImage}>
            {t('staff.admin.tables.download')}
          </Button>
        </div>
      </Dialog>
    </StaffLayout>
  )
}
