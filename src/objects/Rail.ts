import * as PIXI from 'pixi.js'
import { Deque } from '../lib/deque'
import { unreachable } from '../lib/types'
import { WsManager, WsReceive } from '../lib/websocket'
import { RailSabotage } from './RailSabotage'
import { Renderable } from './Renderable'

const TRAIN_SPEED = 40

type RailRelationLog =
  | {
      type: 'branched'
      fromIdx: number
      timing: number
    }
  | {
      type: 'merged'
      toIdx: number
      timing: number
    }
  | {
      type: 'initialized'
    }
export class Rail implements Renderable {
  private app: PIXI.Application

  private ownerId: string
  private index: number

  status?: RailSabotage
  relation_log: RailRelationLog[]

  private event_queue: Deque<EventLog> = new Deque()

  private wsManager?: WsManager

  private container: PIXI.Container

  private height: number
  private width: number
  private gap_x: number

  private readonly isEditable: boolean = false

  constructor(
    app: PIXI.Application,
    ownerId: string,
    index: number,
    layout: {
      height: number
      width: number
      gap_x: number
    },
    is_root: boolean = false,
    wsManager?: WsManager,
    isEditable: boolean = false,
  ) {
    this.app = app

    this.ownerId = ownerId
    this.index = index

    this.relation_log = is_root ? [{ type: 'initialized' }] : []

    this.container = new PIXI.Container()

    this.height = layout.height
    this.width = layout.width
    this.gap_x = layout.gap_x

    this.isEditable = isEditable

    this.wsManager = wsManager
    if (this.wsManager) {
      this.wsManager.eventTarget.addEventListener('message', (event) => {
        const e = event as CustomEvent<WsReceive>
        this.ws_handler(e.detail)
      })
    }
  }

  get render(): PIXI.DisplayObject {
    return this.container
  }

  private static readonly topMargin = [90, 150, 40, 0, 50, 100, 20] as const

  public update_render(timing_ms: number): void {
    class OneRailTmp implements Renderable {
      private app: PIXI.Application

      private container: PIXI.Container

      constructor(app: PIXI.Application) {
        this.app = app

        this.container = new PIXI.Container()
        this.init_render()
      }

      get render(): PIXI.DisplayObject {
        return this.container
      }

      private init_render(): void {
        this.clear()
        const rail = PIXI.Sprite.from(PIXI.Texture.WHITE)
        rail.width = 40
        rail.height = 40
        rail.tint = 0x85471f
        this.container.addChild(rail)
      }

      private clear(): void {
        this.container.children.forEach((child) => {
          child.destroy()
        })
      }
    }

    this.clear()
    const railPx = this.width

    const railCount = this.height / railPx
    const diffDelta = ((timing_ms * TRAIN_SPEED) / 1000) % railPx
    const topMargin =
      (this.height % railPx) + diffDelta + Rail.topMargin[this.index]

    for (let i = 0; i < railCount; i++) {
      const oneRail = new OneRailTmp(this.app)
      oneRail.render.position.set(0, topMargin + railPx * i)
      this.container.addChild(oneRail.render)
    }

    this.event_resolver(timing_ms)
  }

  private clear(): void {
    this.container.children.forEach((child) => {
      child.destroy()
    })
  }

  private ws_handler(detail: WsReceive): void {
    switch (detail.type) {
      case 'railCreated': {
        const { eventTime, body } = detail
        if (body.targetId !== this.ownerId) {
          return
        }
        if (body.newRail !== this.index) {
          return
        }
        this.event_queue.push(
          new EventLog(this.app, {
            type: 'branched',
            fromIdx: body.parentRail,
            cardInfo: {
              attackerName: body.attackerId,
              cardType: body.cardType,
            },
          }),
        )
        break
      }
      case 'railMerged': {
        const { eventTime, body } = detail
        if (body.playerId !== this.ownerId) {
          return
        }
        if (body.childRail !== this.index) {
          return
        }
        this.event_queue.push(
          new EventLog(this.app, {
            type: 'merged',
            toIdx: body.parentRail,
            cardInfo: {
              attackerName: body.playerId,
              cardType: body.cardType,
            },
          }),
        )
        break
      }
      case 'blockCanceled': {
        const { eventTime, body } = detail
        if (body.targetId !== this.ownerId) {
          return
        }
        if (body.rail !== this.index) {
          return
        }
        this.blocking_event = undefined
        this.is_blocking = false
        break
      }
      case 'blockCrashed': {
        const { eventTime, body } = detail
        if (body.targetId !== this.ownerId) {
          return
        }
        if (body.rail !== this.index) {
          return
        }
        this.blocking_event = undefined
        this.is_blocking = false
        break
      }
      case 'blockCreated': {
        const { eventTime, body } = detail
        if (body.targetId !== this.ownerId) {
          return
        }
        if (body.railIndex !== this.index) {
          return
        }
        this.event_queue.push(
          new EventLog(this.app, {
            type: 'sabotage',
            attack: body.attack,
            delay: body.delay,
            cardInfo: {
              attackerName: body.attackerId,
              cardType: body.cardType,
            },
          }),
        )
        break
      }
      default: {
        // nop
      }
    }
  }

  private is_blocking: boolean = false
  private blocking_event?: {
    event: EventLog
    resolve_timing?: number
  }
  private crash_timing?: number
  private event_resolver(timing_ms: number): void {
    if (this.blocking_event?.resolve_timing !== undefined) {
      if (this.blocking_event.resolve_timing <= timing_ms) {
        this.blocking_event.event.resolve()
        this.blocking_event = undefined
      }
    }
    if (this.crash_timing !== undefined) {
      if (this.crash_timing <= timing_ms) {
        this.crash_timing = undefined
        this.status?.trigger_crash()
      }
    }

    if (this.is_blocking) {
      return
    }

    const event = this.event_queue.pop_front()
    if (event === undefined) {
      return
    }

    this.is_blocking = true
    event.resolved = () => {
      this.is_blocking = false
    }

    switch (event.type.type) {
      case 'branched': {
        // timing_ms は、ブランチの根本のレールが画面の一番上に来たタイミング
        /// branching_timing は [根本のレールが最下点に達したタイミング, 列車の速度がもとに戻るレールが切れたタイミング]
        const reached_timing = timing_ms + this.height / (TRAIN_SPEED / 1000)
        const reached_timing_truncated =
          (reached_timing / (TRAIN_SPEED / 1000)) * (TRAIN_SPEED / 1000)
        const branching_timing = [
          reached_timing_truncated,
          reached_timing_truncated +
            ((this.gap_x + this.width) *
              Math.abs(this.index - event.type.fromIdx)) /
              (TRAIN_SPEED / 1000),
        ]

        this.blocking_event = {
          event,
          resolve_timing: branching_timing[1],
        }

        this.relation_log.push({
          type: 'branched',
          fromIdx: event.type.fromIdx,
          timing: branching_timing[0],
        })

        break
      }
      case 'merged': {
        const reached_timing = timing_ms + this.height / (TRAIN_SPEED / 1000)
        const reached_timing_truncated =
          (reached_timing / (TRAIN_SPEED / 1000)) * (TRAIN_SPEED / 1000)
        const merging_timing = [
          reached_timing_truncated,
          reached_timing_truncated +
            ((this.gap_x + this.width) *
              Math.abs(this.index - event.type.toIdx)) /
              (TRAIN_SPEED / 1000),
        ]

        this.blocking_event = {
          event,
          resolve_timing: merging_timing[1],
        }

        this.relation_log.push({
          type: 'merged',
          toIdx: event.type.toIdx,
          timing: merging_timing[0],
        })
        break
      }
      case 'sabotage': {
        const reached_timing = timing_ms + this.height / (TRAIN_SPEED / 1000)
        const reached_timing_truncated =
          (reached_timing / (TRAIN_SPEED / 1000)) * (TRAIN_SPEED / 1000)
        this.status = new RailSabotage(
          this.app,
          'broken',
          reached_timing_truncated,
          event.type.attack,
          event.type.delay,
        )

        if (this.isEditable) {
          this.status.repaired = () => {
            this.wsManager?.send({
              type: 'blockEvent',
              body: {
                type: 'canceled',
                railIndex: this.index,
                cardType: 'lgtm',
              },
            })
            // event.resolve()
          }

          this.status.crashed = () => {
            this.wsManager?.send({
              type: 'blockEvent',
              body: {
                type: 'crashed',
                railIndex: this.index,
                cardType: 'lgtm',
              },
            })
          }
        }

        this.blocking_event = {
          event,
          resolve_timing: undefined,
        }
        this.crash_timing = reached_timing_truncated + event.type.delay
        break
      }
      default: {
        return unreachable(event.type)
      }
    }
  }
}

interface CardInfo {
  attackerName: string
  cardType: string
}
interface EventLogBranched {
  type: 'branched'
  fromIdx: number
  cardInfo: CardInfo
}
interface EventLogMerged {
  type: 'merged'
  toIdx: number
  cardInfo: CardInfo
}
interface EventLogSabotage {
  type: 'sabotage'
  attack: number
  delay: number
  cardInfo: CardInfo
}
type EventLogType = EventLogBranched | EventLogMerged | EventLogSabotage
class EventLog {
  private app: PIXI.Application

  readonly type: EventLogType
  private resolved_handler?: () => void

  constructor(app: PIXI.Application, type: EventLogType) {
    this.app = app

    this.type = type
  }

  set resolved(handler: () => void) {
    this.resolved_handler = handler
  }

  private isResolved: boolean = false
  public resolve(): void {
    if (this.isResolved) {
      return
    }
    this.isResolved = true

    setTimeout(() => {
      this.resolved_handler?.()
    }, 1000)
  }
}
