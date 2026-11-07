import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiError } from '@/lib/api'

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'ready'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: ApiError }

/**
 * Carga asíncrona con recarga manual. `key` identifica la consulta; al cambiar
 * se vuelve a pedir. La función se lee por ref para no depender de su identidad.
 */
export function useAsync<T>(fn: () => Promise<T>, key: string) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [nonce, setNonce] = useState(0)
  const fnRef = useRef(fn)

  useEffect(() => {
    fnRef.current = fn
  })

  useEffect(() => {
    let active = true
    fnRef
      .current()
      .then((data) => {
        if (active) setState({ status: 'ready', data })
      })
      .catch((error: ApiError) => {
        if (active) setState({ status: 'error', error })
      })
    return () => {
      active = false
    }
  }, [key, nonce])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setNonce((value) => value + 1)
  }, [])

  return { ...state, reload }
}
