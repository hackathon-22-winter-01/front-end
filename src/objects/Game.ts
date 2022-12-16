import * as PIXI from 'pixi.js'
import { delta_to_ms } from '../lib/converter'
import { WsManager } from '../lib/websocket'

import ReactSvg from '../pages/assets/react.svg'

/**
 * 1秒間に進むピクセル数
 */
const TRAIN_SPEED = 40

export interface Renderable {
  get render(): PIXI.DisplayObject
}

export class Game implements Renderable {
  private app: PIXI.Application

  myBoard: Board
  enemyBoard: Board[]
  wsManager: WsManager

  cards: Card[]

  startTime: number

  private container: PIXI.Container

  constructor(
    app: PIXI.Application,
    playerNum: number,
    wsManager: WsManager,
    startTime: number,
  ) {
    this.app = app

    this.myBoard = new Board(app)
    this.enemyBoard = Array.from(
      { length: playerNum - 1 },
      () => new Board(app),
    )
    this.wsManager = wsManager

    this.cards = []

    this.container = new PIXI.Container()

    this.startTime = startTime
    this.init_render()
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

  private update_handler?: (delta: number) => void
  private init_render(): void {
    this.clear()
    if (this.update_handler) {
      this.app.ticker.remove(this.update_handler)
    }

    this.container.addChild(
      new PIXI.Graphics()
        .beginFill(0x00ffff)
        .drawRect(0, 0, 800, 400)
        .endFill(),
    )

    this.container.addChild(this.myBoard.render)
    this.myBoard.render.scale.set(0.5, 0.5)
    this.myBoard.render.position.set(0, 0)

    this.enemyBoard.forEach((board, index) => {
      this.container.addChild(board.render)
      board.render.scale.set(0.25, 0.25)
      board.render.position.set(300 + 160 * index, 0)
    })

    this.cards.forEach((card, index) => {
      this.container.addChild(card.render)
      card.render.position.set(120 + 120 * index, 0)
    })

    this.update_handler = (_delta: number) => {
      const nowTime_ms = Date.now()
      const timing_ms = nowTime_ms - this.startTime

      this.update_render(timing_ms)
    }
    this.app.ticker.add(this.update_handler)
  }

  private update_render(timing_ms: number): void {
    this.myBoard.update_render(timing_ms)
    this.enemyBoard.forEach((board) => {
      board.update_render(timing_ms)
    })
  }

  private clear(): void {
    this.container.children.forEach((child) => {
      child.destroy()
    })
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
    this.button.render.pivot.set(48, 48)
    this.button.render.position.set(60, 60)
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

  private static readonly railLayout = {
    width: 36,
    height: 800,
    gap_x: 36,
  }

  private static readonly zIndices = {
    background: 0,
    rails: 10,
    train: 20,
  }

  constructor(app: PIXI.Application) {
    this.app = app
    const layout = Board.railLayout

    this.rails = [
      new Rail(app, 0, layout),
      new Rail(app, 1, layout),
      new Rail(app, 2, layout),
      new Rail(app, 3, layout, true),
      new Rail(app, 4, layout),
      new Rail(app, 5, layout),
      new Rail(app, 6, layout),
    ]
    this.status = null
    this.restHP = 0
    this.maxHP = Board.DEFAULT_MAX_HP

    this.container = new PIXI.Container()
    this.container.sortableChildren = true
    this.init_render()
  }

  get render(): PIXI.DisplayObject {
    return this.container
  }

  private tick_handler?: () => void

  private init_render(): void {
    this.clear()
    if (this.tick_handler) {
      this.app.ticker.remove(this.tick_handler)
      this.tick_handler = undefined
    }
    const board = new PIXI.Graphics()
    board.beginFill(0xf9f5ea)
    board.drawRect(0, 0, 520, 800)
    board.endFill()
    board.zIndex = Board.zIndices.background
    this.container.addChild(board)

    this.rails.forEach((rail) => {
      rail.render.zIndex = Board.zIndices.rails
      this.container.addChild(rail.render)
    })

    const ContainerMask = new PIXI.Graphics()
    ContainerMask.beginFill(0xffffff)
    ContainerMask.drawRoundedRect(0, 0, 520, 800, 12)
    ContainerMask.endFill()
    this.container.addChild(ContainerMask)
    this.container.mask = ContainerMask
  }

  public update_render(timing_ms: number): void {
    this.rails.forEach((rail, idx) => {
      rail.update_render(timing_ms)
      rail.render.x =
        (520 - Board.railLayout.width * 7 - Board.railLayout.gap_x * 6) / 2 +
        idx * (Board.railLayout.width + Board.railLayout.gap_x)
    })
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

  private index: number

  statuses: RailSabotage[]
  relation_log: RailRelationLog[]

  private container: PIXI.Container

  private height: number
  private width: number
  private gap_x: number

  constructor(
    app: PIXI.Application,
    index: number,
    layout: {
      height: number
      width: number
      gap_x: number
    },
    is_root: boolean = false,
  ) {
    this.app = app

    this.index = index

    this.statuses = []
    this.relation_log = is_root ? [{ type: 'initialized' }] : []

    this.container = new PIXI.Container()

    this.height = layout.height
    this.width = layout.width
    this.gap_x = layout.gap_x
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
  }

  private clear(): void {
    this.container.children.forEach((child) => {
      child.destroy()
    })
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
