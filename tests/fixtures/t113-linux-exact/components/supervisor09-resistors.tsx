import type { ResistorProps } from "@tscircuit/props"
import { Yageo45k3Ohm0603Footprint } from "./buck-passives"

// Exact JLCPCB-linked EasyEDA footprint imported on 2026-09-12. Its pad,
// silkscreen and courtyard geometry matches the Yageo 0603 footprint reused
// here. The network CAD model is intentionally omitted.
type PrecisionResistorProps = Omit<
  ResistorProps,
  | "resistance"
  | "tolerance"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>

export const Yageo10k5Ohm0603 = (props: PrecisionResistorProps) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="10.5kohm"
      tolerance="0.1%"
      manufacturerPartNumber="RT0603BRD0710K5L"
      supplierPartNumbers={{ jlcpcb: ["C861077"] }}
      footprint={<Yageo45k3Ohm0603Footprint />}
    />
  )
}
