import type { ReactNode } from "react"
import { Inverter, Octal } from "./parts"

export const StrobeBoard = ({ children }: { children: ReactNode }) => (
  <board routingDisabled fabricatorPreset="jlcpcb_standard">
    <Inverter name="TX0" pcbX={-10} pcbY={4} />
    <Inverter name="TX1" pcbX={-10} pcbY={-4} />
    <Octal />
    <trace from=".TX0 > .Y" to=".RX > .A1" />
    <trace from=".TX1 > .Y" to=".RX > .A2" />
    {children}
  </board>
)
