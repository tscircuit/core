import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["GND"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["VBUS"],
  pin6: ["pin6"],
} as const

const pinAttributes = {
  pin2: { requiresGround: true },
} as const

export const USBLC6_2SC6 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C2687116"],
      }}
      manufacturerPartNumber="USBLC6-2SC6"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.94996mm"
            pcbY="-1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0mm"
            pcbY="-1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.94996mm"
            pcbY="-1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.94996mm"
            pcbY="1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0mm"
            pcbY="1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.94996mm"
            pcbY="1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 1.5391891999998961, y: -0.8892031999998835 },
              { x: 1.5391891999998961, y: 0.8892031999999972 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.5391892000000098, y: -0.8892031999998835 },
              { x: -1.5391892000000098, y: 0.8892031999999972 },
            ]}
          />
          <silkscreencircle
            pcbX="-1.668272mm"
            pcbY="-1.301496mm"
            radius="0.150114mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.1524mm"
            pcbY="2.6764mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.078800000000001, y: 1.9264000000000578 },
              { x: 1.7739999999998872, y: 1.9264000000000578 },
              { x: 1.7739999999998872, y: -2.0279999999999063 },
              { x: -2.078800000000001, y: -2.0279999999999063 },
              { x: -2.078800000000001, y: 1.9264000000000578 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2687116.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2687116.step?uuid=229b69761e2c45dba6a83d8866dec72d",
        pcbRotationOffset: 90,
        modelOriginPosition: {
          x: -0.000012700000070253736,
          y: 0.000012700000070253736,
          z: -0.048939,
        },
      }}
      {...props}
    />
  )
}
