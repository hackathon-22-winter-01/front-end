import * as PIXI from 'pixi.js'

import { PressButton } from './PressButton'
import { Renderable } from './Renderable'

export class Card implements Renderable {
  private app: PIXI.Application
  private cardID: number

  private container: PIXI.Container

  private button: PressButton

  constructor(app: PIXI.Application, cardID: number) {
    this.app = app
    this.cardID = cardID

    this.container = new PIXI.Container()
    this.button = new PressButton(app, 1000)
    this.button.pressed = (this_) => {
      console.log('pressed')
      this_.reset_progress()
    }

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
