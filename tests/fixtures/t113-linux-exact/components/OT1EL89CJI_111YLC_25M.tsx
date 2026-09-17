import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["ENABLE"],
  pin2: ["GND"],
  pin3: ["OUT"],
  pin4: ["VDD"],
} as const

type OscillatorProps = Omit<
  ChipProps<typeof pinLabels>,
  | "pinLabels"
  | "pinAttributes"
  | "footprint"
  | "supplierPartNumbers"
  | "manufacturerPartNumber"
>

// YXC 25 MHz 1.8-3.3 V CMOS oscillator, JLCPCB C7434915. This uses the exact
// JLCPCB-linked EasyEDA geometry imported on 2026-09-12.
export const OT1EL89CJI_111YLC_25M = (props: OscillatorProps) => (
  <chip
    {...props}
    pinLabels={pinLabels}
    pinAttributes={{
      GND: { requiresGround: true },
      VDD: { requiresPower: true },
    }}
    supplierPartNumbers={{ jlcpcb: ["C7434915"] }}
    manufacturerPartNumber="OT1EL89CJI-111YLC-25M"
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-1.27mm"
          pcbY="-1.100074mm"
          width="1.5999968mm"
          height="1.499997mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="1.27mm"
          pcbY="-1.100074mm"
          width="1.5999968mm"
          height="1.499997mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin3"]}
          pcbX="1.27mm"
          pcbY="1.100074mm"
          width="1.5999968mm"
          height="1.499997mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin4"]}
          pcbX="-1.27mm"
          pcbY="1.100074mm"
          width="1.5999968mm"
          height="1.499997mm"
          shape="rect"
        />
        <silkscreencircle pcbX="-2.2mm" pcbY="-2.35mm" radius="0.15mm" />
        <silkscreentext
          text="{NAME}"
          pcbX="0mm"
          pcbY="2.8542mm"
          anchorAlignment="center"
          fontSize="1mm"
        />
        <courtyardoutline
          outline={[
            { x: -2.8408, y: 2.1042 },
            { x: 2.8662, y: 2.1042 },
            { x: 2.8662, y: -2.7392 },
            { x: -2.8408, y: -2.7392 },
            { x: -2.8408, y: 2.1042 },
          ]}
        />
      </footprint>
    }
    cadModel={{
      objUrl:
        "https://modelcdn.tscircuit.com/easyeda_models/assets/C7434915.obj?uuid=8e70d60641f14ddfb78cec8bbcd5f888",
      stepUrl:
        "https://modelcdn.tscircuit.com/easyeda_models/assets/C7434915.step?uuid=8e70d60641f14ddfb78cec8bbcd5f888",
      pcbRotationOffset: 0,
      modelOriginPosition: { x: 0, y: 0, z: -0.82 },
    }}
  />
)
