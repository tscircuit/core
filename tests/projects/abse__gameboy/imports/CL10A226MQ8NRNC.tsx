import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"]
} as const

export const CL10A226MQ8NRNC = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C59461"
  ]
}}
      manufacturerPartNumber="CL10A226MQ8NRNC"
      footprint={<footprint>
        <smtpad portHints={["pin2"]} pcbX="0.700024mm" pcbY="0mm" width="0.7999984mm" height="0.8999982mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-0.700024mm" pcbY="0mm" width="0.7999984mm" height="0.8999982mm" shape="rect" />
<silkscreenpath route={[{"x":-0.2801873999999316,"y":-0.7095743999998376},{"x":-1.080160400000068,"y":-0.7095743999998376}]} />
<silkscreenpath route={[{"x":0.28026359999989836,"y":-0.7100315999998656},{"x":1.080236599999921,"y":-0.7100315999998656}]} />
<silkscreenpath route={[{"x":-0.2801873999999316,"y":0.7101078000000598},{"x":-1.080160400000068,"y":0.7101078000000598}]} />
<silkscreenpath route={[{"x":0.28026359999989836,"y":0.7096252000001186},{"x":1.080236599999921,"y":0.7096252000001186}]} />
<silkscreenpath route={[{"x":-1.3899134000000686,"y":-0.3997452000000976},{"x":-1.3899134000000686,"y":0.40030400000000554}]} />
<silkscreenpath route={[{"x":1.3900149999998348,"y":0.39977060000001075},{"x":1.3900149999998348,"y":-0.4002531999999519}]} />
<silkscreenpath route={[{"x":1.080185799999981,"y":0.7096252000001186},{"x":1.299277109074751,"y":0.6188693482574763},{"x":1.3900149999998348,"y":0.39977060000001075}]} />
<silkscreenpath route={[{"x":1.3900149999998348,"y":-0.40020240000012564},{"x":1.2992681283295724,"y":-0.6192847283296032},{"x":1.080185799999981,"y":-0.7100315999998656}]} />
<silkscreenpath route={[{"x":-1.0801096000000143,"y":-0.7095743999998376},{"x":-1.2991755087698493,"y":-0.6188185485625581},{"x":-1.3899134000000686,"y":-0.3997452000000976}]} />
<silkscreenpath route={[{"x":-1.3899134000000686,"y":0.40022780000003877},{"x":-1.2991934705021322,"y":0.6193339880503572},{"x":-1.0801096000000143,"y":0.7101078000000598}]} />
<silkscreentext text="{NAME}" pcbX="-0.0127mm" pcbY="1.7112mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.647000000000162,"y":0.9612000000000762},{"x":1.6216000000000577,"y":0.9612000000000762},{"x":1.6216000000000577,"y":-0.9611999999999625},{"x":-1.647000000000162,"y":-0.9611999999999625},{"x":-1.647000000000162,"y":0.9612000000000762}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C59461.obj?uuid=ac9b32e974bc448eab36b1293f859dcb",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C59461.step?uuid=ac9b32e974bc448eab36b1293f859dcb",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.4 },
      }}
      {...props}
    />
  )
}