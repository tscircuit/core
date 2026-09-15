import type { InductorProps, ResistorProps } from "@tscircuit/props"
import { Yageo45k3Ohm0603Footprint } from "./buck-passives"

// Exact JLCPCB-linked EasyEDA footprints imported on 2026-09-12.
// Network CAD models from the imports are intentionally omitted.
export const Coilcraft1uH4020Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin1"]}
      pcbX="1.188974mm"
      pcbY="0mm"
      width="1.1999976mm"
      height="3.7999924mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX="-1.188974mm"
      pcbY="0mm"
      width="1.1999976mm"
      height="3.7999924mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: -1.99999600000001, y: 2.099995799999988 },
        { x: 2.099995799999988, y: 2.099995799999988 },
        { x: 2.099995799999988, y: -2.1999955999999656 },
        { x: -2.0999958000001016, y: -2.1999955999999656 },
        { x: -2.0999958000001016, y: 2.099995799999988 },
      ]}
    />
    <silkscreentext
      text="{NAME}"
      pcbX="0.3429mm"
      pcbY="3.1082mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <fabricationnotepath
      route={[
        { x: 1.3999972000000298, y: 1.4999970000000076 },
        { x: 1.299997400000052, y: 1.4999970000000076 },
        { x: 1.299997400000052, y: -1.4999970000000076 },
        { x: 1.3999972000000298, y: -1.4999970000000076 },
        { x: 1.3999972000000298, y: 1.4999970000000076 },
      ]}
      strokeWidth="0.254mm"
    />
    <courtyardoutline
      outline={[
        { x: -2.3582000000000107, y: 2.3582000000001244 },
        { x: 3.043999999999869, y: 2.3582000000001244 },
        { x: 3.043999999999869, y: -2.4343999999998687 },
        { x: -2.3582000000000107, y: -2.4343999999998687 },
        { x: -2.3582000000000107, y: 2.3582000000001244 },
      ]}
    />
  </footprint>
)

type BuckInductorProps = Omit<
  InductorProps,
  | "inductance"
  | "maxCurrentRating"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>

export const Coilcraft1uH4020 = (props: BuckInductorProps) => {
  const { name = "L1", ...restProps } = props
  return (
    <inductor
      {...restProps}
      name={name}
      inductance="1uH"
      maxCurrentRating="5.4A"
      manufacturerPartNumber="XFL4020-102MEC"
      supplierPartNumbers={{ jlcpcb: ["C5355380"] }}
      footprint={<Coilcraft1uH4020Footprint />}
    />
  )
}

type PrecisionResistorProps = Omit<
  ResistorProps,
  | "resistance"
  | "tolerance"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>

export const Yageo100kOhm0603 = (props: PrecisionResistorProps) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="100kohm"
      tolerance="0.1%"
      manufacturerPartNumber="RT0603BRD07100KL"
      supplierPartNumbers={{ jlcpcb: ["C122538"] }}
      footprint={<Yageo45k3Ohm0603Footprint />}
    />
  )
}
