import type { ResistorProps } from "@tscircuit/props"
import { Yageo45k3Ohm0603Footprint } from "./buck-passives"

// Exact JLCPCB-linked EasyEDA imports downloaded 2026-09-11. Both supplier
// records have pad, silkscreen and courtyard geometry identical to the exported
// C861415 footprint component reused here; identity, value and tolerance remain
// locked per wrapper. Network CAD models from the imports are intentionally omitted.
type PrecisionResistorProps = Omit<
  ResistorProps,
  | "resistance"
  | "tolerance"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>

export const Yageo66k5Ohm0603 = (props: PrecisionResistorProps) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="66.5kohm"
      tolerance="0.1%"
      manufacturerPartNumber="RT0603BRD0766K5L"
      supplierPartNumbers={{ jlcpcb: ["C861515"] }}
      footprint={<Yageo45k3Ohm0603Footprint />}
    />
  )
}

export const Yageo10k2Ohm0603 = (props: PrecisionResistorProps) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="10.2kohm"
      tolerance="0.1%"
      manufacturerPartNumber="RT0603BRD0710K2L"
      supplierPartNumbers={{ jlcpcb: ["C515735"] }}
      footprint={<Yageo45k3Ohm0603Footprint />}
    />
  )
}
