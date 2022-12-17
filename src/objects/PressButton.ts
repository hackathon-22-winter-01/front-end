import * as PIXI from 'pixi.js'
import { delta_to_ms } from '../lib/converter'
import { Renderable } from './Renderable'
import ReactSvg from '../pages/assets/react.svg'

export class PressButton implements Renderable {
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
    InnerContainer.x = 48 + (Math.random() - 0.5) * 6
    InnerContainer.y = 48 + (Math.random() - 0.5) * 6
    InnerContainer.scale.set(0.9)

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
