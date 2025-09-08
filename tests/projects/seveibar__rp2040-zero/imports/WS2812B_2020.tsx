import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["DO"],
  pin2: ["GND"],
  pin3: ["DI"],
  pin4: ["VDD"],
} as const

export const WS2812B_2020 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C965555"],
      }}
      manufacturerPartNumber="WS2812B_2020"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.9150349999999889mm"
            pcbY="0.5500369999999748mm"
            width="0.8999982mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.9150349999999889mm"
            pcbY="-0.5500369999999748mm"
            width="0.8999982mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.9150349999999889mm"
            pcbY="-0.5500369999999748mm"
            width="0.8999982mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.9150349999999889mm"
            pcbY="0.5500369999999748mm"
            width="0.8999982mm"
            height="0.6999986mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.24998679999998785, y: 0.7499603999999636 },
              { x: -0.09999980000009145, y: 0.7499603999999636 },
              { x: -0.09999980000009145, y: -0.6500114000000394 },
              { x: -0.09999980000009145, y: -0.6999986000000717 },
              { x: -0.24998679999998785, y: -0.6999986000000717 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.24998679999998785, y: 0.7499603999999636 },
              { x: -0.24998679999998785, y: -0.7000239999999849 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.299997400000052, y: 1.1499850000000151 },
              { x: -1.299997400000052, y: 1.1381486000000223 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.9999979999998914, y: 1.0999977999999828 },
              { x: -0.999998000000005, y: 1.0999977999999828 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.999998000000005, y: -1.0999977999999828 },
              { x: 0.9999979999998914, y: -1.0999977999999828 },
            ]}
          />
        </footprint>
      }
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: ["DI", "GND"],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["VDD", "DO"],
        },
      }}
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=caa88715b11f4aa189b02e52bbb84e4f&pn=C965555",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
