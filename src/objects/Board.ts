import * as PIXI from 'pixi.js'
import { WsManager, WsReceive } from '../lib/websocket'
import { Rail } from './Rail'
import { Renderable } from './Renderable'

export class Board implements Renderable {
  static readonly DEFAULT_MAX_HP = 100

  private app: PIXI.Application

  private wsManager?: WsManager

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
    this.init_render()

    if (wsManager) {
      this.wsManager = wsManager
      this.wsManager.eventTarget.addEventListener('message', (event) => {
        const e = event as CustomEvent<WsReceive>
        this.ws_handler(e.detail)
      })
    }
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
      case 'blockCrashed': {
        const { body } = detail
        if (body.targetId !== this.ownerId) {
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

  private tick_handler?: () => void

  private init_render(): void {
    this.clear()
    if (this.tick_handler) {
      this.app.ticker.remove(this.tick_handler)
      this.tick_handler = undefined
    }

    {
      const HPBarContainer = new PIXI.Container()
      HPBarContainer.position.set(0, 0)
      this.container.addChild(HPBarContainer)
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
        const BoardMask = new PIXI.Graphics()
        BoardMask.beginFill(0xffffff)
        BoardMask.drawRoundedRect(0, 0, 520, 800, 12)
        BoardMask.endFill()
        BoardContainer.addChild(BoardMask)
        BoardContainer.mask = BoardMask
      }
    }
    // {
    //   const board = new PIXI.Graphics()
    //   board.beginFill(0xf9f5ea)
    //   board.drawRect(0, 0, 520, 800)
    //   board.endFill()
    //   board.zIndex = Board.zIndices.background
    //   this.container.addChild(board)
    // }

    // this.rails.forEach((rail) => {
    //   rail.render.zIndex = Board.zIndices.rails
    //   this.container.addChild(rail.render)
    // })

    // const ContainerMask = new PIXI.Graphics()
    // ContainerMask.beginFill(0xffffff)
    // ContainerMask.drawRoundedRect(0, 0, 520, 800, 12)
    // ContainerMask.endFill()
    // this.container.addChild(ContainerMask)
    // this.container.mask = ContainerMask
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
