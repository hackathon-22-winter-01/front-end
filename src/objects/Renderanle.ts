import * as PIXI from 'pixi.js'

export interface Renderable {
  get render(): PIXI.DisplayObject
}
