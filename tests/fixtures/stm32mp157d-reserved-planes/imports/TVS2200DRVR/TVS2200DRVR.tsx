import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GND4"],
  pin2: ["GND3"],
  pin3: ["GND2"],
  pin4: ["IN3"],
  pin5: ["IN2"],
  pin6: ["IN1"],
  pin7: ["GND1"],
} as const

const pinAttributes = {
  pin1: { requiresGround: true },
  pin2: { requiresGround: true },
  pin3: { requiresGround: true },
  pin7: { requiresGround: true },
} as const

export const TVS2200DRVR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C523793"],
      }}
      manufacturerPartNumber="TVS2200DRVR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin7"]}
            pcbX="0mm"
            pcbY="0mm"
            width="1.5999968mm"
            height="0.999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.6500114mm"
            pcbY="0.975106mm"
            width="0.3999992mm"
            height="0.4500118mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0mm"
            pcbY="0.975106mm"
            width="0.3999992mm"
            height="0.4500118mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.6500114mm"
            pcbY="0.975106mm"
            width="0.3999992mm"
            height="0.4500118mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.6500114mm"
            pcbY="-0.975106mm"
            width="0.3999992mm"
            height="0.4500118mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0mm"
            pcbY="-0.975106mm"
            width="0.3999992mm"
            height="0.4500118mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.6500114mm"
            pcbY="-0.975106mm"
            width="0.3999992mm"
            height="0.4500118mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.0500360000000057, y: -1.0490199999999987 },
              { x: -1.0500360000000057, y: 1.0500360000000057 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.0500359999999915, y: -1.0490199999999987 },
              { x: 1.0500359999999915, y: 1.0500360000000057 },
            ]}
          />
          <silkscreencircle
            pcbX="-1.0414mm"
            pcbY="-1.2954mm"
            radius="0.0635mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.0380492mm"
            pcbY="2.1938508mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.249998000000005, y: 1.450111899999996 },
              { x: 1.249998000000005, y: 1.450111899999996 },
              { x: 1.249998000000005, y: -1.450111899999996 },
              { x: -1.249998000000005, y: -1.450111899999996 },
              { x: -1.249998000000005, y: 1.450111899999996 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C523793.obj?uuid=c909123e4a7a4da5a0270979fee6c02c",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C523793.step?uuid=c909123e4a7a4da5a0270979fee6c02c",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: -0.000012700000013410317, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
