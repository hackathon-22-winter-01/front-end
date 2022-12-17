export const delta_to_ms = (delta: number): number => {
  // [delta = 1] == [1 / 60 sec]
  return (delta * 1000) / 60
}
