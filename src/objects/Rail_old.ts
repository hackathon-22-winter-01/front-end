import * as PIXI from 'pixi.js'
import { EaseIn, EaseOut } from '../lib/easing'
import { unreachable } from '../lib/types'

type ColorTree = {
  [key: string]: number | ColorTree
}
const Color = {
  rail: {
    sleeper: 0x85471f,
    rail: 0x583e30,
  },
} as const satisfies ColorTree

export interface Rail {
  init_render(): void
  get render(): PIXI.DisplayObject
  init_animation(duration_ms: number): void
  update_animation(dt: number): boolean
}

export type RailType = 'straight' | 'curve' | 'branch_right' | 'branch_left'

export class StraightRail implements Rail {
  protected rail: PIXI.Graphics
  protected animation_progress_ms: number
  protected animation_duration_ms: number

  constructor() {
    this.rail = new PIXI.Graphics()

    this.animation_progress_ms = 0
    this.animation_duration_ms = 0

    this.init_render()
  }

  public init_render() {
    this.rail.clear()
    this.rail.lineStyle(9, Color.rail.sleeper)
    this.rail.moveTo(0, 7.5)
    this.rail.lineTo(40, 7.5)
    this.rail.moveTo(0, 20.5)
    this.rail.lineTo(40, 20.5)
    this.rail.moveTo(0, 33.5)
    this.rail.lineTo(40, 33.5)

    this.rail.lineStyle(8, Color.rail.rail)
    this.rail.moveTo(9, 0)
    this.rail.lineTo(9, 40)
    this.rail.moveTo(31, 0)
    this.rail.lineTo(31, 40)
  }

  public get render(): PIXI.Graphics {
    return this.rail
  }

  public init_animation(duration_ms: number) {
    this.animation_progress_ms = 0
    this.animation_duration_ms = duration_ms
    this.rail.clear()
  }

  protected update_progress(delta_ms: number): number | null {
    if (this.animation_duration_ms === 0) {
      return null
    }

    this.animation_progress_ms += delta_ms
    if (this.animation_progress_ms >= this.animation_duration_ms) {
      this.animation_progress_ms = 0
      this.animation_duration_ms = 0
      this.init_render()
      return null
    }

    return this.animation_progress_ms / this.animation_duration_ms
  }

  public set_render_progress(progress: number) {
    const progress_by_step = progress * 70

    this.rail.clear()
    this.rail.lineStyle(9, Color.rail.sleeper)
    {
      const ease = EaseOut.range(progress_by_step, 30)
      this.rail.moveTo(ease([20, 0]), 33.5)
      this.rail.lineTo(ease([65, 40]), 33.5)
    }
    if (progress_by_step >= 10) {
      const ease = EaseOut.range(progress_by_step - 10, 30)
      this.rail.moveTo(ease([20, 0]), 20.5)
      this.rail.lineTo(ease([65, 40]), 20.5)
    }
    if (progress_by_step >= 20) {
      const ease = EaseOut.range(progress_by_step - 20, 30)
      this.rail.moveTo(ease([20, 0]), 7.5)
      this.rail.lineTo(ease([65, 40]), 7.5)
    }

    this.rail.lineStyle(8, Color.rail.rail)
    if (progress_by_step < 40) {
      // nop
    } else if (progress_by_step < 50) {
      const ease = EaseIn.range(progress_by_step - 40, 10)

      this.rail.moveTo(9, ease([-6, 4]))
      this.rail.lineTo(9, ease([37, 42]))
      this.rail.moveTo(31, ease([-6, 4]))
      this.rail.lineTo(31, ease([37, 42]))
    } else if (progress_by_step < 60) {
      const ease = EaseOut.range(progress_by_step - 50, 10)

      this.rail.moveTo(9, ease([4, -3]))
      this.rail.lineTo(9, ease([42, 38]))
      this.rail.moveTo(31, ease([4, -3]))
      this.rail.lineTo(31, ease([42, 38]))
    } else {
      const ease = EaseOut.range(progress_by_step - 60, 10)

      this.rail.moveTo(9, ease([-3, 0]))
      this.rail.lineTo(9, ease([38, 40]))
      this.rail.moveTo(31, ease([-3, 0]))
      this.rail.lineTo(31, ease([38, 40]))
    }
  }

  public update_animation(delta_ms: number): boolean {
    const progress = this.update_progress(delta_ms)
    if (progress === null) {
      return false
    }

    this.set_render_progress(progress)
    return true
  }
}

type CurveDirection = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right'
export class CurveRail extends StraightRail {
  private direction: CurveDirection

  constructor(direction: CurveDirection) {
    super()
    this.direction = direction
    this.init_render()
  }

  private draw_rail(
    left_top: {
      x: number
      y: number
    } = { x: 0, y: 0 },
  ) {
    const { x, y } = left_top
    switch (this.direction) {
      case 'bottom_right':
        this.rail.moveTo(9 + x, 40 + y)
        this.rail.arc(40 + x, 40 + y, 31, Math.PI, Math.PI * 1.5)
        this.rail.moveTo(31 + x, 40 + y)
        this.rail.arc(40 + x, 40 + y, 9, Math.PI, Math.PI * 1.5)
        break
      case 'bottom_left':
        this.rail.moveTo(9 + x, 40 + y)
        this.rail.arc(0 + x, 40 + y, 9, 0, Math.PI * 0.5, true)
        this.rail.moveTo(31 + x, 40 + y)
        this.rail.arc(0 + x, 40 + y, 31, 0, Math.PI * 0.5, true)
        break
      case 'top_left':
        this.rail.moveTo(0 + x, 9 + y)
        this.rail.arc(0 + x, 0 + y, 9, Math.PI * 0.5, Math.PI, true)
        this.rail.moveTo(0 + x, 31 + y)
        this.rail.arc(0 + x, 0 + y, 31, Math.PI * 0.5, Math.PI, true)
        break
      case 'top_right':
        this.rail.moveTo(40 + x, 9 + y)
        this.rail.arc(40 + x, 0 + y, 31, Math.PI * 1.5, 0)
        this.rail.moveTo(40 + x, 31 + y)
        this.rail.arc(40 + x, 0 + y, 9, Math.PI * 1.5, 0)
        break
      default:
        return unreachable(this.direction)
    }
  }

  public init_render() {
    this.rail.clear()
    this.rail.lineStyle(9, Color.rail.sleeper)
    switch (this.direction) {
      case 'bottom_right':
        this.rail.moveTo(1, 30)
        this.rail.lineTo(39, 36)
        this.rail.moveTo(10, 10)
        this.rail.lineTo(32, 32)
        this.rail.moveTo(30, 1)
        this.rail.lineTo(36, 39)
        break
      case 'bottom_left':
        this.rail.moveTo(0, 33.5)
        this.rail.lineTo(40, 33.5)
        this.rail.moveTo(36, 4)
        this.rail.lineTo(8, 32)
        this.rail.moveTo(6.5, 0)
        this.rail.lineTo(6.5, 40)
        break
      case 'top_left':
        this.rail.moveTo(6.5, 0)
        this.rail.lineTo(6.5, 40)
        this.rail.moveTo(36, 36)
        this.rail.lineTo(8, 8)
        this.rail.moveTo(0, 6.5)
        this.rail.lineTo(40, 6.5)
        break
      case 'top_right':
        this.rail.moveTo(33.5, 0)
        this.rail.lineTo(33.5, 40)
        this.rail.moveTo(4, 36)
        this.rail.lineTo(32, 8)
        this.rail.moveTo(0, 33.5)
        this.rail.lineTo(40, 33.5)
        break
      default:
        return unreachable(this.direction)
    }

    this.rail.lineStyle(8, Color.rail.rail)
    this.draw_rail()
  }

  public set_render_progress(progress: number) {
    const progress_by_step = progress * 70

    this.rail.clear()
    this.rail.lineStyle(9, Color.rail.sleeper)
    switch (this.direction) {
      case 'bottom_right': {
        {
          const ease = EaseOut.range(progress_by_step, 30)
          this.rail.moveTo(ease([-25, 0]), 33.5)
          this.rail.lineTo(ease([20, 40]), 33.5)
        }
        if (progress_by_step >= 10) {
          const ease = EaseOut.range(progress_by_step - 10, 30)
          this.rail.moveTo(ease([4 - 18, 4]), ease([4 - 18, 4]))
          this.rail.lineTo(ease([32 - 14, 32]), ease([32 - 14, 32]))
        }
        if (progress_by_step >= 20) {
          const ease = EaseOut.range(progress_by_step - 20, 30)
          this.rail.moveTo(33.5, ease([-25, 0]))
          this.rail.lineTo(33.5, ease([20, 40]))
        }
        break
      }
      case 'bottom_left': {
        {
          const ease = EaseOut.range(progress_by_step, 30)
          this.rail.moveTo(ease([20, 0]), 33.5)
          this.rail.lineTo(ease([65, 40]), 33.5)
        }
        if (progress_by_step >= 10) {
          const ease = EaseOut.range(progress_by_step - 10, 30)
          this.rail.moveTo(ease([32 + 18, 32]), ease([4 + 18, 4]))
          this.rail.lineTo(ease([4 + 14, 4]), ease([32 + 14, 32]))
        }
        if (progress_by_step >= 20) {
          const ease = EaseOut.range(progress_by_step - 20, 30)
          this.rail.moveTo(6.5, ease([20, 0]))
          this.rail.lineTo(6.5, ease([65, 40]))
        }
        break
      }
      case 'top_left': {
        // TODO
        throw new Error('not implemented')
      }
      case 'top_right': {
        // TODO
        throw new Error('not implemented')
      }
      default:
        return unreachable(this.direction)
    }

    this.rail.lineStyle(8, Color.rail.rail)
    if (progress_by_step < 40) {
      // nop
    } else if (progress_by_step < 50) {
      const ease = EaseIn.range(progress_by_step - 40, 10)
      this.draw_rail({
        x: 0,
        y: ease([-6, 4]),
      })
    } else if (progress_by_step < 60) {
      const ease = EaseOut.range(progress_by_step - 50, 10)
      this.draw_rail({
        x: 0,
        y: ease([4, -3]),
      })
    } else if (progress_by_step < 70) {
      const ease = EaseIn.range(progress_by_step - 60, 10)
      this.draw_rail({
        x: 0,
        y: ease([-3, 0]),
      })
    }
  }
}

// export class Rail {
//   private rail: PIXI.Graphics
// }
