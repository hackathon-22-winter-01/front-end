import * as PIXI from 'pixi.js'
import { delta_to_ms } from '../lib/converter'
import { WsManager } from '../lib/websocket'

import ReactSvg from '../pages/assets/react.svg'

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
    card.drawRoundedRect(0, 0, 120, 144, 10)
    card.endFill()
    this.container.addChild(card)

    this.container.addChild(this.button.render)
  }
}

export class PressButton {
  private app: PIXI.Application
  private container: PIXI.Container
  /*
  <container {handlePointerEvent}>
    <InnerContainer>
      <ButtonBackground />
      <ButtonImage />
      <ButtonProgress />
      <ContainerBorder />
    </InnerContainer>
  </container>
  */

  /// when null, not has progress
  private needTime_ms: number | null
  private nowTime_ms: number = 0

  private isPressed: boolean = false
  private lastEventTime: number

  private pressed_handler?: (this_: PressButton) => void
  private pressing_handler?: (delta_ms: number, this_: PressButton) => void
  private eventTarget: EventTarget = new EventTarget()

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
    this.eventTarget.dispatchEvent(new Event('press_start'))
  }

  private on_pressing(delta_ms: number): void {
    if (!this.isPressed) {
      this.isPressed = true
      this.lastEventTime = Date.now()
    }

    this.pressing_handler?.(delta_ms, this)
    this.eventTarget.dispatchEvent(
      new CustomEvent('pressing', { detail: delta_ms }),
    )

    const InnerContainer = this.container.getChildAt(0) as PIXI.Container
    InnerContainer.x = 48 + (Math.random() - 0.5) * 10
    InnerContainer.y = 48 + (Math.random() - 0.5) * 10
    InnerContainer.scale.set(1.2)

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
    this.eventTarget.dispatchEvent(new Event('press_end'))

    const InnerContainer = this.container.getChildAt(0) as PIXI.Container
    InnerContainer.x = 48
    InnerContainer.y = 48
    InnerContainer.scale.set(1)
  }

  private on_not_pressing(delta_ms: number): void {
    if (this.isPressed) {
      this.isPressed = false
      this.lastEventTime = Date.now()
    }

    if (this.needTime_ms === null) {
      return
    }

    if (this.nowTime_ms <= 0) {
      this.nowTime_ms = 0
      return
    }

    this.nowTime_ms -= delta_ms * 3
    if (this.nowTime_ms < 0) {
      this.nowTime_ms = 0
    }
  }

  private init_render(): void {
    this.clear()
    this.container.hitArea = new PIXI.Circle(48, 48, 48)
    this.container.cursor = 'pointer'
    {
      const InnerContainer = new PIXI.Container()
      const InnerContainerMask = new PIXI.Graphics()
      InnerContainerMask.beginFill(0xffffff)
      InnerContainerMask.drawCircle(48, 48, 49)
      InnerContainerMask.endFill()
      InnerContainer.mask = InnerContainerMask
      this.container.addChild(InnerContainer)
      {
        // const buttonBackground = PIXI.Sprite.from(ReactSvg)
        const ButtonBackground = PIXI.Sprite.from(PIXI.Texture.WHITE)
        ButtonBackground.tint = 0x00ff00
        ButtonBackground.width = 96
        ButtonBackground.height = 96
        InnerContainer.addChild(ButtonBackground)
      }
      {
        const ButtonImage = PIXI.Sprite.from(ReactSvg)
        ButtonImage.width = 96
        ButtonImage.height = 96
        InnerContainer.addChild(ButtonImage)
      }
      {
        const ButtonProgress = new PIXI.Graphics()
        InnerContainer.addChild(ButtonProgress)
      }
      {
        const ContainerBorder = new PIXI.Graphics()
        ContainerBorder.lineStyle(2, 0xffffff)
        ContainerBorder.drawCircle(48, 48, 48)
        ContainerBorder.endFill()
        InnerContainer.addChild(ContainerBorder)
      }
      InnerContainer.addChild(InnerContainerMask)
      InnerContainer.pivot.set(
        InnerContainer.width / 2,
        InnerContainer.height / 2,
      )
      InnerContainer.x = 48
      InnerContainer.y = 48
    }

    this.container.interactive = true
    this.container
      .on(
        'pointerdown',
        () => {
          this.on_press_start()
        },
        {
          passive: true,
        },
      )
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
      } else {
        this.on_not_pressing(delta_ms)
      }

      if (this.needTime_ms === null) {
        return
      }

      const progress = this.nowTime_ms / this.needTime_ms
      const ButtonProgress = (
        this.container.getChildAt(0) as PIXI.Container
      ).getChildAt(2) as PIXI.Graphics
      ButtonProgress.clear()
      ButtonProgress.beginFill(0xffffff, 0.5)
      ButtonProgress.moveTo(48, 48)
      ButtonProgress.arc(
        48,
        48,
        48,
        -Math.PI / 2,
        -Math.PI / 2 + progress * 2 * Math.PI,
      )
      ButtonProgress.lineTo(48, 48)
    })
  }

  private clear(): void {
    this.container.children.forEach((child) => {
      child.destroy()
    })
  }
}

export class Board implements Renderable {
  static readonly DEFAULT_MAX_HP = 100

  private app: PIXI.Application

  rails: Rail[]
  status: null // todo
  restHP: number
  maxHP: number

  container: PIXI.Container

  constructor(app: PIXI.Application) {
    this.app = app

    this.rails = [
      new Rail(app),
      new Rail(app),
      new Rail(app),
      new Rail(app, true),
      new Rail(app),
      new Rail(app),
      new Rail(app),
    ]
    this.status = null
    this.restHP = 0
    this.maxHP = Board.DEFAULT_MAX_HP

    this.container = new PIXI.Container()
    this.init_render()
  }

  get render(): PIXI.DisplayObject {
    return this.container
  }

  private init_render(): void {
    this.clear()
    const board = new PIXI.Graphics()
    board.beginFill(0x000000)
    board.lineStyle(2, 0xffffff)
    board.drawRect(0, 0, 100, 100)
    board.endFill()
    this.container.addChild(board)
  }

  private clear(): void {
    this.container.children.forEach((child) => {
      child.destroy()
    })
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
