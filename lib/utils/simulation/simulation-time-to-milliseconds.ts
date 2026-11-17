/** Props are parsed into seconds or a unit interval relative to the bit rate. */
export function simulationTimeToMilliseconds(
  time: number | string,
  bitRate: number,
) {
  return (
    (typeof time === "string" ? Number.parseFloat(time) / bitRate : time) * 1000
  )
}
