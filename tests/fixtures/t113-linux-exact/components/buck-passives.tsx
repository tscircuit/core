import type {
  CapacitorProps,
  InductorProps,
  ResistorProps,
} from "@tscircuit/props"

// Exact JLCPCB-linked EasyEDA footprints downloaded 2026-09-11.
// Supplier library geometry is distinct from manufacturer land qualification.
// Coilcraft current limit below conservatively uses its 10% L-drop point at 25C.

export const Yageo45k3Ohm0603Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin2"]}
      pcbX="0.753364mm"
      pcbY="0mm"
      width="0.8064754mm"
      height="0.8640064mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin1"]}
      pcbX="-0.753364mm"
      pcbY="0mm"
      width="0.8064754mm"
      height="0.8640064mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: 0.42621199999996406, y: -0.6606031999999686 },
        { x: 1.3850873999999749, y: -0.6606031999999686 },
        { x: 1.3850873999999749, y: 0.6606031999999686 },
        { x: 0.42621199999996406, y: 0.6606031999999686 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -0.42621200000007775, y: -0.6606031999999686 },
        { x: -1.3850874000000886, y: -0.6606031999999686 },
        { x: -1.3850874000000886, y: 0.6606031999999686 },
        { x: -0.42621200000007775, y: 0.6606031999999686 },
      ]}
    />
    <silkscreentext
      text="{NAME}"
      pcbX="-0.0127mm"
      pcbY="1.6604mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <courtyardoutline
      outline={[
        { x: -1.647000000000162, y: 0.9103999999999814 },
        { x: 1.6216000000000577, y: 0.9103999999999814 },
        { x: 1.6216000000000577, y: -0.9103999999998678 },
        { x: -1.647000000000162, y: -0.9103999999998678 },
        { x: -1.647000000000162, y: 0.9103999999999814 },
      ]}
    />
  </footprint>
)

type Yageo45k3Ohm0603Props = Omit<
  ResistorProps,
  | "resistance"
  | "tolerance"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>
export const Yageo45k3Ohm0603 = (props: Yageo45k3Ohm0603Props) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="45.3kohm"
      tolerance="0.1%"
      manufacturerPartNumber="RT0603BRD0745K3L"
      supplierPartNumbers={{ jlcpcb: ["C861415"] }}
      footprint={<Yageo45k3Ohm0603Footprint />}
    />
  )
}

export const Coilcraft2u2H4020Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin1"]}
      pcbX="-1.18491mm"
      pcbY="0mm"
      width="0.999998mm"
      height="3.499993mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX="1.18491mm"
      pcbY="0mm"
      width="0.999998mm"
      height="3.499993mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: 1.99999600000001, y: 1.9999959999998964 },
        { x: 1.99999600000001, y: -1.9999959999998964 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -2.000021400000037, y: 1.9999959999998964 },
        { x: -2.000021400000037, y: -1.9999959999998964 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -2.000021400000037, y: -1.9999959999998964 },
        { x: 1.99999600000001, y: -1.9999959999998964 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -2.000021400000037, y: 1.9999959999998964 },
        { x: 1.99999600000001, y: 1.9999959999998964 },
      ]}
    />
    <silkscreentext
      text="{NAME}"
      pcbX="0mm"
      pcbY="3.0066mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <courtyardoutline
      outline={[
        { x: -2.26929999999993, y: 2.2566000000000486 },
        { x: 2.2693000000001575, y: 2.2566000000000486 },
        { x: 2.2693000000001575, y: -2.282000000000039 },
        { x: -2.26929999999993, y: -2.282000000000039 },
        { x: -2.26929999999993, y: 2.2566000000000486 },
      ]}
    />
  </footprint>
)

type Coilcraft2u2H4020Props = Omit<
  InductorProps,
  | "inductance"
  | "maxCurrentRating"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>
export const Coilcraft2u2H4020 = (props: Coilcraft2u2H4020Props) => {
  const { name = "L1", ...restProps } = props
  return (
    <inductor
      {...restProps}
      name={name}
      inductance="2.2uH"
      maxCurrentRating="3.1A"
      manufacturerPartNumber="XFL4020-222MEC"
      supplierPartNumbers={{ jlcpcb: ["C122469"] }}
      footprint={<Coilcraft2u2H4020Footprint />}
    />
  )
}

export const Samsung22uF1206Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin2"]}
      pcbX="1.59258mm"
      pcbY="0mm"
      width="1.485011mm"
      height="1.7279874mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin1"]}
      pcbX="-1.59258mm"
      pcbY="0mm"
      width="1.485011mm"
      height="1.7279874mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: 2.4111966000000393, y: 1.0926064000000224 },
        { x: 0.9262109999999666, y: 1.0926064000000224 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 0.9262109999999666, y: -1.0926063999999087 },
        { x: 2.4111966000000393, y: -1.0926063999999087 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 2.5635965999999826, y: -0.9402063999999655 },
        { x: 2.5635965999999826, y: 0.9402063999999655 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -2.411196600000153, y: 1.0926064000000224 },
        { x: -0.9262109999999666, y: 1.0926064000000224 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -0.9262109999999666, y: -1.0926063999999087 },
        { x: -2.411196600000153, y: -1.0926063999999087 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -2.5635966000000963, y: -0.9402063999999655 },
        { x: -2.5635966000000963, y: 0.9402063999999655 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 2.4111966000000393, y: -1.092606399999795 },
        { x: 2.5189596734527413, y: -1.0479694734526674 },
        { x: 2.5635965999999826, y: -0.9402063999999655 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 2.5635965999999826, y: 0.9402063999999655 },
        { x: 2.5189596734527413, y: 1.0479694734527811 },
        { x: 2.4111966000000393, y: 1.092606399999795 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -2.411196600000153, y: -1.092606399999795 },
        { x: -2.518959673452855, y: -1.0479694734526674 },
        { x: -2.5635966000000963, y: -0.9402063999999655 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -2.5635966000000963, y: 0.9402063999999655 },
        { x: -2.518959673452855, y: 1.0479694734527811 },
        { x: -2.411196600000153, y: 1.092606399999795 },
      ]}
    />
    <silkscreentext
      text="{NAME}"
      pcbX="0mm"
      pcbY="2.0922mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <courtyardoutline
      outline={[
        { x: -2.815400000000068, y: 1.342200000000048 },
        { x: 2.815399999999954, y: 1.342200000000048 },
        { x: 2.815399999999954, y: -1.3421999999999343 },
        { x: -2.815400000000068, y: -1.3421999999999343 },
        { x: -2.815400000000068, y: 1.342200000000048 },
      ]}
    />
  </footprint>
)

type Samsung22uF1206Props = Omit<
  CapacitorProps,
  | "capacitance"
  | "maxVoltageRating"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>
export const Samsung22uF1206 = (props: Samsung22uF1206Props) => {
  const { name = "C1", ...restProps } = props
  return (
    <capacitor
      {...restProps}
      name={name}
      capacitance="22uF"
      maxVoltageRating="25V"
      manufacturerPartNumber="CL31A226KAHNNNE"
      supplierPartNumbers={{ jlcpcb: ["C12891"] }}
      footprint={<Samsung22uF1206Footprint />}
    />
  )
}
