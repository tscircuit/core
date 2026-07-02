import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"]
} as const

export const SMMS0630_220M = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C128694"
  ]
}}
      manufacturerPartNumber="SMMS0630_220M"
      footprint={<footprint>
        <smtpad portHints={["pin2"]} pcbX="3.077972mm" pcbY="0mm" width="2.523998mm" height="3.120009mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-3.077972mm" pcbY="0mm" width="2.523998mm" height="3.120009mm" shape="rect" />
<silkscreenpath route={[{"x":-3.5761929999999893,"y":1.7123917999999776},{"x":-3.5761929999999893,"y":3.3761934000000338},{"x":3.5761929999998756,"y":3.3761934000000338},{"x":3.5761929999998756,"y":1.7123917999999776}]} />
<silkscreenpath route={[{"x":-3.5761929999999893,"y":-1.7123917999999776},{"x":-3.5761929999999893,"y":-3.3761934000000338},{"x":3.5761929999998756,"y":-3.3761934000000338},{"x":3.5761929999998756,"y":-1.7123917999999776}]} />
<silkscreentext text="{NAME}" pcbX="0mm" pcbY="4.3782mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-4.593399999999974,"y":3.6282000000001062},{"x":4.593399999999974,"y":3.6282000000001062},{"x":4.593399999999974,"y":-3.6281999999999925},{"x":-4.593399999999974,"y":-3.6281999999999925},{"x":-4.593399999999974,"y":3.6282000000001062}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C128694.obj?uuid=fd41bc67ad4c4c5f978bcfd3746341ff",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C128694.step?uuid=fd41bc67ad4c4c5f978bcfd3746341ff",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012700000070253736, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}