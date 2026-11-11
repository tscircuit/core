import type { ReactNode } from "react"
import { differentialPairPathPads } from "./differential-pair-path-pads"

export function DifferentialPairValidationBoard({
  children,
}: { children?: ReactNode }) {
  return (
    <board width={24} height={14} schematicDisabled routingDisabled>
      <chip name="J1" pcbX={-7} footprint={differentialPairPathPads()} />
      <chip name="ESD" footprint={differentialPairPathPads()} />
      <chip name="MCU" pcbX={7} footprint={differentialPairPathPads()} />
      <trace name="DP1" from=".J1 > .pin1" to=".ESD > .pin1" />
      <trace name="DP2" from=".ESD > .pin1" to=".MCU > .pin1" />
      <trace name="DM1" from=".J1 > .pin2" to=".ESD > .pin2" />
      <trace name="DM2" from=".ESD > .pin2" to=".MCU > .pin2" />
      {children}
    </board>
  )
}
