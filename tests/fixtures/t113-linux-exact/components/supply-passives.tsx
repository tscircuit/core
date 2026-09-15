import type { CapacitorProps, ResistorProps } from "@tscircuit/props"

// Exact JLCPCB-linked EasyEDA footprints downloaded on 2026-09-11.
// These are supplier library lands, not independent manufacturer qualification.
// Copper pad geometry and pin numbering are preserved verbatim.

export const Murata10uF0805Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin2"]}
      pcbX="0.999998mm"
      pcbY="0mm"
      width="1.4100048mm"
      height="1.35001mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin1"]}
      pcbX="-0.999998mm"
      pcbY="0mm"
      width="1.4100048mm"
      height="1.35001mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: 1.8111977999999453, y: 0.9036049999999705 },
        { x: 0.4011929999999211, y: 0.9036049999999705 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 0.4011929999999211, y: -0.9036049999999705 },
        { x: 1.8111977999999453, y: -0.9036049999999705 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 1.9635978000000023, y: -0.7512050000000272 },
        { x: 1.9635978000000023, y: 0.7512050000000272 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -1.811197800000059, y: 0.9036049999999705 },
        { x: -0.40119300000003477, y: 0.9036049999999705 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -0.40119300000003477, y: -0.9036049999999705 },
        { x: -1.811197800000059, y: -0.9036049999999705 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -1.9635978000000023, y: -0.7512050000000272 },
        { x: -1.9635978000000023, y: 0.7512050000000272 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 1.8111977999999453, y: -0.9036049999997431 },
        { x: 1.918960873452761, y: -0.8589680734526155 },
        { x: 1.9635977999998886, y: -0.7512050000000272 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 1.9635977999998886, y: 0.7512050000000272 },
        { x: 1.918960873452761, y: 0.8589680734527292 },
        { x: 1.8111977999999453, y: 0.9036049999998568 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -1.811197800000059, y: -0.9036049999997431 },
        { x: -1.9189608734528747, y: -0.8589680734526155 },
        { x: -1.9635978000000023, y: -0.7512050000000272 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -1.9635978000000023, y: 0.7512050000000272 },
        { x: -1.9189608734528747, y: 0.8589680734527292 },
        { x: -1.811197800000059, y: 0.9036049999998568 },
      ]}
    />
    <silkscreentext
      text="{NAME}"
      pcbX="0.0127mm"
      pcbY="1.9144mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <courtyardoutline
      outline={[
        { x: -2.205799999999954, y: 1.1644000000000005 },
        { x: 2.2311999999999443, y: 1.1644000000000005 },
        { x: 2.2311999999999443, y: -1.13900000000001 },
        { x: -2.205799999999954, y: -1.13900000000001 },
        { x: -2.205799999999954, y: 1.1644000000000005 },
      ]}
    />
  </footprint>
)

type Murata10uF0805Props = Omit<
  CapacitorProps,
  | "capacitance"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
  | "maxVoltageRating"
>
export const Murata10uF0805 = (props: Murata10uF0805Props) => {
  const { name = "C1", ...restProps } = props
  return (
    <capacitor
      {...restProps}
      name={name}
      capacitance="10uF"
      maxVoltageRating="16V"
      manufacturerPartNumber="GRM21BR71C106KE51L"
      supplierPartNumbers={{ jlcpcb: ["C408142"] }}
      footprint={<Murata10uF0805Footprint />}
    />
  )
}

export const Samsung4u7F0805Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin2"]}
      pcbX="0.999998mm"
      pcbY="0mm"
      width="1.4100048mm"
      height="1.35001mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin1"]}
      pcbX="-0.999998mm"
      pcbY="0mm"
      width="1.4100048mm"
      height="1.35001mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: 1.8111977999999453, y: 0.9036049999999705 },
        { x: 0.4011929999999211, y: 0.9036049999999705 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 0.4011929999999211, y: -0.9036049999999705 },
        { x: 1.8111977999999453, y: -0.9036049999999705 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 1.9635978000000023, y: -0.7512050000000272 },
        { x: 1.9635978000000023, y: 0.7512050000000272 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -1.811197800000059, y: 0.9036049999999705 },
        { x: -0.40119300000003477, y: 0.9036049999999705 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -0.40119300000003477, y: -0.9036049999999705 },
        { x: -1.811197800000059, y: -0.9036049999999705 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -1.9635978000000023, y: -0.7512050000000272 },
        { x: -1.9635978000000023, y: 0.7512050000000272 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 1.8111977999999453, y: -0.9036049999997431 },
        { x: 1.918960873452761, y: -0.8589680734526155 },
        { x: 1.9635977999998886, y: -0.7512050000000272 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 1.9635977999998886, y: 0.7512050000000272 },
        { x: 1.918960873452761, y: 0.8589680734527292 },
        { x: 1.8111977999999453, y: 0.9036049999998568 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -1.811197800000059, y: -0.9036049999997431 },
        { x: -1.9189608734528747, y: -0.8589680734526155 },
        { x: -1.9635978000000023, y: -0.7512050000000272 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -1.9635978000000023, y: 0.7512050000000272 },
        { x: -1.9189608734528747, y: 0.8589680734527292 },
        { x: -1.811197800000059, y: 0.9036049999998568 },
      ]}
    />
    <silkscreentext
      text="{NAME}"
      pcbX="0.0127mm"
      pcbY="1.9144mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <courtyardoutline
      outline={[
        { x: -2.205799999999954, y: 1.1644000000000005 },
        { x: 2.2311999999999443, y: 1.1644000000000005 },
        { x: 2.2311999999999443, y: -1.13900000000001 },
        { x: -2.205799999999954, y: -1.13900000000001 },
        { x: -2.205799999999954, y: 1.1644000000000005 },
      ]}
    />
  </footprint>
)

type Samsung4u7F0805Props = Omit<
  CapacitorProps,
  | "capacitance"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
  | "maxVoltageRating"
>
export const Samsung4u7F0805 = (props: Samsung4u7F0805Props) => {
  const { name = "C1", ...restProps } = props
  return (
    <capacitor
      {...restProps}
      name={name}
      capacitance="4.7uF"
      maxVoltageRating="25V"
      manufacturerPartNumber="CL21B475KAFNNNE"
      supplierPartNumbers={{ jlcpcb: ["C98195"] }}
      footprint={<Samsung4u7F0805Footprint />}
    />
  )
}

export const UniRoyal1k5Ohm0402Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin2"]}
      pcbX="0.432816mm"
      pcbY="0mm"
      width="0.565658mm"
      height="0.540004mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin1"]}
      pcbX="-0.432816mm"
      pcbY="0mm"
      width="0.565658mm"
      height="0.540004mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: -0.22621240000012222, y: -0.4986020000000053 },
        { x: -0.9442450000001372, y: -0.4986020000000053 },
        { x: -0.9442450000001372, y: 0.498602000000119 },
        { x: -0.22621240000012222, y: 0.498602000000119 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 0.22621240000000853, y: -0.4986020000000053 },
        { x: 0.9442449999999099, y: -0.4986020000000053 },
        { x: 0.9442449999999099, y: 0.498602000000119 },
        { x: 0.22621240000000853, y: 0.498602000000119 },
      ]}
    />
    <silkscreentext
      text="{NAME}"
      pcbX="0mm"
      pcbY="1.508mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <courtyardoutline
      outline={[
        { x: -1.1897999999998774, y: 0.7580000000000382 },
        { x: 1.189799999999991, y: 0.7580000000000382 },
        { x: 1.189799999999991, y: -0.7326000000000477 },
        { x: -1.1897999999998774, y: -0.7326000000000477 },
        { x: -1.1897999999998774, y: 0.7580000000000382 },
      ]}
    />
  </footprint>
)

type UniRoyal1k5Ohm0402Props = Omit<
  ResistorProps,
  "resistance" | "footprint" | "manufacturerPartNumber" | "supplierPartNumbers"
>
export const UniRoyal1k5Ohm0402 = (props: UniRoyal1k5Ohm0402Props) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="1.5kohm"
      manufacturerPartNumber="0402WGF1501TCE"
      supplierPartNumbers={{ jlcpcb: ["C25867"] }}
      footprint={<UniRoyal1k5Ohm0402Footprint />}
    />
  )
}
