import { ReferenceLabel } from "../product/reference-label"
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"]
} as const

export const A_1206L050_33NR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <fuse currentRating="500mA" voltageRating="33V"
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <schematicrect schX={0} schY={0} width={0.4} height={0.16} strokeWidth={0.02} color="#A00000" />
          <port name="pin2" pinNumber={2} aliases={["2"]} direction="right" schX={0.4} schY={0} schStemLength={0.2} />
          <port name="pin1" pinNumber={1} aliases={["1"]} direction="left" schX={-0.4} schY={0} schStemLength={0.2} />
          <schematicpath points={[{"x":-0.2,"y":0},{"x":0.2,"y":0}]} strokeColor="#880000" />
          <schematictext schX={-0.001} schY={0.28} text="{NAME}" fontSize={0.2} anchor="bottom_center" />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C19193043"
  ]
}}
      manufacturerPartNumber="1206L050/33NR"
      footprint={<footprint>
        <smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin1"]} pcbX="-1.445006mm" pcbY="0mm" width="1.1900916mm" height="1.7279874mm" shape="rect" />
<smtpad solderMaskMargin="0.02mm" solderPasteMargin="0mm" portHints={["pin2"]} pcbX="1.445006mm" pcbY="0mm" width="1.1900916mm" height="1.7279874mm" shape="rect" />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-0.9261856000000108,"y":1.0926064000000082},{"x":-2.1163026000000116,"y":1.0926064000000082}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":0.926210999999995,"y":1.0926064000000082},{"x":2.1163026000000116,"y":1.0926064000000082}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-2.2687025999999975,"y":0.9402064000000081},{"x":-2.2687025999999975,"y":-0.9402063999999939}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":2.2687025999999832,"y":0.9402064000000081},{"x":2.2687025999999832,"y":-0.9402063999999939}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-2.1163026000000116,"y":-1.092606399999994},{"x":-0.9261856000000108,"y":-1.092606399999994}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":2.1163026000000116,"y":-1.092606399999994},{"x":0.926210999999995,"y":-1.092606399999994}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":-1.4210854715202004e-14,"y":0},{"x":-0.08441074011676619,"y":0.2037855535998574},{"x":-0.11320167162334371,"y":0.422474390000005},{"x":-0.08441074011676619,"y":0.6411632264001383},{"x":0,"y":0.8449487799999957}]} />
<silkscreenpath strokeWidth="0.15mm" route={[{"x":2.842170943040401e-14,"y":0},{"x":0.08441074011679461,"y":-0.20378555359984318},{"x":0.11320167162334371,"y":-0.42247438999999076},{"x":0.08441074011679461,"y":-0.6411632264001241},{"x":0,"y":-0.8449487799999957}]} />
<ReferenceLabel name={props.name} />
<courtyardoutline outline={[{"x":-2.2900518000000005,"y":1.1139936999999946},{"x":2.2900518000000005,"y":1.1139936999999946},{"x":2.2900518000000005,"y":-1.1139936999999946},{"x":-2.2900518000000005,"y":-1.1139936999999946},{"x":-2.2900518000000005,"y":1.1139936999999946}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C19193043.obj?uuid=7dbd95a5ee9a45949b72cb8147e267ff",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C19193043.step?uuid=7dbd95a5ee9a45949b72cb8147e267ff",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012699999999199463, z: 0 },
      }}
      {...props}
    />
  )
}