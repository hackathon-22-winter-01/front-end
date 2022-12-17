import * as PIXI from 'pixi.js'
import { delta_to_ms } from './converter'

export class PressProgressManager {
  private app: PIXI.Application

  private needTime_ms: number | null = null
  private nowTime_ms: number = 0

  private isPressed: boolean = false
  private lastEventTime: number

  private pressed_handler?: (this_: PressProgressManager) => void
  private pressing_handler?: (
    delta_ms: number,
    this_: PressProgressManager,
  ) => void
  private update_progress_handler?: (
    progress: number,
    this_: PressProgressManager,
  ) => void

  eventTarget: EventTarget = new EventTarget()

  constructor(app: PIXI.Application, needTime_ms: number | null = null) {
    this.app = app
    this.needTime_ms = needTime_ms
    this.lastEventTime = Date.now()
  }

  set pressed(handler: (this_: PressProgressManager) => void) {
    this.pressed_handler = handler
  }
  set pressing(handler: (
    delta_ms: number,
    this_: PressProgressManager,
  ) => void) {
    this.pressing_handler = handler
  }
  set update_progress(handler: (
    progress: number,
    this_: PressProgressManager,
  ) => void) {
    this.update_progress_handler = handler
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

    if (this.needTime_ms === null) {
      return
    }

    if (this.nowTime_ms > this.needTime_ms) {
      return
    }

    this.nowTime_ms += delta_ms
    if (this.nowTime_ms > this.needTime_ms) {
      this.pressed_handler?.(this)
      this.eventTarget.dispatchEvent(new Event('pressed'))
    }
  }

  private on_press_end(): void {
    this.isPressed = false
    this.lastEventTime = Date.now()
    this.eventTarget.dispatchEvent(new Event('press_end'))
  }

  private on_not_pressing(delta_ms: number): void {
    if (this.isPressed) {
      this.isPressed = false
      this.lastEventTime = Date.now()
    }

    if (this.needTime_ms === null) {
      return
    }

    if (this.nowTime_ms === 0) {
      return
    }

    this.nowTime_ms -= delta_ms * 3
    if (this.nowTime_ms < 0) {
      this.nowTime_ms = 0
    }
  }

  public setHandler(target: PIXI.DisplayObject): void {
    target.interactive = true
    target.cursor = 'pointer'
    target
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
      this.update_progress_handler?.(progress, this)
      this.eventTarget.dispatchEvent(
        new CustomEvent('update_progress', { detail: progress }),
      )
    })
  }
}
