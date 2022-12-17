import * as PIXI from 'pixi.js'
import { WsManager } from '../lib/websocket'
import { Board } from './Board'
import { Card } from './Card'

import { Renderable } from './Renderable'

/**
 * 1秒間に進むピクセル数
 */

export class Game implements Renderable {
  private app: PIXI.Application

  myBoard: Board
  enemyBoard: Board[]
  wsManager: WsManager

  cards: Card[]
  private lastHoveredCardIndex: number = 0

  startTime: number

  private container: PIXI.Container

  private readonly player_list: {
    id: string
    name: string
  }[]
  private readonly my_id: string

  constructor(
    app: PIXI.Application,
    playerNum: number,
    wsManager: WsManager,
    startTime: number,
    player_list: {
      id: string
      name: string
    }[],
    my_id: string,
  ) {
    this.app = app

    this.player_list = player_list
    this.my_id = my_id

    this.myBoard = new Board(app, my_id, wsManager, true)
    this.enemyBoard = Array.from(
      { length: playerNum - 1 },
      (_, i) =>
        new Board(
          app,
          player_list.filter((x) => x.id !== my_id)[i].id,
          wsManager,
        ),
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

    // Background
    {
      const AllBackground = new PIXI.Sprite(PIXI.Texture.WHITE)
      AllBackground.width = 1444
      AllBackground.height = 892
      AllBackground.position.set(0, 0)
      AllBackground.tint = 0x00ffff
      this.container.addChild(AllBackground)
    }
    {
      const MyBoardWrapper = new PIXI.Container()
      MyBoardWrapper.position.set(0, 0)
      this.container.addChild(MyBoardWrapper)
      {
        const MyBoardBackground = new PIXI.Sprite(PIXI.Texture.WHITE)
        MyBoardBackground.width = 552
        MyBoardBackground.height = 892
        MyBoardBackground.position.set(0, 0)
        MyBoardBackground.tint = 0x71dbf2
        MyBoardWrapper.addChild(MyBoardBackground)
      }
      {
        MyBoardWrapper.addChild(this.myBoard.render)
        this.myBoard.render.position.set(16, 12)
      }
    }
    {
      const EnemyBoardWrapper = new PIXI.Container()
      EnemyBoardWrapper.position.set(552 + 16, 0)
      this.container.addChild(EnemyBoardWrapper)
      {
        const EnemyBoardBackground = new PIXI.Sprite(PIXI.Texture.WHITE)
        EnemyBoardBackground.width = 876
        EnemyBoardBackground.height = 552
        EnemyBoardBackground.position.set(0, 0)
        EnemyBoardBackground.tint = 0x71dbf2
        EnemyBoardWrapper.addChild(EnemyBoardBackground)
      }
      {
        this.enemyBoard.forEach((board, index) => {
          EnemyBoardWrapper.addChild(board.render)
          board.render.position.set(16 + 8 + (260 + 8 * 3) * index, 12)
          board.render.scale.set(0.5, 0.5)
        })
      }
    }
    {
      const CardWrapper = new PIXI.Container()
      CardWrapper.position.set(552 + 16, 552 + 16)
      this.container.addChild(CardWrapper)
      {
        const CardBackground = new PIXI.Sprite(PIXI.Texture.WHITE)
        CardBackground.width = 876
        CardBackground.height = 280
        CardBackground.position.set(0, 0)
        CardBackground.tint = 0x71dbf2
        CardWrapper.addChild(CardBackground)
      }
      {
        let sum_left = 16
        this.drawCard()
        this.drawCard()
        this.drawCard()
        this.cards.forEach((card, index) => {
          CardWrapper.addChild(card.render)
          card.render.position.set(sum_left, 12)
          if (index === this.lastHoveredCardIndex) {
            card.render.scale.set(4 / 3, 4 / 3)
            sum_left += (260 * 4) / 3
          } else {
            sum_left += 260
          }
          sum_left += 8
        })
      }
    }

    // this.container.addChild(this.myBoard.render)
    // this.myBoard.render.scale.set(0.5, 0.5)
    // this.myBoard.render.position.set(0, 0)

    // this.enemyBoard.forEach((board, index) => {
    //   this.container.addChild(board.render)
    //   board.render.scale.set(0.25, 0.25)
    //   board.render.position.set(300 + 160 * index, 0)
    // })

    // this.cards.forEach((card, index) => {
    //   this.container.addChild(card.render)
    //   card.render.position.set(120 + 120 * index, 0)
    // })

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
