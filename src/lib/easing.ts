type EasingFunction = (
  t: number,
  duration?: number,
  base?: number,
  mag?: number,
) => number
type RangedEasingFunction = (
  t: number,
  range: [number, number],
  duration?: number,
) => number

const convert_to_range = (
  f: EasingFunction,
) => ((
  t: number,
  range: [number, number],
  duration: number = 1,
) => {
  const [start, end] = range
  return f(t, duration, start, end - start)
}) satisfies RangedEasingFunction

export const linear = ((
  t: number,
  duration: number = 1,
  base: number = 0,
  mag: number = 1,
) => {
  return (t / duration) * mag + base
}) satisfies EasingFunction
export const linearRange = convert_to_range(linear)

export const easeInQuad = ((
  t: number,
  duration: number = 1,
  base: number = 0,
  mag: number = 1,
) => {
  t /= duration
  return mag * t * t + base
}) satisfies EasingFunction
export const easeInQuadRange = convert_to_range(easeInQuad)

export const easeOutQuad = ((
  t: number,
  duration: number = 1,
  base: number = 0,
  mag: number = 1,
) => {
  t /= duration
  return -mag * t * (t - 2) + base
}) satisfies EasingFunction
export const easeOutQuadRange = convert_to_range(easeOutQuad)

export const easeInOutQuad = ((
  t: number,
  duration: number = 1,
  base: number = 0,
  mag: number = 1,
) => {
  t /= duration / 2
  if (t < 1) return (mag / 2) * t * t + base
  t--
  return (-mag / 2) * (t * (t - 2) - 1) + base
}) satisfies EasingFunction
export const easeInOutQuadRange = convert_to_range(easeInOutQuad)
