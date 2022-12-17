import { z } from 'zod'

// TODO
export const targetUrl = 'localhost:3000'

export interface Options {
  maxReconnectionDelay: number
  minReconnectionDelay: number
  connectionTimeout: number
}

const wsReceiveSchema = z.union([
  z.object({
    type: z.literal('cardUsed'),
    body: z.object({
      id: z.string(),
      playerId: z.string(),
    }),
  }),
  z.object({
    type: z.literal('railCreated'),
    body: z.object({
      id: z.string(),
      parentId: z.string(),
      attackerId: z.string(),
      targetId: z.string(),
    }),
  }),
])
type WsReceive = z.infer<typeof wsReceiveSchema>
type WsSend = null // TODO

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

  constructor(targetUrl: string, userID: string) {
    this.url = `${targetUrl}?playerId=${userID}`
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
