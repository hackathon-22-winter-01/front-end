import * as PIXI from 'pixi.js'
import { delta_to_ms } from '../lib/converter'
import { WsManager } from '../lib/websocket'

export interface Renderable {
  get render(): PIXI.DisplayObject
}

export class Game implements Renderable {
  private app: PIXI.Application

  myBoard: Board
  enemyBoard: Board[]
  wsManager: WsManager

  cards: Card[]

  private container: PIXI.Container

  constructor(app: PIXI.Application, playerNum: number, wsManager: WsManager) {
    this.app = app

    this.myBoard = new Board(app)
    this.enemyBoard = Array.from(
      { length: playerNum - 1 },
      () => new Board(app),
    )
    this.wsManager = wsManager

    this.cards = []

    this.container = new PIXI.Container()
  }

  get render(): PIXI.DisplayObject {
    return this.container
  }

  private drawCard(): void {
    const cardMax = 5

    if (this.cards.length >= cardMax) {
      return
    }

    const card = new Card(this.app, 0)
    this.cards.push(card)
  }
}

export class Card implements Renderable {
  private app: PIXI.Application
  private cardID: number

  private container: PIXI.Container

  private button: PressButton

  constructor(app: PIXI.Application, cardID: number) {
    this.app = app
    this.cardID = cardID

    this.container = new PIXI.Container()
    this.button = new PressButton(app, 1000, (this_) => {
      console.log('pressed')
      this_.reset_progress()
    })

    this.init_render()
  }

  get render(): PIXI.DisplayObject {
    return this.container
  }

  private init_render(): void {
    // 120 x 144
    this.container.removeChildren()
    const card = new PIXI.Graphics()
    card.beginFill(0xaeaeae)
    card.drawRect(0, 0, 120, 144)
    card.endFill()
    this.container.addChild(card)

    this.container.addChild(this.button.render)
  }
}

export class PressButton {
  private app: PIXI.Application
  private container: PIXI.Container

  /// when null, not has progress
  private needTime_ms: number | null
  private nowTime_ms: number = 0

  private isPressed: boolean = false
  private lastEventTime: number

  private pressed_handler?: (this_: PressButton) => void
  private pressing_handler?: (delta_ms: number, this_: PressButton) => void

  constructor(
    app: PIXI.Application,
    needTime: number | null,
    pressed_handler?: (this_: PressButton) => void,
    pressing_handler?: (delta_ms: number, this_: PressButton) => void,
  ) {
    this.app = app

    this.container = new PIXI.Container()

    this.needTime_ms = needTime

    this.pressed_handler = pressed_handler
    this.pressing_handler = pressing_handler
    this.lastEventTime = Date.now()

    this.init_render()
  }

  get render(): PIXI.DisplayObject {
    return this.container
  }

  get progress(): number | null {
    if (this.needTime_ms === null) {
      return null
    }

    return this.nowTime_ms / this.needTime_ms
  }

  public reset_progress(): void {
    this.nowTime_ms = 0
  }

  private on_press_start(): void {
    this.isPressed = true
    this.lastEventTime = Date.now()
  }

  private on_pressing(delta_ms: number): void {
    if (!this.isPressed) {
      this.isPressed = true
      this.lastEventTime = Date.now()
    }

    this.pressing_handler?.(delta_ms, this)

    const randomColorCircle = new PIXI.Graphics()
    randomColorCircle.lineStyle(2, 0xffffff)
    randomColorCircle.drawCircle(48, 48, 48)
    randomColorCircle.endFill()
    randomColorCircle.x = Math.random() * 10
    randomColorCircle.y = Math.random() * 10
    ;(this.container.getChildAt(0) as PIXI.Graphics).destroy()
    this.container.removeChildren()
    this.container.addChild(randomColorCircle)

    if (this.needTime_ms === null) {
      return
    }

    if (this.nowTime_ms > this.needTime_ms) {
      return
    }

    this.nowTime_ms += delta_ms
    if (this.nowTime_ms > this.needTime_ms) {
      this.pressed_handler?.(this)
    }
  }

  private on_press_end(): void {
    this.isPressed = false
    this.lastEventTime = Date.now()
    this.nowTime_ms = 0
  }

  private init_render(): void {
    this.container.removeChildren()
    const button = new PIXI.Graphics()
    button.beginFill(0x000000)
    button.lineStyle(2, 0xffffff)
    button.drawCircle(48, 48, 48)
    button.endFill()
    this.container.addChild(button)

    this.container.interactive = true
    this.container
      .on('pointerdown', () => {
        this.on_press_start()
      })
      .on('pointerup', () => {
        this.on_press_end()
      })
      .on('pointerleave', () => {
        if (this.isPressed) {
          this.on_press_end()
        }
      })
      .on('pointerenter', (e) => {
        if (e.isPrimary && e.buttons > 0) {
          this.on_press_start()
        }
      })
    this.app.ticker.add((delta) => {
      const delta_ms = delta_to_ms(delta)
      if (this.isPressed) {
        this.on_pressing(delta_ms)
      }
    })
    this.container.hitArea = new PIXI.Circle(48, 48, 48)
    this.container.cursor = 'pointer'
  }
}

export class Board {
  static readonly DEFAULT_MAX_HP = 100

  private app: PIXI.Application

  rails: Rail[]
  status: null // todo
  restHP: number
  maxHP: number

  constructor(app: PIXI.Application) {
    this.app = app

    this.rails = [
      new Rail(app),
      new Rail(app),
      new Rail(app),
      new Rail(app, true),
      new Rail(app),
      new Rail(app),
    ]
    this.status = null
    this.restHP = 0
    this.maxHP = Board.DEFAULT_MAX_HP
  }
}

type RailRelationLog =
  | {
      type: 'branched'
      from: number
      timing: number
    }
  | {
      type: 'merged'
      to: number
      timing: number
    }
  | {
      type: 'initialized'
    }
export class Rail {
  private app: PIXI.Application

  statuses: RailSabotage[]
  relation_log: RailRelationLog[]

  constructor(app: PIXI.Application, is_root: boolean = false) {
    this.app = app

    this.statuses = []
    this.relation_log = is_root ? [{ type: 'initialized' }] : []
  }
}

type RailSabotageType = 'broken'
export class RailSabotage {
  private app: PIXI.Application

  type: RailSabotageType
  timing: number
  repair_time: number
  repair_progress: number
  is_repaired: boolean

  constructor(
    app: PIXI.Application,
    type: RailSabotageType,
    timing: number,
    repair_time: number,
  ) {
    this.app = app

    this.type = type
    this.timing = timing
    this.repair_time = repair_time
    this.repair_progress = 0
    this.is_repaired = false
  }
}
