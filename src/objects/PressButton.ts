import * as PIXI from 'pixi.js'
import { Renderable } from './Renderable'
import ReactSvg from '../pages/assets/react.svg'
import { PressProgressManager } from '../lib/pressManager'

export class PressButton implements Renderable {
  private progress_manager: PressProgressManager

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

  constructor(app: PIXI.Application, needTime: number | null) {
    this.progress_manager = new PressProgressManager(app, needTime)

    this.app = app

    this.container = new PIXI.Container()

    this.init_render()
  }

  set pressed(handler: (this_: PressProgressManager) => void) {
    this.progress_manager.pressed = handler
  }
  set pressing(handler: (
    delta_ms: number,
    this_: PressProgressManager,
  ) => void) {
    this.progress_manager.pressing = handler
  }

  get render(): PIXI.DisplayObject {
    return this.container
  }

  get progress(): number | null {
    return this.progress_manager.progress
  }

  get eventTarget(): EventTarget {
    return this.progress_manager.eventTarget
  }

  public reset_progress(): void {
    this.progress_manager.reset_progress()
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

    let delay = 0
    this.progress_manager.eventTarget.addEventListener('pressing', (event) => {
      const e = event as CustomEvent<number>
      delay += e.detail
      if (delay < 50) {
        return
      }
      delay %= 50
      const InnerContainer = this.container.getChildAt(0) as PIXI.Container
      InnerContainer.x = 48 + (Math.random() - 0.5) * 6
      InnerContainer.y = 48 + (Math.random() - 0.5) * 6
      InnerContainer.scale.set(0.9)
    })
    this.progress_manager.eventTarget.addEventListener('press_end', () => {
      const InnerContainer = this.container.getChildAt(0) as PIXI.Container
      InnerContainer.x = 48
      InnerContainer.y = 48
      InnerContainer.scale.set(1)
    })

    this.progress_manager.setHandler(this.container)

    this.progress_manager.eventTarget.addEventListener(
      'update_progress',
      (event) => {
        const e = event as CustomEvent<number>
        const progress = e.detail
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
        ButtonProgress.endFill()
      },
    )
  }

  private clear(): void {
    this.container.children.forEach((child) => {
      child.destroy()
    })
  }
}
