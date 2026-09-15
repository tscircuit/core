import type { CapacitorProps } from "@tscircuit/props"

// Exact shared footprint imported from JLCPCB-linked EasyEDA records C1525 and
// C107369 on 2026-09-11. Supplier library data is not manufacturer qualification.
// Pin 1 is at X=-0.420116 mm, pin 2 at X=+0.420116 mm. Pads are
// 0.499999 x 0.540004 mm. Supplier courtyard: 2.2526 x 1.4906 mm.
// It is wider than the generic tscircuit 0402 courtyard; recheck placement.
export const Samsung0402Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin2"]}
      pcbX="0.420116mm"
      pcbY="0mm"
      width="0.499999mm"
      height="0.540004mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin1"]}
      pcbX="-0.420116mm"
      pcbY="0mm"
      width="0.499999mm"
      height="0.540004mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: -0.721385400000031, y: 0.49753519999990203 },
        { x: -0.22138640000002852, y: 0.49753519999990203 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -0.8738108000000011, y: -0.34724340000002485 },
        { x: -0.8738108000000011, y: 0.3451606000000993 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -0.22138640000002852, y: -0.4996433999999681 },
        { x: -0.721385400000031, y: -0.4996433999999681 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 0.7213853999999174, y: -0.4975097999999889 },
        { x: 0.22138639999991483, y: -0.4975097999999889 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 0.22138639999991483, y: 0.49961800000005496 },
        { x: 0.7213853999999174, y: 0.49961800000005496 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 0.8738108000000011, y: 0.34726880000005167 },
        { x: 0.8738108000000011, y: -0.3451606000000993 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 0.7213853999999174, y: 0.4996433999998544 },
        { x: 0.829148473452733, y: 0.4550064734527268 },
        { x: 0.8737853999998606, y: 0.34724340000002485 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 0.8737853999998606, y: -0.3451606000000993 },
        { x: 0.829148473452733, y: -0.4529236734526876 },
        { x: 0.7213853999999174, y: -0.49756059999992885 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -0.721385400000031, y: -0.4996433999997407 },
        { x: -0.829148473452733, y: -0.45500647345261314 },
        { x: -0.8737853999999743, y: -0.34724340000002485 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -0.8737853999999743, y: 0.3451606000000993 },
        { x: -0.829148473452733, y: 0.45292367345280127 },
        { x: -0.721385400000031, y: 0.49756060000004254 },
      ]}
    />
    <silkscreentext
      text="{NAME}"
      pcbX="0.0127mm"
      pcbY="1.508mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <courtyardoutline
      outline={[
        { x: -1.1136000000000195, y: 0.7580000000000382 },
        { x: 1.1389999999998963, y: 0.7580000000000382 },
        { x: 1.1389999999998963, y: -0.7326000000000477 },
        { x: -1.1136000000000195, y: -0.7326000000000477 },
        { x: -1.1136000000000195, y: 0.7580000000000382 },
      ]}
    />
  </footprint>
)

type SamsungCapPlacementProps = Omit<
  CapacitorProps,
  | "capacitance"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
  | "maxVoltageRating"
>

// Samsung CL05B104KO5NNNC: 100 nF, 16 V, X7R, 0402, +/-10%.
export const Samsung100nF0402 = (props: SamsungCapPlacementProps) => {
  const { name = "C1", ...restProps } = props
  return (
    <capacitor
      {...restProps}
      name={name}
      capacitance="100nF"
      maxVoltageRating="16V"
      manufacturerPartNumber="CL05B104KO5NNNC"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      footprint={<Samsung0402Footprint />}
    />
  )
}

// Samsung CL05A225KP5NSNC: 2.2 uF, 10 V, X5R, 0402, +/-10%.
export const Samsung2u2F0402 = (props: SamsungCapPlacementProps) => {
  const { name = "C1", ...restProps } = props
  return (
    <capacitor
      {...restProps}
      name={name}
      capacitance="2.2uF"
      maxVoltageRating="10V"
      manufacturerPartNumber="CL05A225KP5NSNC"
      supplierPartNumbers={{ jlcpcb: ["C107369"] }}
      footprint={<Samsung0402Footprint />}
    />
  )
}
