import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["XTAL1"],
  pin2: ["GND1"],
  pin3: ["XTAL2"],
  pin4: ["GND2"],
} as const

export const ABM8_272_T3 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C20625731"],
      }}
      manufacturerPartNumber="ABM8_272_T3"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.1000739999999496mm"
            pcbY="-0.850010999999995mm"
            width="1.3999972mm"
            height="1.1999975999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.1000739999999496mm"
            pcbY="-0.850010999999995mm"
            width="1.3999972mm"
            height="1.1999975999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="1.1000739999999496mm"
            pcbY="0.850010999999995mm"
            width="1.3999972mm"
            height="1.1999975999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.1000739999999496mm"
            pcbY="0.850010999999995mm"
            width="1.3999972mm"
            height="1.1999975999999999mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.028596400000083, y: -1.6784827999999834 },
              { x: -2.028596400000083, y: 1.678736800000138 },
              { x: 2.0285963999999694, y: 1.678736800000138 },
              { x: 2.0285963999999694, y: -1.6784827999999834 },
              { x: -2.028596400000083, y: -1.6784827999999834 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.257196399999998, y: -0.24988519999988057 },
              { x: -2.257196399999998, y: -1.9070827999998983 },
              { x: -0.39999920000002476, y: -1.9070827999998983 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=02485e56ba8d4732a26526d2983fc729&pn=C20625731",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
