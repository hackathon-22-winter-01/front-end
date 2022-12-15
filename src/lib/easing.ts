export const clamp = (t: number, range: readonly [number, number]) => {
  return Math.min(Math.max(t, range[0]), range[1])
}

export type EasingFunction = (
  t: number,
  duration?: number,
  base?: number,
  mag?: number,
) => number
export type RangedEasingFunction = (
  t: number,
  range: readonly [number, number],
  duration?: number,
) => number
export type CarryRangeEasingFunction = (
  t: number,
  duration?: number,
) => (range: readonly [number, number]) => number

const convert_to_range =
  (f: EasingFunction): RangedEasingFunction =>
  (t, range, duration = 1) => {
    const [start, end] = range
    return f(t, duration, start, end - start)
  }
const convert_to_carry_range =
  (f: EasingFunction): CarryRangeEasingFunction =>
  (t, duration = 1) => {
    return (range) => {
      return convert_to_range(f)(t, range, duration)
    }
  }

interface EaseFunctionGroup {
  at: EasingFunction
  range: CarryRangeEasingFunction
}
const EaseFunctionGroupC = (f: EasingFunction): EaseFunctionGroup => {
  return {
    at: f,
    range: convert_to_carry_range(f),
  }
}

const linearF: EasingFunction = (t, duration = 1, base = 0, mag = 1) => {
  t = clamp(t, [0, duration])
  return (t / duration) * mag + base
}
export const Linear = EaseFunctionGroupC(linearF)

const easeInQuadF: EasingFunction = (t, duration = 1, base = 0, mag = 1) => {
  t = clamp(t, [0, duration])
  t /= duration
  return mag * t * t + base
}
export const EaseIn = EaseFunctionGroupC(easeInQuadF)

const easeOutQuadF: EasingFunction = (t, duration = 1, base = 0, mag = 1) => {
  t = clamp(t, [0, duration])
  t /= duration
  return -mag * t * (t - 2) + base
}
export const EaseOut = EaseFunctionGroupC(easeOutQuadF)

const easeInOutQuadF: EasingFunction = (t, duration = 1, base = 0, mag = 1) => {
  t = clamp(t, [0, duration])
  t /= duration / 2
  if (t < 1) return (mag / 2) * t * t + base
  t--
  return (-mag / 2) * (t * (t - 2) - 1) + base
}
export const EaseInOut = EaseFunctionGroupC(easeInOutQuadF)
