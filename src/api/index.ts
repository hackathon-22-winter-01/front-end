import { useMemo } from 'react'

export interface Client {
  readonly baseUrl: string
}

export const useClient = (): Client => {
  const baseUrl = 'http://localhost:8080'
  const client = useMemo(() => {
    return { baseUrl }
  }, [baseUrl])
  return client
}
