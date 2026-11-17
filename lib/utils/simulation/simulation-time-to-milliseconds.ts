/** Props are parsed into seconds or a unit interval relative to the bit rate. */
export function simulationTimeToMilliseconds(
  time: number | string,
  bitRate: number,
) {
  if (typeof time === "string")
    return (Number.parseFloat(time) / bitRate) * 1000
  return time * 1000
}
