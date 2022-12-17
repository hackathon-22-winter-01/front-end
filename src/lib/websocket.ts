import { z } from 'zod'

// TODO
export const targetUrl = 'localhost:3000'

export interface Options {
  maxReconnectionDelay: number
  minReconnectionDelay: number
  connectionTimeout: number
}

const railSchema = z.object({
	id: z.string(),
})
const playerSchema = z.object({
	id: z.string(),
	mainRail: railSchema,
	rails: z.array(railSchema),
	life: z.number(),
})
const cardSchema = z.object({
	id: z.string(),
	type: z.string(),
})

const wsReceiveSchema = z.union([
	z.object({
		type: z.literal('connected'),
		body: z.object({
			playerId: z.string(),
		}),
	}),
	z.object({
		type: z.literal('gameStarted'),
		body: z.object({
			players: z.array(playerSchema),
			cards: z.array(cardSchema),
		}),
	}),
	z.object({
		type: z.literal('lifeChanged'),
		body: z.object({
			playerId: z.string(),
			new: z.number(),
		}),
	}),
	z.object({
		type: z.literal('cardReset'),
		body: z.object({
			playerId: z.string(),
			cards: z.array(cardSchema),
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
	z.object({
		type: z.literal('railMerged'),
		body: z.object({
			childId: z.string(),
			parentId: z.string(),
			playerId: z.string(),
		}),
	}),
	z.object({
		type: z.literal('railBlockCreated'),
		body: z.object({
			attackerId: z.string(),
			targetId: z.string(),
			delay: z.number(),
			attack: z.number(),
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
