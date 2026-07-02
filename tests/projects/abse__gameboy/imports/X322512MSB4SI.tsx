import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["OSC1"],
  pin2: ["GND1"],
  pin3: ["OSC2"],
  pin4: ["GND2"]
} as const

export const X322512MSB4SI = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C9002"
  ]
}}
      manufacturerPartNumber="X322512MSB4SI"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-1.100074mm" pcbY="-0.850011mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="1.100074mm" pcbY="-0.850011mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="1.100074mm" pcbY="0.850011mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-1.100074mm" pcbY="0.850011mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />
<silkscreenpath route={[{"x":-2.028596400000083,"y":-1.6784827999999834},{"x":-2.028596400000083,"y":1.678736800000138},{"x":2.0285963999999694,"y":1.678736800000138},{"x":2.0285963999999694,"y":-1.6784827999999834},{"x":-2.028596400000083,"y":-1.6784827999999834}]} />
<silkscreenpath route={[{"x":-2.257196399999998,"y":-0.24988519999988057},{"x":-2.257196399999998,"y":-1.9070827999998983},{"x":-0.39999920000002476,"y":-1.9070827999998983}]} />
<silkscreentext text="{NAME}" pcbX="-0.1143mm" pcbY="2.676527mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-2.5106000000000677,"y":1.9265270000000783},{"x":2.2819999999999254,"y":1.9265270000000783},{"x":2.2819999999999254,"y":-2.1548729999999523},{"x":-2.5106000000000677,"y":-2.1548729999999523},{"x":-2.5106000000000677,"y":1.9265270000000783}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C9002.obj?uuid=02485e56ba8d4732a26526d2983fc729",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C9002.step?uuid=02485e56ba8d4732a26526d2983fc729",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}