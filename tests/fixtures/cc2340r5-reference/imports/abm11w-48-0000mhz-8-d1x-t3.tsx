import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["OSC1", "X1"],
  pin2: ["GND1"],
  pin3: ["OSC2", "X2"],
  pin4: ["GND2"],
} as const

const pinAttributes = {
  pin2: { requiresGround: true },
  pin4: { requiresGround: true },
} as const

export const ABM11W_48_0000MHZ_8_D1X_T3 = (
  props: ChipProps<typeof pinLabels>,
) => {
  return (
    <crystal
      frequency="48MHz"
      loadCapacitance="8pF"
      pinVariant="four_pin"
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C1986112"],
      }}
      manufacturerPartNumber="ABM11W-48.0000MHZ-8-D1X-T3"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="0.6375mm"
            pcbY="-0.4875mm"
            width="0.875mm"
            height="0.775mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.6375mm"
            pcbY="0.4875mm"
            width="0.875mm"
            height="0.775mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.6375mm"
            pcbY="0.4875mm"
            width="0.875mm"
            height="0.775mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.6375mm"
            pcbY="-0.4875mm"
            width="0.875mm"
            height="0.775mm"
            shape="rect"
          />
          <silkscreenrect
            pcbX="0mm"
            pcbY="0mm"
            width="2.05mm"
            height="1.65mm"
            strokeWidth="0.151999696mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.4, y: -1.2 },
              { x: 1.4, y: -1.2 },
              { x: 1.4, y: 1.2 },
              { x: -1.4, y: 1.2 },
              { x: -1.4, y: -1.2 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C1986112.obj?uuid=51ae9b24ba7a408881f7752b57b66e45",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C1986112.step?uuid=51ae9b24ba7a408881f7752b57b66e45",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.00011430000006384944, z: -0.01 },
      }}
      {...props}
    />
  )
}
