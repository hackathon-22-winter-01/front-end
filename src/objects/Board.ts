import * as PIXI from 'pixi.js'
import { WsReceive } from '../api/ws/schema'
import { delta_to_ms } from '../lib/converter'
import { PressProgressManager } from '../lib/pressManager'
import { WsManager } from '../lib/websocket'
import { Rail, SAFETY_LENGTH } from './Rail'
import { Renderable } from './Renderable'

export class Board implements Renderable {
  static readonly DEFAULT_MAX_HP = 100

  private app: PIXI.Application

  private wsManager?: WsManager

  readonly progress_manager: PressProgressManager

  rails: Rail[]
  status: null // todo
  restHP: number
  maxHP: number

  private isMine: boolean
  private ownerId: string

  private isGameOver: boolean = false

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

  constructor(
    app: PIXI.Application,
    ownerId: string,
    wsManager?: WsManager,
    isMine: boolean = false,
  ) {
    this.app = app
    const layout = Board.railLayout

    this.rails = [
      new Rail(app, ownerId, 0, layout, false, wsManager, isMine),
      new Rail(app, ownerId, 1, layout, false, wsManager, isMine),
      new Rail(app, ownerId, 2, layout, false, wsManager, isMine),
      new Rail(app, ownerId, 3, layout, true, wsManager, isMine),
      new Rail(app, ownerId, 4, layout, false, wsManager, isMine),
      new Rail(app, ownerId, 5, layout, false, wsManager, isMine),
      new Rail(app, ownerId, 6, layout, false, wsManager, isMine),
    ]
    this.status = null
    this.restHP = Board.DEFAULT_MAX_HP
    this.maxHP = Board.DEFAULT_MAX_HP

    this.ownerId = ownerId

    this.isMine = isMine

    this.container = new PIXI.Container()
    this.container.sortableChildren = true

    if (wsManager) {
      this.wsManager = wsManager
      this.wsManager.eventTarget.addEventListener('message', (event) => {
        const e = event as CustomEvent<WsReceive>
        this.ws_handler(e.detail)
      })
    }

    this.progress_manager = new PressProgressManager(app, null)

    this.init_render()
  }

  get render(): PIXI.DisplayObject {
    return this.container
  }

  private ws_handler(detail: WsReceive): void {
    switch (detail.type) {
      case 'lifeChanged': {
        const { body } = detail
        if (body.playerId !== this.ownerId) {
          return
        }

        this.restHP = body.newLife
        break
      }
      case 'gameOverred': {
        const { body } = detail
        if (body.playerId !== this.ownerId) {
          return
        }

        // TODO: ゲームオーバーの処理 (イベントは通常通り届くし、送れる)
        this.isGameOver = true
        break
      }
      default: {
        // nop
      }
    }
  }

  private tick_handler?: (delta: number) => void

  private init_render(): void {
    this.clear()
    if (this.tick_handler) {
      this.app.ticker.remove(this.tick_handler)
      this.tick_handler = undefined
    }

    const reduceHP = (delta_ms: number) => {
      if (!this.isMine) {
        return
      }

      if (this.isGameOver) {
        return
      }

      const delta = delta_ms / 1000

      this.wsManager?.send({
        type: 'lifeEvent',
        body: {
          type: 'damaged',
          diff: delta,
        },
      })
    }
    if (this.isMine) {
      this.tick_handler = (delta: number) => {
        const delta_ms = delta_to_ms(delta)
        reduceHP(delta_ms)
      }
      this.app.ticker.add(this.tick_handler)
    }
    const healHP = (delta_ms: number) => {
      if (!this.isMine) {
        return
      }

      if (this.isGameOver) {
        return
      }

      const delta = delta_ms / 1000

      this.wsManager?.send({
        type: 'lifeEvent',
        body: {
          type: 'heal',
          diff: delta,
        },
      })
    }
    if (this.isMine) {
      this.progress_manager.pressing = (delta_ms) => {
        healHP(delta_ms)
      }
    }

    {
      const HPBarContainer = new PIXI.Container()
      HPBarContainer.position.set(0, 0)
      this.container.addChild(HPBarContainer)

      if (this.isMine) {
        this.progress_manager.setHandler(HPBarContainer)
      }
      {
        const HPBarBackground = new PIXI.Sprite(PIXI.Texture.WHITE)
        HPBarBackground.width = 520
        HPBarBackground.height = 48
        HPBarBackground.tint = 0xffffff
        HPBarBackground.position.set(0, 0)
        HPBarContainer.addChild(HPBarBackground)
      }
      {
        const HPBarPadding = this.isMine ? ([6, 6] as const) : ([0, 0] as const)
        const HPBarContentSize = [
          520 - HPBarPadding[0] * 2,
          48 - HPBarPadding[1] * 2,
        ] as const

        const HPBarContentContainer = new PIXI.Container()
        HPBarContentContainer.position.set(...HPBarPadding)
        HPBarContainer.addChild(HPBarContentContainer)

        {
          const HPBarContentBackground = new PIXI.Sprite(PIXI.Texture.WHITE)
          HPBarContentBackground.width = HPBarContentSize[0]
          HPBarContentBackground.height = HPBarContentSize[1]
          HPBarContentBackground.tint = 0xd9d9d9
          HPBarContentBackground.position.set(0, 0)
          HPBarContentContainer.addChild(HPBarContentBackground)
        }
        {
          const HPBarContent = new PIXI.Sprite(PIXI.Texture.WHITE)
          HPBarContent.width = HPBarContentSize[0]
          HPBarContent.height = HPBarContentSize[1]
          HPBarContent.tint = 0x2cfe4e
          HPBarContent.position.set(0, 0)
          HPBarContentContainer.addChild(HPBarContent)
        }
        if (this.isMine) {
          const HPBarContentMask = new PIXI.Graphics()
          HPBarContentMask.beginFill(0xffffff)
          HPBarContentMask.drawRoundedRect(
            0,
            0,
            HPBarContentSize[0],
            HPBarContentSize[1],
            8,
          )
          HPBarContentMask.endFill()
          HPBarContentContainer.addChild(HPBarContentMask)
          HPBarContentContainer.mask = HPBarContentMask
        }
      }
      {
        const HPBarMask = new PIXI.Graphics()
        HPBarMask.beginFill(0xffffff)
        HPBarMask.drawRoundedRect(0, 0, 520, 48, 12)
        HPBarMask.endFill()
        HPBarContainer.addChild(HPBarMask)
        HPBarContainer.mask = HPBarMask
      }
    }
    {
      const BoardContainer = new PIXI.Container()
      BoardContainer.position.set(0, 48 + 12)
      this.container.addChild(BoardContainer)
      {
        const BoardBackground = new PIXI.Sprite(PIXI.Texture.WHITE)
        BoardBackground.width = 520
        BoardBackground.height = 800
        BoardBackground.tint = 0xf9f5ea
        BoardBackground.position.set(0, 0)
        BoardBackground.zIndex = Board.zIndices.background
        BoardContainer.addChild(BoardBackground)
      }
      {
        this.rails.forEach((rail) => {
          rail.render.zIndex = Board.zIndices.rails
          BoardContainer.addChild(rail.render)
        })
      }
      {
        // TODO: あとで消す
        const SafetyLine = new PIXI.Sprite(PIXI.Texture.WHITE)
        SafetyLine.width = 520
        SafetyLine.height = 4
        SafetyLine.tint = 0x000000
        SafetyLine.position.set(0, SAFETY_LENGTH - 2)
        SafetyLine.zIndex = Board.zIndices.train
        BoardContainer.addChild(SafetyLine)
      }
      {
        const BoardMask = new PIXI.Graphics()
        BoardMask.beginFill(0xffffff)
        BoardMask.drawRoundedRect(0, 0, 520, 800, 12)
        BoardMask.endFill()
        BoardContainer.addChild(BoardMask)
        BoardContainer.mask = BoardMask
      }
    }
    {
      // TODO
      const GameOveredMask = new PIXI.Sprite(PIXI.Texture.WHITE)
      GameOveredMask.width = 520
      GameOveredMask.height = 848
      GameOveredMask.tint = 0x000000
      GameOveredMask.position.set(0, 0)
      GameOveredMask.alpha = 0.5
      GameOveredMask.visible = false
      this.container.addChild(GameOveredMask)
    }
  }

  public update_render(timing_ms: number): void {
    this.rails.forEach((rail, idx) => {
      rail.update_render(timing_ms)
      rail.render.x =
        (520 - Board.railLayout.width * 7 - Board.railLayout.gap_x * 6) / 2 +
        idx * (Board.railLayout.width + Board.railLayout.gap_x)
    })

    if (this.isGameOver) {
      this.container.getChildAt(2).visible = true
    }
  }

  private clear(): void {
    this.container.children.forEach((child) => {
      child.destroy()
    })
  }
}
