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
  index: z.number(),
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
const cardTypeSchema = z.union([
  z.literal('yolo'),
  z.literal('galaxyBrain'),
  z.literal('openSourcerer'),
  z.literal('refactoring'),
  z.literal('pairExtraordinaire'),
  z.literal('lgtm'),
  z.literal('pullShark'),
  z.literal('starstruck'),
  z.literal('none'),
])

const wsReceiveSchema = z
  .union([
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
        cardType: cardTypeSchema,
        new: z.number().nonnegative().max(100),
      }),
    }),
    z.object({
      type: z.literal('railCreated'),
      body: z.object({
        newRail: railSchema,
        parentRail: railSchema,
        attackerId: z.string(),
        targetId: z.string(),
        cardType: cardTypeSchema,
      }),
    }),
    z.object({
      type: z.literal('railMerged'),
      body: z.object({
        childRail: railSchema,
        parentRail: railSchema,
        playerId: z.string(),
        cardType: cardTypeSchema,
      }),
    }),
    z.object({
      type: z.literal('blockCreated'),
      body: z.object({
        attackerId: z.string(),
        targetId: z.string(),
        cardType: cardTypeSchema,
        delay: z.number(),
        attack: z.number(),
      }),
    }),
    z.object({
      type: z.literal('blockCanceled'),
      body: z.object({
        targetId: z.string(),
        rail: railSchema,
        cardType: cardTypeSchema.nullable(),
      }),
    }),
    z.object({
      type: z.literal('blockCrashed'),
      body: z.object({
        targetId: z.string(),
        rail: railSchema,
        cardType: cardTypeSchema.nullable(),
        newLife: z.number().nonnegative().max(100),
      }),
    }),
    z.object({
      type: z.literal('gameOverred'),
      body: z.object({
        playerId: z.string(),
      }),
    }),
  ])
  .and(
    z.object({
      // format: 0001-01-01T00:00:00Z
      eventTime: z.string().transform((z) => new Date(z).getTime()),
    }),
  )
export type WsReceive = z.infer<typeof wsReceiveSchema>

const wsSendSchema = z.union([
  z.object({
    type: z.literal('gameStartEvent'),
    body: z.object({}),
  }),
  z.object({
    type: z.literal('lifeEvent'),
    body: z.object({
      type: z.union([z.literal('damaged'), z.literal('heal')]),
      diff: z.number(),
    }),
  }),
  z.object({
    type: z.literal('cardEvent'),
    body: z.object({
      id: z.string(),
      targetId: z.string(),
      type: cardTypeSchema,
    }),
  }),
  z.object({
    type: z.literal('blockEvent'),
    body: z.object({
      type: z.union([z.literal('canceled'), z.literal('crashed')]),
      cardType: cardTypeSchema.nullable(),
      rail: railSchema,
    }),
  }),
])
type WsSend = z.infer<typeof wsSendSchema>

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
