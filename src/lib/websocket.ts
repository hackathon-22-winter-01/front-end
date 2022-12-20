import { useCallback, useState } from 'react'
import { wsReceiveSchema, WsSend } from '../api/ws/schema'

// TODO
export const targetUrl = 'localhost:3000'

export interface Options {
  maxReconnectionDelay: number
  minReconnectionDelay: number
  connectionTimeout: number
}

interface IWsManager {
  get isOpen(): boolean
  connect(): void
  disconnect(): void
  send(data: WsSend): void
  get eventTarget(): EventTarget
}

export class WsManager implements IWsManager {
  private url: string
  private ws?: WebSocket
  private _eventTarget: EventTarget = new EventTarget()

  constructor(targetUrl: string) {
    this.url = targetUrl
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private setupWs(): void {
    this.ws = new WebSocket(this.url)

    this.ws.addEventListener('open', () => {
      this._eventTarget.dispatchEvent(new Event('open'))
    })

    this.ws.addEventListener('close', () => {
      this._eventTarget.dispatchEvent(new Event('close'))
    })

    this.ws.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data)
        this._eventTarget.dispatchEvent(
          new CustomEvent('message', { detail: wsReceiveSchema.parse(data) }),
        )
      } catch (e) {
        console.error(e)
      }
    })
  }

  public connect(): void {
    if (!this.isOpen) {
      this.setupWs()
    }
  }

  public disconnect(): void {
    this.ws?.close()
  }

  public send(data: WsSend): void {
    if (this.isOpen) {
      this.ws?.send(JSON.stringify(data))
    }
  }

  public get eventTarget(): EventTarget {
    return this._eventTarget
  }
}

export const useWsManager = (url: string) => {
  const [wsManager] = useState(() => new WsManager(url))

  const connect = useCallback(() => {
    wsManager.connect()
  }, [wsManager])
  const disconnect = useCallback(() => {
    wsManager.disconnect()
  }, [wsManager])

  return {
    value: wsManager,
    eventTarget: wsManager.eventTarget,
    connect,
    disconnect,
  }
}
