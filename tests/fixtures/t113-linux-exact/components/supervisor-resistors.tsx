import type { ResistorProps } from "@tscircuit/props"

// Exact JLCPCB-linked EasyEDA footprints imported 2026-09-11.
// Supplier library geometry is distinct from manufacturer qualification.

export const Yageo31k6Ohm0603Footprint = () => (
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

type Yageo31k6Ohm0603Props = Omit<
  ResistorProps,
  | "resistance"
  | "tolerance"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>
export const Yageo31k6Ohm0603 = (props: Yageo31k6Ohm0603Props) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="31.6kohm"
      tolerance="0.1%"
      manufacturerPartNumber="RT0603BRD0731K6L"
      supplierPartNumbers={{ jlcpcb: ["C705766"] }}
      footprint={<Yageo31k6Ohm0603Footprint />}
    />
  )
}

export const Yageo10kOhm0402Footprint = () => (
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

type Yageo10kOhm0402Props = Omit<
  ResistorProps,
  | "resistance"
  | "tolerance"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>
export const Yageo10kOhm0402 = (props: Yageo10kOhm0402Props) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="10kohm"
      tolerance="0.1%"
      manufacturerPartNumber="RT0402BRD0710KL"
      supplierPartNumbers={{ jlcpcb: ["C190095"] }}
      footprint={<Yageo10kOhm0402Footprint />}
    />
  )
}

export const UniRoyal100kOhm0402Footprint = () => (
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

type UniRoyal100kOhm0402Props = Omit<
  ResistorProps,
  | "resistance"
  | "tolerance"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>
export const UniRoyal100kOhm0402 = (props: UniRoyal100kOhm0402Props) => {
  const { name = "R1", ...restProps } = props
  return (
    <resistor
      {...restProps}
      name={name}
      resistance="100kohm"
      tolerance="1%"
      manufacturerPartNumber="0402WGF1003TCE"
      supplierPartNumbers={{ jlcpcb: ["C25741"] }}
      footprint={<UniRoyal100kOhm0402Footprint />}
    />
  )
}
