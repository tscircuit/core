import type { ResistorProps } from "@tscircuit/props"
import { Yageo45k3Ohm0603Footprint } from "./buck-passives"

// Exact JLCPCB-linked EasyEDA footprint imported for C326729 on 2026-09-12.
// Its geometry matches the other Yageo RT0603 precision resistors used here.
type PrecisionResistorProps = Omit<
  ResistorProps,
  | "resistance"
  | "tolerance"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>

export const Yageo24kOhm0603 = (props: PrecisionResistorProps) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="24kohm"
      tolerance="0.1%"
      manufacturerPartNumber="RT0603BRD0724KL"
      supplierPartNumbers={{ jlcpcb: ["C326729"] }}
      footprint={<Yageo45k3Ohm0603Footprint />}
    />
  )
}
