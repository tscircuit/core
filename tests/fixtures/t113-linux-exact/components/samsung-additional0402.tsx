import type { CapacitorProps } from "@tscircuit/props"

// Exact JLC/EasyEDA footprint imported independently for C47339, C52923, C70464.
// All three complete footprints matched byte-for-byte on 2026-09-11.
// Pin 1: X=-0.420116 mm; pin 2: X=+0.420116 mm.
// Each pad: 0.499999 x 0.540004 mm. Preserve supplier courtyard dimensions.
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

// CL05A474KP5NNNC: 470nF, 10V, 0402.
export const Samsung470nF0402 = (props: SamsungCapPlacementProps) => {
  const { name = "C1", ...restProps } = props
  return (
    <capacitor
      {...restProps}
      name={name}
      capacitance="470nF"
      maxVoltageRating="10V"
      manufacturerPartNumber="CL05A474KP5NNNC"
      supplierPartNumbers={{ jlcpcb: ["C47339"] }}
      footprint={<Samsung0402Footprint />}
    />
  )
}

// CL05A105KA5NQNC: 1uF, 25V, 0402.
export const Samsung1uF0402 = (props: SamsungCapPlacementProps) => {
  const { name = "C1", ...restProps } = props
  return (
    <capacitor
      {...restProps}
      name={name}
      capacitance="1uF"
      maxVoltageRating="25V"
      manufacturerPartNumber="CL05A105KA5NQNC"
      supplierPartNumbers={{ jlcpcb: ["C52923"] }}
      footprint={<Samsung0402Footprint />}
    />
  )
}

// CL05C220JB5NNNC: 22pF, 50V, 0402.
export const Samsung22pF0402 = (props: SamsungCapPlacementProps) => {
  const { name = "C1", ...restProps } = props
  return (
    <capacitor
      {...restProps}
      name={name}
      capacitance="22pF"
      maxVoltageRating="50V"
      manufacturerPartNumber="CL05C220JB5NNNC"
      supplierPartNumbers={{ jlcpcb: ["C70464"] }}
      footprint={<Samsung0402Footprint />}
    />
  )
}
