import type { ChipProps } from "@tscircuit/props"

// ST USBLC6-2SC6, JLCPCB C7519. Pin roles and the two internal flow-through
// connections follow ST datasheet DS4260 Rev 7. The footprint is the exact
// JLCPCB-linked EasyEDA geometry imported on 2026-09-12.
export const USBLC6_2SC6PinLabels = {
  pin1: ["IO1_A"],
  pin2: ["GND"],
  pin3: ["IO2_A"],
  pin4: ["IO2_B"],
  pin5: ["VBUS"],
  pin6: ["IO1_B"],
} as const

type USBLC6_2SC6Props = Omit<
  ChipProps<typeof USBLC6_2SC6PinLabels>,
  | "pinLabels"
  | "internallyConnectedPins"
  | "footprint"
  | "supplierPartNumbers"
  | "manufacturerPartNumber"
>

export const USBLC6_2SC6 = (props: USBLC6_2SC6Props) => (
  <chip
    {...props}
    pinLabels={USBLC6_2SC6PinLabels}
    pinAttributes={{
      VBUS: { requiresPower: true },
      GND: { requiresGround: true },
    }}
    internallyConnectedPins={[
      ["IO1_A", "IO1_B"],
      ["IO2_A", "IO2_B"],
    ]}
    supplierPartNumbers={{ jlcpcb: ["C7519"] }}
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
            { x: 1.5391892, y: -0.8892032 },
            { x: 1.5391892, y: 0.8892032 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -1.5391892, y: -0.8892032 },
            { x: -1.5391892, y: 0.8892032 },
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
            { x: -2.0788, y: 1.9264 },
            { x: 1.774, y: 1.9264 },
            { x: 1.774, y: -2.028 },
            { x: -2.0788, y: -2.028 },
            { x: -2.0788, y: 1.9264 },
          ]}
        />
      </footprint>
    }
    cadModel={{
      objUrl:
        "https://modelcdn.tscircuit.com/easyeda_models/assets/C7519.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
      stepUrl:
        "https://modelcdn.tscircuit.com/easyeda_models/assets/C7519.step?uuid=229b69761e2c45dba6a83d8866dec72d",
      pcbRotationOffset: 90,
      modelOriginPosition: { x: -0.0000127, y: 0.0000127, z: -0.048939 },
    }}
  />
)
