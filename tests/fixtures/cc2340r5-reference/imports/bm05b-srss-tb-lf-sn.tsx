import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VTREF", "pin1"],
  pin2: ["SWDIO", "pin2"],
  pin3: ["SWCLK", "pin3"],
  pin4: ["GND", "pin4"],
  pin5: ["RESET_N", "pin5"],
  pin6: ["SHIELD1", "MT1", "pin6"],
  pin7: ["SHIELD2", "MT2", "pin7"],
} as const

export const BM05B_SRSS_TB_LF__SN_ = (
  props: Omit<ChipProps<typeof pinLabels>, "pinAttributes"> & {
    pinAttributes?: Partial<
      NonNullable<ChipProps<typeof pinLabels>["pinAttributes"]>
    >
  },
) => {
  return (
    <connector
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C160391"],
      }}
      manufacturerPartNumber="BM05B-SRSS-TB(LF)(SN)"
      footprint={
        <footprint insertionDirection="from_above">
          <smtpad
            portHints={["pin7"]}
            pcbX="-3.299968mm"
            pcbY="-1.1998833mm"
            width="1.1999976mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="3.299968mm"
            pcbY="-1.1998833mm"
            width="1.1999976mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-1.999996mm"
            pcbY="1.3248767mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.999998mm"
            pcbY="1.3248767mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0mm"
            pcbY="1.3248767mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0.999998mm"
            pcbY="1.3248767mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="1.999996mm"
            pcbY="1.3248767mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.468829199999959, y: -1.8425033000000894 },
              { x: 2.4688800000001265, y: -1.8425033000000894 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.5311607999999524, y: 1.0784966999999597 },
              { x: 3.556025400000067, y: 1.0784966999999597 },
              { x: 3.556025400000067, y: -0.0688466999999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.555974600000013, y: -0.0688466999999946 },
              { x: -3.555974600000013, y: 1.0784966999999597 },
              { x: -2.5311099999998987, y: 1.0784966999999597 },
            ]}
          />
          <silkscreencircle
            pcbX="2.921mm"
            pcbY="1.7134967mm"
            radius="0.179578mm"
          />
          <courtyardoutline
            outline={[
              { x: -4.159568000000036, y: 2.354402700000037 },
              { x: 4.138232000000016, y: 2.354402700000037 },
              { x: 4.138232000000016, y: -2.336597299999994 },
              { x: -4.159568000000036, y: -2.336597299999994 },
              { x: -4.159568000000036, y: 2.354402700000037 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C160391.obj?uuid=eaf9e23008df4ce1b5a7b451075b7284",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C160391.step?uuid=eaf9e23008df4ce1b5a7b451075b7284",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: 2.000025400000027,
          y: -0.43250299999996966,
          z: -0.01,
        },
      }}
      {...props}
    />
  )
}
