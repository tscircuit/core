import type { InductorProps, ResistorProps } from "@tscircuit/props"
import { Yageo45k3Ohm0603Footprint } from "./buck-passives"

// Exact JLCPCB-linked EasyEDA imports downloaded 2026-09-11. The two Yageo
// resistor records have geometry identical to the C861415 footprint reused
// below. Identity, electrical value and tolerance remain locked per wrapper.
// Network CAD models from the imports are intentionally omitted.
export const Coilcraft1u5H4020Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin2"]}
      pcbX="1.199896mm"
      pcbY="0mm"
      width="0.999998mm"
      height="3.7999924mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin1"]}
      pcbX="-1.199896mm"
      pcbY="0mm"
      width="0.999998mm"
      height="3.7999924mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: -2.0699984000000313, y: -1.8899886000000379 },
        { x: -2.0699984000000313, y: -2.0961858000000575 },
        { x: 2.0824443999999858, y: -2.0961858000000575 },
        { x: 2.080005999999912, y: -1.8999962000000323 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 2.0699983999999176, y: 1.8999962000000323 },
        { x: 2.0700999999999112, y: 2.0955000000000155 },
        { x: -2.08280000000002, y: 2.0955000000000155 },
        { x: -2.080006000000026, y: 1.8800064000000702 },
      ]}
    />
    <silkscreentext
      text="{NAME}"
      pcbX="0mm"
      pcbY="3.0828mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <courtyardoutline
      outline={[
        { x: -2.33280000000002, y: 2.33280000000002 },
        { x: 2.33280000000002, y: 2.33280000000002 },
        { x: 2.33280000000002, y: -2.3582000000000107 },
        { x: -2.33280000000002, y: -2.3582000000000107 },
        { x: -2.33280000000002, y: 2.33280000000002 },
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

export const Coilcraft1u5H4020 = (props: BuckInductorProps) => {
  const { name = "L1", ...restProps } = props
  return (
    <inductor
      {...restProps}
      name={name}
      inductance="1.5uH"
      maxCurrentRating="4.1A"
      manufacturerPartNumber="XFL4020-152MEC"
      supplierPartNumbers={{ jlcpcb: ["C3033018"] }}
      footprint={<Coilcraft1u5H4020Footprint />}
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

export const Yageo49k9Ohm0603 = (props: PrecisionResistorProps) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="49.9kohm"
      tolerance="0.1%"
      manufacturerPartNumber="RT0603BRD0749K9L"
      supplierPartNumbers={{ jlcpcb: ["C705780"] }}
      footprint={<Yageo45k3Ohm0603Footprint />}
    />
  )
}

export const Yageo33k2Ohm0603 = (props: PrecisionResistorProps) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="33.2kohm"
      tolerance="0.1%"
      manufacturerPartNumber="RT0603BRD0733K2L"
      supplierPartNumbers={{ jlcpcb: ["C705767"] }}
      footprint={<Yageo45k3Ohm0603Footprint />}
    />
  )
}
